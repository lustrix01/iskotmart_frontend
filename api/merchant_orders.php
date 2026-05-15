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

function moneyValue(int|float|null $value): float {
    return round((float) ($value ?? 0), 2);
}

function formatOrderDate(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('M j, Y', $timestamp) : $value;
}

function mapDbStatusToUi(string $status): string {
    $normalized = strtoupper(trim($status));
    $map = [
        'PENDING' => 'Pending',
        'TO_CONFIRM' => 'Pending',
        'CONFIRMED' => 'Confirmed',
        'PROCESSING' => 'Confirmed',
        'TO_SHIP' => 'Confirmed',
        'SHIPPED' => 'Shipped',
        'IN_TRANSIT' => 'Shipped',
        'TO_RECEIVE' => 'Shipped',
        'COMPLETED' => 'Completed',
        'DELIVERED' => 'Completed',
        'CANCELLED' => 'Cancelled',
    ];

    return $map[$normalized] ?? 'Pending';
}

function mapUiStatusToDb(string $status): string {
    $map = [
        'Pending' => 'PENDING',
        'Confirmed' => 'CONFIRMED',
        'Shipped' => 'SHIPPED',
        'Completed' => 'COMPLETED',
        'Cancelled' => 'CANCELLED',
    ];

    return $map[$status] ?? '';
}

function productOrderRows(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS,
                ord.PAYMENT_STATUS, ord.RECIPIENT_NAME, ord.PHONE_NUM, ord.ADDRESS,
                COALESCE(dm.DM_NAME, 'Meet-up') AS method,
                u.FNAME, u.LNAME, u.EMAIL,
                GROUP_CONCAT(
                    CONCAT(o.OFFERING_NAME, '||', oi.QUANTITY, '||', oi.PRICE)
                    ORDER BY oi.ORDERITEM_ID
                    SEPARATOR '##'
                ) AS item_names
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         INNER JOIN USERS u ON u.USER_ID = ord.CUSTOMER_ID
         LEFT JOIN DELIVERY_METHOD dm ON dm.DM_ID = ord.DM_ID
         WHERE p.MERCHANT_ID = :merchant_id
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS,
                  ord.PAYMENT_STATUS, ord.RECIPIENT_NAME, ord.PHONE_NUM, ord.ADDRESS,
                  dm.DM_NAME, u.FNAME, u.LNAME, u.EMAIL
         ORDER BY ord.ORDERED_ON DESC, ord.ORDER_ID DESC
         LIMIT 100"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function serviceRequestRows(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT sr.REQUEST_ID, sr.REQUEST_DATE, sr.REQ_STATUS, sr.TOTAL_PRICE, sr.PHONE_NUM, sr.ADDRESS,
                sr.RECEIPT_NAME, sr.RECIPIENT_NAME, sr.CUSTOMER_INFO, u.EMAIL,
                COALESCE(o.OFFERING_NAME, 'Service Request') AS service_name
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         INNER JOIN USERS u ON u.USER_ID = sr.CUSTOMER_ID
         LEFT JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
         ORDER BY sr.REQUEST_DATE DESC, sr.REQUEST_ID DESC
         LIMIT 100"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function merchantOrderPayloads(PDO $db, int $merchantId): array {
    $productOrders = array_map(function (array $row): array {
        $customer = trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? ''));
        $items = array_map(function (string $item): array {
            [$name, $qty, $price] = array_pad(explode('||', $item), 3, '');
            return [
                'name' => trim($name) !== '' ? trim($name) : 'Order item',
                'qty' => max(1, (int) $qty),
                'price' => moneyValue($price),
            ];
        }, array_filter(explode('##', (string) ($row['item_names'] ?? ''))));

        return [
            'source' => 'order',
            'id' => 'ORD-' . (int) $row['ORDER_ID'],
            'rawId' => (int) $row['ORDER_ID'],
            'sortDate' => (string) ($row['ORDERED_ON'] ?? ''),
            'customer' => $row['RECIPIENT_NAME'] ?: $customer,
            'email' => $row['EMAIL'] ?: '',
            'items' => $items,
            'total' => moneyValue($row['TOTAL_AMOUNT'] ?? 0),
            'method' => $row['method'] ?: 'Meet-up',
            'paymentStatus' => $row['PAYMENT_STATUS'] ?: 'UNPAID',
            'status' => mapDbStatusToUi((string) ($row['ORDER_STATUS'] ?? '')),
            'date' => formatOrderDate($row['ORDERED_ON'] ?? null),
            'phone' => $row['PHONE_NUM'] ?: '',
            'address' => $row['ADDRESS'] ?: '',
        ];
    }, productOrderRows($db, $merchantId));

    $serviceOrders = array_map(function (array $row): array {
        $info = json_decode((string) ($row['CUSTOMER_INFO'] ?? ''), true);
        $quantity = max(1, (int) (($info['quantity'] ?? 1)));
        $total = moneyValue($row['TOTAL_PRICE'] ?? 0);
        $unitPrice = $quantity > 0 ? $total / $quantity : $total;
        $customerName = trim((string) ($row['RECIPIENT_NAME'] ?: $row['RECEIPT_NAME'] ?: 'Customer'));

        return [
            'source' => 'service_request',
            'id' => 'SRV-' . (int) $row['REQUEST_ID'],
            'rawId' => (int) $row['REQUEST_ID'],
            'sortDate' => (string) ($row['REQUEST_DATE'] ?? ''),
            'customer' => $customerName !== '' ? $customerName : 'Customer',
            'email' => $row['EMAIL'] ?: '',
            'items' => [[
                'name' => $row['service_name'] ?: 'Service Request',
                'qty' => $quantity,
                'price' => moneyValue($unitPrice),
            ]],
            'total' => $total,
            'method' => 'Service booking',
            'paymentStatus' => strtoupper((string) ($info['paymentStatus'] ?? 'UNPAID')),
            'status' => mapDbStatusToUi((string) ($row['REQ_STATUS'] ?? '')),
            'date' => formatOrderDate($row['REQUEST_DATE'] ?? null),
            'phone' => $row['PHONE_NUM'] ?: '',
            'address' => $row['ADDRESS'] ?: '',
        ];
    }, serviceRequestRows($db, $merchantId));

    $orders = array_merge($productOrders, $serviceOrders);
    usort($orders, function (array $a, array $b): int {
        $aTime = strtotime((string) ($a['sortDate'] ?? '')) ?: 0;
        $bTime = strtotime((string) ($b['sortDate'] ?? '')) ?: 0;
        return $bTime <=> $aTime;
    });

    return array_map(function (array $order): array {
        unset($order['sortDate']);
        return $order;
    }, $orders);
}

function merchantOwnsProductOrder(PDO $db, int $merchantId, int $orderId): bool {
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

function merchantOwnsServiceRequest(PDO $db, int $merchantId, int $requestId): bool {
    $stmt = $db->prepare(
        "SELECT sr.REQUEST_ID
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE sr.REQUEST_ID = :request_id AND s.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':request_id' => $requestId,
        ':merchant_id' => $merchantId,
    ]);

    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

$sessionUser = requireMerchantForOrders($db);
$merchantId = (int) $sessionUser['id'];
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    try {
        jsonResponse(['orders' => merchantOrderPayloads($db, $merchantId)]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to load merchant orders.'], 500);
    }
}

if ($method !== 'POST' && $method !== 'PATCH') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$source = strtolower(trim((string) ($data['source'] ?? '')));
$rawId = (int) ($data['rawId'] ?? ($data['orderId'] ?? 0));
$status = trim((string) ($data['status'] ?? ''));
$allowed = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];

if ($rawId <= 0 || !in_array($status, $allowed, true)) {
    jsonResponse(['error' => 'Invalid order status update.'], 422);
}

$dbStatus = mapUiStatusToDb($status);
if ($dbStatus === '') {
    jsonResponse(['error' => 'Invalid order status value.'], 422);
}

try {
    if ($source === 'service_request') {
        if (!merchantOwnsServiceRequest($db, $merchantId, $rawId)) {
            jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
        }

        $stmt = $db->prepare(
            "UPDATE SERVICE_REQUEST
             SET REQ_STATUS = :status
             WHERE REQUEST_ID = :request_id"
        );
        $stmt->execute([
            ':status' => $dbStatus,
            ':request_id' => $rawId,
        ]);
    } else {
        if (!merchantOwnsProductOrder($db, $merchantId, $rawId)) {
            jsonResponse(['error' => 'Order not found for this merchant.'], 404);
        }

        $stmt = $db->prepare(
            "UPDATE ORDERS
             SET ORDER_STATUS = :status,
                 DELIVERY_STATUS = :delivery_status,
                 RECEIVED_ON = CASE WHEN :completed = 1 THEN NOW(1) ELSE RECEIVED_ON END
             WHERE ORDER_ID = :order_id"
        );
        $stmt->execute([
            ':status' => $dbStatus,
            ':delivery_status' => $dbStatus === 'SHIPPED' ? 'IN_TRANSIT' : $dbStatus,
            ':completed' => $dbStatus === 'COMPLETED' ? 1 : 0,
            ':order_id' => $rawId,
        ]);
    }

    jsonResponse([
        'ok' => true,
        'orders' => merchantOrderPayloads($db, $merchantId),
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to update order status.'], 500);
}
