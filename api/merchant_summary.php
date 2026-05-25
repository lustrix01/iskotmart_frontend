<?php

require_once(__DIR__ . '/config.php');

function requireMerchantForSummary(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function money(int|float|null $value): float {
    return round((float) ($value ?? 0), 2);
}

function formatOrderDate(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('M j, Y', $timestamp) : $value;
}

function merchantProfile(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.EMAIL, u.USERNAME, u.PHONE,
                u.AVATAR_URL, u.CREATED_ON,
                m.BU_EMAIL, m.SHOP_NAME, m.SHOP_DESC, m.ADDRESS, m.STUDENT_NUM, m.ID_IMAGE_URL
         FROM USERS u
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = u.USER_ID
         WHERE u.USER_ID = :merchant_id AND u.STATUS = 'ACTIVE'
         LIMIT 1"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonResponse(['error' => 'Merchant profile was not found.'], 404);
    }

    return [
        'id' => (int) $row['USER_ID'],
        'name' => trim($row['FNAME'] . ' ' . $row['LNAME']),
        'username' => $row['USERNAME'],
        'email' => $row['EMAIL'],
        'phone' => $row['PHONE'],
        'avatarUrl' => $row['AVATAR_URL'],
        'createdOn' => $row['CREATED_ON'],
        'businessEmail' => $row['BU_EMAIL'],
        'shopName' => $row['SHOP_NAME'],
        'shopDescription' => $row['SHOP_DESC'] ?: '',
        'address' => $row['ADDRESS'],
        'studentNumber' => $row['STUDENT_NUM'],
        'idImageUrl' => $row['ID_IMAGE_URL'],
    ];
}

function offeringStats(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN o.OFFERING_TYPE = 'P' THEN 1 ELSE 0 END) AS products,
            SUM(CASE WHEN o.OFFERING_TYPE = 'S' THEN 1 ELSE 0 END) AS services,
            SUM(CASE WHEN UPPER(o.AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN o.OFFERING_TYPE = 'P' AND p.STOCK_QTY <= 5 THEN 1 ELSE 0 END) AS low_stock
         FROM OFFERING o
         LEFT JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
         WHERE o.MERCHANT_ID = :merchant_id"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'total' => (int) ($row['total'] ?? 0),
        'products' => (int) ($row['products'] ?? 0),
        'services' => (int) ($row['services'] ?? 0),
        'active' => (int) ($row['active'] ?? 0),
        'lowStock' => (int) ($row['low_stock'] ?? 0),
    ];
}

function orderRows(PDO $db, int $merchantId): array {
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
         LIMIT 25"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function orderPayloads(array $rows): array {
    return array_map(function (array $row): array {
        $customer = trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? ''));
        $items = array_map(function (string $item): array {
            [$name, $qty, $price] = array_pad(explode('||', $item), 3, '');
            return [
                'name' => trim($name),
                'qty' => max(1, (int) $qty),
                'price' => money($price),
            ];
        }, array_filter(explode('##', (string) $row['item_names'])));

        return [
            'id' => 'ORD-' . (int) $row['ORDER_ID'],
            'rawId' => (int) $row['ORDER_ID'],
            'customer' => $row['RECIPIENT_NAME'] ?: $customer,
            'email' => $row['EMAIL'],
            'items' => $items,
            'product' => implode(', ', array_map(fn (array $item): string => $item['name'], $items)) ?: 'Order items',
            'total' => money($row['TOTAL_AMOUNT']),
            'amount' => 'PHP ' . number_format(money($row['TOTAL_AMOUNT']), 2),
            'method' => $row['method'],
            'paymentStatus' => $row['PAYMENT_STATUS'],
            'status' => $row['ORDER_STATUS'],
            'date' => formatOrderDate($row['ORDERED_ON']),
            'phone' => $row['PHONE_NUM'] ?: '',
            'address' => $row['ADDRESS'] ?: '',
        ];
    }, $rows);
}

function salesStats(array $orders): array {
    $gross = array_reduce($orders, fn ($sum, $order) => $sum + money($order['total'] ?? 0), 0.0);
    $completed = array_filter($orders, fn ($order) => strtoupper((string) ($order['status'] ?? '')) === 'COMPLETED');

    return [
        'grossRevenue' => money($gross),
        'netEarnings' => money($gross),
        'orderCount' => count($orders),
        'completedCount' => count($completed),
        'pendingCount' => count(array_filter($orders, fn ($order) => strtoupper((string) ($order['status'] ?? '')) === 'PENDING')),
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireMerchantForSummary($db);
$merchantId = (int) $sessionUser['id'];
$orders = orderPayloads(orderRows($db, $merchantId));
$sales = salesStats($orders);

jsonResponse([
    'profile' => merchantProfile($db, $merchantId),
    'offerings' => offeringStats($db, $merchantId),
    'orders' => $orders,
    'recentOrders' => array_slice($orders, 0, 5),
    'sales' => $sales,
]);
