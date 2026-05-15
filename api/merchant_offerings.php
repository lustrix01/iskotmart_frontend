<?php

require_once(__DIR__ . '/config.php');

const OFFERING_UPLOAD_MAX_FILES = 5;
const OFFERING_UPLOAD_MAX_BYTES = 3145728;
const OFFERING_UPLOAD_DIR = __DIR__ . '/uploads/offerings';
const OFFERING_UPLOAD_URL = '/api/uploads/offerings';

function requireMerchant(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function normalizeOfferingType(string $type): string {
    $value = strtolower(trim($type));
    if (!in_array($value, ['product', 'service'], true)) {
        jsonResponse(['error' => 'Offering type must be product or service.'], 422);
    }

    return $value;
}

function normalizeOfferingStatus(string $status): string {
    $value = trim($status);
    $allowed = ['Active', 'Out of Stock', 'Hidden'];
    if (!in_array($value, $allowed, true)) {
        jsonResponse(['error' => 'Invalid offering status.'], 422);
    }

    return $value;
}

function requireTextField(string $name): string {
    $value = trim((string) ($_POST[$name] ?? ''));
    if ($value === '') {
        jsonResponse(['error' => "Missing required field: {$name}"], 422);
    }

    return $value;
}

function numericField(string $name, float $min = 0): float {
    $value = $_POST[$name] ?? null;
    if ($value === null || !is_numeric($value) || (float) $value < $min) {
        jsonResponse(['error' => "{$name} must be a valid number."], 422);
    }

    return (float) $value;
}

function firstSubcategoryId(PDO $db, string $type): int {
    $table = $type === 'product' ? 'PROD_SUBCAT' : 'SERVICE_SUBCAT';
    $column = $type === 'product' ? 'PRODSUBCAT_ID' : 'SERSUBCAT_ID';
    $stmt = $db->query("SELECT {$column} AS id FROM {$table} ORDER BY {$column} ASC LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        return (int) $row['id'];
    }

    if ($type === 'service') {
        $catStmt = $db->prepare("INSERT INTO SERVICE_CAT (CAT_NAME) VALUES (:name)");
        $catStmt->execute([':name' => 'General Services']);
        $catId = (int) $db->lastInsertId();

        $subcatStmt = $db->prepare(
            "INSERT INTO SERVICE_SUBCAT (SUBCAT_NAME, SERCAT_ID)
             VALUES (:name, :cat_id)"
        );
        $subcatStmt->execute([
            ':name' => 'General',
            ':cat_id' => $catId,
        ]);

        return (int) $db->lastInsertId();
    }

    jsonResponse(['error' => 'Catalog categories are unavailable. Please try again later.'], 500);
}

function ownedOffering(PDO $db, int $offeringId, int $merchantId): ?array {
    $stmt = $db->prepare(
        "SELECT OFFERING_ID, OFFERING_TYPE
         FROM OFFERING
         WHERE OFFERING_ID = :offering_id AND MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':offering_id' => $offeringId,
        ':merchant_id' => $merchantId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function offeringPayloadFromRow(array $row): array {
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
        'stock' => isset($row['stock']) ? (int) $row['stock'] : null,
        'rate' => $row['rate'] ?: null,
        'status' => $row['status'],
        'img' => $images[0]['url'] ?? '',
        'images' => $images,
    ];
}

function listOfferings(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                COALESCE(o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC) AS description,
                o.AVAIL_STATUS AS status,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
                COALESCE(p.PRICE, s.PRICE) AS price,
                p.STOCK_QTY AS stock,
                CASE
                    WHEN s.SERVICE_ID IS NOT NULL THEN s.DELIVERY_METHOD
                    ELSE NULL
                END AS rate,
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
         WHERE o.MERCHANT_ID = :merchant_id
         GROUP BY o.OFFERING_ID, o.OFFERING_TYPE, o.OFFERING_NAME, o.AVAIL_STATUS,
                  o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC,
                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY, s.DELIVERY_METHOD
         ORDER BY o.OFFERING_ID DESC"
    );
    $stmt->execute([':merchant_id' => $merchantId]);

    return array_map('offeringPayloadFromRow', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function uploadedFiles(): array {
    if (!isset($_FILES['images'])) {
        return [];
    }

    $files = $_FILES['images'];
    $normalized = [];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $normalized[] = [
            'name' => is_array($files['name']) ? $files['name'][$i] : $files['name'],
            'type' => is_array($files['type']) ? $files['type'][$i] : $files['type'],
            'tmp_name' => is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'],
            'error' => is_array($files['error']) ? $files['error'][$i] : $files['error'],
            'size' => is_array($files['size']) ? $files['size'][$i] : $files['size'],
        ];
    }

    return array_values(array_filter($normalized, fn ($file) => $file['error'] !== UPLOAD_ERR_NO_FILE));
}

function validateAndStoreUploads(array $files, int $offeringId): array {
    if (count($files) > OFFERING_UPLOAD_MAX_FILES) {
        jsonResponse(['error' => 'You can upload up to 5 images per offering.'], 422);
    }

    if (!is_dir(OFFERING_UPLOAD_DIR) && !mkdir(OFFERING_UPLOAD_DIR, 0775, true)) {
        jsonResponse(['error' => 'Upload directory is unavailable.'], 500);
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    $stored = [];
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    foreach ($files as $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'One or more images failed to upload.'], 422);
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            jsonResponse(['error' => 'Invalid upload source detected.'], 422);
        }

        if ($file['size'] <= 0 || $file['size'] > OFFERING_UPLOAD_MAX_BYTES) {
            jsonResponse(['error' => 'Each image must be 3 MB or smaller.'], 422);
        }

        $mime = $finfo->file($file['tmp_name']);
        if (!isset($allowed[$mime])) {
            jsonResponse(['error' => 'Images must be JPG, PNG, or WebP files.'], 422);
        }

        $extension = $allowed[$mime];
        $filename = sprintf(
            'offering-%d-%s.%s',
            $offeringId,
            bin2hex(random_bytes(12)),
            $extension
        );
        $target = OFFERING_UPLOAD_DIR . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            jsonResponse(['error' => 'Unable to store uploaded image.'], 500);
        }

        $stored[] = [
            'path' => $target,
            'url' => OFFERING_UPLOAD_URL . '/' . $filename,
        ];
    }

    return $stored;
}

function insertImages(PDO $db, int $offeringId, array $storedImages): void {
    if (!$storedImages) {
        return;
    }

    $existingStmt = $db->prepare("SELECT COUNT(*) FROM DISPLAY_IMG WHERE OFFERING_ID = :offering_id");
    $existingStmt->execute([':offering_id' => $offeringId]);
    $hasExisting = (int) $existingStmt->fetchColumn() > 0;

    $stmt = $db->prepare(
        "INSERT INTO DISPLAY_IMG (IMAGE_URL, IS_DEFAULT, OFFERING_ID)
         VALUES (:image_url, :is_default, :offering_id)"
    );

    foreach ($storedImages as $index => $image) {
        $stmt->execute([
            ':image_url' => $image['url'],
            ':is_default' => !$hasExisting && $index === 0 ? 1 : 0,
            ':offering_id' => $offeringId,
        ]);
    }
}

function deleteImages(PDO $db, int $offeringId, array $imageIds): void {
    if (!$imageIds) {
        return;
    }

    $ids = array_values(array_unique(array_filter(array_map('intval', $imageIds), fn ($id) => $id > 0)));
    if (!$ids) {
        return;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare(
        "SELECT DISPLAY_IMG_ID, IMAGE_URL
         FROM DISPLAY_IMG
         WHERE OFFERING_ID = ? AND DISPLAY_IMG_ID IN ({$placeholders})"
    );
    $stmt->execute(array_merge([$offeringId], $ids));
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $deleteStmt = $db->prepare(
        "DELETE FROM DISPLAY_IMG
         WHERE OFFERING_ID = ? AND DISPLAY_IMG_ID IN ({$placeholders})"
    );
    $deleteStmt->execute(array_merge([$offeringId], $ids));

    foreach ($images as $image) {
        $relative = str_replace(OFFERING_UPLOAD_URL, '', $image['IMAGE_URL']);
        $basename = basename($relative);
        $path = OFFERING_UPLOAD_DIR . '/' . $basename;
        if (is_file($path) && str_starts_with(realpath($path), realpath(OFFERING_UPLOAD_DIR))) {
            @unlink($path);
        }
    }
}

function deleteOfferingImages(PDO $db, int $offeringId): void {
    $stmt = $db->prepare(
        "SELECT DISPLAY_IMG_ID
         FROM DISPLAY_IMG
         WHERE OFFERING_ID = :offering_id"
    );
    $stmt->execute([':offering_id' => $offeringId]);
    $ids = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    deleteImages($db, $offeringId, $ids);
}

$sessionUser = requireMerchant($db);
$merchantId = (int) $sessionUser['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['offerings' => listOfferings($db, $merchantId)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !in_array(($_POST['_method'] ?? ''), ['PATCH', 'DELETE'], true)) {
    $type = normalizeOfferingType((string) ($_POST['type'] ?? ''));
    $name = requireTextField('name');
    $status = normalizeOfferingStatus((string) ($_POST['status'] ?? 'Active'));
    $description = trim((string) ($_POST['description'] ?? ''));
    $price = numericField('price', 0);
    $files = uploadedFiles();

    try {
        $db->beginTransaction();

        $stmt = $db->prepare(
            "INSERT INTO OFFERING (OFFERING_NAME, OFFERING_TYPE, AVAIL_STATUS, OFFERING_DESC, MERCHANT_ID)
             VALUES (:name, :type, :status, :description, :merchant_id)"
        );
        $stmt->execute([
            ':name' => $name,
            ':type' => $type === 'product' ? 'P' : 'S',
            ':status' => $status,
            ':description' => $description !== '' ? $description : null,
            ':merchant_id' => $merchantId,
        ]);
        $offeringId = (int) $db->lastInsertId();

        if ($type === 'product') {
            $stock = (int) numericField('stock', 0);
            $subcatId = firstSubcategoryId($db, 'product');
            $productStmt = $db->prepare(
                "INSERT INTO PRODUCT (PROD_ID, PRICE, PROD_DESC, STOCK_QTY, STATUS, MERCHANT_ID, PRODSUBCAT_ID)
                 VALUES (:id, :price, :description, :stock, :status, :merchant_id, :subcat_id)"
            );
            $productStmt->execute([
                ':id' => $offeringId,
                ':price' => (int) round($price),
                ':description' => $description !== '' ? $description : $name,
                ':stock' => $stock,
                ':status' => $status,
                ':merchant_id' => $merchantId,
                ':subcat_id' => $subcatId,
            ]);
        } else {
            $subcatId = firstSubcategoryId($db, 'service');
            $rate = trim((string) ($_POST['rate'] ?? 'Per Project'));
            $serviceStmt = $db->prepare(
                "INSERT INTO SERVICE (SERVICE_ID, SER_DESC, PRICE, SLOTS, STATUS, DELIVERY_METHOD, POSTED_ON, MERCHANT_ID, SERSUBCAT_ID)
                 VALUES (:id, :description, :price, :slots, :status, :delivery_method, NOW(1), :merchant_id, :subcat_id)"
            );
            $serviceStmt->execute([
                ':id' => $offeringId,
                ':description' => $description !== '' ? $description : $name,
                ':price' => (int) round($price),
                ':slots' => max(1, (int) ($_POST['slots'] ?? 1)),
                ':status' => $status,
                ':delivery_method' => $rate,
                ':merchant_id' => $merchantId,
                ':subcat_id' => $subcatId,
            ]);
        }

        $storedImages = validateAndStoreUploads($files, $offeringId);
        insertImages($db, $offeringId, $storedImages);

        $db->commit();
        jsonResponse(['offerings' => listOfferings($db, $merchantId)], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to save offering. Please try again.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['_method'] ?? '') === 'PATCH')) {
    $offeringId = (int) ($_POST['id'] ?? 0);
    if ($offeringId <= 0 || !ownedOffering($db, $offeringId, $merchantId)) {
        jsonResponse(['error' => 'Offering not found.'], 404);
    }

    $type = normalizeOfferingType((string) ($_POST['type'] ?? ''));
    $name = requireTextField('name');
    $status = normalizeOfferingStatus((string) ($_POST['status'] ?? 'Active'));
    $description = trim((string) ($_POST['description'] ?? ''));
    $price = numericField('price', 0);
    $removeIds = json_decode((string) ($_POST['removeImageIds'] ?? '[]'), true);
    $files = uploadedFiles();

    try {
        $db->beginTransaction();

        $stmt = $db->prepare(
            "UPDATE OFFERING
             SET OFFERING_NAME = :name,
                 AVAIL_STATUS = :status,
                 OFFERING_DESC = :description
             WHERE OFFERING_ID = :id AND MERCHANT_ID = :merchant_id"
        );
        $stmt->execute([
            ':name' => $name,
            ':status' => $status,
            ':description' => $description !== '' ? $description : null,
            ':id' => $offeringId,
            ':merchant_id' => $merchantId,
        ]);

        if ($type === 'product') {
            $stock = (int) numericField('stock', 0);
            $productStmt = $db->prepare(
                "UPDATE PRODUCT
                 SET PRICE = :price, PROD_DESC = :description, STOCK_QTY = :stock, STATUS = :status
                 WHERE PROD_ID = :id AND MERCHANT_ID = :merchant_id"
            );
            $productStmt->execute([
                ':price' => (int) round($price),
                ':description' => $description !== '' ? $description : $name,
                ':stock' => $stock,
                ':status' => $status,
                ':id' => $offeringId,
                ':merchant_id' => $merchantId,
            ]);
        } else {
            $rate = trim((string) ($_POST['rate'] ?? 'Per Project'));
            $serviceStmt = $db->prepare(
                "UPDATE SERVICE
                 SET PRICE = :price, SER_DESC = :description, STATUS = :status, DELIVERY_METHOD = :delivery_method
                 WHERE SERVICE_ID = :id AND MERCHANT_ID = :merchant_id"
            );
            $serviceStmt->execute([
                ':price' => (int) round($price),
                ':description' => $description !== '' ? $description : $name,
                ':status' => $status,
                ':delivery_method' => $rate,
                ':id' => $offeringId,
                ':merchant_id' => $merchantId,
            ]);
        }

        deleteImages($db, $offeringId, is_array($removeIds) ? $removeIds : []);
        $storedImages = validateAndStoreUploads($files, $offeringId);
        insertImages($db, $offeringId, $storedImages);

        $db->commit();
        jsonResponse(['offerings' => listOfferings($db, $merchantId)]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to update offering. Please try again.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['_method'] ?? '') === 'DELETE')) {
    $offeringId = (int) ($_POST['id'] ?? 0);
    $offering = $offeringId > 0 ? ownedOffering($db, $offeringId, $merchantId) : null;
    if (!$offering) {
        jsonResponse(['error' => 'Offering not found.'], 404);
    }

    try {
        $db->beginTransaction();

        deleteOfferingImages($db, $offeringId);

        $db->prepare("DELETE FROM ALLOWED_PAYMENT WHERE OFFERING_ID = :id")
            ->execute([':id' => $offeringId]);
        $db->prepare("DELETE FROM DISCOUNT WHERE OFFERING_ID = :id")
            ->execute([':id' => $offeringId]);

        if ($offering['OFFERING_TYPE'] === 'P') {
            $db->prepare("DELETE FROM PRODUCT WHERE PROD_ID = :id AND MERCHANT_ID = :merchant_id")
                ->execute([':id' => $offeringId, ':merchant_id' => $merchantId]);
        } else {
            $db->prepare("DELETE FROM SERVICE WHERE SERVICE_ID = :id AND MERCHANT_ID = :merchant_id")
                ->execute([':id' => $offeringId, ':merchant_id' => $merchantId]);
        }

        $db->prepare("DELETE FROM OFFERING WHERE OFFERING_ID = :id AND MERCHANT_ID = :merchant_id")
            ->execute([':id' => $offeringId, ':merchant_id' => $merchantId]);

        $db->commit();
        jsonResponse(['offerings' => listOfferings($db, $merchantId)]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to delete offering. Please try again.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
