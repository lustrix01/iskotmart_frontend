<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = currentUser($db);
if (!$user) {
    jsonResponse([
        'unreadMessages' => 0,
    ]);
}

$role = strtolower((string) ($user['role'] ?? ''));
$userId = (int) ($user['id'] ?? 0);

try {
    $unreadMessages = 0;

    if ($role === 'customer') {
        $stmt = $db->prepare(
            "SELECT COUNT(DISTINCT MSG_RECEIVER)
             FROM MESSAGE
             WHERE MSG_SENDER = :customer_id
               AND MESSAGEcol = 'merchant'
               AND MSG_RECEIVER IS NOT NULL
               AND UPPER(STATUS) NOT IN ('READ', 'SEEN')"
        );
        $stmt->execute([':customer_id' => $userId]);
        $unreadMessages = (int) $stmt->fetchColumn();
    } elseif ($role === 'merchant') {
        $stmt = $db->prepare(
            "SELECT COUNT(DISTINCT MSG_SENDER)
             FROM MESSAGE
             WHERE MSG_RECEIVER = :merchant_id
               AND MESSAGEcol = 'customer'
               AND MSG_SENDER IS NOT NULL
               AND UPPER(STATUS) NOT IN ('READ', 'SEEN')"
        );
        $stmt->execute([':merchant_id' => $userId]);
        $unreadMessages = (int) $stmt->fetchColumn();
    }

    jsonResponse([
        'unreadMessages' => $unreadMessages,
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load navigation counts.'], 500);
}
