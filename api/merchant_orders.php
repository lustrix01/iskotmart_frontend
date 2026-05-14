<?php

require_once(__DIR__ . '/config.php');

function requireMerchantForOrders(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function merchantOwnsOrder(PDO $db, int $merchantId, int $orderId): bool {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE ord.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);

    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

$sessionUser = requireMerchantForOrders($db);
$merchantId = (int) $sessionUser['id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$orderId = (int) ($data['orderId'] ?? 0);
$status = trim((string) ($data['status'] ?? ''));
$allowed = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];

if ($orderId <= 0 || !in_array($status, $allowed, true)) {
    jsonResponse(['error' => 'Invalid order status update.'], 422);
}

if (!merchantOwnsOrder($db, $merchantId, $orderId)) {
    jsonResponse(['error' => 'Order not found for this merchant.'], 404);
}

try {
    $stmt = $db->prepare(
        "UPDATE ORDERS
         SET ORDER_STATUS = :status,
             DELIVERY_STATUS = :delivery_status,
             RECEIVED_ON = CASE WHEN :completed = 1 THEN NOW(1) ELSE RECEIVED_ON END
         WHERE ORDER_ID = :order_id"
    );
    $stmt->execute([
        ':status' => $status,
        ':delivery_status' => $status === 'Shipped' ? 'In Transit' : $status,
        ':completed' => $status === 'Completed' ? 1 : 0,
        ':order_id' => $orderId,
    ]);

    jsonResponse(['ok' => true]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to update order status.'], 500);
}
