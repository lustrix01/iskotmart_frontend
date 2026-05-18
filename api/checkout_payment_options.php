<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForPaymentOptions(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function checkoutPaymentKind(string $label): ?string {
    $normalized = strtolower(trim($label));
    if ($normalized === '') {
        return null;
    }

    if (str_contains($normalized, 'gcash')) {
        return 'gcash';
    }

    if (
        str_contains($normalized, 'cod') ||
        str_contains($normalized, 'cash on delivery') ||
        str_contains($normalized, 'cash') ||
        str_contains($normalized, 'meetup')
    ) {
        return 'cod';
    }

    return null;
}

function checkoutOffering(PDO $db, string $type, int $id): ?array {
    if ($type === 'product') {
        $stmt = $db->prepare(
            "SELECT p.PROD_ID AS id, p.MERCHANT_ID AS merchant_id,
                    COALESCE(m.SHOP_NAME, u.USERNAME) AS merchant_name
             FROM PRODUCT p
             INNER JOIN USERS u ON u.USER_ID = p.MERCHANT_ID AND u.STATUS = 'ACTIVE'
             LEFT JOIN MERCHANT m ON m.MERCHANT_ID = p.MERCHANT_ID
             WHERE p.PROD_ID = :id
             LIMIT 1"
        );
    } else {
        $stmt = $db->prepare(
            "SELECT s.SERVICE_ID AS id, s.MERCHANT_ID AS merchant_id,
                    COALESCE(m.SHOP_NAME, u.USERNAME) AS merchant_name
             FROM SERVICE s
             INNER JOIN USERS u ON u.USER_ID = s.MERCHANT_ID AND u.STATUS = 'ACTIVE'
             LEFT JOIN MERCHANT m ON m.MERCHANT_ID = s.MERCHANT_ID
             WHERE s.SERVICE_ID = :id
             LIMIT 1"
        );
    }

    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function merchantPaymentRows(PDO $db, int $merchantId, int $offeringId): array {
    $stmt = $db->prepare(
        "SELECT ap.ALLOWED_PM_ID, pm.PM_ID, pm.SERVICE, pm.LINK, pm.QR_URL,
                pm.NUMBER, pm.USERNAME, pm.OTHER
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

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

requireCustomerForPaymentOptions($db);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$type = strtolower(trim((string) ($data['type'] ?? '')));
$items = $data['items'] ?? [];

if (!in_array($type, ['product', 'service'], true)) {
    jsonResponse(['error' => 'Invalid checkout type.'], 422);
}

if (!is_array($items) || count($items) === 0) {
    jsonResponse(['error' => 'Checkout requires at least one item.'], 422);
}

$merchants = [];
$allowedMethods = ['cod' => false, 'gcash' => false];

foreach ($items as $item) {
    $id = (int) ($item['id'] ?? 0);
    if ($id <= 0) {
        continue;
    }

    $offering = checkoutOffering($db, $type, $id);
    if (!$offering) {
        continue;
    }

    $merchantId = (int) $offering['merchant_id'];
    if (!isset($merchants[$merchantId])) {
        $merchants[$merchantId] = [
            'id' => $merchantId,
            'name' => $offering['merchant_name'] ?: 'Merchant',
            'methods' => [],
        ];
    }

    foreach (merchantPaymentRows($db, $merchantId, $id) as $row) {
        $kind = checkoutPaymentKind((string) ($row['SERVICE'] ?? ''));
        if ($kind === null || !array_key_exists($kind, $allowedMethods)) {
            continue;
        }

        $allowedMethods[$kind] = true;
        $methodKey = $kind . '-' . (int) $row['PM_ID'];
        $merchants[$merchantId]['methods'][$methodKey] = [
            'id' => (int) $row['PM_ID'],
            'allowedPaymentId' => (int) $row['ALLOWED_PM_ID'],
            'kind' => $kind,
            'label' => $row['SERVICE'],
            'number' => $row['NUMBER'] ?: '',
            'username' => $row['USERNAME'] ?: '',
            'link' => $row['LINK'] ?: '',
            'qrUrl' => $row['QR_URL'] ?: '',
            'other' => $row['OTHER'] ?: '',
        ];
    }
}

$merchantPayload = array_map(function (array $merchant): array {
    $merchant['methods'] = array_values($merchant['methods']);
    return $merchant;
}, array_values($merchants));

jsonResponse([
    'allowedMethods' => $allowedMethods,
    'merchants' => $merchantPayload,
]);
