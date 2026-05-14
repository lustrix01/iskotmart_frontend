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

jsonResponse([
    'orderNumber' => sprintf('ORD-%s-%04d', date('ymdHis'), random_int(1000, 9999)),
    'paymentStatus' => $paymentMethod === 'gcash' ? 'Paid' : 'Unpaid',
    'validatedBy' => $dbBackedItems === count($items) ? 'database' : 'mock-catalog-fallback',
    'customerId' => (int) $sessionUser['id'],
]);
