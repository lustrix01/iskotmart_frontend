<?php

require_once(__DIR__ . '/config.php');

const MESSAGE_UPLOAD_DIR = __DIR__ . '/uploads/messages';
const MESSAGE_UPLOAD_URL = '/api/uploads/messages';

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

function ensureMessageAttachmentColumns(PDO $db): void {
    $columns = $db->query("SHOW COLUMNS FROM MESSAGE")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('ATTACH_URL', $columns, true)) {
        $db->exec("ALTER TABLE MESSAGE ADD COLUMN ATTACH_URL varchar(255) DEFAULT NULL AFTER STATUS");
    }
    if (!in_array('ATTACH_FILETYPE', $columns, true)) {
        $db->exec("ALTER TABLE MESSAGE ADD COLUMN ATTACH_FILETYPE varchar(45) DEFAULT NULL AFTER ATTACH_URL");
    }
}

function storeMessageImage(int $senderId, string $dataUrl): array {
    $dataUrl = trim($dataUrl);
    if ($dataUrl === '') {
        return ['', ''];
    }

    if (!preg_match('/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+\/=\r\n]+)$/', $dataUrl, $matches)) {
        jsonResponse(['error' => 'Messages only allow JPG, PNG, WebP, or GIF images.'], 422);
    }

    $binary = base64_decode(str_replace(["\r", "\n"], '', $matches[2]), true);
    if ($binary === false || strlen($binary) === 0) {
        jsonResponse(['error' => 'Message image could not be read.'], 422);
    }
    if (strlen($binary) > 5 * 1024 * 1024) {
        jsonResponse(['error' => 'Message image must be 5MB or smaller.'], 422);
    }
    if (!is_dir(MESSAGE_UPLOAD_DIR) && !mkdir(MESSAGE_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Unable to prepare message image storage.'], 500);
    }

    $extension = match ($matches[1]) {
        'image/jpeg', 'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        default => 'img',
    };
    $fileName = sprintf('message-%d-%s.%s', $senderId, bin2hex(random_bytes(8)), $extension);
    if (file_put_contents(MESSAGE_UPLOAD_DIR . '/' . $fileName, $binary) === false) {
        jsonResponse(['error' => 'Unable to store message image.'], 500);
    }

    return [MESSAGE_UPLOAD_URL . '/' . $fileName, $matches[1]];
}

$sessionUser = requireCustomerForMessages($db);
$customerId = (int) $sessionUser['id'];
ensureMessageAttachmentColumns($db);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = jsonInput();
        $merchantId = (int) ($data['merchantId'] ?? 0);
        $message = trim((string) ($data['message'] ?? ''));
        [$attachUrl, $attachFiletype] = storeMessageImage($customerId, (string) ($data['imageData'] ?? ''));

        if ($merchantId <= 0) {
            jsonResponse(['error' => 'Merchant is required.'], 422);
        }

        if ($message === '' && $attachUrl === '') {
            jsonResponse(['error' => 'Message or image is required.'], 422);
        }

        $merchantStmt = $db->prepare(
            "SELECT m.MERCHANT_ID
             FROM MERCHANT m
             INNER JOIN USERS u ON u.USER_ID = m.MERCHANT_ID AND u.STATUS = 'ACTIVE'
             WHERE m.MERCHANT_ID = :merchant_id
             LIMIT 1"
        );
        $merchantStmt->execute([':merchant_id' => $merchantId]);
        if (!$merchantStmt->fetchColumn()) {
            jsonResponse(['error' => 'Merchant not found.'], 404);
        }

        $stmt = $db->prepare(
            "INSERT INTO MESSAGE (MSG_TEXT, STATUS, ATTACH_URL, ATTACH_FILETYPE, MESSAGEcol, MSG_RECEIVER, MSG_SENDER)
             VALUES (:message, 'SENT', :attach_url, :attach_filetype, 'customer', :merchant_id, :customer_id)"
        );
        $stmt->execute([
            ':message' => $message,
            ':attach_url' => $attachUrl !== '' ? $attachUrl : null,
            ':attach_filetype' => $attachFiletype !== '' ? $attachFiletype : null,
            ':merchant_id' => $merchantId,
            ':customer_id' => $customerId,
        ]);

        jsonResponse(['message' => 'Message sent.'], 201);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    $markReadStmt = $db->prepare(
        "UPDATE MESSAGE
         SET STATUS = 'READ'
         WHERE MSG_SENDER = :customer_id
           AND MESSAGEcol = 'merchant'
           AND UPPER(STATUS) NOT IN ('READ', 'SEEN')"
    );
    $markReadStmt->execute([':customer_id' => $customerId]);

    $stmt = $db->prepare(
        "SELECT msg.MSG_ID, msg.MSG_TEXT, msg.SENT_ON, msg.STATUS, msg.ATTACH_URL, msg.ATTACH_FILETYPE,
                msg.MESSAGEcol, msg.MSG_RECEIVER AS merchant_id,
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
            'sender' => ($row['MESSAGEcol'] ?? 'customer') === 'merchant' ? 'them' : 'me',
            'text' => $messageText,
            'imageUrl' => (string) ($row['ATTACH_URL'] ?? ''),
            'imageType' => (string) ($row['ATTACH_FILETYPE'] ?? ''),
            'time' => formatMessageTime($row['SENT_ON'] ?? null),
            'status' => (string) ($row['STATUS'] ?? ''),
        ];

        $threadsByMerchant[$merchantId]['messages'][] = $message;
        if ($threadsByMerchant[$merchantId]['lastMsg'] === '') {
            $threadsByMerchant[$merchantId]['lastMsg'] = $messageText !== '' ? $messageText : 'Image';
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
