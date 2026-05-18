<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

startApiSession();
$clientSession = clientSessionTokenFromRequest();
if ($clientSession !== '' && isset($_SESSION['client_auth']) && is_array($_SESSION['client_auth'])) {
    unset($_SESSION['client_auth'][$clientSession]);
}

unset($_SESSION['user_id'], $_SESSION['client_session_id']);

if (!empty($_SESSION['client_auth'])) {
    jsonResponse(['ok' => true]);
}

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}

session_destroy();

jsonResponse(['ok' => true]);
