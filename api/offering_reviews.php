<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');
require_once(__DIR__ . '/review_helpers.php');

ensureReviewContextColumns($db);

const REVIEW_UPLOAD_DIR = __DIR__ . '/uploads/reviews';
const REVIEW_UPLOAD_URL = '/api/uploads/reviews';

function offeringReviewSummary(PDO $db, int $offeringId): array {
    $summaryStmt = $db->prepare(
        "SELECT AVG(RATING) AS average_rating, COUNT(REVIEW_ID) AS review_count
         FROM REVIEW
         WHERE OFFERING_ID = :offering_id"
    );
    $summaryStmt->execute([':offering_id' => $offeringId]);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $reviewsStmt = $db->prepare(
        "SELECT r.REVIEW_ID, r.RATING, r.DESCRIPTION, r.REVIEWED_ON,
                COALESCE(c.DISPLAY_NAME, TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), 'Customer') AS customer_name
         FROM REVIEW r
         INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = r.CUSTOMER_ID
         INNER JOIN USERS u ON u.USER_ID = c.CUSTOMER_ID
         WHERE r.OFFERING_ID = :offering_id
         ORDER BY r.REVIEWED_ON DESC, r.REVIEW_ID DESC
         LIMIT 20"
    );
    $reviewsStmt->execute([':offering_id' => $offeringId]);
    $reviews = $reviewsStmt->fetchAll(PDO::FETCH_ASSOC);
    $attachmentsByReview = reviewAttachmentsByReview($db, array_map(
        fn (array $row): int => (int) $row['REVIEW_ID'],
        $reviews
    ));

    return [
        'average' => $summary['average_rating'] !== null ? round((float) $summary['average_rating'], 1) : null,
        'count' => (int) ($summary['review_count'] ?? 0),
        'reviews' => array_map(fn (array $row): array => [
            'id' => (int) $row['REVIEW_ID'],
            'rating' => (int) $row['RATING'],
            'description' => (string) ($row['DESCRIPTION'] ?? ''),
            'reviewedOn' => (string) ($row['REVIEWED_ON'] ?? ''),
            'customerName' => $row['customer_name'] ?: 'Customer',
            'attachments' => $attachmentsByReview[(int) $row['REVIEW_ID']] ?? [],
        ], $reviews),
    ];
}

function reviewAttachmentsByReview(PDO $db, array $reviewIds): array {
    $reviewIds = array_values(array_unique(array_filter($reviewIds, fn (int $id): bool => $id > 0)));
    if (!$reviewIds) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($reviewIds), '?'));
    $stmt = $db->prepare(
        "SELECT ATTACH_ID, ATTACH_URL, FILE_TYPE, REVIEW_ID
         FROM REVIEW_ATTACH
         WHERE REVIEW_ID IN ({$placeholders})
         ORDER BY ATTACH_ID ASC"
    );
    $stmt->execute($reviewIds);

    $byReview = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $reviewId = (int) $row['REVIEW_ID'];
        $byReview[$reviewId][] = [
            'id' => (int) $row['ATTACH_ID'],
            'url' => (string) $row['ATTACH_URL'],
            'fileType' => (string) $row['FILE_TYPE'],
        ];
    }

    return $byReview;
}

function storeReviewImage(PDO $db, int $reviewId, string $dataUrl): void {
    $dataUrl = trim($dataUrl);
    if ($dataUrl === '') {
        return;
    }

    $image = verifiedImageDataUrlPayload($dataUrl, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 'Review', 5 * 1024 * 1024);

    if (!is_dir(REVIEW_UPLOAD_DIR) && !mkdir(REVIEW_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Unable to prepare review image storage.'], 500);
    }

    $fileName = sprintf('review-%d-%s.%s', $reviewId, bin2hex(random_bytes(8)), $image['extension']);
    $targetPath = REVIEW_UPLOAD_DIR . '/' . $fileName;
    if (file_put_contents($targetPath, $image['binary']) === false) {
        jsonResponse(['error' => 'Unable to store review image.'], 500);
    }

    $deleteStmt = $db->prepare("DELETE FROM REVIEW_ATTACH WHERE REVIEW_ID = :review_id");
    $deleteStmt->execute([':review_id' => $reviewId]);

    $insertStmt = $db->prepare(
        "INSERT INTO REVIEW_ATTACH (ATTACH_URL, FILE_TYPE, REVIEW_ID)
         VALUES (:attach_url, :file_type, :review_id)"
    );
    $insertStmt->execute([
        ':attach_url' => REVIEW_UPLOAD_URL . '/' . $fileName,
        ':file_type' => $image['mime'],
        ':review_id' => $reviewId,
    ]);
}

function requireCustomerForReview(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }
    return $user;
}

function reviewContextFromInput(array $data): array {
    $source = strtolower(trim((string) ($data['source'] ?? '')));
    $orderId = (int) ($data['orderId'] ?? 0);
    $requestId = (int) ($data['requestId'] ?? 0);

    if ($source === 'service' || $source === 'service_request') {
        return ['type' => 'service', 'orderId' => null, 'requestId' => $requestId];
    }

    return ['type' => 'product', 'orderId' => $orderId, 'requestId' => null];
}

function customerCanReviewContext(PDO $db, int $customerId, int $offeringId, array $context): bool {
    if (($context['type'] ?? '') === 'product') {
        $orderId = (int) ($context['orderId'] ?? 0);
        if ($orderId <= 0) {
            return false;
        }

        $productStmt = $db->prepare(
            "SELECT ord.ORDER_ID
             FROM ORDERS ord
             INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
             WHERE ord.ORDER_ID = :order_id
               AND ord.CUSTOMER_ID = :customer_id
               AND oi.PRODUCT_ID = :offering_id
               AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
               AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
             LIMIT 1"
        );
        $productStmt->execute([
            ':order_id' => $orderId,
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
        ]);
        return (bool) $productStmt->fetch(PDO::FETCH_ASSOC);
    }

    $requestId = (int) ($context['requestId'] ?? 0);
    if ($requestId <= 0) {
        return false;
    }

    $serviceStmt = $db->prepare(
        "SELECT CUSTOMER_INFO
         FROM SERVICE_REQUEST
         WHERE REQUEST_ID = :request_id
           AND CUSTOMER_ID = :customer_id
           AND SERVICE_ID = :offering_id
           AND UPPER(REQ_STATUS) IN ('COMPLETED', 'DELIVERED')
         LIMIT 1"
    );
    $serviceStmt->execute([
        ':request_id' => $requestId,
        ':customer_id' => $customerId,
        ':offering_id' => $offeringId,
    ]);
    $row = $serviceStmt->fetch(PDO::FETCH_ASSOC);
    return $row && servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID;
}

function customerCanReviewOffering(PDO $db, int $customerId, int $offeringId): bool {
    $productStmt = $db->prepare(
        "SELECT ord.ORDER_ID
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         WHERE ord.CUSTOMER_ID = :customer_id
           AND oi.PRODUCT_ID = :offering_id
           AND UPPER(ord.ORDER_STATUS) IN ('COMPLETED', 'DELIVERED')
           AND UPPER(ord.PAYMENT_STATUS) = 'PAID'
         LIMIT 1"
    );
    $productStmt->execute([
        ':customer_id' => $customerId,
        ':offering_id' => $offeringId,
    ]);
    if ($productStmt->fetch(PDO::FETCH_ASSOC)) {
        return true;
    }

    $serviceStmt = $db->prepare(
        "SELECT CUSTOMER_INFO
         FROM SERVICE_REQUEST
         WHERE CUSTOMER_ID = :customer_id
           AND SERVICE_ID = :offering_id
           AND UPPER(REQ_STATUS) IN ('COMPLETED', 'DELIVERED')"
    );
    $serviceStmt->execute([
        ':customer_id' => $customerId,
        ':offering_id' => $offeringId,
    ]);
    foreach ($serviceStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? '')) === PAYMENT_STATUS_PAID) {
            return true;
        }
    }

    return false;
}

function customerExistingReview(PDO $db, int $customerId, int $offeringId, ?array $context = null): ?array {
    if ($context && ($context['type'] ?? '') === 'product') {
        $stmt = $db->prepare(
            "SELECT REVIEW_ID, RATING, DESCRIPTION, REVIEWED_ON
             FROM REVIEW
             WHERE CUSTOMER_ID = :customer_id
               AND OFFERING_ID = :offering_id
               AND ORDER_ID = :order_id
             ORDER BY REVIEW_ID DESC
             LIMIT 1"
        );
        $stmt->execute([
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
            ':order_id' => (int) ($context['orderId'] ?? 0),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    if ($context && ($context['type'] ?? '') === 'service') {
        $stmt = $db->prepare(
            "SELECT REVIEW_ID, RATING, DESCRIPTION, REVIEWED_ON
             FROM REVIEW
             WHERE CUSTOMER_ID = :customer_id
               AND OFFERING_ID = :offering_id
               AND REQUEST_ID = :request_id
             ORDER BY REVIEW_ID DESC
             LIMIT 1"
        );
        $stmt->execute([
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
            ':request_id' => (int) ($context['requestId'] ?? 0),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    $stmt = $db->prepare(
        "SELECT REVIEW_ID, RATING, DESCRIPTION, REVIEWED_ON
         FROM REVIEW
         WHERE CUSTOMER_ID = :customer_id AND OFFERING_ID = :offering_id
         ORDER BY REVIEW_ID DESC
         LIMIT 1"
    );
    $stmt->execute([
        ':customer_id' => $customerId,
        ':offering_id' => $offeringId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    $offeringId = (int) ($_GET['offeringId'] ?? 0);
    if ($offeringId <= 0) {
        jsonResponse(['error' => 'Invalid offering.'], 422);
    }

    $payload = offeringReviewSummary($db, $offeringId);
    $user = currentUser($db);
    if ($user && ($user['role'] ?? '') === 'customer') {
        $existing = customerExistingReview($db, (int) $user['id'], $offeringId);
        $payload['myReview'] = $existing ? [
            'id' => (int) $existing['REVIEW_ID'],
            'rating' => (int) $existing['RATING'],
            'description' => (string) ($existing['DESCRIPTION'] ?? ''),
            'reviewedOn' => (string) ($existing['REVIEWED_ON'] ?? ''),
            'attachments' => reviewAttachmentsByReview($db, [(int) $existing['REVIEW_ID']])[(int) $existing['REVIEW_ID']] ?? [],
        ] : null;
        $payload['canReview'] = customerCanReviewOffering($db, (int) $user['id'], $offeringId);
    }

    jsonResponse($payload);
}

if ($method !== 'POST' && $method !== 'PATCH') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = requireCustomerForReview($db);
$customerId = (int) $user['id'];
$data = jsonInput();
$offeringId = (int) ($data['offeringId'] ?? 0);
$rating = (int) ($data['rating'] ?? 0);
$description = trim((string) ($data['description'] ?? ''));
$reviewImage = trim((string) ($data['reviewImage'] ?? ''));
$context = reviewContextFromInput($data);

if ($offeringId <= 0 || $rating < 1 || $rating > 5) {
    jsonResponse(['error' => 'Rating must be between 1 and 5.'], 422);
}
if (!customerCanReviewContext($db, $customerId, $offeringId, $context)) {
    jsonResponse(['error' => 'Only paid completed purchases can be rated.'], 403);
}

try {
    $existing = customerExistingReview($db, $customerId, $offeringId, $context);
    if ($existing) {
        $reviewId = (int) $existing['REVIEW_ID'];
        $stmt = $db->prepare(
            "UPDATE REVIEW
             SET RATING = :rating,
                 DESCRIPTION = :description,
                 REVIEWED_ON = NOW(1)
             WHERE REVIEW_ID = :review_id AND CUSTOMER_ID = :customer_id"
        );
        $stmt->execute([
            ':rating' => $rating,
            ':description' => $description !== '' ? $description : null,
            ':review_id' => $reviewId,
            ':customer_id' => $customerId,
        ]);
    } else {
        $stmt = $db->prepare(
            "INSERT INTO REVIEW (RATING, DESCRIPTION, CUSTOMER_ID, OFFERING_ID, ORDER_ID, REQUEST_ID)
             VALUES (:rating, :description, :customer_id, :offering_id, :order_id, :request_id)"
        );
        $stmt->execute([
            ':rating' => $rating,
            ':description' => $description !== '' ? $description : null,
            ':customer_id' => $customerId,
            ':offering_id' => $offeringId,
            ':order_id' => $context['orderId'],
            ':request_id' => $context['requestId'],
        ]);
        $reviewId = (int) $db->lastInsertId();
    }

    if ($reviewImage !== '') {
        storeReviewImage($db, $reviewId, $reviewImage);
    }

    jsonResponse(offeringReviewSummary($db, $offeringId));
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to save rating.'], 500);
}
