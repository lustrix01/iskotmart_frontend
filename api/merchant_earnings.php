<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireMerchantForEarnings(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }
    return $user;
}

function moneyEarnings(mixed $value): float {
    return round((float) ($value ?? 0), 2);
}

function serviceGrossEarnings(array $row): float {
    $info = json_decode((string) ($row['CUSTOMER_INFO'] ?? ''), true);
    if (is_array($info) && isset($info['lineSubtotal'])) {
        return moneyEarnings($info['lineSubtotal']);
    }

    return moneyEarnings($row['revenue'] ?? 0);
}

function merchantVoucherDeductions(PDO $db, int $merchantId): array {
    $orderStmt = $db->prepare(
        "SELECT COALESCE(SUM(CAST(vu.DISCOUNT_AMT AS DECIMAL(12,2))), 0) AS amount
         FROM VOUCHER_USAGE vu
         INNER JOIN VOUCHER v ON v.VOUCHER_ID = vu.VOUCHER_ID
         INNER JOIN ORDERS ord ON ord.ORDER_ID = vu.ORDER_ID
         WHERE v.MERCHANT_ID = :merchant_id
           AND vu.ORDER_ID IS NOT NULL
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'"
    );
    $orderStmt->execute([':merchant_id' => $merchantId]);

    $serviceStmt = $db->prepare(
        "SELECT vu.DISCOUNT_AMT, sr.CUSTOMER_INFO
         FROM VOUCHER_USAGE vu
         INNER JOIN VOUCHER v ON v.VOUCHER_ID = vu.VOUCHER_ID
         INNER JOIN SERVICE_REQUEST sr ON sr.REQUEST_ID = vu.REQUEST_ID
         WHERE v.MERCHANT_ID = :merchant_id
           AND vu.REQUEST_ID IS NOT NULL
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')"
    );
    $serviceStmt->execute([':merchant_id' => $merchantId]);

    $serviceAmount = 0.0;
    foreach ($serviceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            $serviceAmount += moneyEarnings($row['DISCOUNT_AMT'] ?? 0);
        }
    }

    return [
        'amount' => moneyEarnings($orderStmt->fetchColumn() + $serviceAmount),
        'configured' => true,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireMerchantForEarnings($db);
$merchantId = (int) $sessionUser['id'];

try {
    $productStmt = $db->prepare(
        "SELECT ord.ORDER_ID AS id, ord.ORDERED_ON AS paid_on,
                COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS revenue,
                COALESCE(ord.DISCOUNT_AMT, 0) AS discount
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.DISCOUNT_AMT"
    );
    $productStmt->execute([':merchant_id' => $merchantId]);
    $productRows = $productStmt->fetchAll(PDO::FETCH_ASSOC);

    $serviceStmt = $db->prepare(
        "SELECT sr.REQUEST_ID AS id, sr.REQUEST_DATE AS paid_on, sr.TOTAL_PRICE AS revenue, sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')"
    );
    $serviceStmt->execute([':merchant_id' => $merchantId]);
    $serviceRows = array_values(array_filter(
        $serviceStmt->fetchAll(PDO::FETCH_ASSOC),
        fn (array $row): bool => servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID
    ));
    $serviceRows = array_map(function (array $row): array {
        $row['revenue'] = serviceGrossEarnings($row);
        return $row;
    }, $serviceRows);

    $gross = moneyEarnings(array_reduce(
        array_merge($productRows, $serviceRows),
        fn ($sum, $row) => $sum + moneyEarnings($row['revenue'] ?? 0),
        0.0
    ));
    $voucherDeductions = merchantVoucherDeductions($db, $merchantId);
    $orderDiscounts = moneyEarnings(array_reduce($productRows, fn ($sum, $row) => $sum + moneyEarnings($row['discount'] ?? 0), 0.0));
    $discounts = moneyEarnings(max(0, $orderDiscounts - $voucherDeductions['amount']));
    $refunds = 0.0;
    $platformFees = 0.0;
    $net = moneyEarnings($gross - $discounts - $voucherDeductions['amount'] - $refunds - $platformFees);

    $trend = [];
    foreach (array_merge($productRows, $serviceRows) as $row) {
        $bucket = date('M j', strtotime((string) ($row['paid_on'] ?? 'now')));
        if (!isset($trend[$bucket])) {
            $trend[$bucket] = ['label' => $bucket, 'gross' => 0.0, 'net' => 0.0];
        }
        $amount = moneyEarnings($row['revenue'] ?? 0);
        $trend[$bucket]['gross'] += $amount;
        $trend[$bucket]['net'] += $amount;
    }

    $productBreakdownStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, 'Product' AS type,
                COALESCE(SUM(oi.QUANTITY), 0) AS quantity,
                COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS gross
         FROM PRODUCT p
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         INNER JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p.PROD_ID
         INNER JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
         GROUP BY o.OFFERING_ID, o.OFFERING_NAME"
    );
    $productBreakdownStmt->execute([':merchant_id' => $merchantId]);
    $breakdown = array_map(fn (array $row): array => [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'type' => $row['type'],
        'quantity' => (int) $row['quantity'],
        'gross' => moneyEarnings($row['gross']),
        'discounts' => 0.0,
    ], $productBreakdownStmt->fetchAll(PDO::FETCH_ASSOC));

    $serviceBreakdownStmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_NAME AS name, sr.TOTAL_PRICE, sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         INNER JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')"
    );
    $serviceBreakdownStmt->execute([':merchant_id' => $merchantId]);
    foreach ($serviceBreakdownStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) !== PAYMENT_STATUS_PAID) {
            continue;
        }
        $id = (int) $row['id'];
        $index = array_search($id, array_column($breakdown, 'id'), true);
        if ($index === false) {
            $breakdown[] = [
                'id' => $id,
                'name' => $row['name'],
                'type' => 'Service',
                'quantity' => serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? '')),
                'gross' => moneyEarnings($row['TOTAL_PRICE'] ?? 0),
                'discounts' => 0.0,
            ];
            continue;
        }
        $breakdown[$index]['quantity'] += serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
        $breakdown[$index]['gross'] = moneyEarnings($breakdown[$index]['gross'] + moneyEarnings($row['TOTAL_PRICE'] ?? 0));
    }

    usort($breakdown, fn ($a, $b) => $b['gross'] <=> $a['gross']);
    $breakdown = array_map(function (array $row) use ($gross): array {
        $row['percent'] = $gross > 0 ? round(($row['gross'] / $gross) * 100, 1) : 0;
        return $row;
    }, $breakdown);

    jsonResponse([
        'summary' => [
            'grossRevenue' => $gross,
            'netEarnings' => $net,
            'paidCompletedOrders' => count($productRows) + count($serviceRows),
        ],
        'trend' => array_values($trend),
        'breakdown' => $breakdown,
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
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant earnings.'], 500);
}
