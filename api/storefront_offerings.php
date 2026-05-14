<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $stmt = $db->query(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                o.AVAIL_STATUS AS status,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
                COALESCE(p.PRICE, s.PRICE) AS price,
                p.STOCK_QTY AS stock,
                s.DELIVERY_METHOD AS rate,
                u.USERNAME AS merchant_name,
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
         INNER JOIN USERS u ON u.USER_ID = o.MERCHANT_ID AND u.STATUS = 'ACTIVE'
         LEFT JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
         LEFT JOIN PROD_SUBCAT ps ON ps.PRODSUBCAT_ID = p.PRODSUBCAT_ID
         LEFT JOIN PROD_CATEGORY pc ON pc.PRODCAT_ID = ps.PRODCAT_ID
         LEFT JOIN SERVICE s ON s.SERVICE_ID = o.OFFERING_ID
         LEFT JOIN SERVICE_SUBCAT ss ON ss.SERSUBCAT_ID = s.SERSUBCAT_ID
         LEFT JOIN SERVICE_CAT sc ON sc.SERCAT_ID = ss.SERCAT_ID
         LEFT JOIN DISPLAY_IMG di ON di.OFFERING_ID = o.OFFERING_ID
         WHERE o.AVAIL_STATUS = 'Active'
         GROUP BY o.OFFERING_ID, o.OFFERING_TYPE, o.OFFERING_NAME, o.AVAIL_STATUS,
                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY, s.DELIVERY_METHOD, u.USERNAME
         ORDER BY o.OFFERING_ID DESC"
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $offerings = array_map(function (array $row): array {
        $images = [];
        if (!empty($row['images_json'])) {
            $decoded = json_decode('[' . $row['images_json'] . ']', true);
            $images = is_array($decoded) ? $decoded : [];
        }

        return [
            'id' => (int) $row['id'],
            'type' => $row['type'] === 'P' ? 'product' : 'service',
            'name' => $row['name'],
            'merchant' => $row['merchant_name'] ?: 'Merchant',
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
            'slots' => 0,
        ];
    }, $rows);

    jsonResponse(['offerings' => $offerings]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load storefront offerings.'], 500);
}

