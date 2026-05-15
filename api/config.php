<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Isko-Client-Session');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter(array_map(
    'trim',
    explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173')
));

if ($requestOrigin && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function requestOriginFromServer(): string {
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        return $origin;
    }

    $referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
    if ($referer === '') {
        return '';
    }

    $parts = parse_url($referer);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }

    $port = isset($parts['port']) ? ':' . $parts['port'] : '';
    return strtolower($parts['scheme'] . '://' . $parts['host'] . $port);
}

function enforceMutationRequestOrigin(array $allowedOrigins): void {
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    $secFetchSite = strtolower(trim((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($secFetchSite === 'cross-site') {
        jsonResponse(['error' => 'Cross-site request blocked.'], 403);
    }

    $origin = requestOriginFromServer();
    if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
        jsonResponse(['error' => 'Request origin is not allowed.'], 403);
    }
}

enforceMutationRequestOrigin($allowedOrigins);

try {
    require_once(__DIR__ . '/../backend/core/initialize.php');
} catch (Throwable $e) {
    error_log(sprintf(
        '[api bootstrap] %s in %s:%d',
        $e->getMessage(),
        $e->getFile(),
        $e->getLine()
    ));

    if (ob_get_length() !== false) {
        ob_clean();
    }

    http_response_code(500);
    echo json_encode(['error' => 'API server is unavailable. Check PHP and database configuration.']);
    exit;
}

function jsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST ?: [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonResponse(array $payload, int $status = 200): void {
    if (ob_get_length() !== false) {
        ob_clean();
    }

    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function logApiError(Throwable $e): void {
    error_log(sprintf(
        '[api] %s in %s:%d',
        $e->getMessage(),
        $e->getFile(),
        $e->getLine()
    ));
}

function requireFields(array $data, array $fields): void {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            jsonResponse(['error' => "Missing required field: {$field}"], 422);
        }
    }
}

function normalizeRole(string $role): string {
    $map = [
        'ADM' => 'admin',
        'ADMIN' => 'admin',
        'MRC' => 'merchant',
        'MERCHANT' => 'merchant',
        'MOD' => 'moderator',
        'MODERATOR' => 'moderator',
        'CUS' => 'customer',
        'CUSTOMER' => 'customer',
    ];

    $key = strtoupper($role);
    return $map[$key] ?? 'customer';
}

function normalizeSignupRole(string $role): string {
    $normalized = normalizeRole($role);
    return $normalized === 'merchant' ? 'merchant' : 'customer';
}

function normalizeGender(string $gender): ?string {
    $value = strtoupper(trim($gender));
    $map = [
        'MALE' => 'MALE',
        'FEMALE' => 'FEMALE',
        'OTHER' => 'OTHER',
        'PREFER NOT TO SAY' => 'OTHER',
    ];

    return $map[$value] ?? null;
}

function isBicolUEmail(string $email): bool {
    $normalized = strtolower(trim($email));
    return $normalized !== '@bicol-u.edu.ph' && str_ends_with($normalized, '@bicol-u.edu.ph');
}

function validateStrongPassword(string $password): ?string {
    if (strlen($password) < 10) {
        return 'Password must be at least 10 characters long.';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'Password must include at least one uppercase letter.';
    }
    if (!preg_match('/[a-z]/', $password)) {
        return 'Password must include at least one lowercase letter.';
    }
    if (!preg_match('/\d/', $password)) {
        return 'Password must include at least one number.';
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        return 'Password must include at least one special character.';
    }

    return null;
}

function startApiSession(bool $rememberMe = false): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $lifetime = $rememberMe ? 60 * 60 * 24 * 30 : 0;

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function clientSessionTokenFromRequest(): string {
    $token = trim((string) ($_SERVER['HTTP_X_ISKO_CLIENT_SESSION'] ?? ''));
    if ($token === '' || !preg_match('/^[A-Za-z0-9._-]{16,128}$/', $token)) {
        return '';
    }

    return $token;
}

function userPayloadFromRow(array $user): array {
    return [
        'id' => (int) $user['USER_ID'],
        'name' => trim($user['FNAME'] . ' ' . $user['LNAME']),
        'username' => $user['USERNAME'],
        'email' => $user['EMAIL'],
        'role' => normalizeRole($user['ROLE']),
    ];
}

function issueAuthSession(array $user, bool $rememberMe = false): void {
    startApiSession($rememberMe);
    session_regenerate_id(true);
    $clientSession = clientSessionTokenFromRequest();
    if ($clientSession === '') {
        jsonResponse(['error' => 'Client session is required. Refresh the page and try again.'], 400);
    }

    if (!isset($_SESSION['client_auth']) || !is_array($_SESSION['client_auth'])) {
        $_SESSION['client_auth'] = [];
    }

    $_SESSION['client_auth'][$clientSession] = [
        'user_id' => (int) $user['id'],
        'issued_at' => time(),
    ];

    unset($_SESSION['user_id'], $_SESSION['client_session_id']);
}

function currentUser(PDO $db): ?array {
    startApiSession();

    $requestClientSession = clientSessionTokenFromRequest();
    if ($requestClientSession === '') {
        return null;
    }

    $clientAuth = $_SESSION['client_auth'][$requestClientSession] ?? null;
    $userId = is_array($clientAuth) ? ($clientAuth['user_id'] ?? null) : null;
    if (!$userId) {
        $legacyUserId = $_SESSION['user_id'] ?? null;
        $legacyClientSession = (string) ($_SESSION['client_session_id'] ?? '');
        if ($legacyUserId && $legacyClientSession !== '' && hash_equals($legacyClientSession, $requestClientSession)) {
            if (!isset($_SESSION['client_auth']) || !is_array($_SESSION['client_auth'])) {
                $_SESSION['client_auth'] = [];
            }
            $_SESSION['client_auth'][$requestClientSession] = [
                'user_id' => (int) $legacyUserId,
                'issued_at' => time(),
            ];
            unset($_SESSION['user_id'], $_SESSION['client_session_id']);
            $userId = (int) $legacyUserId;
        } else {
            unset($_SESSION['user_id'], $_SESSION['client_session_id']);
            return null;
        }
    }

    if (!is_numeric($userId)) {
        unset($_SESSION['client_auth'][$requestClientSession]);
        return null;
    }

    $stmt = $db->prepare(
        "SELECT USER_ID, FNAME, LNAME, EMAIL, USERNAME, ROLE
         FROM USERS
         WHERE USER_ID = :user_id AND STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        unset($_SESSION['client_auth'][$requestClientSession]);
        return null;
    }

    return userPayloadFromRow($user);
}
