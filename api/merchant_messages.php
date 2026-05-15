<?php

require_once(__DIR__ . '/config.php');

function requireMerchantForMessages(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function formatMerchantMessageTime(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('M j, g:i A', $timestamp) : $value;
}

function customerExists(PDO $db, int $customerId): bool {
    $stmt = $db->prepare(
        "SELECT c.CUSTOMER_ID
         FROM CUSTOMER c
         INNER JOIN USERS u ON u.USER_ID = c.CUSTOMER_ID AND u.STATUS = 'ACTIVE'
         WHERE c.CUSTOMER_ID = :customer_id
         LIMIT 1"
    );
    $stmt->execute([':customer_id' => $customerId]);
    return (bool) $stmt->fetchColumn();
}

$sessionUser = requireMerchantForMessages($db);
$merchantId = (int) $sessionUser['id'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = jsonInput();
        $customerId = (int) ($data['customerId'] ?? 0);
        $message = trim((string) ($data['message'] ?? ''));

        if ($customerId <= 0) {
            jsonResponse(['error' => 'Customer is required.'], 422);
        }

        if ($message === '') {
            jsonResponse(['error' => 'Message is required.'], 422);
        }

        if (!customerExists($db, $customerId)) {
            jsonResponse(['error' => 'Customer not found.'], 404);
        }

        $threadStmt = $db->prepare(
            "SELECT 1 FROM MESSAGE
             WHERE MSG_RECEIVER = :merchant_id AND MSG_SENDER = :customer_id
             LIMIT 1"
        );
        $threadStmt->execute([
            ':merchant_id' => $merchantId,
            ':customer_id' => $customerId,
        ]);
        if (!$threadStmt->fetchColumn()) {
            jsonResponse(['error' => 'Conversation not found.'], 404);
        }

        $stmt = $db->prepare(
            "INSERT INTO MESSAGE (MSG_TEXT, STATUS, MESSAGEcol, MSG_RECEIVER, MSG_SENDER)
             VALUES (:message, 'SENT', 'merchant', :merchant_id, :customer_id)"
        );
        $stmt->execute([
            ':message' => $message,
            ':merchant_id' => $merchantId,
            ':customer_id' => $customerId,
        ]);

        jsonResponse(['message' => 'Message sent.'], 201);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    $stmt = $db->prepare(
        "SELECT msg.MSG_ID, msg.MSG_TEXT, msg.SENT_ON, msg.STATUS, msg.MESSAGEcol,
                msg.MSG_SENDER AS customer_id,
                COALESCE(c.DISPLAY_NAME, TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), u.USERNAME, 'Customer') AS customer_name
         FROM MESSAGE msg
         INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = msg.MSG_SENDER
         INNER JOIN USERS u ON u.USER_ID = c.CUSTOMER_ID AND u.STATUS = 'ACTIVE'
         WHERE msg.MSG_RECEIVER = :merchant_id
         ORDER BY msg.SENT_ON DESC, msg.MSG_ID DESC
         LIMIT 300"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $threadsByCustomer = [];
    foreach ($rows as $row) {
        $customerId = (int) ($row['customer_id'] ?? 0);
        if ($customerId <= 0) {
            continue;
        }

        if (!isset($threadsByCustomer[$customerId])) {
            $name = $row['customer_name'] ?: 'Customer';
            $initials = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 2));
            $threadsByCustomer[$customerId] = [
                'id' => $customerId,
                'name' => $name,
                'avatar' => $initials !== '' ? $initials : 'CU',
                'status' => 'ACTIVE',
                'messages' => [],
                'lastMsg' => '',
                'time' => '',
            ];
        }

        $messageText = trim((string) ($row['MSG_TEXT'] ?? ''));
        $message = [
            'id' => (int) $row['MSG_ID'],
            'sender' => ($row['MESSAGEcol'] ?? 'customer') === 'merchant' ? 'me' : 'them',
            'text' => $messageText,
            'time' => formatMerchantMessageTime($row['SENT_ON'] ?? null),
            'status' => (string) ($row['STATUS'] ?? ''),
        ];

        $threadsByCustomer[$customerId]['messages'][] = $message;
        if ($threadsByCustomer[$customerId]['lastMsg'] === '') {
            $threadsByCustomer[$customerId]['lastMsg'] = $messageText;
            $threadsByCustomer[$customerId]['time'] = $message['time'];
        }
    }

    $threads = array_values(array_map(function (array $thread): array {
        usort($thread['messages'], fn (array $a, array $b): int => ($a['id'] ?? 0) <=> ($b['id'] ?? 0));
        return $thread;
    }, $threadsByCustomer));

    jsonResponse(['threads' => $threads]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant messages. Please try again.'], 500);
}
