<?php

require_once(__DIR__ . '/config.php');

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
                m.BU_EMAIL, m.SHOP_NAME, m.SHOP_DESC, m.ADDRESS, m.STUDENT_NUM, m.ID_IMAGE_URL
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

    if ($shopName === '' || $address === '') {
        jsonResponse(['error' => 'Shop name and address are required.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "UPDATE MERCHANT
             SET SHOP_NAME = :shop_name,
                 SHOP_DESC = :shop_desc,
                 ADDRESS = :address
             WHERE MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':shop_name' => $shopName,
            ':shop_desc' => $shopDescription !== '' ? $shopDescription : null,
            ':address' => $address,
            ':merchant_id' => $merchantId,
        ]);

        jsonResponse(['profile' => loadMerchantProfile($db, $merchantId)]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to update shop profile.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
