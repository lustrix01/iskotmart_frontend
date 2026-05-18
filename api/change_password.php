<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = currentUser($db);
if (!$sessionUser) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

$data = jsonInput();
requireFields($data, ['currentPassword', 'newPassword']);

$currentPassword = (string) $data['currentPassword'];
$newPassword = (string) $data['newPassword'];
$confirmPassword = (string) ($data['confirmPassword'] ?? $newPassword);

if (!hash_equals($newPassword, $confirmPassword)) {
    jsonResponse(['error' => 'New password and confirmation do not match.'], 422);
}

$passwordError = validateStrongPassword($newPassword);
if ($passwordError !== null) {
    jsonResponse(['error' => $passwordError], 422);
}

enforceAuthRateLimit('change_password', (string) $sessionUser['id'], 6, 900);

try {
    $stmt = $db->prepare(
        "SELECT USER_ID, PASSWORD_HASH
         FROM USERS
         WHERE USER_ID = :user_id AND STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':user_id' => $sessionUser['id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['PASSWORD_HASH'])) {
        jsonResponse(['error' => 'Current password is incorrect.'], 401);
    }

    if (password_verify($newPassword, $user['PASSWORD_HASH'])) {
        jsonResponse(['error' => 'New password must be different from the current password.'], 422);
    }

    $update = $db->prepare(
        "UPDATE USERS
         SET PASSWORD_HASH = :password_hash
         WHERE USER_ID = :user_id AND STATUS = 'ACTIVE'"
    );
    $update->execute([
        ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ':user_id' => $sessionUser['id'],
    ]);

    startApiSession();
    $clientSession = clientSessionTokenFromRequest();
    $currentAuth = $clientSession !== '' && isset($_SESSION['client_auth'][$clientSession])
        ? $_SESSION['client_auth'][$clientSession]
        : null;
    $_SESSION['client_auth'] = [];
    if ($clientSession !== '' && is_array($currentAuth)) {
        $_SESSION['client_auth'][$clientSession] = $currentAuth;
    }

    jsonResponse(['message' => 'Password has been updated.']);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to update password. Please try again.'], 500);
}
