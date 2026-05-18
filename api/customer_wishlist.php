<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForWishlist(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function ensureWishlistTable(PDO $db): void {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS CUSTOMER_WISHLIST (
            WISHLIST_ID int(11) NOT NULL AUTO_INCREMENT,
            CUSTOMER_ID int(11) NOT NULL,
            OFFERING_ID int(11) NOT NULL,
            ADDED_ON datetime(1) NOT NULL DEFAULT current_timestamp(1),
            PRIMARY KEY (WISHLIST_ID),
            UNIQUE KEY CUSTOMER_OFFERING_UNIQUE (CUSTOMER_ID, OFFERING_ID),
            KEY CUSTOMER_WISHLIST_OFFERING_idx (OFFERING_ID),
            CONSTRAINT FK_CUSTOMER_WISHLIST_CUSTOMER
                FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
                ON DELETE CASCADE ON UPDATE NO ACTION,
            CONSTRAINT FK_CUSTOMER_WISHLIST_OFFERING
                FOREIGN KEY (OFFERING_ID) REFERENCES OFFERING (OFFERING_ID)
                ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci"
    );
}

function wishlistItems(PDO $db, int $customerId): array {
    $stmt = $db->prepare(
        "SELECT cw.WISHLIST_ID AS wishlist_id, cw.ADDED_ON AS added_on,
                o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                COALESCE(o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC) AS description,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
                COALESCE(p.PRICE, s.PRICE) AS price,
                p.STOCK_QTY AS stock,
                s.DELIVERY_METHOD AS rate,
                o.MERCHANT_ID AS merchant_id,
                COALESCE(m.SHOP_NAME, u.USERNAME, 'Merchant') AS merchant_name,
                AVG(r.RATING) AS average_rating,
                COUNT(DISTINCT r.REVIEW_ID) AS review_count,
                GROUP_CONCAT(DISTINCT
                    JSON_OBJECT(
                        'id', di.DISPLAY_IMG_ID,
                        'url', di.IMAGE_URL,
                        'isDefault', di.IS_DEFAULT
                    )
                    ORDER BY di.IS_DEFAULT DESC, di.DISPLAY_IMG_ID ASC
                    SEPARATOR ','
                ) AS images_json
         FROM CUSTOMER_WISHLIST cw
         INNER JOIN OFFERING o ON o.OFFERING_ID = cw.OFFERING_ID
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
         WHERE cw.CUSTOMER_ID = :customer_id
         GROUP BY cw.WISHLIST_ID, cw.ADDED_ON, o.OFFERING_ID, o.OFFERING_TYPE,
                  o.OFFERING_NAME, o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC,
                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY,
                  s.DELIVERY_METHOD, o.MERCHANT_ID, m.SHOP_NAME, u.USERNAME
         ORDER BY cw.ADDED_ON DESC, cw.WISHLIST_ID DESC"
    );
    $stmt->execute([':customer_id' => $customerId]);

    return array_map(function (array $row): array {
        $images = [];
        if (!empty($row['images_json'])) {
            $decoded = json_decode('[' . $row['images_json'] . ']', true);
            $images = is_array($decoded) ? $decoded : [];
        }

        return [
            'wishlistId' => (int) $row['wishlist_id'],
            'id' => (int) $row['id'],
            'type' => $row['type'] === 'P' ? 'product' : 'service',
            'name' => $row['name'],
            'description' => $row['description'] ?: '',
            'merchantId' => (int) $row['merchant_id'],
            'merchant' => $row['merchant_name'] ?: 'Merchant',
            'category' => $row['category'] ?: 'Uncategorized',
            'price' => (float) $row['price'],
            'stock' => $row['stock'] !== null ? (int) $row['stock'] : null,
            'rateType' => $row['rate'] ?: 'per project',
            'img' => $images[0]['url'] ?? '',
            'images' => $images,
            'rating' => $row['average_rating'] !== null ? round((float) $row['average_rating'], 1) : null,
            'reviewCount' => (int) ($row['review_count'] ?? 0),
            'addedOn' => $row['added_on'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

$sessionUser = requireCustomerForWishlist($db);
$customerId = (int) $sessionUser['id'];

try {
    ensureWishlistTable($db);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $offeringId = (int) ($_GET['offeringId'] ?? 0);
        if ($offeringId > 0) {
            $stmt = $db->prepare(
                "SELECT 1 FROM CUSTOMER_WISHLIST
                 WHERE CUSTOMER_ID = :customer_id AND OFFERING_ID = :offering_id
                 LIMIT 1"
            );
            $stmt->execute([
                ':customer_id' => $customerId,
                ':offering_id' => $offeringId,
            ]);
            jsonResponse(['wishlisted' => (bool) $stmt->fetchColumn()]);
        }

        jsonResponse(['items' => wishlistItems($db, $customerId)]);
    }

    $data = jsonInput();
    $offeringId = (int) ($data['offeringId'] ?? 0);
    if ($offeringId <= 0) {
        jsonResponse(['error' => 'Offering is required.'], 422);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $stmt = $db->prepare(
            "INSERT IGNORE INTO CUSTOMER_WISHLIST (CUSTOMER_ID, OFFERING_ID)
             SELECT :customer_id, OFFERING_ID
             FROM OFFERING
             WHERE OFFERING_ID = :offering_id AND AVAIL_STATUS = 'Active'"
        );
        $stmt->execute([
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
        ]);

        $checkStmt = $db->prepare(
            "SELECT 1 FROM CUSTOMER_WISHLIST
             WHERE CUSTOMER_ID = :customer_id AND OFFERING_ID = :offering_id
             LIMIT 1"
        );
        $checkStmt->execute([
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
        ]);
        if (!$checkStmt->fetchColumn()) {
            jsonResponse(['error' => 'Offering not found.'], 404);
        }

        jsonResponse([
            'wishlisted' => true,
            'items' => wishlistItems($db, $customerId),
        ], 201);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $stmt = $db->prepare(
            "DELETE FROM CUSTOMER_WISHLIST
             WHERE CUSTOMER_ID = :customer_id AND OFFERING_ID = :offering_id"
        );
        $stmt->execute([
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
        ]);

        jsonResponse([
            'wishlisted' => false,
            'items' => wishlistItems($db, $customerId),
        ]);
    }
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to update wishlist. Please try again.'], 500);
}

jsonResponse(['error' => 'Method not allowed'], 405);
