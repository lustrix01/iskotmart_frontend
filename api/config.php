<?php

require_once(__DIR__ . '/../backend/core/initialize.php');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

function jsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST ?: [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonResponse(array $payload, int $status = 200): void {
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
