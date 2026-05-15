<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForMessages(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function formatMessageTime(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('M j, g:i A', $timestamp) : $value;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireCustomerForMessages($db);
$customerId = (int) $sessionUser['id'];

try {
    $stmt = $db->prepare(
        "SELECT msg.MSG_ID, msg.MSG_TEXT, msg.SENT_ON, msg.STATUS, msg.MSG_RECEIVER AS merchant_id,
                COALESCE(m.SHOP_NAME, TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), 'Merchant') AS merchant_name
         FROM MESSAGE msg
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = msg.MSG_RECEIVER
         INNER JOIN USERS u ON u.USER_ID = m.MERCHANT_ID
         WHERE msg.MSG_SENDER = :customer_id
         ORDER BY msg.SENT_ON DESC, msg.MSG_ID DESC
         LIMIT 200"
    );
    $stmt->execute([':customer_id' => $customerId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $threadsByMerchant = [];
    foreach ($rows as $row) {
        $merchantId = (int) ($row['merchant_id'] ?? 0);
        if ($merchantId <= 0) {
            continue;
        }

        if (!isset($threadsByMerchant[$merchantId])) {
            $threadsByMerchant[$merchantId] = [
                'id' => $merchantId,
                'name' => $row['merchant_name'] ?: 'Merchant',
                'messages' => [],
                'lastMsg' => '',
                'time' => '',
            ];
        }

        $messageText = trim((string) ($row['MSG_TEXT'] ?? ''));
        $message = [
            'id' => (int) $row['MSG_ID'],
            'sender' => 'me',
            'text' => $messageText,
            'time' => formatMessageTime($row['SENT_ON'] ?? null),
            'status' => (string) ($row['STATUS'] ?? ''),
        ];

        $threadsByMerchant[$merchantId]['messages'][] = $message;
        if ($threadsByMerchant[$merchantId]['lastMsg'] === '') {
            $threadsByMerchant[$merchantId]['lastMsg'] = $messageText;
            $threadsByMerchant[$merchantId]['time'] = $message['time'];
        }
    }

    $threads = array_values(array_map(function (array $thread): array {
        usort($thread['messages'], fn (array $a, array $b): int => ($a['id'] ?? 0) <=> ($b['id'] ?? 0));
        return $thread;
    }, $threadsByMerchant));

    jsonResponse(['threads' => $threads]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load customer messages. Please try again.'], 500);
}
