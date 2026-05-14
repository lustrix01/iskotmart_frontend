<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$role = normalizeSignupRole($data['role'] ?? 'customer');
$gender = normalizeGender((string) ($data['gender'] ?? ''));

requireFields($data, ['username', 'email', 'password', 'firstName', 'lastName', 'dob', 'phone', 'gender']);
if ($gender === null) {
    jsonResponse(['error' => 'Invalid gender value.'], 422);
}

$dob = trim((string) ($data['dob'] ?? ''));
$dobParts = explode('-', $dob);
if (
    count($dobParts) !== 3 ||
    !checkdate((int) $dobParts[1], (int) $dobParts[2], (int) $dobParts[0])
) {
    jsonResponse([
        'error' => 'Invalid date of birth.',
        'details' => ['Use a real date in YYYY-MM-DD format.'],
    ], 422);
}

try {
    $email = strtolower(trim((string) $data['email']));
    $passwordError = validateStrongPassword((string) $data['password']);
    if ($passwordError !== null) {
        jsonResponse([
            'error' => 'Password does not meet security requirements.',
            'details' => [$passwordError],
        ], 422);
    }

    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    if ($role === 'merchant') {
        requireFields($data, ['businessName', 'address', 'studentNumber']);
        if (!isBicolUEmail($email)) {
            jsonResponse(['error' => 'Merchant accounts require a valid @bicol-u.edu.ph email address.'], 422);
        }

        $merchant = new Merchant($db);
        $merchant->username = $data['username'];
        $merchant->email = $email;
        $merchant->bu_email = $email;
        $merchant->pwd = $passwordHash;
        $merchant->fname = $data['firstName'];
        $merchant->lname = $data['lastName'];
        $merchant->dob = $dob;
        $merchant->phone = $data['phone'];
        $merchant->gender = $gender;
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
        $user->email = $email;
        $user->pwd = $passwordHash;
        $user->fname = $data['firstName'];
        $user->lname = $data['lastName'];
        $user->dob = $dob;
        $user->phone = $data['phone'];
        $user->gender = $gender;
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

    $authUser = [
        'id' => (int) $userId,
        'name' => trim($data['firstName'] . ' ' . $data['lastName']),
        'username' => $data['username'],
        'email' => $email,
        'role' => $role,
    ];
    issueAuthSession($authUser);

    jsonResponse(['user' => $authUser], 201);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    logApiError($e);

    $message = $e->getMessage();
    $sqlState = $e instanceof PDOException ? (string) $e->getCode() : '';

    if (str_contains($message, 'Email already registered') || str_contains($message, 'username already taken')) {
        jsonResponse([
            'error' => 'Email or username is already taken.',
            'details' => [
                'Try a different username.',
                'Use a different email address if this account was already registered.',
            ],
        ], 409);
    }

    if ($sqlState === '23000') {
        jsonResponse([
            'error' => 'A signup record conflicts with existing data.',
            'details' => [
                'The email, username, student number, or related merchant record may already exist.',
                'Review the form and try again with unique account details.',
            ],
        ], 409);
    }

    if ($sqlState === '22007' || str_contains(strtolower($message), 'date')) {
        jsonResponse([
            'error' => 'The server rejected one of the date fields.',
            'details' => ['Check that the date of birth is a real calendar date.'],
        ], 422);
    }

    if ($sqlState === '42S02') {
        jsonResponse([
            'error' => 'Signup service is temporarily unavailable.',
            'details' => [
                'Please try again later or contact support.',
            ],
        ], 500);
    }

    jsonResponse([
        'error' => 'Signup failed while saving the account.',
        'details' => [
            'The form passed client validation, but the server could not save the record.',
            'Check that MySQL is running, the database schema is imported, and the username/email are unique.',
        ],
    ], 400);
}
