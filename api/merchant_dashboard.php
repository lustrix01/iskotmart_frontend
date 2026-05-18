<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireMerchantDashboardUser(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function merchantInitials(string $name): string {
    $words = preg_split('/\s+/', trim($name));
    $letters = '';
    foreach ($words as $word) {
        if ($word !== '') {
            $letters .= strtoupper(substr($word, 0, 1));
        }
        if (strlen($letters) >= 2) {
            break;
        }
    }

    return $letters ?: 'IM';
}

function moneyAmount(float|int $amount): string {
    return '₱' . number_format((float) $amount, 2);
}

function merchantProfile(PDO $db, array $user): array {
    $stmt = $db->prepare(
        "SELECT m.SHOP_NAME, m.SHOP_DESC, m.ADDRESS, m.BU_EMAIL, m.ID_IMAGE_URL,
                u.EMAIL, u.FNAME, u.LNAME
         FROM MERCHANT m
         JOIN USERS u ON u.USER_ID = m.MERCHANT_ID
         WHERE m.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([':merchant_id' => (int) $user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $shopName = $row['SHOP_NAME'] ?? ($user['name'] ?? 'Merchant Shop');

    return [
        'id' => (int) $user['id'],
        'shopName' => $shopName,
        'description' => $row['SHOP_DESC'] ?? '',
        'address' => $row['ADDRESS'] ?? '',
        'email' => $row['BU_EMAIL'] ?? ($row['EMAIL'] ?? ($user['email'] ?? '')),
        'avatarUrl' => $row['ID_IMAGE_URL'] ?? '',
        'initials' => merchantInitials($shopName),
    ];
}

function dashboardStats(PDO $db, int $merchantId): array {
    $productSalesStmt = $db->prepare(
        "SELECT COALESCE(SUM(CASE
                    WHEN UPPER(o.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
                     AND UPPER(o.PAYMENT_STATUS) = 'PAID'
                    THEN oi.PRICE * oi.QUANTITY
                    ELSE 0
                END), 0) AS total_sales,
                COUNT(DISTINCT CASE
                    WHEN UPPER(o.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
                     AND UPPER(o.PAYMENT_STATUS) = 'PAID'
                    THEN o.ORDER_ID
                END) AS total_orders,
                COUNT(DISTINCT CASE
                    WHEN UPPER(o.ORDER_STATUS) NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
                    THEN o.ORDER_ID
                END) AS pending_orders
         FROM ORDERS o
         JOIN ORDER_ITEM oi ON oi.ORDER_ID = o.ORDER_ID
         JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id"
    );
    $productSalesStmt->execute([':merchant_id' => $merchantId]);
    $productSales = $productSalesStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $serviceSalesStmt = $db->prepare(
        "SELECT sr.TOTAL_PRICE, sr.REQ_STATUS, sr.CUSTOMER_INFO,
                CASE
                    WHEN UPPER(sr.REQ_STATUS) NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
                    THEN sr.REQUEST_ID
                    ELSE NULL
                END AS active_request_id
         FROM SERVICE_REQUEST sr
         JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id"
    );
    $serviceSalesStmt->execute([':merchant_id' => $merchantId]);
    $serviceRows = $serviceSalesStmt->fetchAll(PDO::FETCH_ASSOC);
    $serviceSales = 0.0;
    $serviceOrders = 0;
    $serviceActiveOrders = [];
    foreach ($serviceRows as $row) {
        $status = strtoupper((string) ($row['REQ_STATUS'] ?? ''));
        if (in_array($status, ['COMPLETED', 'DELIVERED'], true) && servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            $serviceSales += (float) ($row['TOTAL_PRICE'] ?? 0);
            $serviceOrders++;
        }
        if ($row['active_request_id'] !== null) {
            $serviceActiveOrders[(int) $row['active_request_id']] = true;
        }
    }

    $catalogStmt = $db->prepare(
        "SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN UPPER(AVAIL_STATUS) = 'ACTIVE' THEN 1 END) AS active
         FROM OFFERING
         WHERE MERCHANT_ID = :merchant_id"
    );
    $catalogStmt->execute([':merchant_id' => $merchantId]);
    $catalog = $catalogStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $customerIds = [];
    $productCustomerStmt = $db->prepare(
        "SELECT DISTINCT o.CUSTOMER_ID
         FROM ORDERS o
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = o.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND o.CUSTOMER_ID IS NOT NULL"
    );
    $productCustomerStmt->execute([':merchant_id' => $merchantId]);
    foreach ($productCustomerStmt->fetchAll(PDO::FETCH_COLUMN) as $customerId) {
        $customerIds[(int) $customerId] = true;
    }

    $serviceCustomerStmt = $db->prepare(
        "SELECT DISTINCT sr.CUSTOMER_ID
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND sr.CUSTOMER_ID IS NOT NULL"
    );
    $serviceCustomerStmt->execute([':merchant_id' => $merchantId]);
    foreach ($serviceCustomerStmt->fetchAll(PDO::FETCH_COLUMN) as $customerId) {
        $customerIds[(int) $customerId] = true;
    }

    $totalSales = (float) ($productSales['total_sales'] ?? 0) + $serviceSales;
    $totalOrders = (int) ($productSales['total_orders'] ?? 0) + $serviceOrders;
    $activeOrders = (int) ($productSales['pending_orders'] ?? 0) + count($serviceActiveOrders);

    return [
        'totalSales' => $totalSales,
        'totalSalesFormatted' => moneyAmount($totalSales),
        'totalOrders' => $totalOrders,
        'pendingOrders' => $activeOrders,
        'activeOrders' => $activeOrders,
        'catalogItems' => (int) ($catalog['total'] ?? 0),
        'activeCatalogItems' => (int) ($catalog['active'] ?? 0),
        'customers' => count($customerIds),
    ];
}

function emptySalesBuckets(int $days): array {
    $buckets = [];
    for ($i = $days - 1; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-{$i} days"));
        $buckets[$date] = [
            'date' => $date,
            'label' => $days <= 7 ? date('D', strtotime($date)) : date('M j', strtotime($date)),
            'sales' => 0.0,
            'orders' => 0,
        ];
    }

    return $buckets;
}

function merchantSalesTrend(PDO $db, int $merchantId, int $days): array {
    $buckets = emptySalesBuckets($days);
    $start = array_key_first($buckets) . ' 00:00:00';
    $end = date('Y-m-d 23:59:59');

    $productStmt = $db->prepare(
        "SELECT DATE(o.ORDERED_ON) AS sale_date,
                COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS sales,
                COUNT(DISTINCT o.ORDER_ID) AS orders
         FROM ORDERS o
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = o.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(o.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(o.PAYMENT_STATUS) = 'PAID'
           AND o.ORDERED_ON BETWEEN :start_at AND :end_at
         GROUP BY DATE(o.ORDERED_ON)"
    );
    $productStmt->execute([
        ':merchant_id' => $merchantId,
        ':start_at' => $start,
        ':end_at' => $end,
    ]);
    foreach ($productStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $date = (string) ($row['sale_date'] ?? '');
        if (isset($buckets[$date])) {
            $buckets[$date]['sales'] += (float) ($row['sales'] ?? 0);
            $buckets[$date]['orders'] += (int) ($row['orders'] ?? 0);
        }
    }

    $serviceStmt = $db->prepare(
        "SELECT sr.REQUEST_DATE, sr.TOTAL_PRICE, sr.CUSTOMER_INFO
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
    foreach ($serviceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) !== PAYMENT_STATUS_PAID) {
            continue;
        }
        $date = date('Y-m-d', strtotime((string) ($row['REQUEST_DATE'] ?? 'now')));
        if (isset($buckets[$date])) {
            $buckets[$date]['sales'] += (float) ($row['TOTAL_PRICE'] ?? 0);
            $buckets[$date]['orders']++;
        }
    }

    return array_values(array_map(fn (array $bucket): array => [
        'date' => $bucket['date'],
        'label' => $bucket['label'],
        'sales' => round((float) $bucket['sales'], 2),
        'orders' => (int) $bucket['orders'],
    ], $buckets));
}

function recentMerchantActivity(PDO $db, int $merchantId): array {
    $productStmt = $db->prepare(
        "SELECT CONCAT('ORD-', o.ORDER_ID) AS id,
                o.ORDER_ID AS raw_id,
                'product' AS source,
                COALESCE(NULLIF(TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), ''), c.DISPLAY_NAME, o.RECIPIENT_NAME, 'Customer') AS account,
                GROUP_CONCAT(CONCAT(off.OFFERING_NAME, ' x', oi.QUANTITY) ORDER BY oi.ORDERITEM_ID SEPARATOR ', ') AS product,
                SUM(oi.PRICE * oi.QUANTITY) AS amount,
                o.ORDER_STATUS AS status,
                o.ORDERED_ON AS ordered_on
         FROM ORDERS o
         JOIN ORDER_ITEM oi ON oi.ORDER_ID = o.ORDER_ID
         JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         JOIN OFFERING off ON off.OFFERING_ID = p.PROD_ID
         LEFT JOIN USERS u ON u.USER_ID = o.CUSTOMER_ID
         LEFT JOIN CUSTOMER c ON c.CUSTOMER_ID = o.CUSTOMER_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND UPPER(o.ORDER_STATUS) NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
         GROUP BY o.ORDER_ID, o.ORDER_STATUS, o.ORDERED_ON, u.FNAME, u.LNAME, c.DISPLAY_NAME, o.RECIPIENT_NAME
         ORDER BY o.ORDERED_ON DESC
         LIMIT 50"
    );
    $productStmt->execute([':merchant_id' => $merchantId]);

    $serviceStmt = $db->prepare(
        "SELECT CONCAT('SRV-', sr.REQUEST_ID) AS id,
                sr.REQUEST_ID AS raw_id,
                'service' AS source,
                COALESCE(NULLIF(TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), ''), c.DISPLAY_NAME, sr.RECIPIENT_NAME, 'Customer') AS account,
                off.OFFERING_NAME AS product,
                COALESCE(sr.TOTAL_PRICE, s.PRICE, 0) AS amount,
                sr.REQ_STATUS AS status,
                sr.REQUEST_DATE AS ordered_on
         FROM SERVICE_REQUEST sr
         JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         JOIN OFFERING off ON off.OFFERING_ID = s.SERVICE_ID
         LEFT JOIN USERS u ON u.USER_ID = sr.CUSTOMER_ID
         LEFT JOIN CUSTOMER c ON c.CUSTOMER_ID = sr.CUSTOMER_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND UPPER(sr.REQ_STATUS) NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
         ORDER BY sr.REQUEST_DATE DESC
         LIMIT 50"
    );
    $serviceStmt->execute([':merchant_id' => $merchantId]);

    $rows = array_merge(
        $productStmt->fetchAll(PDO::FETCH_ASSOC),
        $serviceStmt->fetchAll(PDO::FETCH_ASSOC),
    );

    usort($rows, fn (array $a, array $b): int =>
        strtotime((string) ($b['ordered_on'] ?? '')) <=> strtotime((string) ($a['ordered_on'] ?? ''))
    );
    $rows = array_slice($rows, 0, 10);

    return array_map(function (array $row): array {
        return [
            'id' => $row['id'],
            'rawId' => (int) $row['raw_id'],
            'source' => $row['source'],
            'account' => $row['account'],
            'product' => $row['product'],
            'amount' => moneyAmount((float) $row['amount']),
            'status' => $row['status'],
            'date' => $row['ordered_on'] ? date('M d, Y', strtotime($row['ordered_on'])) : '',
        ];
    }, $rows);
}

function merchantInsights(PDO $db, int $merchantId): array {
    $topStmt = $db->prepare(
        "SELECT off.OFFERING_ID AS id, off.OFFERING_NAME AS name,
                COALESCE(SUM(oi.QUANTITY), 0) AS sold,
                COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS revenue
         FROM OFFERING off
         JOIN PRODUCT p ON p.PROD_ID = off.OFFERING_ID
         LEFT JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p.PROD_ID
         WHERE p.MERCHANT_ID = :merchant_id
         GROUP BY off.OFFERING_ID, off.OFFERING_NAME
         ORDER BY revenue DESC, sold DESC, off.OFFERING_ID DESC
         LIMIT 5"
    );
    $topStmt->execute([':merchant_id' => $merchantId]);
    $topProducts = array_map(function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'sold' => (int) $row['sold'],
            'revenue' => (float) $row['revenue'],
        ];
    }, $topStmt->fetchAll(PDO::FETCH_ASSOC));

    $lowStockStmt = $db->prepare(
        "SELECT off.OFFERING_ID AS id, off.OFFERING_NAME AS name, p.STOCK_QTY AS stock
         FROM PRODUCT p
         JOIN OFFERING off ON off.OFFERING_ID = p.PROD_ID
         WHERE p.MERCHANT_ID = :merchant_id AND p.STOCK_QTY <= 5
         ORDER BY p.STOCK_QTY ASC, off.OFFERING_NAME ASC"
    );
    $lowStockStmt->execute([':merchant_id' => $merchantId]);
    $lowStock = array_map(function (array $row): array {
        $stock = (int) $row['stock'];
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'stock' => $stock,
            'status' => $stock <= 0 ? 'Out of stock' : "Low stock - {$stock} remaining",
            'type' => $stock <= 0 ? 'error' : 'warning',
        ];
    }, $lowStockStmt->fetchAll(PDO::FETCH_ASSOC));

    return [
        'topProducts' => $topProducts,
        'lowStock' => $lowStock,
    ];
}

function fallbackDashboardStats(): array {
    return [
        'totalSales' => 0,
        'totalSalesFormatted' => moneyAmount(0),
        'totalOrders' => 0,
        'pendingOrders' => 0,
        'catalogItems' => 0,
        'activeCatalogItems' => 0,
        'customers' => 0,
    ];
}

function safeDashboardSection(callable $loader, mixed $fallback): mixed {
    try {
        return $loader();
    } catch (Throwable $e) {
        logApiError($e);
        return $fallback;
    }
}

try {
    $user = requireMerchantDashboardUser($db);
    $merchantId = (int) $user['id'];

    jsonResponse([
        'profile' => safeDashboardSection(fn () => merchantProfile($db, $user), [
            'id' => $merchantId,
            'shopName' => $user['name'] ?? 'Merchant Shop',
            'description' => '',
            'address' => '',
            'email' => $user['email'] ?? '',
            'avatarUrl' => '',
            'initials' => merchantInitials($user['name'] ?? 'Merchant Shop'),
        ]),
        'stats' => safeDashboardSection(fn () => dashboardStats($db, $merchantId), fallbackDashboardStats()),
        'salesTrend' => [
            'last7Days' => safeDashboardSection(fn () => merchantSalesTrend($db, $merchantId, 7), array_values(emptySalesBuckets(7))),
            'last30Days' => safeDashboardSection(fn () => merchantSalesTrend($db, $merchantId, 30), array_values(emptySalesBuckets(30))),
        ],
        'recentOrders' => safeDashboardSection(fn () => recentMerchantActivity($db, $merchantId), []),
        'insights' => safeDashboardSection(fn () => merchantInsights($db, $merchantId), [
            'topProducts' => [],
            'lowStock' => [],
        ]),
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant dashboard from database.'], 500);
}
