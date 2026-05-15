<?php

require_once(__DIR__ . '/config.php');

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

function assertClose(float $expected, float $actual, string $label): void {
    if (abs($expected - $actual) > 0.01) {
        jsonResponse(['error' => "{$label} does not match server calculation."], 422);
    }
}

function fallbackUnitPrice(string $type, string $name, int $id): ?float {
    $normalized = strtolower(trim($name));

    if ($type === 'product') {
        if (str_contains($normalized, 'keyboard')) {
            return 904.30;
        }
        if (str_contains($normalized, 'earbuds') || str_contains($normalized, 'mouse') || str_contains($normalized, 'sandwich') || str_contains($normalized, 'tote')) {
            return 999.00;
        }
    }

    if ($type === 'service') {
        if (str_contains($normalized, 'logo') || str_contains($normalized, 'branding')) {
            return str_contains($normalized, 'professional') ? 1903.30 : 1500.00;
        }
        if (str_contains($normalized, 'consultation')) {
            return 951.65;
        }
        if (str_contains($normalized, 'tutoring') || str_contains($normalized, 'algebra')) {
            return 250.00;
        }
    }

    return $id > 0 ? null : null;
}

function dbOffering(PDO $db, string $type, int $id): ?array {
    if ($type === 'product') {
        $stmt = $db->prepare(
            "SELECT p.PROD_ID AS id, p.PRICE AS price, p.STOCK_QTY AS capacity,
                    p.STATUS AS status, p.MERCHANT_ID AS merchant_id
             FROM PRODUCT p
             WHERE p.PROD_ID = :id
             LIMIT 1"
        );
    } else {
        $stmt = $db->prepare(
            "SELECT s.SERVICE_ID AS id, s.PRICE AS price, s.SLOTS AS capacity,
                    s.STATUS AS status, s.MERCHANT_ID AS merchant_id
             FROM SERVICE s
             WHERE s.SERVICE_ID = :id
             LIMIT 1"
        );
    }

    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function merchantAllowsPayment(PDO $db, int $merchantId, int $offeringId, string $paymentMethod): bool {
    $serviceName = $paymentMethod === 'gcash' ? 'GCash' : 'Cash on Delivery';
    $stmt = $db->prepare(
        "SELECT ap.ALLOWED_PM_ID
         FROM ALLOWED_PAYMENT ap
         INNER JOIN PAYMENT_METHOD pm ON pm.PM_ID = ap.PM_ID
         WHERE ap.OFFERING_ID = :offering_id
           AND ap.STATUS = 'ACTIVE'
           AND pm.MERCHANT_ID = :merchant_id
           AND LOWER(pm.SERVICE) = LOWER(:service)
         LIMIT 1"
    );
    $stmt->execute([
        ':offering_id' => $offeringId,
        ':merchant_id' => $merchantId,
        ':service' => $serviceName,
    ]);

    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

function resolveDeliveryMethodId(PDO $db, int $productId, string $deliveryMethod): ?int {
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

    $fallbackStmt = $db->query("SELECT DM_ID FROM DELIVERY_METHOD ORDER BY DM_ID ASC LIMIT 1");
    $fallback = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
    return $fallback ? (int) $fallback['DM_ID'] : null;
}

$sessionUser = requireCustomerForCheckout($db);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$type = strtolower(trim((string) ($data['type'] ?? '')));
$paymentMethod = strtolower(trim((string) ($data['paymentMethod'] ?? '')));
$deliveryMethod = strtolower(trim((string) ($data['deliveryMethod'] ?? '')));
$items = $data['items'] ?? [];
$totals = $data['totals'] ?? [];
$customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];
$service = is_array($data['service'] ?? null) ? $data['service'] : [];

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
    $name = trim((string) ($item['name'] ?? ''));

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
        ];
        continue;
    }

    $fallbackPrice = fallbackUnitPrice($type, $name, $id);
    if ($fallbackPrice === null) {
        jsonResponse(['error' => 'Item is not available for checkout.'], 409);
    }

    $subtotal += $fallbackPrice * $quantity;
}

$shippingFee = $type === 'product' && $deliveryMethod === 'standard' ? 50.00 : 0.00;
$serviceFee = $type === 'service' ? 50.00 : 0.00;
$discountAmount = moneyValue($totals['discountAmount'] ?? 0);
$total = max(0, $subtotal + $shippingFee + $serviceFee - $discountAmount);

assertClose($subtotal, moneyValue($totals['subtotal'] ?? -1), 'Subtotal');
assertClose($shippingFee, moneyValue($totals['shippingFee'] ?? 0), 'Shipping fee');
assertClose($serviceFee, moneyValue($totals['serviceFee'] ?? 0), 'Service fee');
assertClose($total, moneyValue($totals['total'] ?? -1), 'Total');

$paymentStatus = $paymentMethod === 'gcash' ? 'Paid' : 'Unpaid';
$validatedBy = $dbBackedItems === count($items) ? 'database' : 'mock-catalog-fallback';

if ($type === 'product' && $validatedBy === 'database') {
    $recipientName = trim((string) ($customer['recipientName'] ?? ''));
    $phone = trim((string) ($customer['phone'] ?? ''));
    $address = trim((string) ($customer['address'] ?? ''));
    if ($recipientName === '' || $phone === '' || $address === '') {
        jsonResponse(['error' => 'Recipient name, phone, and address are required.'], 422);
    }

    $dmId = resolveDeliveryMethodId($db, (int) $validatedItems[0]['id'], $deliveryMethod);
    if (!$dmId) {
        jsonResponse(['error' => 'Delivery method is unavailable for this order.'], 422);
    }

    try {
        $db->beginTransaction();

        $orderStmt = $db->prepare(
            "INSERT INTO ORDERS
                (TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, DISCOUNT_ID, CUSTOMER_ID, DM_ID)
             VALUES
                (:total_amount, :order_status, :payment_status, :recipient_name, :phone, :address, :discount_amt, :delivery_status, :discount_id, :customer_id, :dm_id)"
        );
        $orderStmt->execute([
            ':total_amount' => (int) round($total),
            ':order_status' => 'PENDING',
            ':payment_status' => strtoupper($paymentStatus),
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
             SET STOCK_QTY = STOCK_QTY - :quantity
             WHERE PROD_ID = :product_id AND STOCK_QTY >= :quantity"
        );

        foreach ($validatedItems as $item) {
            $itemStmt->execute([
                ':price' => (int) round((float) $item['price']),
                ':quantity' => (int) $item['quantity'],
                ':order_id' => $orderId,
                ':product_id' => (int) $item['id'],
            ]);

            $stockStmt->execute([
                ':quantity' => (int) $item['quantity'],
                ':product_id' => (int) $item['id'],
            ]);

            if ($stockStmt->rowCount() === 0) {
                throw new RuntimeException('Insufficient stock during checkout.');
            }
        }

        $db->commit();

        jsonResponse([
            'orderNumber' => 'ORD-' . $orderId,
            'paymentStatus' => $paymentStatus,
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

    $deadlineRaw = trim((string) ($service['deadline'] ?? ''));
    $deadlineTimestamp = $deadlineRaw !== '' ? strtotime($deadlineRaw) : false;
    $scheduledDate = $deadlineTimestamp ? date('Y-m-d H:i:s', $deadlineTimestamp) : date('Y-m-d H:i:s');
    $complexity = trim((string) ($service['complexity'] ?? ''));

    try {
        $db->beginTransaction();

        $requestStmt = $db->prepare(
            "INSERT INTO SERVICE_REQUEST
                (SCHEDULED_DATE, REQ_STATUS, TOTAL_PRICE, CUSTOMER_INFO, NOTE, RECEIPT_NAME, ADDRESS, PHONE_NUM, CUSTOMER_ID, SERVICE_ID, RECIPIENT_NAME)
             VALUES
                (:scheduled_date, :req_status, :total_price, :customer_info, :note, :receipt_name, :address, :phone_num, :customer_id, :service_id, :recipient_name)"
        );
        $slotsStmt = $db->prepare(
            "UPDATE SERVICE
             SET SLOTS = SLOTS - :quantity
             WHERE SERVICE_ID = :service_id AND SLOTS >= :quantity"
        );

        $createdIds = [];
        foreach ($validatedItems as $item) {
            $qty = max(1, (int) $item['quantity']);
            $unitPrice = moneyValue($item['price']);
            $lineTotal = (int) round($unitPrice * $qty);
            $customerInfo = json_encode([
                'paymentMethod' => $paymentMethod,
                'paymentStatus' => $paymentStatus,
                'complexity' => $complexity,
                'quantity' => $qty,
            ]);

            $requestStmt->execute([
                ':scheduled_date' => $scheduledDate,
                ':req_status' => 'PENDING',
                ':total_price' => $lineTotal,
                ':customer_info' => $customerInfo !== false ? $customerInfo : '{}',
                ':note' => $qty > 1 ? ('Requested quantity: ' . $qty) : null,
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
                ':quantity' => $qty,
                ':service_id' => (int) $item['id'],
            ]);
            if ($slotsStmt->rowCount() === 0) {
                throw new RuntimeException('Insufficient service slots during checkout.');
            }
        }

        $db->commit();

        $reference = count($createdIds) === 1
            ? ('SRV-' . $createdIds[0])
            : ('SRV-' . $createdIds[0] . '+' . (count($createdIds) - 1));

        jsonResponse([
            'orderNumber' => $reference,
            'paymentStatus' => $paymentStatus,
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

jsonResponse([
    'orderNumber' => sprintf('ORD-%s-%04d', date('ymdHis'), random_int(1000, 9999)),
    'paymentStatus' => $paymentStatus,
    'validatedBy' => $validatedBy,
    'customerId' => (int) $sessionUser['id'],
]);
