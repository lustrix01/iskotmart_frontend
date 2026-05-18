<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['email']);

$genericMessage = 'If an account exists for that email, a password reset link has been prepared.';
$email = strtolower(trim((string) $data['email']));

try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `PASSWORD_RESETS` (
          `RESET_ID` int(11) NOT NULL AUTO_INCREMENT,
          `USER_ID` int(11) NOT NULL,
          `TOKEN_HASH` char(64) NOT NULL,
          `EXPIRES_AT` datetime NOT NULL,
          `USED_AT` datetime DEFAULT NULL,
          `CREATED_AT` datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`RESET_ID`),
          UNIQUE KEY `PASSWORD_RESETS_TOKEN_UNIQUE` (`TOKEN_HASH`),
          KEY `PASSWORD_RESETS_USER_IDX` (`USER_ID`),
          KEY `PASSWORD_RESETS_EXPIRES_IDX` (`EXPIRES_AT`),
          CONSTRAINT `FK_PASSWORD_RESETS_USER`
            FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci"
    );

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
    error_log('[password reset] ' . $user['EMAIL'] . ' reset link: ' . $resetLink);

    $payload = ['message' => $genericMessage];
    if (strtolower((string) getenv('APP_ENV')) !== 'production') {
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
