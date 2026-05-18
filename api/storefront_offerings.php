<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

function storefrontDiscountedPrice(float $price, ?string $type, mixed $value): float {
    $discountValue = (float) ($value ?? 0);
    if ($discountValue <= 0 || $type === null) {
        return $price;
    }

    $discounted = strtolower($type) === 'percentage'
        ? $price - ($price * ($discountValue / 100))
        : $price - $discountValue;

    return round(max(0, $discounted), 2);
}

function storefrontDiscountLabel(?string $type, mixed $value): string {
    $discountValue = (float) ($value ?? 0);
    if ($discountValue <= 0 || $type === null) {
        return '';
    }

    return strtolower($type) === 'percentage'
        ? '-' . rtrim(rtrim(number_format($discountValue, 2), '0'), '.') . '%'
        : '-₱' . rtrim(rtrim(number_format($discountValue, 2), '0'), '.');
}

function ensureStorefrontDiscountStatusColumn(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }

    $checked = true;
    try {
        $stmt = $db->query("SHOW COLUMNS FROM DISCOUNT LIKE 'STATUS'");
        if (!$stmt || !$stmt->fetch(PDO::FETCH_ASSOC)) {
            $db->exec("ALTER TABLE DISCOUNT ADD STATUS varchar(45) NOT NULL DEFAULT 'ACTIVE'");
        }
    } catch (Throwable $e) {
        logApiError($e);
    }
}

try {
    ensureStorefrontDiscountStatusColumn($db);

    $stmt = $db->query(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                COALESCE(o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC) AS description,
                o.AVAIL_STATUS AS status,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
	                COALESCE(p.PRICE, s.PRICE) AS price,
	                p.STOCK_QTY AS stock,
	                s.SLOTS AS slots,
	                s.DELIVERY_METHOD AS rate,
                o.MERCHANT_ID AS merchant_id,
                COALESCE(m.SHOP_NAME, u.USERNAME) AS merchant_name,
                AVG(r.RATING) AS average_rating,
                COUNT(DISTINCT r.REVIEW_ID) AS review_count,
	                COALESCE(MAX(weekly_sales.quantity), 0) AS weekly_sold,
	                COALESCE(MAX(weekly_sales.revenue), 0) AS weekly_revenue,
	                COALESCE(MAX(service_completed.quantity), 0) AS service_completed,
	                discount.DISCOUNT_ID AS discount_id,
                discount.TYPE AS discount_type,
                discount.VALUE AS discount_value,
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
         INNER JOIN USERS u ON u.USER_ID = o.MERCHANT_ID AND u.STATUS = 'ACTIVE'
         LEFT JOIN MERCHANT m ON m.MERCHANT_ID = o.MERCHANT_ID
         LEFT JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
         LEFT JOIN PROD_SUBCAT ps ON ps.PRODSUBCAT_ID = p.PRODSUBCAT_ID
         LEFT JOIN PROD_CATEGORY pc ON pc.PRODCAT_ID = ps.PRODCAT_ID
         LEFT JOIN SERVICE s ON s.SERVICE_ID = o.OFFERING_ID
         LEFT JOIN SERVICE_SUBCAT ss ON ss.SERSUBCAT_ID = s.SERSUBCAT_ID
         LEFT JOIN SERVICE_CAT sc ON sc.SERCAT_ID = ss.SERCAT_ID
         LEFT JOIN DISPLAY_IMG di ON di.OFFERING_ID = o.OFFERING_ID
         LEFT JOIN REVIEW r ON r.OFFERING_ID = o.OFFERING_ID
	         LEFT JOIN (
	             SELECT p2.PROD_ID AS offering_id,
                    COALESCE(SUM(oi.QUANTITY), 0) AS quantity,
                    COALESCE(SUM(oi.PRICE * oi.QUANTITY), 0) AS revenue
             FROM PRODUCT p2
             INNER JOIN ORDER_ITEM oi ON oi.PRODUCT_ID = p2.PROD_ID
             INNER JOIN ORDERS ord ON ord.ORDER_ID = oi.ORDER_ID
             WHERE UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
               AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
               AND ord.ORDERED_ON >= DATE_SUB(NOW(), INTERVAL 7 DAY)
	             GROUP BY p2.PROD_ID
	         ) weekly_sales ON weekly_sales.offering_id = o.OFFERING_ID
	         LEFT JOIN (
	             SELECT sr.SERVICE_ID AS offering_id,
	                    COALESCE(SUM(
	                        CAST(
	                            CASE
	                                WHEN JSON_VALID(sr.CUSTOMER_INFO)
	                                THEN COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.CUSTOMER_INFO, '$.quantity')), ''), '1')
	                                ELSE '1'
	                            END AS UNSIGNED
	                        )
	                    ), 0) AS quantity
	             FROM SERVICE_REQUEST sr
	             WHERE UPPER(sr.REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
	             GROUP BY sr.SERVICE_ID
	         ) service_completed ON service_completed.offering_id = o.OFFERING_ID
         LEFT JOIN (
             SELECT d.*
             FROM DISCOUNT d
             INNER JOIN (
                 SELECT OFFERING_ID, MAX(DISCOUNT_ID) AS DISCOUNT_ID
                 FROM DISCOUNT
                 WHERE START_DATE <= NOW(1)
                   AND END_DATE >= NOW(1)
                   AND COALESCE(STATUS, 'ACTIVE') = 'ACTIVE'
                 GROUP BY OFFERING_ID
             ) latest_discount ON latest_discount.DISCOUNT_ID = d.DISCOUNT_ID
         ) discount ON discount.OFFERING_ID = o.OFFERING_ID
         WHERE UPPER(o.AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED')
         GROUP BY o.OFFERING_ID, o.OFFERING_TYPE, o.OFFERING_NAME, o.AVAIL_STATUS,
                  o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC,
	                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY, s.SLOTS, s.DELIVERY_METHOD,
                  o.MERCHANT_ID, m.SHOP_NAME, u.USERNAME,
                  discount.DISCOUNT_ID, discount.TYPE, discount.VALUE
         ORDER BY o.OFFERING_ID DESC"
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $offerings = array_map(function (array $row): array {
        $images = [];
        if (!empty($row['images_json'])) {
            $decoded = json_decode('[' . $row['images_json'] . ']', true);
            $images = is_array($decoded)
                ? array_values(array_filter($decoded, fn ($image): bool => is_array($image) && !empty($image['url'])))
                : [];
        }

        $originalPrice = (float) $row['price'];
        $discountedPrice = storefrontDiscountedPrice(
            $originalPrice,
            $row['discount_type'] ?? null,
            $row['discount_value'] ?? null
        );
        $discount = storefrontDiscountLabel($row['discount_type'] ?? null, $row['discount_value'] ?? null);

        return [
            'id' => (int) $row['id'],
            'type' => $row['type'] === 'P' ? 'product' : 'service',
            'name' => $row['name'],
            'description' => $row['description'] ?: '',
            'merchantId' => (int) $row['merchant_id'],
            'merchant' => $row['merchant_name'] ?: 'Merchant',
            'category' => $row['category'] ?: 'Uncategorized',
            'price' => $discount !== '' ? $discountedPrice : $originalPrice,
	            'stock' => $row['stock'] !== null ? (int) $row['stock'] : null,
	            'rateType' => $row['rate'] ?: 'per project',
            'img' => $images[0]['url'] ?? '',
            'images' => $images,
            'rating' => $row['average_rating'] !== null ? round((float) $row['average_rating'], 1) : null,
            'reviewCount' => (int) ($row['review_count'] ?? 0),
            'weeklySold' => (int) ($row['weekly_sold'] ?? 0),
            'weeklyRevenue' => round((float) ($row['weekly_revenue'] ?? 0), 2),
            'isOnSale' => $discount !== '',
            'sold' => (string) ((int) ($row['weekly_sold'] ?? 0)),
            'oldPrice' => $originalPrice,
            'discount' => $discount,
	            'completed' => (int) ($row['service_completed'] ?? 0),
	            'slots' => $row['slots'] !== null ? (int) $row['slots'] : 0,
        ];
    }, $rows);

    $products = array_values(array_filter($offerings, fn (array $item): bool => $item['type'] === 'product'));
    $services = array_values(array_filter($offerings, fn (array $item): bool => $item['type'] === 'service'));
    $weeklyProducts = array_values(array_filter($products, fn (array $item): bool => (int) ($item['weeklySold'] ?? 0) > 0));
    usort($weeklyProducts, fn (array $a, array $b): int =>
        ($b['weeklySold'] <=> $a['weeklySold'])
        ?: ($b['weeklyRevenue'] <=> $a['weeklyRevenue'])
        ?: (($b['reviewCount'] ?? 0) <=> ($a['reviewCount'] ?? 0))
        ?: ($b['id'] <=> $a['id'])
    );

    $featuredServices = array_values(array_filter($services, fn (array $item): bool => (int) ($item['completed'] ?? 0) > 0));
    usort($featuredServices, fn (array $a, array $b): int =>
        ($b['completed'] <=> $a['completed'])
        ?: (($b['reviewCount'] ?? 0) <=> ($a['reviewCount'] ?? 0))
        ?: (($b['rating'] ?? 0) <=> ($a['rating'] ?? 0))
        ?: ($b['id'] <=> $a['id'])
    );

    $onSaleProducts = array_values(array_filter($weeklyProducts, fn (array $item): bool => !empty($item['isOnSale'])));

    jsonResponse([
        'offerings' => $offerings,
        'featuredProducts' => array_slice($weeklyProducts, 0, 10),
        'featuredServices' => array_slice($featuredServices, 0, 10),
        'onSaleProducts' => array_slice($onSaleProducts, 0, 10),
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load storefront offerings.'], 500);
}
