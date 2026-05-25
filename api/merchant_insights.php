<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireMerchantForInsights(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }
    return $user;
}

function moneyInsights(mixed $value): float {
    return round((float) ($value ?? 0), 2);
}

function insightsRangeStart(string $range): string {
    return match ($range) {
        'Last 7 Days' => date('Y-m-d 00:00:00', strtotime('-6 days')),
        'Last Month' => date('Y-m-01 00:00:00', strtotime('first day of last month')),
        default => date('Y-m-01 00:00:00'),
    };
}

function insightsRangeEnd(string $range): string {
    return $range === 'Last Month'
        ? date('Y-m-t 23:59:59', strtotime('last day of last month'))
        : date('Y-m-d 23:59:59');
}

function serviceGrossInsights(array $row): float {
    $info = json_decode((string) ($row['CUSTOMER_INFO'] ?? ''), true);
    if (is_array($info) && isset($info['lineSubtotal'])) {
        return moneyInsights($info['lineSubtotal']);
    }

    return moneyInsights($row['revenue'] ?? $row['TOTAL_PRICE'] ?? 0);
}

function merchantVoucherInsightDeductions(PDO $db, int $merchantId, string $start, string $end): array {
    $orderStmt = $db->prepare(
        "SELECT COALESCE(SUM(CAST(vu.DISCOUNT_AMT AS DECIMAL(12,2))), 0) AS amount
         FROM VOUCHER_USAGE vu
         INNER JOIN VOUCHER v ON v.VOUCHER_ID = vu.VOUCHER_ID
         INNER JOIN ORDERS ord ON ord.ORDER_ID = vu.ORDER_ID
         WHERE v.MERCHANT_ID = :merchant_id
           AND vu.ORDER_ID IS NOT NULL
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
           AND ord.ORDERED_ON BETWEEN :start_at AND :end_at"
    );
    $orderStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);

    $serviceStmt = $db->prepare(
        "SELECT vu.DISCOUNT_AMT, sr.CUSTOMER_INFO
         FROM VOUCHER_USAGE vu
         INNER JOIN VOUCHER v ON v.VOUCHER_ID = vu.VOUCHER_ID
         INNER JOIN SERVICE_REQUEST sr ON sr.REQUEST_ID = vu.REQUEST_ID
         WHERE v.MERCHANT_ID = :merchant_id
           AND vu.REQUEST_ID IS NOT NULL
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND sr.REQUEST_DATE BETWEEN :start_at AND :end_at"
    );
    $serviceStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);

    $serviceAmount = 0.0;
    foreach ($serviceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            $serviceAmount += moneyInsights($row['DISCOUNT_AMT'] ?? 0);
        }
    }

    return [
        'amount' => moneyInsights($orderStmt->fetchColumn() + $serviceAmount),
        'configured' => true,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireMerchantForInsights($db);
$merchantId = (int) $sessionUser['id'];
$range = trim((string) ($_GET['range'] ?? 'This Month'));
$start = insightsRangeStart($range);
$end = insightsRangeEnd($range);

try {
    $productStmt = $db->prepare(
        "SELECT ord.ORDER_ID AS id, ord.ORDERED_ON AS paid_on, ord.CUSTOMER_ID,
                COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS revenue,
                COALESCE(ord.DISCOUNT_AMT, 0) AS discount
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
           AND ord.ORDERED_ON BETWEEN :start_at AND :end_at
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.CUSTOMER_ID, ord.DISCOUNT_AMT"
    );
    $productStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    $productRows = $productStmt->fetchAll(PDO::FETCH_ASSOC);

    $serviceStmt = $db->prepare(
        "SELECT sr.REQUEST_ID AS id, sr.REQUEST_DATE AS paid_on, sr.TOTAL_PRICE AS revenue,
                sr.CUSTOMER_ID, sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND sr.REQUEST_DATE BETWEEN :start_at AND :end_at"
    );
    $serviceStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    $serviceRows = array_values(array_filter(
        $serviceStmt->fetchAll(PDO::FETCH_ASSOC),
        fn (array $row): bool => servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID
    ));
    $serviceRows = array_map(function (array $row): array {
        $row['revenue'] = serviceGrossInsights($row);
        return $row;
    }, $serviceRows);

    $allRows = array_merge($productRows, $serviceRows);
    $gross = moneyInsights(array_reduce(
        $allRows,
        fn ($sum, $row) => $sum + moneyInsights($row['revenue'] ?? 0),
        0.0
    ));
    $voucherDeductions = merchantVoucherInsightDeductions($db, $merchantId, $start, $end);
    $orderDiscounts = moneyInsights(array_reduce($productRows, fn ($sum, $row) => $sum + moneyInsights($row['discount'] ?? 0), 0.0));
    $discounts = moneyInsights(max(0, $orderDiscounts - $voucherDeductions['amount']));
    $refunds = 0.0;
    $platformFees = 0.0;
    $net = moneyInsights($gross - $discounts - $voucherDeductions['amount'] - $refunds - $platformFees);
    $uniqueCustomers = count(array_unique(array_map(fn ($row) => (int) ($row['CUSTOMER_ID'] ?? 0), $allRows)));

    $trend = [];
    foreach ($allRows as $row) {
        $bucket = date('M j', strtotime((string) ($row['paid_on'] ?? 'now')));
        if (!isset($trend[$bucket])) {
            $trend[$bucket] = ['label' => $bucket, 'gross' => 0.0, 'net' => 0.0, 'orders' => 0];
        }
        $amount = moneyInsights($row['revenue'] ?? 0);
        $trend[$bucket]['gross'] += $amount;
        $trend[$bucket]['net'] += $amount;
        $trend[$bucket]['orders']++;
    }

    $productPerformanceStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, 'Product' AS type,
                COALESCE(SUM(CASE WHEN UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED') AND UPPER(ord.PAYMENT_STATUS) = 'PAID' AND ord.ORDERED_ON BETWEEN :quantity_start_at AND :quantity_end_at THEN oi.QUANTITY ELSE 0 END), 0) AS quantity,
                COALESCE(SUM(CASE WHEN UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED') AND UPPER(ord.PAYMENT_STATUS) = 'PAID' AND ord.ORDERED_ON BETWEEN :revenue_start_at AND :revenue_end_at THEN oi.PRICE * oi.QUANTITY ELSE 0 END), 0) AS revenue
         FROM PRODUCT p
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         LEFT JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p.PROD_ID
         LEFT JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
         WHERE p.MERCHANT_ID = :merchant_id
         GROUP BY o.OFFERING_ID, o.OFFERING_NAME"
    );
    $productPerformanceStmt->execute([
        ':merchant_id' => $merchantId,
        ':quantity_start_at' => $start,
        ':quantity_end_at' => $end,
        ':revenue_start_at' => $start,
        ':revenue_end_at' => $end,
    ]);
    $performers = array_map(fn (array $row): array => [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'type' => $row['type'],
        'quantity' => (int) $row['quantity'],
        'gross' => moneyInsights($row['revenue']),
        'revenue' => moneyInsights($row['revenue']),
    ], $productPerformanceStmt->fetchAll(PDO::FETCH_ASSOC));

    $servicePerformanceStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, sr.TOTAL_PRICE, sr.CUSTOMER_INFO
         FROM SERVICE s
         INNER JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         LEFT JOIN SERVICE_REQUEST sr ON sr.SERVICE_ID = s.SERVICE_ID
            AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
            AND sr.REQUEST_DATE BETWEEN :start_at AND :end_at
         WHERE s.MERCHANT_ID = :merchant_id"
    );
    $servicePerformanceStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    $servicePerformance = [];
    foreach ($servicePerformanceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $id = (int) $row['id'];
        if (!isset($servicePerformance[$id])) {
            $servicePerformance[$id] = [
                'id' => $id,
                'name' => $row['name'],
                'type' => 'Service',
                'quantity' => 0,
                'gross' => 0.0,
                'revenue' => 0.0,
            ];
        }
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            $quantity = serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
            $amount = moneyInsights($row['TOTAL_PRICE'] ?? 0);
            $servicePerformance[$id]['quantity'] += $quantity;
            $servicePerformance[$id]['gross'] += $amount;
            $servicePerformance[$id]['revenue'] += $amount;
        }
    }
    $performers = array_merge($performers, array_values($servicePerformance));
    usort($performers, fn ($a, $b) => $b['revenue'] <=> $a['revenue'] ?: $b['quantity'] <=> $a['quantity']);

    $breakdown = array_map(function (array $row) use ($gross): array {
        $row['percent'] = $gross > 0 ? round(($row['gross'] / $gross) * 100, 1) : 0;
        return $row;
    }, array_values(array_filter($performers, fn (array $item): bool => $item['gross'] > 0 || $item['quantity'] > 0)));

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
        'range' => $range,
        'summary' => [
            'grossRevenue' => $gross,
            'netEarnings' => $net,
            'totalSales' => $gross,
            'orderCount' => count($allRows),
            'paidCompletedOrders' => count($allRows),
            'uniqueCustomerCount' => $uniqueCustomers,
        ],
        'trend' => array_values($trend),
        'performers' => [
            'top' => array_slice(array_values(array_filter($performers, fn ($item) => $item['revenue'] > 0)), 0, 5),
            'low' => array_slice(array_values(array_reverse($performers)), 0, 5),
            'breakdown' => $breakdown,
        ],
        'deductions' => [
            'discounts' => $discounts,
            'vouchers' => $voucherDeductions['amount'],
            'refunds' => $refunds,
            'platformFees' => $platformFees,
            'status' => [
                'vouchers' => $voucherDeductions['configured'] ? 'configured' : 'unavailable',
                'refunds' => 'not_configured',
                'platformFees' => 'not_configured',
            ],
            'note' => 'Voucher deductions come from voucher usage. Refunds and platform fees are not configured in the current schema.',
        ],
        'inventoryAlerts' => $alerts,
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant insights.'], 500);
}
