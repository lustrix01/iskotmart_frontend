<?php

require_once(__DIR__ . '/config.php');

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
    return 'PHP ' . number_format((float) $amount, 2);
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
        "SELECT COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS total_sales,
                COUNT(DISTINCT o.ORDER_ID) AS total_orders,
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
        "SELECT COALESCE(SUM(sr.TOTAL_PRICE), 0) AS total_sales,
                COUNT(sr.REQUEST_ID) AS total_orders,
                COUNT(CASE
                    WHEN UPPER(sr.REQ_STATUS) NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
                    THEN sr.REQUEST_ID
                END) AS pending_orders
         FROM SERVICE_REQUEST sr
         JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id"
    );
    $serviceSalesStmt->execute([':merchant_id' => $merchantId]);
    $serviceSales = $serviceSalesStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $catalogStmt = $db->prepare(
        "SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN UPPER(AVAIL_STATUS) = 'ACTIVE' THEN 1 END) AS active
         FROM OFFERING
         WHERE MERCHANT_ID = :merchant_id"
    );
    $catalogStmt->execute([':merchant_id' => $merchantId]);
    $catalog = $catalogStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $totalSales = (float) ($productSales['total_sales'] ?? 0) + (float) ($serviceSales['total_sales'] ?? 0);
    $totalOrders = (int) ($productSales['total_orders'] ?? 0) + (int) ($serviceSales['total_orders'] ?? 0);
    $pendingOrders = (int) ($productSales['pending_orders'] ?? 0) + (int) ($serviceSales['pending_orders'] ?? 0);

    return [
        'totalSales' => $totalSales,
        'totalSalesFormatted' => moneyAmount($totalSales),
        'totalOrders' => $totalOrders,
        'pendingOrders' => $pendingOrders,
        'catalogItems' => (int) ($catalog['total'] ?? 0),
        'activeCatalogItems' => (int) ($catalog['active'] ?? 0),
        'storeVisitors' => 0,
    ];
}

function recentMerchantActivity(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "(SELECT CONCAT('ORD-', o.ORDER_ID) AS id,
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
         GROUP BY o.ORDER_ID, o.ORDER_STATUS, o.ORDERED_ON, u.FNAME, u.LNAME, c.DISPLAY_NAME, o.RECIPIENT_NAME)
         UNION ALL
        (SELECT CONCAT('SRV-', sr.REQUEST_ID) AS id,
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
         WHERE s.MERCHANT_ID = :merchant_id)
         ORDER BY ordered_on DESC
         LIMIT 6"
    );
    $stmt->execute([':merchant_id' => $merchantId]);

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
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
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

try {
    $user = requireMerchantDashboardUser($db);
    $merchantId = (int) $user['id'];

    jsonResponse([
        'profile' => merchantProfile($db, $user),
        'stats' => dashboardStats($db, $merchantId),
        'recentOrders' => recentMerchantActivity($db, $merchantId),
        'insights' => merchantInsights($db, $merchantId),
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant dashboard from database.'], 500);
}
