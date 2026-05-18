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

function ensureCheckoutMerchantFulfillmentColumns(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    requireTableColumns($db, 'MERCHANT', [
        'ACCEPTS_COD',
        'ACCEPTS_GCASH',
        'ALLOW_MEETUP',
        'ALLOW_DELIVERY',
        'DELIVERY_FEE',
    ]);
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

function checkoutMerchantFulfillmentSettings(PDO $db, int $merchantId): array {
    ensureCheckoutMerchantFulfillmentColumns($db);

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
$itemMethodAvailability = [];
$deliveryOptions = [
    'standard' => $type !== 'product',
    'pickup' => $type !== 'product',
    'deliveryFee' => 0,
];

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
    $settings = checkoutMerchantFulfillmentSettings($db, $merchantId);
    ensureCheckoutPaymentDefaults($db, $merchantId, $id);
    if ($type === 'product') {
        $deliveryOptions['standard'] = $deliveryOptions['standard'] || $settings['allowDelivery'];
        $deliveryOptions['pickup'] = $deliveryOptions['pickup'] || $settings['allowMeetup'];
        $deliveryOptions['deliveryFee'] = max($deliveryOptions['deliveryFee'], (float) $settings['deliveryFee']);
    }
    if (!isset($merchants[$merchantId])) {
        $merchants[$merchantId] = [
            'id' => $merchantId,
            'name' => $offering['merchant_name'] ?: 'Merchant',
            'fulfillment' => $settings,
            'methods' => [],
        ];
    }

    $itemMethods = ['cod' => false, 'gcash' => false];
    foreach (merchantPaymentRows($db, $merchantId, $id) as $row) {
        $kind = checkoutPaymentKind((string) ($row['SERVICE'] ?? ''));
        if ($kind === null || !array_key_exists($kind, $allowedMethods)) {
            continue;
        }

        $itemMethods[$kind] = true;
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
    $itemMethodAvailability[] = $itemMethods;
}

if ($itemMethodAvailability) {
    $allowedMethods = [
        'cod' => count(array_filter($itemMethodAvailability, fn (array $methods): bool => $methods['cod'])) === count($itemMethodAvailability),
        'gcash' => count(array_filter($itemMethodAvailability, fn (array $methods): bool => $methods['gcash'])) === count($itemMethodAvailability),
    ];
}

$merchantPayload = array_map(function (array $merchant): array {
    $merchant['methods'] = array_values($merchant['methods']);
    return $merchant;
}, array_values($merchants));

jsonResponse([
    'allowedMethods' => $allowedMethods,
    'deliveryOptions' => $deliveryOptions,
    'merchants' => $merchantPayload,
]);
