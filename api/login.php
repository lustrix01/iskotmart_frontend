<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['email', 'password']);

$stmt = $db->prepare(
    "SELECT USER_ID, FNAME, LNAME, EMAIL, USERNAME, PASSWORD_HASH, ROLE
     FROM USERS
     WHERE EMAIL = :email AND STATUS = 'ACTIVE'
     LIMIT 1"
);
$stmt->execute([':email' => $data['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($data['password'], $user['PASSWORD_HASH'])) {
    jsonResponse(['error' => 'Invalid email or password'], 401);
}

$role = normalizeRole($user['ROLE']);

jsonResponse([
    'user' => [
        'id' => (int) $user['USER_ID'],
        'name' => trim($user['FNAME'] . ' ' . $user['LNAME']),
        'username' => $user['USERNAME'],
        'email' => $user['EMAIL'],
        'role' => $role,
    ],
]);
