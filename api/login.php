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
        $html = "<p>Your login code is <strong>{$otp}</strong>. It expires in " . ((int)(getenv('EMAIL_2FA_EXPIRE_SECONDS') ?: 300) / 60) . " minutes.</p>";
        sendEmail($user['EMAIL'], $name, 'Your login code', $html, "Your login code is: {$otp}");
    } catch (Throwable $e) {
        error_log('[2FA] failed to send email: ' . $e->getMessage());
    }

    // store pending 2fa in session
    startApiSession($rememberMe);
    $_SESSION['pending_2fa_user'] = [
        'user_id' => (int) $user['USER_ID'],
        'remember_me' => $rememberMe,
        'issued_at' => time(),
    ];

    jsonResponse(['requires2fa' => true]);
}

$authUser = userPayloadFromRow($user);

issueAuthSession($authUser, $rememberMe);

jsonResponse(['user' => $authUser]);
