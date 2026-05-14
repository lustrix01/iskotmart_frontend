<?php

require_once(__DIR__ . '/config.php');

function requireMerchantForDiscounts(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function positiveMoney(mixed $value, string $field, float $min = 0): float {
    if (!is_numeric($value) || (float) $value < $min) {
        jsonResponse(['error' => "{$field} must be a valid amount."], 422);
    }

    return round((float) $value, 2);
}

function dateValue(string $value, string $field): string {
    $parts = explode('-', $value);
    if (count($parts) !== 3 || !checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])) {
        jsonResponse(['error' => "{$field} must be a valid date."], 422);
    }

    return $value;
}

function requireMerchantOffering(PDO $db, int $merchantId, int $offeringId, string $type = 'P'): void {
    $stmt = $db->prepare(
        "SELECT o.OFFERING_ID
         FROM OFFERING o
         WHERE o.OFFERING_ID = :offering_id
           AND o.MERCHANT_ID = :merchant_id
           AND o.OFFERING_TYPE = :type
         LIMIT 1"
    );
    $stmt->execute([
        ':offering_id' => $offeringId,
        ':merchant_id' => $merchantId,
        ':type' => $type,
    ]);

    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(['error' => 'Selected product does not belong to this merchant.'], 403);
    }
}

$sessionUser = requireMerchantForDiscounts($db);
$merchantId = (int) $sessionUser['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $voucherStmt = $db->prepare(
            "SELECT v.VOUCHER_ID AS id, v.CODE AS code, v.DISCOUNT_TYPE AS discountType,
                    v.DISCOUNT_VALUE AS discountValue, v.CAP AS cap, v.MIN_SPEND AS minSpend,
                    v.USAGE_LIMIT AS usageLimit, v.EXPIRY_DATE AS expiryDate, v.STATUS AS status,
                    COUNT(vu.VU_ID) AS used
             FROM VOUCHER v
             LEFT JOIN VOUCHER_USAGE vu ON vu.VOUCHER_ID = v.VOUCHER_ID
             WHERE v.MERCHANT_ID = :merchant_id
             GROUP BY v.VOUCHER_ID, v.CODE, v.DISCOUNT_TYPE, v.DISCOUNT_VALUE, v.CAP,
                      v.MIN_SPEND, v.USAGE_LIMIT, v.EXPIRY_DATE, v.STATUS
             ORDER BY v.VOUCHER_ID DESC"
        );
        $voucherStmt->execute([':merchant_id' => $merchantId]);

        $discountStmt = $db->prepare(
            "SELECT d.DISCOUNT_ID AS id, d.OFFERING_ID AS offeringId,
                    o.OFFERING_NAME AS productName, p.PRICE AS originalPrice,
                    d.TYPE AS discountType, d.VALUE AS discountValue,
                    d.START_DATE AS startDate, d.END_DATE AS endDate
             FROM DISCOUNT d
             JOIN OFFERING o ON o.OFFERING_ID = d.OFFERING_ID
             JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
             WHERE o.MERCHANT_ID = :merchant_id
             ORDER BY d.DISCOUNT_ID DESC"
        );
        $discountStmt->execute([':merchant_id' => $merchantId]);

        $vouchers = array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'code' => $row['code'],
                'discountType' => $row['discountType'],
                'discountValue' => (float) $row['discountValue'],
                'cap' => $row['cap'] !== null ? (float) $row['cap'] : '',
                'minSpend' => (float) $row['minSpend'],
                'usageLimit' => (int) $row['usageLimit'],
                'used' => (int) $row['used'],
                'expiryDate' => $row['expiryDate'],
                'status' => $row['status'],
            ];
        }, $voucherStmt->fetchAll(PDO::FETCH_ASSOC));

        $productDiscounts = array_map(function (array $row): array {
            $originalPrice = (float) $row['originalPrice'];
            $discountValue = (float) $row['discountValue'];
            $discountedPrice = strtolower((string) $row['discountType']) === 'percentage'
                ? max(0, $originalPrice - ($originalPrice * ($discountValue / 100)))
                : max(0, $originalPrice - $discountValue);

            return [
                'id' => (int) $row['id'],
                'offeringId' => (int) $row['offeringId'],
                'productName' => $row['productName'],
                'originalPrice' => $originalPrice,
                'discountType' => $row['discountType'],
                'discountValue' => $discountValue,
                'discountedPrice' => $discountedPrice,
                'startDate' => substr((string) $row['startDate'], 0, 10),
                'endDate' => substr((string) $row['endDate'], 0, 10),
                'status' => date('Y-m-d') <= substr((string) $row['endDate'], 0, 10) ? 'Active' : 'Expired',
            ];
        }, $discountStmt->fetchAll(PDO::FETCH_ASSOC));

        jsonResponse(['vouchers' => $vouchers, 'productDiscounts' => $productDiscounts]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to load merchant discounts from database.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$mode = strtolower(trim((string) ($data['mode'] ?? '')));

if ($mode === 'delete-voucher') {
    $voucherId = (int) ($data['id'] ?? 0);
    if ($voucherId <= 0) {
        jsonResponse(['error' => 'A valid voucher ID is required.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "DELETE FROM VOUCHER
             WHERE VOUCHER_ID = :voucher_id AND MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':voucher_id' => $voucherId,
            ':merchant_id' => $merchantId,
        ]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['error' => 'Voucher not found for this merchant.'], 404);
        }

        jsonResponse(['message' => 'Voucher deleted.']);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to delete voucher. It may already be used by an order or request.'], 409);
    }
}

if ($mode === 'delete-product-discount') {
    $discountId = (int) ($data['id'] ?? 0);
    if ($discountId <= 0) {
        jsonResponse(['error' => 'A valid discount ID is required.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "DELETE d
             FROM DISCOUNT d
             JOIN OFFERING o ON o.OFFERING_ID = d.OFFERING_ID
             WHERE d.DISCOUNT_ID = :discount_id AND o.MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':discount_id' => $discountId,
            ':merchant_id' => $merchantId,
        ]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['error' => 'Product discount not found for this merchant.'], 404);
        }

        jsonResponse(['message' => 'Product discount deleted.']);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to delete product discount.'], 409);
    }
}

if ($mode === 'voucher') {
    requireFields($data, ['code', 'discountType', 'discountValue', 'minSpend', 'usageLimit', 'expiryDate']);

    $code = strtoupper(trim((string) $data['code']));
    if (!preg_match('/^[A-Z0-9][A-Z0-9-]{2,31}$/', $code)) {
        jsonResponse(['error' => 'Voucher code must be 3-32 characters and use only letters, numbers, or dashes.'], 422);
    }

    $discountType = strtolower(trim((string) $data['discountType']));
    if (!in_array($discountType, ['percentage', 'fixed'], true)) {
        jsonResponse(['error' => 'Voucher discount type must be percentage or fixed.'], 422);
    }

    $discountValue = positiveMoney($data['discountValue'], 'Discount value', 1);
    if ($discountType === 'percentage' && $discountValue > 100) {
        jsonResponse(['error' => 'Percentage voucher discount cannot exceed 100%.'], 422);
    }

    $minSpend = positiveMoney($data['minSpend'], 'Minimum spend', 0);
    $cap = isset($data['cap']) && $data['cap'] !== '' ? positiveMoney($data['cap'], 'Discount cap', 0) : null;
    $usageLimit = (int) $data['usageLimit'];
    if ($usageLimit <= 0) {
        jsonResponse(['error' => 'Usage limit must be at least 1.'], 422);
    }

    $expiryDate = dateValue((string) $data['expiryDate'], 'Expiry date');
    if ($expiryDate < date('Y-m-d')) {
        jsonResponse(['error' => 'Expiry date cannot be in the past.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "INSERT INTO VOUCHER
                (CODE, DISCOUNT_TYPE, DISCOUNT_VALUE, CAP, MIN_SPEND, USAGE_LIMIT, EXPIRY_DATE, STATUS, MERCHANT_ID)
             VALUES
                (:code, :discount_type, :discount_value, :cap, :min_spend, :usage_limit, :expiry_date, 'ACTIVE', :merchant_id)"
        );
        $stmt->execute([
            ':code' => $code,
            ':discount_type' => $discountType,
            ':discount_value' => (int) round($discountValue),
            ':cap' => $cap !== null ? (int) round($cap) : null,
            ':min_spend' => (int) round($minSpend),
            ':usage_limit' => $usageLimit,
            ':expiry_date' => $expiryDate,
            ':merchant_id' => $merchantId,
        ]);

        jsonResponse(['message' => 'Voucher saved.'], 201);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to save voucher. Please verify the code is unique and try again.'], 400);
    }
}

if ($mode === 'product-discount') {
    requireFields($data, ['offeringId', 'discountType', 'discountValue', 'startDate', 'endDate']);

    $offeringId = (int) $data['offeringId'];
    if ($offeringId <= 0) {
        jsonResponse(['error' => 'A valid merchant product is required.'], 422);
    }
    requireMerchantOffering($db, $merchantId, $offeringId, 'P');

    $discountType = strtolower(trim((string) $data['discountType']));
    if (!in_array($discountType, ['percentage', 'fixed'], true)) {
        jsonResponse(['error' => 'Product discount type must be percentage or fixed.'], 422);
    }

    $discountValue = positiveMoney($data['discountValue'], 'Discount value', 1);
    if ($discountType === 'percentage' && $discountValue > 100) {
        jsonResponse(['error' => 'Percentage product discount cannot exceed 100%.'], 422);
    }

    $startDate = dateValue((string) $data['startDate'], 'Start date');
    $endDate = dateValue((string) $data['endDate'], 'End date');
    if ($endDate < $startDate) {
        jsonResponse(['error' => 'End date cannot be earlier than start date.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "INSERT INTO DISCOUNT (TYPE, VALUE, START_DATE, END_DATE, OFFERING_ID)
             VALUES (:type, :value, :start_date, :end_date, :offering_id)"
        );
        $stmt->execute([
            ':type' => $discountType,
            ':value' => (int) round($discountValue),
            ':start_date' => $startDate . ' 00:00:00.0',
            ':end_date' => $endDate . ' 23:59:59.0',
            ':offering_id' => $offeringId,
        ]);

        jsonResponse(['message' => 'Product discount saved.'], 201);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to save product discount. Please verify the selected product and try again.'], 400);
    }
}

jsonResponse(['error' => 'Unknown discount mode.'], 422);
