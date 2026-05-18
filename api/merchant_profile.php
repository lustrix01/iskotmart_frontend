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
    ];
}

function loadMerchantProfile(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.EMAIL, u.USERNAME, u.PHONE,
                u.AVATAR_URL, u.CREATED_ON,
                m.BU_EMAIL, m.SHOP_NAME, m.SHOP_DESC, m.SHOP_BANNER_URL,
                m.ADDRESS, m.STUDENT_NUM, m.ID_IMAGE_URL
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = jsonInput();
    $shopName = trim((string) ($data['shopName'] ?? ''));
    $shopDescription = trim((string) ($data['shopDescription'] ?? ''));
    $address = trim((string) ($data['address'] ?? ''));
    $bannerImage = trim((string) ($data['bannerImage'] ?? ''));
    $avatarImage = trim((string) ($data['avatarImage'] ?? ''));

    if ($shopName === '' || $address === '') {
        jsonResponse(['error' => 'Shop name and address are required.'], 422);
    }

    try {
        $bannerUrl = $bannerImage !== '' ? storeMerchantBannerImage($merchantId, $bannerImage) : null;
        $avatarUrl = $avatarImage !== '' ? storeMerchantAvatarImage($merchantId, $avatarImage) : null;
        $stmt = $db->prepare(
            "UPDATE MERCHANT
             SET SHOP_NAME = :shop_name,
                 SHOP_DESC = :shop_desc,
                 ADDRESS = :address,
                 SHOP_BANNER_URL = COALESCE(:banner_url, SHOP_BANNER_URL)
             WHERE MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':shop_name' => $shopName,
            ':shop_desc' => $shopDescription !== '' ? $shopDescription : null,
            ':address' => $address,
            ':banner_url' => $bannerUrl,
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

        jsonResponse(['profile' => loadMerchantProfile($db, $merchantId)]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to update shop profile.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
