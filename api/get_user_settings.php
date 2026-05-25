<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

startApiSession();

$token = clientSessionTokenFromRequest();
if ($token === '') {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

$clientAuth = $_SESSION['client_auth'][$token] ?? null;
$userId = is_array($clientAuth) ? ($clientAuth['user_id'] ?? null) : null;
if (!$userId) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

$stmt = $db->prepare("SELECT EMAIL_2FA_ENABLED FROM USERS WHERE USER_ID = :user_id AND STATUS = 'ACTIVE' LIMIT 1");
$stmt->execute([':user_id' => $userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    jsonResponse(['error' => 'User not found'], 404);
}

jsonResponse(['settings' => ['email2fa' => (bool) ($row['EMAIL_2FA_ENABLED'] ?? false)]]);
