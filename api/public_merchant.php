<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function ensurePublicMerchantBannerColumn(PDO $db): void {
    $columns = $db->query("SHOW COLUMNS FROM MERCHANT")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('SHOP_BANNER_URL', $columns, true)) {
        $db->exec("ALTER TABLE MERCHANT ADD COLUMN SHOP_BANNER_URL tinytext DEFAULT NULL AFTER SHOP_DESC");
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

function formatPublicMerchantDate(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('F Y', $timestamp) : $value;
}

function activePublicOfferingSql(string $alias = 'o'): string {
    $prefix = $alias !== '' ? "{$alias}." : '';
    return "UPPER({$prefix}AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED')";
}

function completedPublicStatusSql(string $alias): string {
    return "UPPER({$alias}) IN ('COMPLETED', 'DELIVERED')";
}

function publicOfferingPayload(array $row): array {
    $images = [];
    if (!empty($row['images_json'])) {
        $decoded = json_decode('[' . $row['images_json'] . ']', true);
        $images = is_array($decoded)
            ? array_values(array_filter($decoded, fn ($image): bool => is_array($image) && !empty($image['url'])))
            : [];
    }

    return [
        'id' => (int) $row['id'],
        'type' => $row['type'] === 'P' ? 'product' : 'service',
        'name' => $row['name'],
        'description' => $row['description'] ?: '',
        'category' => $row['category'] ?: 'Uncategorized',
        'price' => (float) $row['price'],
        'stock' => $row['stock'] !== null ? (int) $row['stock'] : null,
        'rateType' => $row['rate'] ?: 'per project',
        'img' => $images[0]['url'] ?? '',
        'images' => $images,
        'rating' => $row['average_rating'] !== null ? round((float) $row['average_rating'], 1) : null,
        'reviewCount' => (int) ($row['review_count'] ?? 0),
        'sold' => (string) ((int) ($row['sold_count'] ?? 0)),
        'oldPrice' => (float) $row['price'],
        'discount' => '',
        'completed' => (string) ((int) ($row['sold_count'] ?? 0)),
    ];
}

function publicMerchantMetrics(PDO $db, int $merchantId): array {
    $ratingStmt = $db->prepare(
        "SELECT AVG(r.RATING) AS average_rating, COUNT(r.REVIEW_ID) AS review_count
         FROM REVIEW r
         INNER JOIN OFFERING o ON o.OFFERING_ID = r.OFFERING_ID
         WHERE o.MERCHANT_ID = :merchant_id"
    );
    $ratingStmt->execute([':merchant_id' => $merchantId]);
    $rating = $ratingStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $productSoldStmt = $db->prepare(
        "SELECT COALESCE(SUM(oi.QUANTITY), 0)
         FROM ORDER_ITEM oi
         INNER JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE p.MERCHANT_ID = :merchant_id
           AND " . completedPublicStatusSql('ord.ORDER_STATUS')
    );
    $productSoldStmt->execute([':merchant_id' => $merchantId]);
    $productSold = (int) $productSoldStmt->fetchColumn();

    $serviceSoldStmt = $db->prepare(
        "SELECT sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND " . completedPublicStatusSql('sr.REQ_STATUS')
    );
    $serviceSoldStmt->execute([':merchant_id' => $merchantId]);
    $serviceSold = 0;
    foreach ($serviceSoldStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $serviceSold += serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
    }

    return [
        'rating' => $rating['average_rating'] !== null ? round((float) $rating['average_rating'], 1) : null,
        'reviews' => (int) ($rating['review_count'] ?? 0),
        'sold' => $productSold + $serviceSold,
    ];
}

function publicMerchantProfile(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.USERNAME, u.AVATAR_URL, u.CREATED_ON,
                m.SHOP_NAME, m.SHOP_DESC, m.SHOP_BANNER_URL, m.ADDRESS
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

    $statsStmt = $db->prepare(
        "SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN OFFERING_TYPE = 'P' THEN 1 ELSE 0 END) AS products,
            SUM(CASE WHEN OFFERING_TYPE = 'S' THEN 1 ELSE 0 END) AS services
         FROM OFFERING
         WHERE MERCHANT_ID = :merchant_id AND " . activePublicOfferingSql('')
    );
    $statsStmt->execute([':merchant_id' => $merchantId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $metrics = publicMerchantMetrics($db, $merchantId);

    return [
        'id' => (int) $row['USER_ID'],
        'name' => $row['SHOP_NAME'] ?: trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')),
        'ownerName' => trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')),
        'username' => $row['USERNAME'],
        'bio' => $row['SHOP_DESC'] ?: 'This merchant has not added a shop description yet.',
        'address' => $row['ADDRESS'] ?: '',
        'avatar' => $row['AVATAR_URL'] ?: '',
        'bannerUrl' => $row['SHOP_BANNER_URL'] ?? '',
        'isVerified' => true,
        'rating' => $metrics['rating'],
        'reviews' => $metrics['reviews'],
        'sold' => (string) $metrics['sold'],
        'responseRate' => 'New',
        'responseTime' => 'Messages enabled',
        'joined' => formatPublicMerchantDate($row['CREATED_ON'] ?? null),
        'offeringCounts' => [
            'total' => (int) ($stats['total'] ?? 0),
            'products' => (int) ($stats['products'] ?? 0),
            'services' => (int) ($stats['services'] ?? 0),
        ],
    ];
}

function publicMerchantOfferings(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                COALESCE(o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC) AS description,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
                COALESCE(p.PRICE, s.PRICE) AS price,
                p.STOCK_QTY AS stock,
                s.DELIVERY_METHOD AS rate,
                AVG(r.RATING) AS average_rating,
                COUNT(DISTINCT r.REVIEW_ID) AS review_count,
                COALESCE(MAX(product_sales.sold_count), MAX(service_sales.sold_count), 0) AS sold_count,
                GROUP_CONCAT(DISTINCT
                    JSON_OBJECT(
                        'id', di.DISPLAY_IMG_ID,
                        'url', di.IMAGE_URL,
                        'isDefault', di.IS_DEFAULT
                    )
                    ORDER BY di.IS_DEFAULT DESC, di.DISPLAY_IMG_ID ASC
                    SEPARATOR ','
                ) AS images_json
         FROM OFFERING o
         LEFT JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
         LEFT JOIN PROD_SUBCAT ps ON ps.PRODSUBCAT_ID = p.PRODSUBCAT_ID
         LEFT JOIN PROD_CATEGORY pc ON pc.PRODCAT_ID = ps.PRODCAT_ID
         LEFT JOIN SERVICE s ON s.SERVICE_ID = o.OFFERING_ID
         LEFT JOIN SERVICE_SUBCAT ss ON ss.SERSUBCAT_ID = s.SERSUBCAT_ID
         LEFT JOIN SERVICE_CAT sc ON sc.SERCAT_ID = ss.SERCAT_ID
         LEFT JOIN DISPLAY_IMG di ON di.OFFERING_ID = o.OFFERING_ID
         LEFT JOIN REVIEW r ON r.OFFERING_ID = o.OFFERING_ID
         LEFT JOIN (
             SELECT p2.PROD_ID AS offering_id, COALESCE(SUM(oi.QUANTITY), 0) AS sold_count
             FROM PRODUCT p2
             INNER JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p2.PROD_ID
             INNER JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
             WHERE " . completedPublicStatusSql('ord.ORDER_STATUS') . "
             GROUP BY p2.PROD_ID
         ) product_sales ON product_sales.offering_id = o.OFFERING_ID
         LEFT JOIN (
             SELECT s2.SERVICE_ID AS offering_id, COUNT(sr.REQUEST_ID) AS sold_count
             FROM SERVICE s2
             INNER JOIN SERVICE_REQUEST sr ON sr.SERVICE_ID = s2.SERVICE_ID
             WHERE " . completedPublicStatusSql('sr.REQ_STATUS') . "
             GROUP BY s2.SERVICE_ID
         ) service_sales ON service_sales.offering_id = o.OFFERING_ID
         WHERE o.MERCHANT_ID = :merchant_id AND " . activePublicOfferingSql() . "
         GROUP BY o.OFFERING_ID, o.OFFERING_TYPE, o.OFFERING_NAME,
                  o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC,
                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY, s.DELIVERY_METHOD
         ORDER BY o.OFFERING_ID DESC"
    );
    $stmt->execute([':merchant_id' => $merchantId]);

    $offerings = array_map('publicOfferingPayload', $stmt->fetchAll(PDO::FETCH_ASSOC));
    return [
        'products' => array_values(array_filter($offerings, fn (array $item): bool => $item['type'] === 'product')),
        'services' => array_values(array_filter($offerings, fn (array $item): bool => $item['type'] === 'service')),
    ];
}

$merchantId = (int) ($_GET['id'] ?? 0);
if ($merchantId <= 0) {
    jsonResponse(['error' => 'Merchant is required.'], 422);
}

ensurePublicMerchantBannerColumn($db);

try {
    $offerings = publicMerchantOfferings($db, $merchantId);
    jsonResponse([
        'profile' => publicMerchantProfile($db, $merchantId),
        'products' => $offerings['products'],
        'services' => $offerings['services'],
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load merchant profile.'], 500);
}
