<?php

require_once(__DIR__ . '/config.php');

const MERCHANT_BANNER_UPLOAD_DIR = __DIR__ . '/uploads/merchant-banners';
const MERCHANT_BANNER_UPLOAD_URL = '/api/uploads/merchant-banners';
const MERCHANT_AVATAR_UPLOAD_DIR = __DIR__ . '/uploads/merchant-avatars';
const MERCHANT_AVATAR_UPLOAD_URL = '/api/uploads/merchant-avatars';

function ensureMerchantBannerColumn(PDO $db): void {
    $columns = $db->query("SHOW COLUMNS FROM MERCHANT")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('SHOP_BANNER_URL', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN SHOP_BANNER_URL tinytext DEFAULT NULL AFTER SHOP_DESC");
    }
    if (!in_array('ACCEPTS_COD', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN ACCEPTS_COD tinyint(1) NOT NULL DEFAULT 1 AFTER ID_IMAGE_URL");
    }
    if (!in_array('ACCEPTS_GCASH', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN ACCEPTS_GCASH tinyint(1) NOT NULL DEFAULT 1 AFTER ACCEPTS_COD");
    }
    if (!in_array('ALLOW_MEETUP', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN ALLOW_MEETUP tinyint(1) NOT NULL DEFAULT 1 AFTER ACCEPTS_GCASH");
    }
    if (!in_array('ALLOW_DELIVERY', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN ALLOW_DELIVERY tinyint(1) NOT NULL DEFAULT 1 AFTER ALLOW_MEETUP");
    }
    if (!in_array('DELIVERY_FEE', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN DELIVERY_FEE double NOT NULL DEFAULT 50 AFTER ALLOW_DELIVERY");
    }
}

function requireMerchantForProfile(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function merchantProfilePayload(array $row): array {
    return [
        'id' => (int) $row['USER_ID'],
        'name' => trim($row['FNAME'] . ' ' . $row['LNAME']),
        'username' => $row['USERNAME'],
        'email' => $row['EMAIL'],
        'phone' => $row['PHONE'],
        'avatarUrl' => $row['AVATAR_URL'],
        'createdOn' => $row['CREATED_ON'],
        'shopName' => $row['SHOP_NAME'],
        'shopDescription' => $row['SHOP_DESC'] ?: '',
        'bannerUrl' => $row['SHOP_BANNER_URL'] ?? '',
        'businessEmail' => $row['BU_EMAIL'],
        'address' => $row['ADDRESS'],
        'studentNumber' => $row['STUDENT_NUM'],
        'idImageUrl' => $row['ID_IMAGE_URL'],
        'fulfillment' => [
            'acceptsCOD' => (bool) ($row['ACCEPTS_COD'] ?? 1),
            'acceptsGCash' => (bool) ($row['ACCEPTS_GCASH'] ?? 1),
            'allowMeetup' => (bool) ($row['ALLOW_MEETUP'] ?? 1),
            'allowDelivery' => (bool) ($row['ALLOW_DELIVERY'] ?? 1),
            'deliveryFee' => (float) ($row['DELIVERY_FEE'] ?? 50),
        ],
    ];
}

function loadMerchantProfile(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.EMAIL, u.USERNAME, u.PHONE,
                u.AVATAR_URL, u.CREATED_ON,
                m.BU_EMAIL, m.SHOP_NAME, m.SHOP_DESC, m.SHOP_BANNER_URL,
                m.ADDRESS, m.STUDENT_NUM, m.ID_IMAGE_URL,
                m.ACCEPTS_COD, m.ACCEPTS_GCASH, m.ALLOW_MEETUP, m.ALLOW_DELIVERY, m.DELIVERY_FEE
         FROM USERS u
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = u.USER_ID
         WHERE u.USER_ID = :merchant_id AND u.STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonResponse(['error' => 'Merchant profile was not found.'], 404);
    }

    return merchantProfilePayload($row);
}

function boolInput(array $data, string $key, bool $default): bool {
    if (!array_key_exists($key, $data)) {
        return $default;
    }

    return filter_var($data[$key], FILTER_VALIDATE_BOOLEAN);
}

function paymentMethodIdForKind(PDO $db, int $merchantId, string $kind): int {
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

function syncMerchantOfferingPaymentSettings(PDO $db, int $merchantId, bool $acceptsCod, bool $acceptsGcash): void {
    $offeringStmt = $db->prepare("SELECT OFFERING_ID FROM OFFERING WHERE MERCHANT_ID = :merchant_id");
    $offeringStmt->execute([':merchant_id' => $merchantId]);
    $offeringIds = array_map('intval', $offeringStmt->fetchAll(PDO::FETCH_COLUMN));
    if (!$offeringIds) {
        return;
    }

    $upsert = $db->prepare(
        "INSERT INTO ALLOWED_PAYMENT (STATUS, PM_ID, OFFERING_ID)
         VALUES (:status, :pm_id, :offering_id)"
    );
    $update = $db->prepare(
        "UPDATE ALLOWED_PAYMENT
         SET STATUS = :status
         WHERE PM_ID = :pm_id AND OFFERING_ID = :offering_id"
    );
    $existing = $db->prepare(
        "SELECT ALLOWED_PM_ID
         FROM ALLOWED_PAYMENT
         WHERE PM_ID = :pm_id AND OFFERING_ID = :offering_id
         LIMIT 1"
    );

    foreach ([
        'cod' => $acceptsCod,
        'gcash' => $acceptsGcash,
    ] as $kind => $enabled) {
        $paymentMethodId = paymentMethodIdForKind($db, $merchantId, $kind);
        $status = $enabled ? 'ACTIVE' : 'INACTIVE';
        foreach ($offeringIds as $offeringId) {
            $existing->execute([':pm_id' => $paymentMethodId, ':offering_id' => $offeringId]);
            if ($existing->fetch(PDO::FETCH_ASSOC)) {
                $update->execute([':status' => $status, ':pm_id' => $paymentMethodId, ':offering_id' => $offeringId]);
            } else {
                $upsert->execute([':status' => $status, ':pm_id' => $paymentMethodId, ':offering_id' => $offeringId]);
            }
        }
    }
}

function syncMerchantDeliveryFee(PDO $db, int $merchantId, float $deliveryFee): void {
    $stmt = $db->prepare(
        "UPDATE DELIVERY_METHOD dm
         INNER JOIN PRODUCT p ON p.PROD_ID = dm.PROD_ID
         SET dm.DM_FEE = :delivery_fee
         WHERE p.MERCHANT_ID = :merchant_id
           AND (
             LOWER(dm.DM_NAME) LIKE '%standard%'
             OR LOWER(dm.DM_NAME) LIKE '%delivery%'
             OR LOWER(dm.DM_NAME) LIKE '%ship%'
           )"
    );
    $stmt->execute([
        ':delivery_fee' => $deliveryFee,
        ':merchant_id' => $merchantId,
    ]);
}

function storeMerchantBannerImage(int $merchantId, string $dataUrl): string {
    $dataUrl = trim($dataUrl);
    if ($dataUrl === '') {
        return '';
    }

    if (!preg_match('/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+\/=\r\n]+)$/', $dataUrl, $matches)) {
        jsonResponse(['error' => 'Banner must be a JPG, PNG, or WebP image.'], 422);
    }

    $binary = base64_decode(str_replace(["\r", "\n"], '', $matches[2]), true);
    if ($binary === false || strlen($binary) === 0) {
        jsonResponse(['error' => 'Banner image could not be read.'], 422);
    }

    if (strlen($binary) > 5 * 1024 * 1024) {
        jsonResponse(['error' => 'Banner image must be 5MB or smaller.'], 422);
    }

    if (!is_dir(MERCHANT_BANNER_UPLOAD_DIR) && !mkdir(MERCHANT_BANNER_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Unable to prepare banner image storage.'], 500);
    }

    $extension = match ($matches[1]) {
        'image/jpeg', 'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'img',
    };
    $fileName = sprintf('merchant-%d-banner-%s.%s', $merchantId, bin2hex(random_bytes(8)), $extension);
    $targetPath = MERCHANT_BANNER_UPLOAD_DIR . '/' . $fileName;

    if (file_put_contents($targetPath, $binary) === false) {
        jsonResponse(['error' => 'Unable to store banner image.'], 500);
    }

    return MERCHANT_BANNER_UPLOAD_URL . '/' . $fileName;
}

function storeMerchantAvatarImage(int $merchantId, string $dataUrl): string {
    $dataUrl = trim($dataUrl);
    if ($dataUrl === '') {
        return '';
    }

    if (!preg_match('/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+\/=\r\n]+)$/', $dataUrl, $matches)) {
        jsonResponse(['error' => 'Profile image must be a JPG, PNG, or WebP image.'], 422);
    }

    $binary = base64_decode(str_replace(["\r", "\n"], '', $matches[2]), true);
    if ($binary === false || strlen($binary) === 0) {
        jsonResponse(['error' => 'Profile image could not be read.'], 422);
    }

    if (strlen($binary) > 5 * 1024 * 1024) {
        jsonResponse(['error' => 'Profile image must be 5MB or smaller.'], 422);
    }

    if (!is_dir(MERCHANT_AVATAR_UPLOAD_DIR) && !mkdir(MERCHANT_AVATAR_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Unable to prepare profile image storage.'], 500);
    }

    $extension = match ($matches[1]) {
        'image/jpeg', 'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'img',
    };
    $fileName = sprintf('merchant-%d-avatar-%s.%s', $merchantId, bin2hex(random_bytes(8)), $extension);
    $targetPath = MERCHANT_AVATAR_UPLOAD_DIR . '/' . $fileName;

    if (file_put_contents($targetPath, $binary) === false) {
        jsonResponse(['error' => 'Unable to store profile image.'], 500);
    }

    return MERCHANT_AVATAR_UPLOAD_URL . '/' . $fileName;
}

ensureMerchantBannerColumn($db);

$sessionUser = requireMerchantForProfile($db);
$merchantId = (int) $sessionUser['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['profile' => loadMerchantProfile($db, $merchantId)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = jsonInput();
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $sessionEmail = strtolower(trim((string) ($sessionUser['email'] ?? '')));

    if ($email === '' || $email !== $sessionEmail) {
        jsonResponse(['error' => 'Type your merchant email address to confirm shop closure.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "UPDATE USERS
             SET STATUS = 'INACTIVE'
             WHERE USER_ID = :merchant_id
               AND UPPER(ROLE) IN ('MRC', 'MERCHANT')
               AND STATUS = 'ACTIVE'"
        );
        $stmt->execute([':merchant_id' => $merchantId]);

        if ($stmt->rowCount() < 1) {
            jsonResponse(['error' => 'Shop account is already inactive or could not be closed.'], 409);
        }

        jsonResponse(['ok' => true, 'status' => 'INACTIVE']);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to close shop account.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = jsonInput();
    $shopName = trim((string) ($data['shopName'] ?? ''));
    $shopDescription = trim((string) ($data['shopDescription'] ?? ''));
    $address = trim((string) ($data['address'] ?? ''));
    $bannerImage = trim((string) ($data['bannerImage'] ?? ''));
    $avatarImage = trim((string) ($data['avatarImage'] ?? ''));
    $fulfillment = is_array($data['fulfillment'] ?? null) ? $data['fulfillment'] : [];
    $acceptsCod = boolInput($fulfillment, 'acceptsCOD', true);
    $acceptsGcash = boolInput($fulfillment, 'acceptsGCash', true);
    $allowMeetup = boolInput($fulfillment, 'allowMeetup', true);
    $allowDelivery = boolInput($fulfillment, 'allowDelivery', true);
    $deliveryFee = max(0, min(10000, (float) ($fulfillment['deliveryFee'] ?? 50)));

    if ($shopName === '' || $address === '') {
        jsonResponse(['error' => 'Shop name and address are required.'], 422);
    }
    if (!$acceptsCod && !$acceptsGcash) {
        jsonResponse(['error' => 'At least one payment method must be enabled.'], 422);
    }
    if (!$allowMeetup && !$allowDelivery) {
        jsonResponse(['error' => 'At least one delivery option must be enabled.'], 422);
    }

    try {
        $db->beginTransaction();
        $bannerUrl = $bannerImage !== '' ? storeMerchantBannerImage($merchantId, $bannerImage) : null;
        $avatarUrl = $avatarImage !== '' ? storeMerchantAvatarImage($merchantId, $avatarImage) : null;
        $stmt = $db->prepare(
            "UPDATE MERCHANT
	             SET SHOP_NAME = :shop_name,
	                 SHOP_DESC = :shop_desc,
	                 ADDRESS = :address,
	                 SHOP_BANNER_URL = COALESCE(:banner_url, SHOP_BANNER_URL),
	                 ACCEPTS_COD = :accepts_cod,
	                 ACCEPTS_GCASH = :accepts_gcash,
	                 ALLOW_MEETUP = :allow_meetup,
	                 ALLOW_DELIVERY = :allow_delivery,
	                 DELIVERY_FEE = :delivery_fee
	             WHERE MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':shop_name' => $shopName,
            ':shop_desc' => $shopDescription !== '' ? $shopDescription : null,
            ':address' => $address,
            ':banner_url' => $bannerUrl,
            ':accepts_cod' => $acceptsCod ? 1 : 0,
            ':accepts_gcash' => $acceptsGcash ? 1 : 0,
            ':allow_meetup' => $allowMeetup ? 1 : 0,
            ':allow_delivery' => $allowDelivery ? 1 : 0,
            ':delivery_fee' => $deliveryFee,
            ':merchant_id' => $merchantId,
        ]);

        if ($avatarUrl !== null) {
            $avatarStmt = $db->prepare(
                "UPDATE USERS
                 SET AVATAR_URL = :avatar_url
                 WHERE USER_ID = :merchant_id"
            );
            $avatarStmt->execute([
                ':avatar_url' => $avatarUrl,
                ':merchant_id' => $merchantId,
            ]);
        }

        syncMerchantOfferingPaymentSettings($db, $merchantId, $acceptsCod, $acceptsGcash);
        syncMerchantDeliveryFee($db, $merchantId, $deliveryFee);
        $db->commit();

        jsonResponse(['profile' => loadMerchantProfile($db, $merchantId)]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to update shop profile.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
