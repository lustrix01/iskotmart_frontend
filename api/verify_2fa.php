<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['code']);

startApiSession();

$pending = $_SESSION['pending_2fa_user'] ?? null;
if (!is_array($pending) || empty($pending['user_id'])) {
    jsonResponse(['error' => 'No pending 2FA request'], 400);
}

$userId = (int) $pending['user_id'];
$rememberMe = (bool) ($pending['remember_me'] ?? false);

try {
    ensureEmail2faTable($db);

    // Fetch latest unused record
    $stmt = $db->prepare(
        "SELECT ID, CODE_HASH, EXPIRES_AT, ATTEMPTS, USED
         FROM EMAIL_2FA
         WHERE USER_ID = :user_id
         ORDER BY CREATED_AT DESC
         LIMIT 1"
    );
    $stmt->execute([':user_id' => $userId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record || (int) $record['USED'] === 1) {
        jsonResponse(['error' => 'No valid code found'], 400);
    }

    if (strtotime($record['EXPIRES_AT']) < time()) {
        jsonResponse(['error' => 'Code expired'], 400);
    }

    $inputCode = trim((string) $data['code']);
    $valid = password_verify($inputCode, $record['CODE_HASH']);

    if (!$valid) {
        $inc = $db->prepare("UPDATE EMAIL_2FA SET ATTEMPTS = ATTEMPTS + 1 WHERE ID = :id");
        $inc->execute([':id' => $record['ID']]);
        jsonResponse(['error' => 'Invalid code'], 401);
    }

    // mark used
    $mark = $db->prepare("UPDATE EMAIL_2FA SET USED = 1 WHERE ID = :id");
    $mark->execute([':id' => $record['ID']]);

    // fetch user row and issue session
    $uStmt = $db->prepare(
        "SELECT USER_ID, FNAME, LNAME, EMAIL, USERNAME, ROLE, AVATAR_URL
         FROM USERS
         WHERE USER_ID = :user_id AND STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $uStmt->execute([':user_id' => $userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        jsonResponse(['error' => 'User not found'], 404);
    }

    $authUser = userPayloadFromRow($user);
    issueAuthSession($authUser, $rememberMe);

    // clear pending
    unset($_SESSION['pending_2fa_user']);

    jsonResponse(['user' => $authUser]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to verify code'], 500);
}
