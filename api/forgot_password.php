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
        "SELECT USER_ID, EMAIL, FNAME, LNAME
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

    try {
        require_once(INC_PATH . 'util/EmailHandler.php');

        $name = trim($user['FNAME'] . ' ' . $user['LNAME']);
        if ($name === '') {
            $name = $user['EMAIL'];
        }

        $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE);
        $safeLink = htmlspecialchars($resetLink, ENT_QUOTES | ENT_SUBSTITUTE);
        $supportEmail = htmlspecialchars((string) (getenv('SUPPORT_EMAIL') ?: 'support@localhost'), ENT_QUOTES | ENT_SUBSTITUTE);

        $html = '<span style="display:none;max-height:0;overflow:hidden;">IskoMart password reset</span>';
        $html .= '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f4f6f8;padding:24px;">';
        $html .= '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">';
        $html .= '<div style="padding:24px;text-align:center;background:#003366;color:#ffffff;">';
        $html .= '<h1 style="margin:0;font-size:22px;">Reset your IskoMart password</h1>';
        $html .= '</div>';
        $html .= '<div style="padding:24px;color:#333;">';
        $html .= '<p style="margin:0 0 16px;">Hello ' . $safeName . ',</p>';
        $html .= '<p style="margin:0 0 20px;">We received a request to reset the password for your IskoMart account. Click the button below to choose a new password. This link expires in 30 minutes.</p>';
        $html .= '<p style="text-align:center;margin:24px 0;"><a href="' . $safeLink . '" style="display:inline-block;padding:14px 24px;background:#FF851B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">Reset password</a></p>';
        $html .= '<p style="margin:0 0 8px;">If the button does not work, copy and paste this link into your browser:</p>';
        $html .= '<p style="word-break:break-all;"><a href="' . $safeLink . '" style="color:#0074D9;">' . $safeLink . '</a></p>';
        $html .= '<p style="margin:24px 0 0;color:#666;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>';
        $html .= '</div>';
        $html .= '<div style="padding:18px 24px;background:#f7f9fc;color:#7a8ca4;font-size:12px;text-align:center;">IskoMart · <a href="mailto:' . $supportEmail . '" style="color:#0074D9;text-decoration:none;">' . $supportEmail . '</a></div>';
        $html .= '</div></div>';

        $alt = 'Reset your IskoMart password using this link: ' . $resetLink;

        $sent = sendEmail($user['EMAIL'], $name, 'Reset your IskoMart password', $html, $alt);
        if (strtolower((string) getenv('APP_ENV')) === 'local') {
            $payload['emailSent'] = $sent;
        }
    } catch (Throwable $e) {
        error_log('[password reset] email send failed: ' . $e->getMessage());
        if (strtolower((string) getenv('APP_ENV')) === 'local') {
            $payload['emailSent'] = false;
        }
    }

    jsonResponse($payload);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    logApiError($e);
    jsonResponse(['error' => 'Unable to prepare password reset. Check the database connection and reset-token table.'], 500);
}
