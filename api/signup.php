<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$role = normalizeRole($data['role'] ?? 'customer');

requireFields($data, ['username', 'email', 'password', 'firstName', 'lastName', 'dob', 'phone', 'gender']);

try {
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    if ($role === 'merchant') {
        requireFields($data, ['businessName', 'address', 'studentNumber']);

        $merchant = new Merchant($db);
        $merchant->username = $data['username'];
        $merchant->email = $data['email'];
        $merchant->bu_email = $data['email'];
        $merchant->pwd = $passwordHash;
        $merchant->fname = $data['firstName'];
        $merchant->lname = $data['lastName'];
        $merchant->dob = $data['dob'];
        $merchant->phone = $data['phone'];
        $merchant->gender = $data['gender'];
        $merchant->shop_name = $data['businessName'];
        $merchant->shop_desc = $data['shopDescription'] ?? null;
        $merchant->address = $data['address'];
        $merchant->student_num = $data['studentNumber'];
        $merchant->id_img_url = $data['idImageUrl'] ?? null;

        $userId = $merchant->createUser();
    } else {
        $db->beginTransaction();

        $user = new User($db);
        $user->username = $data['username'];
        $user->email = $data['email'];
        $user->pwd = $passwordHash;
        $user->fname = $data['firstName'];
        $user->lname = $data['lastName'];
        $user->dob = $data['dob'];
        $user->phone = $data['phone'];
        $user->gender = $data['gender'];
        $user->role = 'CUS';

        $userId = $user->createUser();

        $customerStmt = $db->prepare(
            "INSERT INTO CUSTOMER (CUSTOMER_ID, DISPLAY_NAME, BIO)
             VALUES (:customer_id, :display_name, NULL)"
        );
        $displayName = trim($data['firstName'] . ' ' . $data['lastName']);
        $customerStmt->execute([
            ':customer_id' => $userId,
            ':display_name' => $displayName,
        ]);

        $db->commit();
    }

    jsonResponse([
        'user' => [
            'id' => (int) $userId,
            'name' => trim($data['firstName'] . ' ' . $data['lastName']),
            'username' => $data['username'],
            'email' => $data['email'],
            'role' => $role,
        ],
    ], 201);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    logApiError($e);
    jsonResponse(['error' => 'Unable to create account. Please review your details and try again.'], 400);
}
