<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
requireFields($data, ['token', 'password']);

$token = trim((string) $data['token']);
$password = (string) $data['password'];

if (!preg_match('/^[A-Fa-f0-9]{64}$/', $token)) {
    jsonResponse(['error' => 'Invalid or expired reset link.'], 422);
}

$passwordError = validateStrongPassword($password);
if ($passwordError !== null) {
    jsonResponse(['error' => $passwordError], 422);
}

$tokenHash = hash('sha256', $token);

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

    $db->beginTransaction();

    $stmt = $db->prepare(
        "SELECT RESET_ID, USER_ID
         FROM PASSWORD_RESETS
         WHERE TOKEN_HASH = :token_hash
           AND USED_AT IS NULL
           AND EXPIRES_AT > NOW()
         LIMIT 1"
    );
    $stmt->execute([':token_hash' => $tokenHash]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        $db->rollBack();
        jsonResponse(['error' => 'Invalid or expired reset link.'], 422);
    }

    $updateUserStmt = $db->prepare(
        "UPDATE USERS
         SET PASSWORD_HASH = :password_hash
         WHERE USER_ID = :user_id AND STATUS = 'ACTIVE'"
    );
    $updateUserStmt->execute([
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':user_id' => $reset['USER_ID'],
    ]);

    if ($updateUserStmt->rowCount() < 1) {
        $db->rollBack();
        jsonResponse(['error' => 'Unable to reset password for this account.'], 422);
    }

    $consumeStmt = $db->prepare(
        "UPDATE PASSWORD_RESETS
         SET USED_AT = NOW()
         WHERE RESET_ID = :reset_id"
    );
    $consumeStmt->execute([':reset_id' => $reset['RESET_ID']]);

    $db->commit();

    jsonResponse(['message' => 'Password has been reset. You can now sign in.']);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    logApiError($e);
    jsonResponse(['error' => 'Unable to reset password.'], 500);
}
