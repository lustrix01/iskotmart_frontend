<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');

function requireMerchantForShopMetrics(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }
    return $user;
}

function completedStatusSql(string $alias): string {
    return "UPPER({$alias}) IN ('COMPLETED', 'DELIVERED')";
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireMerchantForShopMetrics($db);
$merchantId = (int) $sessionUser['id'];

try {
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
           AND " . completedStatusSql('ord.ORDER_STATUS')
    );
    $productSoldStmt->execute([':merchant_id' => $merchantId]);
    $productSold = (int) $productSoldStmt->fetchColumn();

    $serviceSoldStmt = $db->prepare(
        "SELECT sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
           AND " . completedStatusSql('sr.REQ_STATUS')
    );
    $serviceSoldStmt->execute([':merchant_id' => $merchantId]);
    $serviceSold = 0;
    foreach ($serviceSoldStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $serviceSold += serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
    }

    $joinedStmt = $db->prepare(
        "SELECT CREATED_ON
         FROM USERS
         WHERE USER_ID = :merchant_id
         LIMIT 1"
    );
    $joinedStmt->execute([':merchant_id' => $merchantId]);
    $joined = (string) ($joinedStmt->fetchColumn() ?: '');

    jsonResponse([
        'metrics' => [
            'rating' => [
                'average' => $rating['average_rating'] !== null ? round((float) $rating['average_rating'], 1) : null,
                'count' => (int) ($rating['review_count'] ?? 0),
            ],
            'sold' => $productSold + $serviceSold,
            'joined' => $joined,
        ],
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to load shop metrics.'], 500);
}
