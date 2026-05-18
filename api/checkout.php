<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireCustomerForCheckout(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function moneyValue(mixed $value): float {
    return round((float) $value, 2);
}

function normalizedServiceRequirements(mixed $value): array {
    $requirements = is_array($value) ? $value : [];

    return [
        'deadline' => trim((string) ($requirements['deadline'] ?? '')),
        'package' => trim((string) ($requirements['package'] ?? '')),
        'businessType' => trim((string) ($requirements['businessType'] ?? '')),
        'brief' => trim((string) ($requirements['brief'] ?? '')),
        'complexity' => trim((string) ($requirements['complexity'] ?? ($requirements['package'] ?? ''))),
    ];
}

function assertClose(float $expected, float $actual, string $label): void {
    if (abs($expected - $actual) > 0.01) {
        jsonResponse(['error' => "{$label} does not match server calculation."], 422);
    }
}

function ensureCheckoutDiscountStatusColumn(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }

    $checked = true;
    requireTableColumns($db, 'DISCOUNT', ['STATUS']);
}

function ensureMerchantFulfillmentColumns(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    ensureTableColumns($db, 'MERCHANT', [
        'ACCEPTS_COD' => 'tinyint(1) NOT NULL DEFAULT 1',
        'ACCEPTS_GCASH' => 'tinyint(1) NOT NULL DEFAULT 1',
        'ALLOW_MEETUP' => 'tinyint(1) NOT NULL DEFAULT 1',
        'ALLOW_DELIVERY' => 'tinyint(1) NOT NULL DEFAULT 1',
        'DELIVERY_FEE' => 'double NOT NULL DEFAULT 50',
    ]);
}

function checkoutMerchantFulfillmentSettings(PDO $db, int $merchantId): array {
    ensureMerchantFulfillmentColumns($db);

    $stmt = $db->prepare(
        "SELECT ACCEPTS_COD, ACCEPTS_GCASH, ALLOW_MEETUP, ALLOW_DELIVERY, DELIVERY_FEE
         FROM MERCHANT
         WHERE MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'acceptsCOD' => (bool) ($row['ACCEPTS_COD'] ?? 1),
        'acceptsGCash' => (bool) ($row['ACCEPTS_GCASH'] ?? 1),
        'allowMeetup' => (bool) ($row['ALLOW_MEETUP'] ?? 1),
        'allowDelivery' => (bool) ($row['ALLOW_DELIVERY'] ?? 1),
        'deliveryFee' => max(0, (float) ($row['DELIVERY_FEE'] ?? 50)),
    ];
}

function applyCheckoutDiscount(float $price, mixed $type, mixed $value): float {
    $discountValue = (float) ($value ?? 0);
    if ($discountValue <= 0 || $type === null) {
        return moneyValue($price);
    }

    $discounted = strtolower((string) $type) === 'percentage'
        ? $price - ($price * ($discountValue / 100))
        : $price - $discountValue;

    return moneyValue(max(0, $discounted));
}

function dbOffering(PDO $db, string $type, int $id): ?array {
    ensureCheckoutDiscountStatusColumn($db);

    if ($type === 'product') {
        $stmt = $db->prepare(
            "SELECT p.PROD_ID AS id, p.PRICE AS price, p.STOCK_QTY AS capacity,
                    p.STATUS AS status, p.MERCHANT_ID AS merchant_id,
                    d.TYPE AS discount_type, d.VALUE AS discount_value
	             FROM PRODUCT p
	             INNER JOIN USERS u ON u.USER_ID = p.MERCHANT_ID AND u.STATUS = 'ACTIVE'
             LEFT JOIN (
                 SELECT d1.*
                 FROM DISCOUNT d1
                 INNER JOIN (
                     SELECT OFFERING_ID, MAX(DISCOUNT_ID) AS DISCOUNT_ID
                     FROM DISCOUNT
                     WHERE START_DATE <= NOW(1)
                       AND END_DATE >= NOW(1)
                       AND COALESCE(STATUS, 'ACTIVE') = 'ACTIVE'
                     GROUP BY OFFERING_ID
                 ) latest ON latest.DISCOUNT_ID = d1.DISCOUNT_ID
             ) d ON d.OFFERING_ID = p.PROD_ID
             WHERE p.PROD_ID = :id
             LIMIT 1"
        );
    } else {
        $stmt = $db->prepare(
            "SELECT s.SERVICE_ID AS id, s.PRICE AS price, s.SLOTS AS capacity,
                    s.STATUS AS status, s.MERCHANT_ID AS merchant_id,
                    d.TYPE AS discount_type, d.VALUE AS discount_value
	             FROM SERVICE s
	             INNER JOIN USERS u ON u.USER_ID = s.MERCHANT_ID AND u.STATUS = 'ACTIVE'
             LEFT JOIN (
                 SELECT d1.*
                 FROM DISCOUNT d1
                 INNER JOIN (
                     SELECT OFFERING_ID, MAX(DISCOUNT_ID) AS DISCOUNT_ID
                     FROM DISCOUNT
                     WHERE START_DATE <= NOW(1)
                       AND END_DATE >= NOW(1)
                       AND COALESCE(STATUS, 'ACTIVE') = 'ACTIVE'
                     GROUP BY OFFERING_ID
                 ) latest ON latest.DISCOUNT_ID = d1.DISCOUNT_ID
             ) d ON d.OFFERING_ID = s.SERVICE_ID
             WHERE s.SERVICE_ID = :id
             LIMIT 1"
        );
    }

    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    $row['price'] = applyCheckoutDiscount(
        moneyValue($row['price'] ?? 0),
        $row['discount_type'] ?? null,
        $row['discount_value'] ?? null
    );

    return $row;
}

function merchantAllowsPayment(PDO $db, int $merchantId, int $offeringId, string $paymentMethod): bool {
    $settings = checkoutMerchantFulfillmentSettings($db, $merchantId);
    if ($paymentMethod === 'gcash' && !$settings['acceptsGCash']) {
        return false;
    }
    if ($paymentMethod === 'cod' && !$settings['acceptsCOD']) {
        return false;
    }

    $stmt = $db->prepare(
        "SELECT pm.SERVICE
         FROM ALLOWED_PAYMENT ap
         INNER JOIN PAYMENT_METHOD pm ON pm.PM_ID = ap.PM_ID
         WHERE ap.OFFERING_ID = :offering_id
           AND ap.STATUS = 'ACTIVE'
           AND pm.MERCHANT_ID = :merchant_id
         ORDER BY ap.ALLOWED_PM_ID ASC"
    );
    $stmt->execute([
        ':offering_id' => $offeringId,
        ':merchant_id' => $merchantId,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        ensureCheckoutPaymentDefaults($db, $merchantId, $offeringId);
        $stmt->execute([
            ':offering_id' => $offeringId,
            ':merchant_id' => $merchantId,
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) {
            return false;
        }
    }

    $allowsGcash = false;
    $allowsCod = false;

    foreach ($rows as $row) {
        $label = strtolower(trim((string) ($row['SERVICE'] ?? '')));
        if ($label === '') {
            continue;
        }

        if (str_contains($label, 'gcash')) {
            $allowsGcash = true;
        }

        if (
            str_contains($label, 'cod') ||
            str_contains($label, 'cash on delivery') ||
            str_contains($label, 'cash') ||
            str_contains($label, 'meetup')
        ) {
            $allowsCod = true;
        }
    }

    return $paymentMethod === 'gcash' ? $allowsGcash : $allowsCod;
}

function checkoutPaymentMethodIdForKind(PDO $db, int $merchantId, string $kind): int {
    $labels = $kind === 'gcash'
        ? ['gcash']
        : ['cod', 'cash on delivery', 'cash', 'meetup'];

    $conditions = [];
    $params = [':merchant_id' => $merchantId];
    foreach ($labels as $index => $label) {
        $key = ':label_' . $index;
        $conditions[] = "LOWER(SERVICE) LIKE {$key}";
        $params[$key] = '%' . $label . '%';
    }

    $stmt = $db->prepare(
        "SELECT PM_ID
         FROM PAYMENT_METHOD
         WHERE MERCHANT_ID = :merchant_id
           AND (" . implode(' OR ', $conditions) . ")
         ORDER BY PM_ID ASC
         LIMIT 1"
    );
    $stmt->execute($params);
    $existingId = (int) ($stmt->fetchColumn() ?: 0);
    if ($existingId > 0) {
        return $existingId;
    }

    $insert = $db->prepare(
        "INSERT INTO PAYMENT_METHOD (SERVICE, LINK, QR_URL, NUMBER, USERNAME, OTHER, MERCHANT_ID)
         VALUES (:service, NULL, NULL, NULL, NULL, :other, :merchant_id)"
    );
    $insert->execute([
        ':service' => $kind === 'gcash' ? 'GCash' : 'COD / Cash on Delivery',
        ':other' => $kind === 'gcash'
            ? 'Merchant can provide GCash details through chat.'
            : 'Cash payment on delivery or meetup.',
        ':merchant_id' => $merchantId,
    ]);

    return (int) $db->lastInsertId();
}

function ensureCheckoutPaymentDefaults(PDO $db, int $merchantId, int $offeringId): void {
    $settings = checkoutMerchantFulfillmentSettings($db, $merchantId);
    foreach (['cod', 'gcash'] as $kind) {
        $paymentMethodId = checkoutPaymentMethodIdForKind($db, $merchantId, $kind);
        if ($paymentMethodId <= 0) {
            continue;
        }
        $status = ($kind === 'gcash' ? $settings['acceptsGCash'] : $settings['acceptsCOD'])
            ? 'ACTIVE'
            : 'INACTIVE';

        $existing = $db->prepare(
            "SELECT ALLOWED_PM_ID
             FROM ALLOWED_PAYMENT
             WHERE OFFERING_ID = :offering_id AND PM_ID = :pm_id
             LIMIT 1"
        );
        $existing->execute([
            ':offering_id' => $offeringId,
            ':pm_id' => $paymentMethodId,
        ]);

        if ($existing->fetch(PDO::FETCH_ASSOC)) {
            $update = $db->prepare(
                "UPDATE ALLOWED_PAYMENT
                 SET STATUS = :status
                 WHERE OFFERING_ID = :offering_id AND PM_ID = :pm_id"
            );
            $update->execute([
                ':status' => $status,
                ':offering_id' => $offeringId,
                ':pm_id' => $paymentMethodId,
            ]);
            continue;
        }

        $insert = $db->prepare(
            "INSERT INTO ALLOWED_PAYMENT (STATUS, PM_ID, OFFERING_ID)
             VALUES (:status, :pm_id, :offering_id)"
        );
        $insert->execute([
            ':status' => $status,
            ':pm_id' => $paymentMethodId,
            ':offering_id' => $offeringId,
        ]);
    }
}

function resolveDeliveryMethodId(PDO $db, int $productId, string $deliveryMethod, float $deliveryFee = 50): ?int {
    $normalized = strtolower(trim($deliveryMethod));
    $methodLabels = $normalized === 'pickup'
        ? ['pickup', 'meetup', 'meet-up', 'campus meetup']
        : ['standard', 'delivery', 'shipping', 'ship'];

    $likeConditions = [];
    $params = [':product_id' => $productId];
    foreach ($methodLabels as $index => $label) {
        $key = ':method_' . $index;
        $likeConditions[] = "LOWER(DM_NAME) LIKE {$key}";
        $params[$key] = '%' . $label . '%';
    }

    $stmt = $db->prepare(
        "SELECT DM_ID
         FROM DELIVERY_METHOD
         WHERE PROD_ID = :product_id
           AND (" . implode(' OR ', $likeConditions) . ")
         ORDER BY DM_ID ASC
         LIMIT 1"
    );
    $stmt->execute($params);
    $matched = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($matched && isset($matched['DM_ID'])) {
        return (int) $matched['DM_ID'];
    }

    $stmt = $db->prepare(
        "SELECT DM_ID
         FROM DELIVERY_METHOD
         WHERE PROD_ID = :product_id
         ORDER BY DM_ID ASC
         LIMIT 1"
    );
    $stmt->execute([':product_id' => $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row['DM_ID'])) {
        return (int) $row['DM_ID'];
    }

    // If a product has no delivery configuration yet, create a sensible default row
    // so checkout can proceed instead of failing on missing DM_ID.
    $dmName = $normalized === 'pickup' ? 'Campus Meetup' : 'Standard Delivery';
    $dmProvider = $normalized === 'pickup' ? 'Meetup' : 'Campus Rider';
    $dmFee = $normalized === 'pickup' ? 0 : $deliveryFee;

    $insert = $db->prepare(
        "INSERT INTO DELIVERY_METHOD (DM_NAME, DM_FEE, DM_PROVIDER, NOTE, PROD_ID)
         VALUES (:name, :fee, :provider, :note, :product_id)"
    );
    $insert->execute([
        ':name' => $dmName,
        ':fee' => $dmFee,
        ':provider' => $dmProvider,
        ':note' => 'Auto-generated during checkout',
        ':product_id' => $productId,
    ]);

    $newId = (int) $db->lastInsertId();
    return $newId > 0 ? $newId : null;
}

function voucherDiscountAmount(array $voucher, float $eligibleSubtotal): float {
    $discountType = strtolower((string) $voucher['DISCOUNT_TYPE']);
    $discountValue = (float) $voucher['DISCOUNT_VALUE'];
    $discount = $discountType === 'percentage'
        ? $eligibleSubtotal * ($discountValue / 100)
        : $discountValue;

    if (($voucher['CAP'] ?? null) !== null && (string) $voucher['CAP'] !== '') {
        $discount = min($discount, (float) $voucher['CAP']);
    }

    return moneyValue(max(0, min($discount, $eligibleSubtotal)));
}

function validateCheckoutVoucher(PDO $db, string $code, array $validatedItems, bool $lock = false): ?array {
    $code = strtoupper(trim($code));
    if ($code === '') {
        return null;
    }

    if (!preg_match('/^[A-Z0-9][A-Z0-9-]{2,31}$/', $code)) {
        jsonResponse(['error' => 'Invalid voucher code.'], 422);
    }

    $merchantSubtotals = [];
    foreach ($validatedItems as $item) {
        $merchantId = (int) ($item['merchant_id'] ?? 0);
        if ($merchantId <= 0) {
            jsonResponse(['error' => 'Voucher cannot be applied to this checkout.'], 422);
        }

        $merchantSubtotals[$merchantId] = ($merchantSubtotals[$merchantId] ?? 0)
            + ((float) $item['price'] * (int) $item['quantity']);
    }

    $merchantIds = array_keys($merchantSubtotals);
    if (!$merchantIds) {
        jsonResponse(['error' => 'Voucher cannot be applied to this checkout.'], 422);
    }

    $placeholders = implode(',', array_fill(0, count($merchantIds), '?'));
    $lockClause = $lock ? ' FOR UPDATE' : '';
    $stmt = $db->prepare(
        "SELECT v.*
         FROM VOUCHER v
         WHERE UPPER(v.CODE) = ?
           AND v.STATUS = 'ACTIVE'
           AND v.MERCHANT_ID IN ({$placeholders})
         ORDER BY v.VOUCHER_ID DESC{$lockClause}"
    );
    $stmt->execute(array_merge([$code], $merchantIds));
    $vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $usageStmt = $db->prepare(
        "SELECT COUNT(*)
         FROM VOUCHER_USAGE
         WHERE VOUCHER_ID = :voucher_id"
    );

    foreach ($vouchers as $voucher) {
        $merchantId = (int) $voucher['MERCHANT_ID'];
        $eligibleSubtotal = moneyValue($merchantSubtotals[$merchantId] ?? 0);
        if ($eligibleSubtotal <= 0) {
            continue;
        }

        if ((string) $voucher['EXPIRY_DATE'] < date('Y-m-d')) {
            continue;
        }

        $usageStmt->execute([':voucher_id' => (int) $voucher['VOUCHER_ID']]);
        $used = (int) $usageStmt->fetchColumn();
        $usageLimit = (int) ($voucher['USAGE_LIMIT'] ?? 0);
        if ($usageLimit > 0 && $used >= $usageLimit) {
            jsonResponse(['error' => 'Voucher usage limit has been reached.'], 422);
        }

        if ($eligibleSubtotal < (float) $voucher['MIN_SPEND']) {
            jsonResponse(['error' => 'Minimum spend for this voucher has not been met.'], 422);
        }

        return [
            'id' => (int) $voucher['VOUCHER_ID'],
            'code' => $code,
            'merchantId' => $merchantId,
            'discountAmount' => voucherDiscountAmount($voucher, $eligibleSubtotal),
            'eligibleSubtotal' => $eligibleSubtotal,
        ];
    }

    jsonResponse(['error' => 'Invalid voucher code.'], 422);
}

function normalizeVoucherCodes(mixed $rawCodes, string $legacyCode = ''): array {
    $codes = [];
    if (is_array($rawCodes)) {
        foreach ($rawCodes as $rawCode) {
            $code = strtoupper(trim((string) $rawCode));
            if ($code !== '') {
                $codes[] = $code;
            }
        }
    } elseif ($legacyCode !== '') {
        $codes[] = strtoupper(trim($legacyCode));
    }

    if (count($codes) !== count(array_unique($codes))) {
        jsonResponse(['error' => 'The same voucher cannot be applied more than once.'], 422);
    }

    return array_values(array_unique($codes));
}

function validateCheckoutVouchers(PDO $db, array $codes, array $validatedItems, bool $lock = false): array {
    $vouchers = [];
    $discountByMerchant = [];

    foreach ($codes as $code) {
        $voucher = validateCheckoutVoucher($db, $code, $validatedItems, $lock);
        if (!$voucher) {
            continue;
        }

        $merchantId = (int) ($voucher['merchantId'] ?? 0);
        $eligibleSubtotal = moneyValue($voucher['eligibleSubtotal'] ?? 0);
        $currentMerchantDiscount = moneyValue($discountByMerchant[$merchantId] ?? 0);
        $discountAmount = min(
            moneyValue($voucher['discountAmount'] ?? 0),
            max(0, $eligibleSubtotal - $currentMerchantDiscount)
        );

        if ($discountAmount <= 0) {
            jsonResponse(['error' => 'Voucher discount exceeds the eligible store subtotal.'], 422);
        }

        $voucher['discountAmount'] = moneyValue($discountAmount);
        $discountByMerchant[$merchantId] = $currentMerchantDiscount + $voucher['discountAmount'];
        $vouchers[] = $voucher;
    }

    return $vouchers;
}

function totalVoucherDiscount(array $vouchers): float {
    return moneyValue(array_reduce(
        $vouchers,
        fn (float $sum, array $voucher): float => $sum + moneyValue($voucher['discountAmount'] ?? 0),
        0.0
    ));
}

function serviceLineTotals(array $validatedItems, float $checkoutTotal): array {
    $roundedTotal = (int) round($checkoutTotal);
    $lineSubtotals = array_map(
        fn (array $item): float => moneyValue((float) $item['price'] * (int) $item['quantity']),
        $validatedItems
    );
    $subtotal = array_sum($lineSubtotals);
    $remaining = $roundedTotal;
    $totals = [];

    foreach ($lineSubtotals as $index => $lineSubtotal) {
        if ($index === array_key_last($lineSubtotals)) {
            $totals[$index] = max(0, $remaining);
            break;
        }

        $share = $subtotal > 0 ? $lineSubtotal / $subtotal : 1 / max(1, count($lineSubtotals));
        $lineTotal = max(0, (int) round($roundedTotal * $share));
        $totals[$index] = $lineTotal;
        $remaining -= $lineTotal;
    }

    return $totals;
}

function recordVoucherUsage(PDO $db, array $voucher, float $discountAmount, ?int $orderId = null, ?int $requestId = null): void {
    if ($discountAmount <= 0) {
        return;
    }

    $stmt = $db->prepare(
        "INSERT INTO VOUCHER_USAGE (USED_ON, DISCOUNT_AMT, VOUCHER_ID, REQUEST_ID, ORDER_ID)
         VALUES (:used_on, :discount_amt, :voucher_id, :request_id, :order_id)"
    );
    $stmt->execute([
        ':used_on' => date('Y-m-d H:i:s'),
        ':discount_amt' => (string) moneyValue($discountAmount),
        ':voucher_id' => (int) $voucher['id'],
        ':request_id' => $requestId,
        ':order_id' => $orderId,
    ]);

    $statusStmt = $db->prepare(
        "UPDATE VOUCHER v
         SET v.STATUS = 'INACTIVE'
         WHERE v.VOUCHER_ID = :voucher_id
           AND v.USAGE_LIMIT > 0
           AND (
             SELECT COUNT(*)
             FROM VOUCHER_USAGE vu
             WHERE vu.VOUCHER_ID = v.VOUCHER_ID
           ) >= v.USAGE_LIMIT"
    );
    $statusStmt->execute([':voucher_id' => (int) $voucher['id']]);
}

$sessionUser = requireCustomerForCheckout($db);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$type = strtolower(trim((string) ($data['type'] ?? '')));
$paymentMethod = strtolower(trim((string) ($data['paymentMethod'] ?? '')));
$deliveryMethod = strtolower(trim((string) ($data['deliveryMethod'] ?? '')));
$voucherCode = strtoupper(trim((string) ($data['voucherCode'] ?? '')));
$voucherCodes = normalizeVoucherCodes($data['voucherCodes'] ?? null, $voucherCode);
$items = $data['items'] ?? [];
$totals = $data['totals'] ?? [];
$customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];
$service = is_array($data['service'] ?? null) ? $data['service'] : [];
$paymentProofImage = trim((string) ($data['paymentProofImage'] ?? ''));
$paymentProofUrl = null;

if (!in_array($type, ['product', 'service'], true)) {
    jsonResponse(['error' => 'Invalid checkout type.'], 422);
}

if (!in_array($paymentMethod, ['gcash', 'cod'], true)) {
    jsonResponse(['error' => 'Only GCash and COD are available for checkout.'], 422);
}

if ($paymentMethod === 'gcash') {
    $reference = preg_replace('/\D+/', '', (string) ($data['referenceNumber'] ?? ''));
    if (strlen($reference) !== 13) {
        jsonResponse(['error' => 'GCash reference number must be 13 digits.'], 422);
    }
    if ($paymentProofImage === '') {
        jsonResponse(['error' => 'GCash payment proof image is required.'], 422);
    }
    ensurePaymentProofColumn($db);
    $paymentProofUrl = storePaymentProofImage($paymentProofImage);
}

if (!is_array($items) || count($items) === 0) {
    jsonResponse(['error' => 'Checkout requires at least one item.'], 422);
}

$subtotal = 0.0;
$dbBackedItems = 0;
$validatedItems = [];

foreach ($items as $item) {
    $id = (int) ($item['id'] ?? 0);
    $quantity = (int) ($item['quantity'] ?? 0);

    if ($id <= 0 || $quantity <= 0 || $quantity > 99) {
        jsonResponse(['error' => 'Invalid item quantity.'], 422);
    }

    $dbItem = dbOffering($db, $type, $id);

    if ($dbItem) {
        $dbBackedItems++;
        $status = strtoupper((string) $dbItem['status']);
        if (!in_array($status, ['ACTIVE', 'AVAILABLE', 'APPROVED'], true)) {
            jsonResponse(['error' => 'One or more items are no longer available.'], 409);
        }

        if ((int) $dbItem['capacity'] < $quantity) {
            jsonResponse(['error' => $type === 'product' ? 'Insufficient stock.' : 'Insufficient service slots.'], 409);
        }

        if (!merchantAllowsPayment($db, (int) $dbItem['merchant_id'], $id, $paymentMethod)) {
            jsonResponse(['error' => 'Selected payment method is not allowed by the merchant.'], 422);
        }

        $subtotal += moneyValue($dbItem['price']) * $quantity;
        $validatedItems[] = [
            'id' => $id,
            'quantity' => $quantity,
            'price' => moneyValue($dbItem['price']),
            'capacity' => (int) $dbItem['capacity'],
            'merchant_id' => (int) $dbItem['merchant_id'],
            'service_requirements' => normalizedServiceRequirements($item['serviceRequirements'] ?? []),
        ];
        continue;
    }

    jsonResponse(['error' => 'Item is not available for checkout.'], 409);
}

$merchantIds = array_values(array_unique(array_map(
    fn (array $item): int => (int) $item['merchant_id'],
    $validatedItems
)));
if ($type === 'product' && count($merchantIds) > 1) {
    jsonResponse(['error' => 'Please check out items from one merchant at a time.'], 422);
}
$primaryMerchantId = (int) ($merchantIds[0] ?? 0);
$merchantSettings = $primaryMerchantId > 0
    ? checkoutMerchantFulfillmentSettings($db, $primaryMerchantId)
    : [
        'acceptsCOD' => true,
        'acceptsGCash' => true,
        'allowMeetup' => true,
        'allowDelivery' => true,
        'deliveryFee' => 50,
    ];
if ($type === 'product') {
    if ($deliveryMethod === 'standard' && !$merchantSettings['allowDelivery']) {
        jsonResponse(['error' => 'Standard delivery is not enabled by this merchant.'], 422);
    }
    if ($deliveryMethod === 'pickup' && !$merchantSettings['allowMeetup']) {
        jsonResponse(['error' => 'Campus meetup is not enabled by this merchant.'], 422);
    }
}

$shippingFee = $type === 'product' && $deliveryMethod === 'standard'
    ? moneyValue($merchantSettings['deliveryFee'])
    : 0.00;
$serviceFee = $type === 'service' ? 50.00 : 0.00;
$vouchers = [];
$discountAmount = 0.0;
if ($voucherCodes) {
    if ($dbBackedItems !== count($items)) {
        jsonResponse(['error' => 'Voucher cannot be applied to this checkout.'], 422);
    }
    $vouchers = validateCheckoutVouchers($db, $voucherCodes, $validatedItems);
    $discountAmount = totalVoucherDiscount($vouchers);
}
if (!$voucherCodes && moneyValue($totals['discountAmount'] ?? 0) > 0) {
    jsonResponse(['error' => 'A voucher code is required for this discount.'], 422);
}
$total = max(0, $subtotal + $shippingFee + $serviceFee - $discountAmount);

assertClose($subtotal, moneyValue($totals['subtotal'] ?? -1), 'Subtotal');
assertClose($shippingFee, moneyValue($totals['shippingFee'] ?? 0), 'Shipping fee');
assertClose($serviceFee, moneyValue($totals['serviceFee'] ?? 0), 'Service fee');
assertClose($discountAmount, moneyValue($totals['discountAmount'] ?? 0), 'Discount');
assertClose($total, moneyValue($totals['total'] ?? -1), 'Total');

$paymentStatus = $paymentMethod === 'gcash' ? PAYMENT_STATUS_PENDING_REVIEW : PAYMENT_STATUS_UNPAID;
$validatedBy = 'database';

if ($type === 'product' && $validatedBy === 'database') {
    $recipientName = trim((string) ($customer['recipientName'] ?? ''));
    $phone = trim((string) ($customer['phone'] ?? ''));
    $address = trim((string) ($customer['address'] ?? ''));
    if ($recipientName === '' || $phone === '' || $address === '') {
        jsonResponse(['error' => 'Recipient name, phone, and address are required.'], 422);
    }

    $dmId = resolveDeliveryMethodId($db, (int) $validatedItems[0]['id'], $deliveryMethod, (float) $merchantSettings['deliveryFee']);
    if (!$dmId) {
        jsonResponse(['error' => 'Delivery method is unavailable for this order.'], 422);
    }

    try {
        $db->beginTransaction();
        if ($voucherCodes) {
            $vouchers = validateCheckoutVouchers($db, $voucherCodes, $validatedItems, true);
            $discountAmount = totalVoucherDiscount($vouchers);
        }

        $orderStmt = $db->prepare(
            "INSERT INTO ORDERS
                (TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, DISCOUNT_ID, CUSTOMER_ID, DM_ID)
             VALUES
                (:total_amount, :order_status, :payment_status, :recipient_name, :phone, :address, :discount_amt, :delivery_status, :discount_id, :customer_id, :dm_id)"
        );
        $orderStmt->execute([
            ':total_amount' => (int) round($total),
            ':order_status' => 'PENDING',
            ':payment_status' => $paymentStatus,
            ':recipient_name' => $recipientName,
            ':phone' => $phone,
            ':address' => $address,
            ':discount_amt' => $discountAmount > 0 ? $discountAmount : null,
            ':delivery_status' => strtoupper($deliveryMethod === 'standard' ? 'TO_SHIP' : 'FOR_MEETUP'),
            ':discount_id' => null,
            ':customer_id' => (int) $sessionUser['id'],
            ':dm_id' => $dmId,
        ]);

        $orderId = (int) $db->lastInsertId();
        if ($orderId <= 0) {
            throw new RuntimeException('Unable to create order record.');
        }

        $itemStmt = $db->prepare(
            "INSERT INTO ORDER_ITEM (PRICE, QUANTITY, ORDER_ID, PRODUCT_ID)
             VALUES (:price, :quantity, :order_id, :product_id)"
        );
        $stockStmt = $db->prepare(
            "UPDATE PRODUCT
             SET STOCK_QTY = STOCK_QTY - :decrement_quantity
             WHERE PROD_ID = :product_id AND STOCK_QTY >= :required_quantity"
        );

        foreach ($validatedItems as $item) {
            $itemStmt->execute([
                ':price' => (int) round((float) $item['price']),
                ':quantity' => (int) $item['quantity'],
                ':order_id' => $orderId,
                ':product_id' => (int) $item['id'],
            ]);

            $stockStmt->execute([
                ':decrement_quantity' => (int) $item['quantity'],
                ':required_quantity' => (int) $item['quantity'],
                ':product_id' => (int) $item['id'],
            ]);

            if ($stockStmt->rowCount() === 0) {
                throw new RuntimeException('Insufficient stock during checkout.');
            }
        }

        foreach ($vouchers as $voucher) {
            recordVoucherUsage($db, $voucher, moneyValue($voucher['discountAmount'] ?? 0), $orderId, null);
        }

        if ($paymentMethod === 'gcash') {
            $allowedPaymentId = resolveAllowedPaymentId($db, (int) $validatedItems[0]['merchant_id'], (int) $validatedItems[0]['id'], 'gcash');
            if ($allowedPaymentId !== null) {
                ensurePaymentRecord($db, $orderId, null, $allowedPaymentId, $total, $reference, $paymentProofUrl);
            }
        }

        $db->commit();

        jsonResponse([
            'orderNumber' => 'ORD-' . $orderId,
            'paymentStatus' => paymentStatusLabel($paymentStatus),
            'validatedBy' => $validatedBy,
            'customerId' => (int) $sessionUser['id'],
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to place order. Please try again.'], 500);
    }
}

if ($type === 'service' && $validatedBy === 'database') {
    $recipientName = trim((string) ($customer['recipientName'] ?? ''));
    $phone = trim((string) ($customer['phone'] ?? ''));
    $address = trim((string) ($customer['address'] ?? ''));
    if ($recipientName === '' || $phone === '') {
        jsonResponse(['error' => 'Recipient name and phone are required.'], 422);
    }

    $fallbackRequirements = normalizedServiceRequirements($service);

    try {
        $db->beginTransaction();
        if ($voucherCodes) {
            $vouchers = validateCheckoutVouchers($db, $voucherCodes, $validatedItems, true);
            $discountAmount = totalVoucherDiscount($vouchers);
        }

        $requestStmt = $db->prepare(
            "INSERT INTO SERVICE_REQUEST
                (SCHEDULED_DATE, REQ_STATUS, TOTAL_PRICE, CUSTOMER_INFO, NOTE, RECEIPT_NAME, ADDRESS, PHONE_NUM, CUSTOMER_ID, SERVICE_ID, RECIPIENT_NAME)
             VALUES
                (:scheduled_date, :req_status, :total_price, :customer_info, :note, :receipt_name, :address, :phone_num, :customer_id, :service_id, :recipient_name)"
        );
        $slotsStmt = $db->prepare(
            "UPDATE SERVICE
             SET SLOTS = SLOTS - :decrement_quantity
             WHERE SERVICE_ID = :service_id AND SLOTS >= :required_quantity"
        );

        $createdIds = [];
        $requestTotals = serviceLineTotals($validatedItems, $total);
        foreach ($validatedItems as $index => $item) {
            $qty = max(1, (int) $item['quantity']);
            $unitPrice = moneyValue($item['price']);
            $lineSubtotal = moneyValue($unitPrice * $qty);
            $lineTotal = $requestTotals[$index] ?? (int) round($lineSubtotal);
            $requirements = array_merge($fallbackRequirements, array_filter(
                $item['service_requirements'] ?? [],
                fn ($value): bool => trim((string) $value) !== ''
            ));
            $deadlineRaw = trim((string) ($requirements['deadline'] ?? ''));
            $deadlineTimestamp = $deadlineRaw !== '' ? strtotime($deadlineRaw) : false;
            $scheduledDate = $deadlineTimestamp ? date('Y-m-d H:i:s', $deadlineTimestamp) : date('Y-m-d H:i:s');
            $noteParts = [];
            if (!empty($requirements['brief'])) {
                $noteParts[] = 'Brief: ' . $requirements['brief'];
            }
            if ($qty > 1) {
                $noteParts[] = 'Requested quantity: ' . $qty;
            }
            $customerInfo = json_encode([
                'paymentMethod' => $paymentMethod,
                'paymentStatus' => $paymentStatus,
                'referenceNumber' => $paymentMethod === 'gcash' ? $reference : '',
                'complexity' => $requirements['complexity'] ?: $requirements['package'],
                'package' => $requirements['package'],
                'businessType' => $requirements['businessType'],
                'brief' => $requirements['brief'],
                'quantity' => $qty,
                'lineSubtotal' => $lineSubtotal,
                'serviceFee' => $serviceFee,
                'voucherDiscount' => $discountAmount,
            ]);

            $requestStmt->execute([
                ':scheduled_date' => $scheduledDate,
                ':req_status' => 'PENDING',
                ':total_price' => $lineTotal,
                ':customer_info' => $customerInfo !== false ? $customerInfo : '{}',
                ':note' => $noteParts ? implode("\n", $noteParts) : null,
                ':receipt_name' => $recipientName,
                ':address' => $address !== '' ? $address : null,
                ':phone_num' => $phone,
                ':customer_id' => (int) $sessionUser['id'],
                ':service_id' => (int) $item['id'],
                ':recipient_name' => $recipientName,
            ]);

            $requestId = (int) $db->lastInsertId();
            if ($requestId <= 0) {
                throw new RuntimeException('Unable to create service request.');
            }
            $createdIds[] = $requestId;

            $slotsStmt->execute([
                ':decrement_quantity' => $qty,
                ':required_quantity' => $qty,
                ':service_id' => (int) $item['id'],
            ]);
            if ($slotsStmt->rowCount() === 0) {
                throw new RuntimeException('Insufficient service slots during checkout.');
            }

            if ($paymentMethod === 'gcash') {
                $allowedPaymentId = resolveAllowedPaymentId($db, (int) $item['merchant_id'], (int) $item['id'], 'gcash');
                if ($allowedPaymentId !== null) {
                    ensurePaymentRecord($db, null, $requestId, $allowedPaymentId, $lineTotal, $reference, $paymentProofUrl);
                }
            }
        }

        if ($createdIds) {
            foreach ($vouchers as $voucher) {
                recordVoucherUsage($db, $voucher, moneyValue($voucher['discountAmount'] ?? 0), null, (int) $createdIds[0]);
            }
        }

        $db->commit();

        $reference = count($createdIds) === 1
            ? ('SRV-' . $createdIds[0])
            : ('SRV-' . $createdIds[0] . '+' . (count($createdIds) - 1));

        jsonResponse([
            'orderNumber' => $reference,
            'paymentStatus' => paymentStatusLabel($paymentStatus),
            'validatedBy' => $validatedBy,
            'customerId' => (int) $sessionUser['id'],
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to place service request. Please try again.'], 500);
    }
}

jsonResponse(['error' => 'Unable to place checkout for this item type.'], 422);
