<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireMerchantForAnalytics(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }
    return $user;
}

function moneyAnalytics(mixed $value): float {
    return round((float) ($value ?? 0), 2);
}

function rangeStart(string $range): string {
    return match ($range) {
        'Last 7 Days' => date('Y-m-d 00:00:00', strtotime('-6 days')),
        'Last Month' => date('Y-m-01 00:00:00', strtotime('first day of last month')),
        default => date('Y-m-01 00:00:00'),
    };
}

function rangeEnd(string $range): string {
    return $range === 'Last Month'
        ? date('Y-m-t 23:59:59', strtotime('last day of last month'))
        : date('Y-m-d 23:59:59');
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireMerchantForAnalytics($db);
$merchantId = (int) $sessionUser['id'];
$range = trim((string) ($_GET['range'] ?? 'This Month'));
$start = rangeStart($range);
$end = rangeEnd($range);

try {
    $productRowsStmt = $db->prepare(
        "SELECT ord.ORDER_ID AS id, ord.ORDERED_ON AS paid_on, ord.TOTAL_AMOUNT AS revenue, ord.CUSTOMER_ID
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
           AND ord.ORDERED_ON BETWEEN :start_at AND :end_at
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.CUSTOMER_ID"
    );
    $productRowsStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    $productRows = $productRowsStmt->fetchAll(PDO::FETCH_ASSOC);

    $serviceRowsStmt = $db->prepare(
        "SELECT sr.REQUEST_ID AS id, sr.REQUEST_DATE AS paid_on, sr.TOTAL_PRICE AS revenue, sr.CUSTOMER_ID, sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND sr.REQUEST_DATE BETWEEN :start_at AND :end_at"
    );
    $serviceRowsStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    $serviceRows = array_values(array_filter(
        $serviceRowsStmt->fetchAll(PDO::FETCH_ASSOC),
        fn (array $row): bool => servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID
    ));

    $allRows = array_merge($productRows, $serviceRows);
    $totalSales = array_reduce($allRows, fn ($sum, $row) => $sum + moneyAnalytics($row['revenue'] ?? 0), 0.0);
    $uniqueCustomers = count(array_unique(array_map(fn ($row) => (int) $row['CUSTOMER_ID'], $allRows)));

    $trend = [];
    foreach ($allRows as $row) {
        $bucket = date('M j', strtotime((string) ($row['paid_on'] ?? 'now')));
        if (!isset($trend[$bucket])) {
            $trend[$bucket] = ['label' => $bucket, 'sales' => 0.0, 'orders' => 0];
        }
        $trend[$bucket]['sales'] += moneyAnalytics($row['revenue'] ?? 0);
        $trend[$bucket]['orders']++;
    }

    $topProductStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, 'Product' AS type,
                COALESCE(SUM(CASE WHEN UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED') AND UPPER(ord.PAYMENT_STATUS) = 'PAID' THEN oi.QUANTITY ELSE 0 END), 0) AS quantity,
                COALESCE(SUM(CASE WHEN UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED') AND UPPER(ord.PAYMENT_STATUS) = 'PAID' THEN oi.PRICE * oi.QUANTITY ELSE 0 END), 0) AS revenue
         FROM PRODUCT p
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         LEFT JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p.PROD_ID
         LEFT JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
         WHERE p.MERCHANT_ID = :merchant_id
         GROUP BY o.OFFERING_ID, o.OFFERING_NAME
         ORDER BY revenue DESC, quantity DESC, o.OFFERING_NAME ASC"
    );
    $topProductStmt->execute([':merchant_id' => $merchantId]);
    $performers = array_map(fn (array $row): array => [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'type' => $row['type'],
        'quantity' => (int) $row['quantity'],
        'revenue' => moneyAnalytics($row['revenue']),
    ], $topProductStmt->fetchAll(PDO::FETCH_ASSOC));

    $servicePerformanceStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, sr.TOTAL_PRICE, sr.CUSTOMER_INFO
         FROM SERVICE s
         INNER JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         LEFT JOIN SERVICE_REQUEST sr ON sr.SERVICE_ID = s.SERVICE_ID
            AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
         WHERE s.MERCHANT_ID = :merchant_id"
    );
    $servicePerformanceStmt->execute([':merchant_id' => $merchantId]);
    $servicePerformance = [];
    foreach ($servicePerformanceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $id = (int) $row['id'];
        if (!isset($servicePerformance[$id])) {
            $servicePerformance[$id] = [
                'id' => $id,
                'name' => $row['name'],
                'type' => 'Service',
                'quantity' => 0,
                'revenue' => 0.0,
            ];
        }
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            $servicePerformance[$id]['quantity'] += serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
            $servicePerformance[$id]['revenue'] += moneyAnalytics($row['TOTAL_PRICE'] ?? 0);
        }
    }
    $performers = array_merge($performers, array_values($servicePerformance));
    usort($performers, fn ($a, $b) => $b['revenue'] <=> $a['revenue'] ?: $b['quantity'] <=> $a['quantity']);

    $inventoryStmt = $db->prepare(
        "SELECT p.PROD_ID AS id, o.OFFERING_NAME AS name, p.STOCK_QTY AS stock
         FROM PRODUCT p
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         WHERE p.MERCHANT_ID = :merchant_id AND p.STOCK_QTY <= 5
         ORDER BY p.STOCK_QTY ASC, o.OFFERING_NAME ASC"
    );
    $inventoryStmt->execute([':merchant_id' => $merchantId]);
    $alerts = array_map(function (array $row): array {
        $stock = (int) $row['stock'];
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'stock' => $stock,
            'status' => $stock <= 0 ? 'Out of stock' : "Low stock - {$stock} remaining",
            'type' => $stock <= 0 ? 'error' : 'warning',
        ];
    }, $inventoryStmt->fetchAll(PDO::FETCH_ASSOC));

    jsonResponse([
        'summary' => [
            'totalSales' => moneyAnalytics($totalSales),
            'orderCount' => count($allRows),
            'uniqueCustomerCount' => $uniqueCustomers,
        ],
        'trend' => array_values($trend),
        'topPerformers' => array_slice(array_values(array_filter($performers, fn ($item) => $item['revenue'] > 0)), 0, 5),
        'lowPerformers' => array_slice(array_values(array_reverse($performers)), 0, 5),
        'inventoryAlerts' => $alerts,
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant analytics.'], 500);
}
