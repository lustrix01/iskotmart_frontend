<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['email']);

$genericMessage = 'If an account exists for that email, a password reset link has been prepared.';
$email = strtolower(trim((string) $data['email']));
enforceAuthRateLimit('forgot_password', $email, 5, 900);

try {
    ensurePasswordResetTable($db);

    $stmt = $db->prepare(
        "SELECT USER_ID, EMAIL
         FROM USERS
         WHERE EMAIL = :email AND STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(['message' => $genericMessage]);
    }

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $db->beginTransaction();

    $invalidateStmt = $db->prepare(
        "UPDATE PASSWORD_RESETS
         SET USED_AT = NOW()
         WHERE USER_ID = :user_id AND USED_AT IS NULL"
    );
    $invalidateStmt->execute([':user_id' => $user['USER_ID']]);

    $insertStmt = $db->prepare(
        "INSERT INTO PASSWORD_RESETS (USER_ID, TOKEN_HASH, EXPIRES_AT)
         VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 30 MINUTE))"
    );
    $insertStmt->execute([
        ':user_id' => $user['USER_ID'],
        ':token_hash' => $tokenHash,
    ]);

    $db->commit();

    $baseUrl = rtrim((string) (getenv('RESET_LINK_BASE_URL') ?: requestOriginFromServer()), '/');
    if ($baseUrl === '') {
        $baseUrl = 'http://localhost:5173';
    }

    $resetLink = $baseUrl . '/reset-password?token=' . urlencode($token);

    $payload = ['message' => $genericMessage];
    if (strtolower((string) getenv('APP_ENV')) === 'local') {
        $payload['resetLink'] = $resetLink;
    }

    jsonResponse($payload);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    logApiError($e);
    jsonResponse(['error' => 'Unable to prepare password reset. Check the database connection and reset-token table.'], 500);
}
