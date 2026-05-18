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

function integerField(string $name, int $min = 0): int {
    $value = $_POST[$name] ?? null;
    if ($value === null || !is_numeric($value) || (int) $value < $min || (float) $value !== (float) (int) $value) {
        jsonResponse(['error' => "{$name} must be a whole number."], 422);
    }

    return (int) $value;
}

function normalizeCategoryLabel(string $category): string {
    return strtolower(trim(preg_replace('/\s+/', ' ', $category)));
}

function ensureMerchantFulfillmentColumns(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    requireTableColumns($db, 'MERCHANT', [
        'ACCEPTS_COD',
        'ACCEPTS_GCASH',
        'ALLOW_MEETUP',
        'ALLOW_DELIVERY',
        'DELIVERY_FEE',
    ]);
}

function resolveProductSubcategoryId(PDO $db, string $category): int {
    $normalized = normalizeCategoryLabel($category);
    $aliases = [
        'food' => 'Eats',
        'food & drink' => 'Eats',
        'electronics' => 'Peripherals',
        'apparel' => 'Unisex Clothing',
        'fashion' => 'Unisex Clothing',
        'books' => 'Non-fiction',
        'school supplies' => 'Stationary',
        'stationery' => 'Stationary',
        'stationary' => 'Stationary',
        'dorm needs' => 'Household supplies',
    ];
    $target = $aliases[$normalized] ?? $category;

    $stmt = $db->prepare(
	     "SELECT ps.PRODSUBCAT_ID AS id
	      FROM PROD_SUBCAT ps
	      INNER JOIN PROD_CATEGORY pc ON pc.PRODCAT_ID = ps.PRODCAT_ID
	      WHERE LOWER(ps.SUBCAT_NAME) = LOWER(:target_subcat)
	         OR LOWER(pc.CAT_NAME) = LOWER(:target_cat)
	         OR LOWER(pc.CAT_NAME) LIKE LOWER(:like_target)
	      ORDER BY
	         CASE WHEN LOWER(ps.SUBCAT_NAME) = LOWER(:target_order) THEN 0 ELSE 1 END,
	         ps.PRODSUBCAT_ID ASC
	      LIMIT 1"
	 );
	 $stmt->execute([
	     ':target_subcat' => $target,
	     ':target_cat' => $target,
	     ':target_order' => $target,
	     ':like_target' => '%' . $target . '%',
	 ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        return (int) $row['id'];
    }

    jsonResponse(['error' => 'Selected product category is unavailable.'], 422);
}

function resolveServiceSubcategoryId(PDO $db, string $category): int {
    $label = trim($category) !== '' ? trim($category) : 'General Services';
    $aliases = [
        'creative' => ['Creative Services', 'Creative'],
        'academics' => ['Academics & Tutoring', 'Tutoring'],
        'tutoring' => ['Academics & Tutoring', 'Tutoring'],
        'tech support' => ['Tech Support', 'Technical Support'],
        'errands' => ['Errands & Tasks', 'Errands'],
    ];
    [$catName, $subcatName] = $aliases[normalizeCategoryLabel($label)] ?? [$label, $label];

    $stmt = $db->prepare(
	     "SELECT ss.SERSUBCAT_ID AS id
	      FROM SERVICE_SUBCAT ss
	      INNER JOIN SERVICE_CAT sc ON sc.SERCAT_ID = ss.SERCAT_ID
	      WHERE LOWER(ss.SUBCAT_NAME) = LOWER(:subcat_name_filter)
	         OR LOWER(sc.CAT_NAME) = LOWER(:cat_name)
	      ORDER BY
	         CASE WHEN LOWER(ss.SUBCAT_NAME) = LOWER(:subcat_name_order) THEN 0 ELSE 1 END,
	         ss.SERSUBCAT_ID ASC
	      LIMIT 1"
	 );
	 $stmt->execute([
	     ':subcat_name_filter' => $subcatName,
	     ':subcat_name_order' => $subcatName,
	     ':cat_name' => $catName,
	 ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return (int) $row['id'];
    }

    $catStmt = $db->prepare("SELECT SERCAT_ID FROM SERVICE_CAT WHERE LOWER(CAT_NAME) = LOWER(:name) LIMIT 1");
    $catStmt->execute([':name' => $catName]);
    $catId = (int) ($catStmt->fetchColumn() ?: 0);
    if ($catId <= 0) {
        $insertCat = $db->prepare("INSERT INTO SERVICE_CAT (CAT_NAME) VALUES (:name)");
        $insertCat->execute([':name' => $catName]);
        $catId = (int) $db->lastInsertId();
    }

    $insertSubcat = $db->prepare(
        "INSERT INTO SERVICE_SUBCAT (SUBCAT_NAME, SERCAT_ID)
         VALUES (:name, :cat_id)"
    );
    $insertSubcat->execute([
        ':name' => $subcatName,
        ':cat_id' => $catId,
    ]);

    return (int) $db->lastInsertId();
}

function resolveSubcategoryId(PDO $db, string $type, string $category): int {
    return $type === 'product'
        ? resolveProductSubcategoryId($db, $category)
        : resolveServiceSubcategoryId($db, $category);
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

function paymentMethodIdForKind(PDO $db, int $merchantId, string $kind): int {
    $labels = $kind === 'gcash'
        ? ['gcash']
        : ['cod', 'cash on delivery', 'cash', 'meetup'];

    $conditions = [];
    $params = [':merchant_id' => $merchantId];
    foreach ($labels as $index => $label) {
        $key = ':label_' . $index;
        $conditions[] = "LOWER(SERVICE) LIKE {$key}";
        $params[$key] = '%' . $label . '%';
    }

    $stmt = $db->prepare(
        "SELECT PM_ID
         FROM PAYMENT_METHOD
         WHERE MERCHANT_ID = :merchant_id
           AND (" . implode(' OR ', $conditions) . ")
         ORDER BY PM_ID ASC
         LIMIT 1"
    );
    $stmt->execute($params);
    $existingId = (int) ($stmt->fetchColumn() ?: 0);
    if ($existingId > 0) {
        return $existingId;
    }

    $insert = $db->prepare(
        "INSERT INTO PAYMENT_METHOD (SERVICE, LINK, QR_URL, NUMBER, USERNAME, OTHER, MERCHANT_ID)
         VALUES (:service, NULL, NULL, NULL, NULL, :other, :merchant_id)"
    );
    $insert->execute([
        ':service' => $kind === 'gcash' ? 'GCash' : 'COD / Cash on Delivery',
        ':other' => $kind === 'gcash'
            ? 'Merchant can provide GCash details through chat.'
            : 'Cash payment on delivery or meetup.',
        ':merchant_id' => $merchantId,
    ]);

    return (int) $db->lastInsertId();
}

function merchantFulfillmentSettings(PDO $db, int $merchantId): array {
    ensureMerchantFulfillmentColumns($db);

    $stmt = $db->prepare(
        "SELECT ACCEPTS_COD, ACCEPTS_GCASH, ALLOW_MEETUP, ALLOW_DELIVERY, DELIVERY_FEE
         FROM MERCHANT
         WHERE MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'acceptsCOD' => (bool) ($row['ACCEPTS_COD'] ?? 1),
        'acceptsGCash' => (bool) ($row['ACCEPTS_GCASH'] ?? 1),
        'allowMeetup' => (bool) ($row['ALLOW_MEETUP'] ?? 1),
        'allowDelivery' => (bool) ($row['ALLOW_DELIVERY'] ?? 1),
        'deliveryFee' => max(0, (float) ($row['DELIVERY_FEE'] ?? 50)),
    ];
}

function ensureOfferingPaymentDefaults(PDO $db, int $merchantId, int $offeringId): void {
    $settings = merchantFulfillmentSettings($db, $merchantId);
    foreach (['cod', 'gcash'] as $kind) {
        $paymentMethodId = paymentMethodIdForKind($db, $merchantId, $kind);
        if ($paymentMethodId <= 0) {
            continue;
        }
        $status = ($kind === 'gcash' ? $settings['acceptsGCash'] : $settings['acceptsCOD'])
            ? 'ACTIVE'
            : 'INACTIVE';

        $existing = $db->prepare(
            "SELECT ALLOWED_PM_ID
             FROM ALLOWED_PAYMENT
             WHERE OFFERING_ID = :offering_id AND PM_ID = :pm_id
             LIMIT 1"
        );
        $existing->execute([
            ':offering_id' => $offeringId,
            ':pm_id' => $paymentMethodId,
        ]);

        if ($existing->fetch(PDO::FETCH_ASSOC)) {
            $update = $db->prepare(
                "UPDATE ALLOWED_PAYMENT
                 SET STATUS = :status
                 WHERE OFFERING_ID = :offering_id AND PM_ID = :pm_id"
            );
            $update->execute([
                ':status' => $status,
                ':offering_id' => $offeringId,
                ':pm_id' => $paymentMethodId,
            ]);
            continue;
        }

        $insert = $db->prepare(
            "INSERT INTO ALLOWED_PAYMENT (STATUS, PM_ID, OFFERING_ID)
             VALUES (:status, :pm_id, :offering_id)"
        );
        $insert->execute([
            ':status' => $status,
            ':pm_id' => $paymentMethodId,
            ':offering_id' => $offeringId,
        ]);
    }
}

function ensureProductDeliveryDefaults(PDO $db, int $productId, float $deliveryFee = 50): void {
    $existing = $db->prepare("SELECT DM_NAME FROM DELIVERY_METHOD WHERE PROD_ID = :product_id");
    $existing->execute([':product_id' => $productId]);
    $names = array_map(
        fn ($name): string => strtolower((string) $name),
        $existing->fetchAll(PDO::FETCH_COLUMN)
    );

    $needsMeetup = !array_filter($names, fn ($name): bool => str_contains($name, 'meetup') || str_contains($name, 'pickup'));
    $needsDelivery = !array_filter($names, fn ($name): bool => str_contains($name, 'standard') || str_contains($name, 'delivery') || str_contains($name, 'ship'));
    if (!$needsMeetup && !$needsDelivery) {
        return;
    }

    $insert = $db->prepare(
        "INSERT INTO DELIVERY_METHOD (DM_NAME, DM_FEE, DM_PROVIDER, NOTE, PROD_ID)
         VALUES (:name, :fee, :provider, :note, :product_id)"
    );

    if ($needsMeetup) {
        $insert->execute([
            ':name' => 'Campus Meetup',
            ':fee' => 0,
            ':provider' => 'Meetup',
            ':note' => 'Default merchant fulfillment option',
            ':product_id' => $productId,
        ]);
    }

    if ($needsDelivery) {
        $insert->execute([
            ':name' => 'Standard Delivery',
            ':fee' => $deliveryFee,
            ':provider' => 'Campus Rider',
            ':note' => 'Default merchant fulfillment option',
            ':product_id' => $productId,
        ]);
    }
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
        'slots' => isset($row['slots']) ? (int) $row['slots'] : null,
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
                s.SLOTS AS slots,
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
                  pc.CAT_NAME, sc.CAT_NAME, p.PRICE, s.PRICE, p.STOCK_QTY, s.SLOTS, s.DELIVERY_METHOD
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
    $category = requireTextField('category');
    $price = integerField('price', 0);
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
            $stock = integerField('stock', 0);
            $subcatId = resolveSubcategoryId($db, $type, $category);
            $productStmt = $db->prepare(
                "INSERT INTO PRODUCT (PROD_ID, PRICE, PROD_DESC, STOCK_QTY, STATUS, MERCHANT_ID, PRODSUBCAT_ID)
                 VALUES (:id, :price, :description, :stock, :status, :merchant_id, :subcat_id)"
            );
            $productStmt->execute([
                ':id' => $offeringId,
                ':price' => $price,
                ':description' => $description !== '' ? $description : $name,
                ':stock' => $stock,
                ':status' => $status,
                ':merchant_id' => $merchantId,
                ':subcat_id' => $subcatId,
            ]);
        } else {
            $subcatId = resolveSubcategoryId($db, $type, $category);
            $rate = trim((string) ($_POST['rate'] ?? 'Per Project'));
            $slots = integerField('slots', 1);
            $serviceStmt = $db->prepare(
                "INSERT INTO SERVICE (SERVICE_ID, SER_DESC, PRICE, SLOTS, STATUS, DELIVERY_METHOD, POSTED_ON, MERCHANT_ID, SERSUBCAT_ID)
                 VALUES (:id, :description, :price, :slots, :status, :delivery_method, NOW(1), :merchant_id, :subcat_id)"
            );
            $serviceStmt->execute([
                ':id' => $offeringId,
                ':description' => $description !== '' ? $description : $name,
                ':price' => $price,
                ':slots' => $slots,
                ':status' => $status,
                ':delivery_method' => $rate,
                ':merchant_id' => $merchantId,
                ':subcat_id' => $subcatId,
            ]);
        }

        ensureOfferingPaymentDefaults($db, $merchantId, $offeringId);
        if ($type === 'product') {
            $settings = merchantFulfillmentSettings($db, $merchantId);
            ensureProductDeliveryDefaults($db, $offeringId, (float) $settings['deliveryFee']);
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
    $category = requireTextField('category');
    $price = integerField('price', 0);
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
            $stock = integerField('stock', 0);
            $subcatId = resolveSubcategoryId($db, $type, $category);
            $productStmt = $db->prepare(
                "UPDATE PRODUCT
                 SET PRICE = :price, PROD_DESC = :description, STOCK_QTY = :stock, STATUS = :status, PRODSUBCAT_ID = :subcat_id
                 WHERE PROD_ID = :id AND MERCHANT_ID = :merchant_id"
            );
            $productStmt->execute([
                ':price' => $price,
                ':description' => $description !== '' ? $description : $name,
                ':stock' => $stock,
                ':status' => $status,
                ':subcat_id' => $subcatId,
                ':id' => $offeringId,
                ':merchant_id' => $merchantId,
            ]);
        } else {
            $rate = trim((string) ($_POST['rate'] ?? 'Per Project'));
            $slots = integerField('slots', 1);
            $subcatId = resolveSubcategoryId($db, $type, $category);
            $serviceStmt = $db->prepare(
                "UPDATE SERVICE
                 SET PRICE = :price,
                     SER_DESC = :description,
                     SLOTS = :slots,
                     STATUS = :status,
                     DELIVERY_METHOD = :delivery_method,
                     SERSUBCAT_ID = :subcat_id
                 WHERE SERVICE_ID = :id AND MERCHANT_ID = :merchant_id"
            );
            $serviceStmt->execute([
                ':price' => $price,
                ':description' => $description !== '' ? $description : $name,
                ':slots' => $slots,
                ':status' => $status,
                ':delivery_method' => $rate,
                ':subcat_id' => $subcatId,
                ':id' => $offeringId,
                ':merchant_id' => $merchantId,
            ]);
        }

        ensureOfferingPaymentDefaults($db, $merchantId, $offeringId);
        if ($type === 'product') {
            $settings = merchantFulfillmentSettings($db, $merchantId);
            ensureProductDeliveryDefaults($db, $offeringId, (float) $settings['deliveryFee']);
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
