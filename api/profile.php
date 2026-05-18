<?php

require_once(__DIR__ . '/config.php');

const CUSTOMER_AVATAR_UPLOAD_DIR = __DIR__ . '/uploads/customer-avatars';
const CUSTOMER_AVATAR_UPLOAD_URL = '/api/uploads/customer-avatars';

function requireCustomer(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function storeCustomerAvatarImage(int $customerId, string $dataUrl): string {
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

    if (!is_dir(CUSTOMER_AVATAR_UPLOAD_DIR) && !mkdir(CUSTOMER_AVATAR_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Unable to prepare profile image storage.'], 500);
    }

    $extension = match ($matches[1]) {
        'image/jpeg', 'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'img',
    };
    $fileName = sprintf('customer-%d-avatar-%s.%s', $customerId, bin2hex(random_bytes(8)), $extension);
    $targetPath = CUSTOMER_AVATAR_UPLOAD_DIR . '/' . $fileName;

    if (file_put_contents($targetPath, $binary) === false) {
        jsonResponse(['error' => 'Unable to store profile image.'], 500);
    }

    return CUSTOMER_AVATAR_UPLOAD_URL . '/' . $fileName;
}

function profilePayloadFromRow(array $row): array {
    return [
        'id' => (int) $row['USER_ID'],
        'firstName' => $row['FNAME'],
        'lastName' => $row['LNAME'],
        'name' => trim($row['FNAME'] . ' ' . $row['LNAME']),
        'displayName' => $row['DISPLAY_NAME'] ?: trim($row['FNAME'] . ' ' . $row['LNAME']),
        'username' => $row['USERNAME'],
        'email' => $row['EMAIL'],
        'phone' => $row['PHONE'],
        'dob' => $row['DOB'],
        'gender' => $row['GENDER'],
        'avatarUrl' => $row['AVATAR_URL'],
        'bio' => $row['BIO'],
        'createdOn' => $row['CREATED_ON'],
        'role' => normalizeRole($row['ROLE']),
    ];
}

$sessionUser = requireCustomer($db);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.EMAIL, u.USERNAME, u.PHONE,
                u.DOB, u.GENDER, u.AVATAR_URL, u.CREATED_ON, u.ROLE,
                c.DISPLAY_NAME, c.BIO
         FROM USERS u
         INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = u.USER_ID
         WHERE u.USER_ID = :user_id AND u.STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':user_id' => $sessionUser['id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        jsonResponse(['error' => 'Customer profile was not found'], 404);
    }

    jsonResponse(['profile' => profilePayloadFromRow($profile)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = jsonInput();
    requireFields($data, ['firstName', 'lastName', 'phone', 'dob', 'gender']);

    $gender = normalizeGender((string) $data['gender']);
    if ($gender === null) {
        jsonResponse(['error' => 'Invalid gender value.'], 422);
    }

    $firstName = trim((string) $data['firstName']);
    $lastName = trim((string) $data['lastName']);
    $phone = trim((string) $data['phone']);
    $dob = trim((string) $data['dob']);
    $displayName = trim((string) ($data['displayName'] ?? ($firstName . ' ' . $lastName)));
    $bio = isset($data['bio']) ? trim((string) $data['bio']) : null;
    $avatarImage = trim((string) ($data['avatarImage'] ?? ''));

    if ($firstName === '' || $lastName === '' || $phone === '' || $dob === '') {
        jsonResponse(['error' => 'Profile fields cannot be blank.'], 422);
    }

    try {
        $avatarUrl = $avatarImage !== '' ? storeCustomerAvatarImage((int) $sessionUser['id'], $avatarImage) : null;

        $db->beginTransaction();

        $userStmt = $db->prepare(
            "UPDATE USERS
             SET FNAME = :first_name,
                 LNAME = :last_name,
                 PHONE = :phone,
                 DOB = :dob,
                 GENDER = :gender,
                 AVATAR_URL = COALESCE(:avatar_url, AVATAR_URL)
             WHERE USER_ID = :user_id AND STATUS = 'ACTIVE' AND ROLE = 'CUS'"
        );
        $userStmt->execute([
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':phone' => $phone,
            ':dob' => $dob,
            ':gender' => $gender,
            ':avatar_url' => $avatarUrl,
            ':user_id' => $sessionUser['id'],
        ]);

        $customerStmt = $db->prepare(
            "UPDATE CUSTOMER
             SET DISPLAY_NAME = :display_name,
                 BIO = :bio
             WHERE CUSTOMER_ID = :customer_id"
        );
        $customerStmt->execute([
            ':display_name' => $displayName !== '' ? $displayName : ($firstName . ' ' . $lastName),
            ':bio' => $bio !== '' ? $bio : null,
            ':customer_id' => $sessionUser['id'],
        ]);

        $db->commit();

        $stmt = $db->prepare(
            "SELECT u.USER_ID, u.FNAME, u.LNAME, u.EMAIL, u.USERNAME, u.PHONE,
                    u.DOB, u.GENDER, u.AVATAR_URL, u.CREATED_ON, u.ROLE,
                    c.DISPLAY_NAME, c.BIO
             FROM USERS u
             INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = u.USER_ID
             WHERE u.USER_ID = :user_id AND u.STATUS = 'ACTIVE'
             LIMIT 1"
        );
        $stmt->execute([':user_id' => $sessionUser['id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        jsonResponse([
            'profile' => profilePayloadFromRow($profile),
            'user' => [
                'id' => (int) $sessionUser['id'],
                'name' => trim($firstName . ' ' . $lastName),
                'username' => $sessionUser['username'],
                'email' => $sessionUser['email'],
                'role' => 'customer',
            ],
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        logApiError($e);
        jsonResponse(['error' => 'Unable to update profile. Please try again.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
