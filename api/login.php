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

// Ensure users table has EMAIL_2FA_ENABLED column (added if missing)
ensureTableColumns($db, 'USERS', [
    'EMAIL_2FA_ENABLED' => "TINYINT(1) NOT NULL DEFAULT 0",
]);

ensureEmail2faTable($db);

$stmt = $db->prepare(
    "SELECT USER_ID, FNAME, LNAME, EMAIL, USERNAME, PASSWORD_HASH, ROLE, AVATAR_URL, EMAIL_2FA_ENABLED
     FROM USERS
     WHERE EMAIL = :email AND STATUS = 'ACTIVE'
     LIMIT 1"
);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($data['password'], $user['PASSWORD_HASH'])) {
    jsonResponse(['error' => 'Invalid email or password'], 401);
}

$requires2fa = (isset($user['EMAIL_2FA_ENABLED']) && (int) $user['EMAIL_2FA_ENABLED'] === 1);
if ($requires2fa) {
    // generate OTP, store hashed, send email, and mark session as pending 2FA
    $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $hash = password_hash($otp, PASSWORD_DEFAULT);
    $expiresAt = date('Y-m-d H:i:s', time() + (int) (getenv('EMAIL_2FA_EXPIRE_SECONDS') ?: 300));

    // Invalidate previous unused codes for user
    $db->beginTransaction();
    $invalidateStmt = $db->prepare(
        "UPDATE EMAIL_2FA SET USED = 1 WHERE USER_ID = :user_id AND USED = 0"
    );
    $invalidateStmt->execute([':user_id' => $user['USER_ID']]);

    $insertStmt = $db->prepare(
        "INSERT INTO EMAIL_2FA (USER_ID, CODE_HASH, EXPIRES_AT) VALUES (:user_id, :code_hash, :expires_at)"
    );
    $insertStmt->execute([
        ':user_id' => $user['USER_ID'],
        ':code_hash' => $hash,
        ':expires_at' => $expiresAt,
    ]);

    $db->commit();

    // send email (non-blocking best-effort)
    try {
        // load mailer helper (initialize.php sets INC_PATH)
        require_once(INC_PATH . 'util/EmailHandler.php');
        $name = trim($user['FNAME'] . ' ' . $user['LNAME']);
        $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE);
        $expireMinutes = (int) ( (int) (getenv('EMAIL_2FA_EXPIRE_SECONDS') ?: 300) / 60 );
        $baseUrl = rtrim((string) (getenv('APP_URL') ?: requestOriginFromServer()), '/');
        $logoUrl = trim((string) (getenv('MAILER_LOGO_URL') ?: ''), ' "');

        $html = '';
        $html .= '<span style="display:none;max-height:0px;overflow:hidden;">Your IskoMart two-step verification code</span>';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f4f6f8;padding:24px;">';
        $html .= '<tr><td align="center">';
        $html .= '<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;">';
        $html .= '<tr><td style="padding:24px;text-align:center;background:linear-gradient(90deg,#003366,#0074D9);color:#fff">';
        if ($logoUrl !== '') {
            $html .= '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES | ENT_SUBSTITUTE) . '" alt="IskoMart" width="120" style="display:block;margin:0 auto 8px;">';
        }
        $html .= '<h1 style="margin:0;font-size:20px;font-weight:700;">Two-step verification</h1>';
        $html .= '</td></tr>';

        $html .= '<tr><td style="padding:28px;">';
        $html .= '<p style="margin:0 0 12px;color:#333;font-size:14px;">Hello, <strong>' . $safeName . '!</strong> use the code below to sign in to IskoMart. This code expires in <strong>' . $expireMinutes . ' minutes</strong>.</p>';

        $html .= '<div style="margin:18px 0;padding:18px;background:#f7fafc;border:1px dashed #e6eef9;border-radius:8px;text-align:center;">';
        $html .= '<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;letter-spacing:4px;color:#003366;font-weight:700;">' . $otp . '</div>';
        $html .= '</div>';

        $html .= '<p style="margin:0 0 8px;color:#666;font-size:13px;">If you didn\'t request this, ignore this email or <a href="mailto:' . htmlspecialchars((string)(getenv('SUPPORT_EMAIL') ?: 'support@localhost'), ENT_QUOTES | ENT_SUBSTITUTE) . '">contact support</a>.</p>';

        $loginUrl = $baseUrl ?: '';
        if ($loginUrl !== '') {
            $html .= '<p style="margin:20px 0 0;text-align:center;"><a href="' . htmlspecialchars($loginUrl, ENT_QUOTES | ENT_SUBSTITUTE) . '" style="display:inline-block;padding:10px 20px;background:#FF851B;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Return to IskoMart</a></p>';
        }

        $html .= '</td></tr>';
        $html .= '<tr><td style="padding:14px 18px;background:#fafafa;color:#9aa8bc;font-size:12px;text-align:center;">IskoMart · support@localhost</td></tr>';
        $html .= '</table></td></tr></table>';

        $alt = "Your IskoMart code: {$otp} -- expires in {$expireMinutes} minutes. If you didn't request this, ignore this email.";

        $sent = sendEmail($user['EMAIL'], $name, 'Your IskoMart two-step verification code', $html, $alt);
    } catch (Throwable $e) {
        $sent = false;
        error_log('[2FA] failed to send email: ' . $e->getMessage());
    }

    // store pending 2fa in session
    startApiSession($rememberMe);
    $_SESSION['pending_2fa_user'] = [
        'user_id' => (int) $user['USER_ID'],
        'remember_me' => $rememberMe,
        'issued_at' => time(),
    ];

    $resp = ['requires2fa' => true];
    if (strtolower((string) getenv('APP_ENV')) === 'local') {
        $resp['emailSent'] = !empty($sent);
    }
    jsonResponse($resp);
}

$authUser = userPayloadFromRow($user);

issueAuthSession($authUser, $rememberMe);

jsonResponse(['user' => $authUser]);
