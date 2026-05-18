<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['email', 'password']);
$rememberMe = filter_var($data['rememberMe'] ?? false, FILTER_VALIDATE_BOOLEAN);
$email = strtolower(trim((string) $data['email']));

enforceAuthRateLimit('login', $email, 8, 300);

$stmt = $db->prepare(
    "SELECT USER_ID, FNAME, LNAME, EMAIL, USERNAME, PASSWORD_HASH, ROLE
     FROM USERS
     WHERE EMAIL = :email AND STATUS = 'ACTIVE'
     LIMIT 1"
);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($data['password'], $user['PASSWORD_HASH'])) {
    jsonResponse(['error' => 'Invalid email or password'], 401);
}

$authUser = userPayloadFromRow($user);

issueAuthSession($authUser, $rememberMe);

jsonResponse(['user' => $authUser]);
