<?php

require_once(__DIR__ . '/config.php');

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

function publicOfferingPayload(array $row): array {
    $images = [];
    if (!empty($row['images_json'])) {
        $decoded = json_decode('[' . $row['images_json'] . ']', true);
        $images = is_array($decoded) ? $decoded : [];
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
        'rating' => 0,
        'sold' => '0',
        'oldPrice' => (float) $row['price'],
        'discount' => '',
        'completed' => '0',
    ];
}

function publicMerchantProfile(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT u.USER_ID, u.FNAME, u.LNAME, u.USERNAME, u.AVATAR_URL, u.CREATED_ON,
                m.SHOP_NAME, m.SHOP_DESC, m.ADDRESS
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
         WHERE MERCHANT_ID = :merchant_id AND AVAIL_STATUS = 'Active'"
    );
    $statsStmt->execute([':merchant_id' => $merchantId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'id' => (int) $row['USER_ID'],
        'name' => $row['SHOP_NAME'] ?: trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')),
        'ownerName' => trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')),
        'username' => $row['USERNAME'],
        'bio' => $row['SHOP_DESC'] ?: 'This merchant has not added a shop description yet.',
        'address' => $row['ADDRESS'] ?: '',
        'avatar' => $row['AVATAR_URL'] ?: '',
        'isVerified' => true,
        'rating' => 0,
        'reviews' => 0,
        'sold' => '0',
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
                GROUP_CONCAT(
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
         WHERE o.MERCHANT_ID = :merchant_id AND o.AVAIL_STATUS = 'Active'
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
