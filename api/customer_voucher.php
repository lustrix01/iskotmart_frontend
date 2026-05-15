<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForVoucher(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function voucherOffering(PDO $db, string $type, int $id): ?array {
    if ($type === 'product') {
        $stmt = $db->prepare(
            "SELECT p.PROD_ID AS id, p.PRICE AS price, p.MERCHANT_ID AS merchant_id
             FROM PRODUCT p
             WHERE p.PROD_ID = :id
             LIMIT 1"
        );
    } else {
        $stmt = $db->prepare(
            "SELECT s.SERVICE_ID AS id, s.PRICE AS price, s.MERCHANT_ID AS merchant_id
             FROM SERVICE s
             WHERE s.SERVICE_ID = :id
             LIMIT 1"
        );
    }

    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function computeVoucherDiscount(array $voucher, float $eligibleSubtotal): float {
    $type = strtolower((string) $voucher['DISCOUNT_TYPE']);
    $value = (float) $voucher['DISCOUNT_VALUE'];
    $discount = $type === 'percentage'
        ? $eligibleSubtotal * ($value / 100)
        : $value;

    if ($voucher['CAP'] !== null && $voucher['CAP'] !== '') {
        $discount = min($discount, (float) $voucher['CAP']);
    }

    return round(max(0, min($discount, $eligibleSubtotal)), 2);
}

requireCustomerForVoucher($db);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$type = strtolower(trim((string) ($data['type'] ?? '')));
$code = strtoupper(trim((string) ($data['code'] ?? '')));
$items = $data['items'] ?? [];

if (!in_array($type, ['product', 'service'], true)) {
    jsonResponse(['error' => 'Invalid checkout type.'], 422);
}

if (!preg_match('/^[A-Z0-9][A-Z0-9-]{2,31}$/', $code)) {
    jsonResponse(['error' => 'Invalid voucher code.'], 422);
}

if (!is_array($items) || count($items) === 0) {
    jsonResponse(['error' => 'Add an item before applying a voucher.'], 422);
}

try {
    $merchantSubtotals = [];

    foreach ($items as $item) {
        $id = (int) ($item['id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);
        if ($id <= 0 || $quantity <= 0 || $quantity > 99) {
            jsonResponse(['error' => 'Invalid item quantity.'], 422);
        }

        $offering = voucherOffering($db, $type, $id);
        if (!$offering) {
            jsonResponse(['error' => 'Item is not available for voucher validation.'], 409);
        }

        $merchantId = (int) $offering['merchant_id'];
        $merchantSubtotals[$merchantId] = ($merchantSubtotals[$merchantId] ?? 0) + ((float) $offering['price'] * $quantity);
    }

    $merchantIds = array_keys($merchantSubtotals);
    $placeholders = implode(',', array_fill(0, count($merchantIds), '?'));
    $stmt = $db->prepare(
        "SELECT v.*, COUNT(vu.VU_ID) AS used
         FROM VOUCHER v
         LEFT JOIN VOUCHER_USAGE vu ON vu.VOUCHER_ID = v.VOUCHER_ID
         WHERE UPPER(v.CODE) = ?
           AND v.STATUS = 'ACTIVE'
           AND v.MERCHANT_ID IN ({$placeholders})
         GROUP BY v.VOUCHER_ID, v.CODE, v.DISCOUNT_TYPE, v.DISCOUNT_VALUE, v.CAP,
                  v.MIN_SPEND, v.USAGE_LIMIT, v.EXPIRY_DATE, v.STATUS, v.MERCHANT_ID
         ORDER BY v.VOUCHER_ID DESC"
    );
    $stmt->execute(array_merge([$code], $merchantIds));
    $vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($vouchers as $voucher) {
        $merchantId = (int) $voucher['MERCHANT_ID'];
        $eligibleSubtotal = round((float) ($merchantSubtotals[$merchantId] ?? 0), 2);

        if (strtoupper((string) $voucher['STATUS']) !== 'ACTIVE') {
            continue;
        }
        if ((string) $voucher['EXPIRY_DATE'] < date('Y-m-d')) {
            continue;
        }
        if ((int) $voucher['used'] > 0) {
            continue;
        }
        if ($eligibleSubtotal < (float) $voucher['MIN_SPEND']) {
            jsonResponse(['error' => 'Minimum spend for this voucher has not been met.'], 422);
        }

        $discountAmount = computeVoucherDiscount($voucher, $eligibleSubtotal);
        jsonResponse([
            'code' => $code,
            'discountAmount' => $discountAmount,
            'discountType' => strtolower((string) $voucher['DISCOUNT_TYPE']),
            'discountValue' => (float) $voucher['DISCOUNT_VALUE'],
            'eligibleSubtotal' => $eligibleSubtotal,
            'message' => "Voucher {$code} applied.",
        ]);
    }

    jsonResponse(['error' => 'Invalid voucher code.'], 404);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to validate voucher. Please try again.'], 500);
}
