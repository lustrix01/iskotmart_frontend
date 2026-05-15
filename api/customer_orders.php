<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForOrders(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
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

function mapOrderStatus(string $status): string {
    $normalized = strtoupper(trim($status));
    $map = [
        'PENDING' => 'To confirm',
        'TO_CONFIRM' => 'To confirm',
        'CONFIRMED' => 'To ship',
        'PROCESSING' => 'To ship',
        'TO_SHIP' => 'To ship',
        'SHIPPED' => 'To receive',
        'IN_TRANSIT' => 'To receive',
        'TO_RECEIVE' => 'To receive',
        'DELIVERED' => 'Completed',
        'COMPLETED' => 'Completed',
        'CANCELLED' => 'Cancelled',
    ];

    return $map[$normalized] ?? 'To confirm';
}

function decodeServiceRequestInfo(string $payload): array {
    $decoded = json_decode($payload, true);
    return is_array($decoded) ? $decoded : [];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireCustomerForOrders($db);
$customerId = (int) $sessionUser['id'];

try {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS, ord.PAYMENT_STATUS,
                COALESCE(dm.DM_NAME, 'Meet-up') AS delivery_mode,
                m.MERCHANT_ID,
                COALESCE(m.SHOP_NAME, TRIM(CONCAT(mu.FNAME, ' ', mu.LNAME)), 'Merchant') AS merchant_name,
                GROUP_CONCAT(
                    CONCAT(
                        COALESCE(o.OFFERING_NAME, 'Item'),
                        '||', oi.QUANTITY,
                        '||', oi.PRICE,
                        '||', COALESCE(di.IMAGE_URL, '')
                    )
                    ORDER BY oi.ORDERITEM_ID
                    SEPARATOR '##'
                ) AS item_blob
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = p.MERCHANT_ID
         INNER JOIN USERS mu ON mu.USER_ID = m.MERCHANT_ID
         LEFT JOIN DELIVERY_METHOD dm ON dm.DM_ID = ord.DM_ID
         LEFT JOIN DISPLAY_IMG di ON di.OFFERING_ID = o.OFFERING_ID AND di.IS_DEFAULT = 1
         WHERE ord.CUSTOMER_ID = :customer_id
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS, ord.PAYMENT_STATUS,
                  dm.DM_NAME, m.MERCHANT_ID, m.SHOP_NAME, mu.FNAME, mu.LNAME
         ORDER BY ord.ORDERED_ON DESC, ord.ORDER_ID DESC
         LIMIT 50"
    );
    $stmt->execute([':customer_id' => $customerId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $productOrders = array_map(function (array $row): array {
        $items = array_map(function (string $encoded): array {
            [$name, $qty, $price, $img] = array_pad(explode('||', $encoded), 4, '');
            return [
                'name' => trim($name) !== '' ? trim($name) : 'Item',
                'qty' => max(1, (int) $qty),
                'price' => moneyValue($price),
                'img' => trim($img),
            ];
        }, array_filter(explode('##', (string) ($row['item_blob'] ?? ''))));

        return [
            'id' => 'ORD-' . (int) $row['ORDER_ID'],
            'rawId' => (int) $row['ORDER_ID'],
            'sortDate' => (string) ($row['ORDERED_ON'] ?? ''),
            'merchant' => $row['merchant_name'] ?: 'Merchant',
            'merchantId' => 'M-' . (int) $row['MERCHANT_ID'],
            'type' => 'product',
            'items' => $items,
            'status' => mapOrderStatus((string) ($row['ORDER_STATUS'] ?? '')),
            'payment' => ((string) ($row['PAYMENT_STATUS'] ?? '')) !== '' ? (string) $row['PAYMENT_STATUS'] : 'Unpaid',
            'mode' => (string) ($row['delivery_mode'] ?? 'Meet-up'),
            'total' => moneyValue($row['TOTAL_AMOUNT'] ?? 0),
            'date' => formatOrderDate($row['ORDERED_ON'] ?? null),
        ];
    }, $rows);

    $serviceStmt = $db->prepare(
        "SELECT sr.REQUEST_ID, sr.REQUEST_DATE, sr.SCHEDULED_DATE, sr.REQ_STATUS, sr.TOTAL_PRICE,
                sr.CUSTOMER_INFO, sr.NOTE, sr.RECEIPT_NAME, sr.ADDRESS, sr.PHONE_NUM,
                s.SERVICE_ID, m.MERCHANT_ID,
                COALESCE(m.SHOP_NAME, TRIM(CONCAT(mu.FNAME, ' ', mu.LNAME)), 'Merchant') AS merchant_name,
                COALESCE(o.OFFERING_NAME, 'Service Request') AS service_name,
                COALESCE(di.IMAGE_URL, '') AS service_image
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = s.MERCHANT_ID
         INNER JOIN USERS mu ON mu.USER_ID = m.MERCHANT_ID
         LEFT JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         LEFT JOIN DISPLAY_IMG di ON di.OFFERING_ID = s.SERVICE_ID AND di.IS_DEFAULT = 1
         WHERE sr.CUSTOMER_ID = :customer_id
         ORDER BY sr.REQUEST_DATE DESC, sr.REQUEST_ID DESC
         LIMIT 50"
    );
    $serviceStmt->execute([':customer_id' => $customerId]);
    $serviceRows = $serviceStmt->fetchAll(PDO::FETCH_ASSOC);

    $serviceOrders = array_map(function (array $row): array {
        $info = decodeServiceRequestInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
        $quantity = max(1, (int) ($info['quantity'] ?? 1));
        $total = moneyValue($row['TOTAL_PRICE'] ?? 0);
        $unitPrice = $quantity > 0 ? $total / $quantity : $total;
        $payment = trim((string) ($info['paymentStatus'] ?? ''));
        if ($payment === '') {
            $payment = 'Unpaid';
        }

        return [
            'id' => 'SRV-' . (int) $row['REQUEST_ID'],
            'rawId' => (int) $row['REQUEST_ID'],
            'sortDate' => (string) ($row['REQUEST_DATE'] ?? ''),
            'merchant' => $row['merchant_name'] ?: 'Merchant',
            'merchantId' => 'M-' . (int) $row['MERCHANT_ID'],
            'type' => 'service',
            'items' => [[
                'name' => $row['service_name'] ?: 'Service Request',
                'qty' => $quantity,
                'price' => moneyValue($unitPrice),
                'img' => trim((string) ($row['service_image'] ?? '')),
            ]],
            'status' => mapOrderStatus((string) ($row['REQ_STATUS'] ?? '')),
            'payment' => $payment,
            'mode' => 'Service booking',
            'total' => $total,
            'date' => formatOrderDate($row['REQUEST_DATE'] ?? null),
        ];
    }, $serviceRows);

    $orders = array_merge($productOrders, $serviceOrders);
    usort($orders, function (array $a, array $b): int {
        $aTime = strtotime((string) ($a['sortDate'] ?? '')) ?: 0;
        $bTime = strtotime((string) ($b['sortDate'] ?? '')) ?: 0;
        return $bTime <=> $aTime;
    });
    $orders = array_map(function (array $order): array {
        unset($order['sortDate']);
        return $order;
    }, $orders);

    jsonResponse(['orders' => $orders]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load customer orders. Please try again.'], 500);
}
