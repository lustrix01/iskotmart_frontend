<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['enable']);

$enable = filter_var($data['enable'], FILTER_VALIDATE_BOOLEAN);

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

try {
    // require password confirmation when enabling
    if ($enable) {
        if (!isset($data['password']) || trim((string) $data['password']) === '') {
            jsonResponse(['error' => 'Password required to enable 2FA'], 400);
        }
        $stmt = $db->prepare("SELECT PASSWORD_HASH FROM USERS WHERE USER_ID = :user_id LIMIT 1");
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || !password_verify($data['password'], $row['PASSWORD_HASH'])) {
            jsonResponse(['error' => 'Invalid password'], 401);
        }
    }

    $update = $db->prepare("UPDATE USERS SET EMAIL_2FA_ENABLED = :enabled WHERE USER_ID = :user_id");
    $update->execute([':enabled' => $enable ? 1 : 0, ':user_id' => $userId]);

    jsonResponse(['settings' => ['email2fa' => (bool) $enable]]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to update setting'], 500);
}
