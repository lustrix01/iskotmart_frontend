<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');
require_once(__DIR__ . '/order_inventory_helpers.php');
require_once(__DIR__ . '/order_activity_helpers.php');

function requireMerchantForOrders(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'merchant') {
        jsonResponse(['error' => 'Merchant account required'], 403);
    }

    return $user;
}

function moneyValue(int|float|null $value): float {
    return round((float) ($value ?? 0), 2);
}

function formatOrderDate(?string $value): string {
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('M j, Y', $timestamp) : $value;
}

function serviceRequirementsPayload(array $info, ?string $scheduledDate, ?string $note): array {
    return [
        'deadline' => formatOrderDate($scheduledDate),
        'package' => trim((string) ($info['package'] ?? $info['complexity'] ?? '')),
        'businessType' => trim((string) ($info['businessType'] ?? '')),
        'brief' => trim((string) ($info['brief'] ?? '')),
        'note' => trim((string) ($note ?? '')),
    ];
}

function mapDbStatusToUi(string $status): string {
    $normalized = strtoupper(trim($status));
    $map = [
        'PENDING' => 'Pending',
        'TO_CONFIRM' => 'Pending',
        'CONFIRMED' => 'Confirmed',
        'PROCESSING' => 'Confirmed',
        'TO_SHIP' => 'Confirmed',
        'SHIPPED' => 'Shipped',
        'IN_TRANSIT' => 'Shipped',
        'TO_RECEIVE' => 'Shipped',
        'COMPLETED' => 'Completed',
        'DELIVERED' => 'Completed',
        'CANCELLED' => 'Cancelled',
    ];

    return $map[$normalized] ?? 'Pending';
}

function mapUiStatusToDb(string $status): string {
    $map = [
        'Pending' => 'PENDING',
        'Confirmed' => 'CONFIRMED',
        'Shipped' => 'SHIPPED',
        'Completed' => 'COMPLETED',
        'Cancelled' => 'CANCELLED',
    ];

    return $map[$status] ?? '';
}

function productOrderRows(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS,
                ord.PAYMENT_STATUS, ord.RECIPIENT_NAME, ord.PHONE_NUM, ord.ADDRESS,
                COALESCE(dm.DM_NAME, 'Meet-up') AS method,
                (SELECT pm.SERVICE
                 FROM PAYMENT pay
                 INNER JOIN ALLOWED_PAYMENT ap ON ap.ALLOWED_PM_ID = pay.ALLOWED_PM_ID
                 INNER JOIN PAYMENT_METHOD pm ON pm.PM_ID = ap.PM_ID
                 WHERE pay.ORDER_ID = ord.ORDER_ID
                 ORDER BY pay.PAYMENT_ID DESC
                 LIMIT 1) AS payment_method,
	                (SELECT pay.REF_NUM
	                 FROM PAYMENT pay
	                 WHERE pay.ORDER_ID = ord.ORDER_ID
	                 ORDER BY pay.PAYMENT_ID DESC
	                 LIMIT 1) AS payment_reference,
	                (SELECT pay.PROOF_URL
	                 FROM PAYMENT pay
	                 WHERE pay.ORDER_ID = ord.ORDER_ID
	                 ORDER BY pay.PAYMENT_ID DESC
	                 LIMIT 1) AS payment_proof_url,
                u.FNAME, u.LNAME, u.EMAIL,
                GROUP_CONCAT(
                    CONCAT(o.OFFERING_NAME, '||', oi.QUANTITY, '||', oi.PRICE)
                    ORDER BY oi.ORDERITEM_ID
                    SEPARATOR '##'
                ) AS item_names
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         INNER JOIN OFFERING o ON o.OFFERING_ID = p.PROD_ID
         INNER JOIN USERS u ON u.USER_ID = ord.CUSTOMER_ID
         LEFT JOIN DELIVERY_METHOD dm ON dm.DM_ID = ord.DM_ID
         WHERE p.MERCHANT_ID = :merchant_id
         GROUP BY ord.ORDER_ID, ord.ORDERED_ON, ord.TOTAL_AMOUNT, ord.ORDER_STATUS,
                  ord.PAYMENT_STATUS, ord.RECIPIENT_NAME, ord.PHONE_NUM, ord.ADDRESS,
                  dm.DM_NAME, u.FNAME, u.LNAME, u.EMAIL
         ORDER BY ord.ORDERED_ON DESC, ord.ORDER_ID DESC
         LIMIT 100"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function serviceRequestRows(PDO $db, int $merchantId): array {
    $stmt = $db->prepare(
        "SELECT sr.REQUEST_ID, sr.REQUEST_DATE, sr.SCHEDULED_DATE, sr.REQ_STATUS, sr.TOTAL_PRICE, sr.PHONE_NUM, sr.ADDRESS,
		                sr.RECEIPT_NAME, sr.RECIPIENT_NAME, sr.CUSTOMER_INFO, sr.NOTE, u.EMAIL,
	                (SELECT pay.PROOF_URL
	                 FROM PAYMENT pay
	                 WHERE pay.REQUEST_ID = sr.REQUEST_ID
	                 ORDER BY pay.PAYMENT_ID DESC
	                 LIMIT 1) AS payment_proof_url,
                COALESCE(o.OFFERING_NAME, 'Service Request') AS service_name
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         INNER JOIN USERS u ON u.USER_ID = sr.CUSTOMER_ID
         LEFT JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         WHERE s.MERCHANT_ID = :merchant_id
         ORDER BY sr.REQUEST_DATE DESC, sr.REQUEST_ID DESC
         LIMIT 100"
    );
    $stmt->execute([':merchant_id' => $merchantId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function merchantOrderPayloads(PDO $db, int $merchantId): array {
    $productOrders = array_map(function (array $row): array {
        $customer = trim(($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? ''));
        $items = array_map(function (string $item): array {
            [$name, $qty, $price] = array_pad(explode('||', $item), 3, '');
	        return [
                'name' => trim($name) !== '' ? trim($name) : 'Order item',
                'qty' => max(1, (int) $qty),
                'price' => moneyValue($price),
            ];
        }, array_filter(explode('##', (string) ($row['item_names'] ?? ''))));

        $paymentStatus = canonicalPaymentStatus($row['PAYMENT_STATUS'] ?? null);
        return [
            'source' => 'order',
            'id' => 'ORD-' . (int) $row['ORDER_ID'],
            'rawId' => (int) $row['ORDER_ID'],
            'sortDate' => (string) ($row['ORDERED_ON'] ?? ''),
            'customer' => $row['RECIPIENT_NAME'] ?: $customer,
            'email' => $row['EMAIL'] ?: '',
            'items' => $items,
            'total' => moneyValue($row['TOTAL_AMOUNT'] ?? 0),
            'method' => $row['method'] ?: 'Meet-up',
            'paymentStatus' => paymentStatusLabel($paymentStatus),
            'paymentStatusCode' => $paymentStatus,
	            'paymentMethod' => $row['payment_method'] ?: ($paymentStatus === PAYMENT_STATUS_PENDING_REVIEW ? 'GCash' : 'COD / Cash'),
	            'paymentReference' => $row['payment_reference'] ?: '',
	            'paymentProofUrl' => $row['payment_proof_url'] ?: '',
            'status' => mapDbStatusToUi((string) ($row['ORDER_STATUS'] ?? '')),
            'date' => formatOrderDate($row['ORDERED_ON'] ?? null),
            'phone' => $row['PHONE_NUM'] ?: '',
            'address' => $row['ADDRESS'] ?: '',
        ];
    }, productOrderRows($db, $merchantId));

    $serviceOrders = array_map(function (array $row): array {
        $info = decodeServicePaymentInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
        $quantity = serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''));
        $total = moneyValue($row['TOTAL_PRICE'] ?? 0);
        $unitPrice = $quantity > 0 ? $total / $quantity : $total;
        $customerName = trim((string) ($row['RECIPIENT_NAME'] ?: $row['RECEIPT_NAME'] ?: 'Customer'));
        $paymentStatus = servicePaymentStatus((string) ($row['CUSTOMER_INFO'] ?? ''));
        $paymentMethod = servicePaymentMethod((string) ($row['CUSTOMER_INFO'] ?? ''));

        return [
            'source' => 'service_request',
            'id' => 'SRV-' . (int) $row['REQUEST_ID'],
            'rawId' => (int) $row['REQUEST_ID'],
            'sortDate' => (string) ($row['REQUEST_DATE'] ?? ''),
            'customer' => $customerName !== '' ? $customerName : 'Customer',
            'email' => $row['EMAIL'] ?: '',
	            'items' => [[
	                'name' => $row['service_name'] ?: 'Service Request',
	                'qty' => $quantity,
	                'price' => moneyValue($unitPrice),
	            ]],
	            'serviceRequirements' => serviceRequirementsPayload(
	                $info,
	                $row['SCHEDULED_DATE'] ?? null,
	                $row['NOTE'] ?? null
	            ),
	            'total' => $total,
            'method' => 'Service booking',
            'paymentStatus' => paymentStatusLabel($paymentStatus),
            'paymentStatusCode' => $paymentStatus,
	            'paymentMethod' => $paymentMethod === 'gcash' ? 'GCash' : 'COD / Cash',
	            'paymentReference' => (string) ($info['referenceNumber'] ?? ''),
	            'paymentProofUrl' => $row['payment_proof_url'] ?: '',
            'status' => mapDbStatusToUi((string) ($row['REQ_STATUS'] ?? '')),
            'date' => formatOrderDate($row['REQUEST_DATE'] ?? null),
            'phone' => $row['PHONE_NUM'] ?: '',
            'address' => $row['ADDRESS'] ?: '',
        ];
    }, serviceRequestRows($db, $merchantId));

    $orders = array_merge($productOrders, $serviceOrders);
    usort($orders, function (array $a, array $b): int {
        $aTime = strtotime((string) ($a['sortDate'] ?? '')) ?: 0;
        $bTime = strtotime((string) ($b['sortDate'] ?? '')) ?: 0;
        return $bTime <=> $aTime;
    });

    return array_map(function (array $order) use ($db): array {
        unset($order['sortDate']);
        $order['activityLog'] = activityRowsForSource($db, (string) $order['source'], (int) $order['rawId']);
        return $order;
    }, $orders);
}

function merchantOwnsProductOrder(PDO $db, int $merchantId, int $orderId): bool {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE ord.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);

    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

function productOrderPaymentStatus(PDO $db, int $merchantId, int $orderId): ?array {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_ID, ord.PAYMENT_STATUS, ord.TOTAL_AMOUNT
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE ord.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function merchantOwnsServiceRequest(PDO $db, int $merchantId, int $requestId): bool {
    $stmt = $db->prepare(
        "SELECT sr.REQUEST_ID
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE sr.REQUEST_ID = :request_id AND s.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':request_id' => $requestId,
        ':merchant_id' => $merchantId,
    ]);

    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

function serviceRequestPaymentStatus(PDO $db, int $merchantId, int $requestId): ?array {
    $stmt = $db->prepare(
        "SELECT sr.REQUEST_ID, sr.REQ_STATUS, sr.CUSTOMER_INFO, sr.TOTAL_PRICE, sr.SERVICE_ID
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         WHERE sr.REQUEST_ID = :request_id AND s.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':request_id' => $requestId,
        ':merchant_id' => $merchantId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function productOrderCurrentStatus(PDO $db, int $merchantId, int $orderId): ?string {
    $stmt = $db->prepare(
        "SELECT ord.ORDER_STATUS
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE ord.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);
    $status = $stmt->fetchColumn();
    return $status !== false ? strtoupper((string) $status) : null;
}

function productOrderRequiresShippingDetails(PDO $db, int $merchantId, int $orderId): bool {
    $stmt = $db->prepare(
        "SELECT ord.DELIVERY_STATUS, COALESCE(dm.DM_NAME, 'Meet-up') AS method
         FROM ORDERS ord
         INNER JOIN ORDER_ITEM oi ON oi.ORDER_ID = ord.ORDER_ID
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         LEFT JOIN DELIVERY_METHOD dm ON dm.DM_ID = ord.DM_ID
         WHERE ord.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return false;
    }

    $deliveryStatus = strtoupper(trim((string) ($row['DELIVERY_STATUS'] ?? '')));
    $method = strtolower(trim((string) ($row['method'] ?? '')));
    return $deliveryStatus === 'TO_SHIP' || ($method !== '' && $method !== 'meet-up');
}

function reserveProductOrderInventory(PDO $db, int $orderId): void {
    $stmt = $db->prepare(
        "SELECT PRODUCT_ID, QUANTITY
         FROM ORDER_ITEM
         WHERE ORDER_ID = :order_id"
    );
    $stmt->execute([':order_id' => $orderId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stockStmt = $db->prepare(
        "UPDATE PRODUCT
         SET STOCK_QTY = STOCK_QTY - :quantity
         WHERE PROD_ID = :product_id AND STOCK_QTY >= :quantity"
    );
    foreach ($items as $item) {
        $stockStmt->execute([
            ':quantity' => max(1, (int) ($item['QUANTITY'] ?? 1)),
            ':product_id' => (int) ($item['PRODUCT_ID'] ?? 0),
        ]);
        if ($stockStmt->rowCount() === 0) {
            throw new RuntimeException('Insufficient stock to undo cancellation.');
        }
    }
}

function reserveServiceRequestSlots(PDO $db, int $requestId, int $quantity): void {
    $stmt = $db->prepare(
        "UPDATE SERVICE s
         INNER JOIN SERVICE_REQUEST sr ON sr.SERVICE_ID = s.SERVICE_ID
         SET s.SLOTS = s.SLOTS - :quantity
         WHERE sr.REQUEST_ID = :request_id AND s.SLOTS >= :quantity"
    );
    $stmt->execute([
        ':quantity' => max(1, $quantity),
        ':request_id' => $requestId,
    ]);
    if ($stmt->rowCount() === 0) {
        throw new RuntimeException('Insufficient service slots to undo cancellation.');
    }
}

function applyProductOrderStatus(PDO $db, int $orderId, string $dbStatus): void {
    $stmt = $db->prepare(
        "UPDATE ORDERS
         SET ORDER_STATUS = :status,
             DELIVERY_STATUS = :delivery_status,
             RECEIVED_ON = CASE WHEN :completed = 1 THEN NOW(1) ELSE RECEIVED_ON END
         WHERE ORDER_ID = :order_id"
    );
    $stmt->execute([
        ':status' => $dbStatus,
        ':delivery_status' => $dbStatus === 'SHIPPED' ? 'IN_TRANSIT' : $dbStatus,
        ':completed' => $dbStatus === 'COMPLETED' ? 1 : 0,
        ':order_id' => $orderId,
    ]);
}

function applyServiceRequestStatus(PDO $db, int $requestId, string $dbStatus): void {
    $stmt = $db->prepare(
        "UPDATE SERVICE_REQUEST
         SET REQ_STATUS = :status
         WHERE REQUEST_ID = :request_id"
    );
    $stmt->execute([
        ':status' => $dbStatus,
        ':request_id' => $requestId,
    ]);
}

function undoMerchantOrderAction(PDO $db, int $merchantId, array $sessionUser, string $source, int $rawId, int $logId): void {
    if ($logId <= 0) {
        jsonResponse(['error' => 'Invalid undo request.'], 422);
    }

    $source = normalizeActivitySource($source);
    if ($source === 'service_request') {
        if (!merchantOwnsServiceRequest($db, $merchantId, $rawId)) {
            jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
        }
    } elseif (!merchantOwnsProductOrder($db, $merchantId, $rawId)) {
        jsonResponse(['error' => 'Order not found for this merchant.'], 404);
    }

    $latest = latestActivityRow($db, $source, $rawId);
    if (!$latest || (int) $latest['id'] !== $logId) {
        jsonResponse(['error' => 'Only the latest order activity can be undone.'], 409);
    }
    if (($latest['actorRole'] ?? '') !== 'merchant' || !in_array((string) $latest['eventType'], ['status_changed', 'payment_confirmed'], true)) {
        jsonResponse(['error' => 'This order activity cannot be undone.'], 409);
    }

    $db->beginTransaction();
    try {
        $items = activityItemsForSource($db, $source, $rawId);
        if ($latest['eventType'] === 'status_changed') {
            $targetStatus = mapUiStatusToDb((string) $latest['oldValue']);
            if ($targetStatus === '') {
                throw new RuntimeException('Invalid undo status target.');
            }

            if ($source === 'service_request') {
                $request = serviceRequestPaymentStatus($db, $merchantId, $rawId);
                $currentStatus = strtoupper((string) ($request['REQ_STATUS'] ?? ''));
                if ($targetStatus === 'COMPLETED' && (!$request || servicePaymentStatus((string) ($request['CUSTOMER_INFO'] ?? '')) !== PAYMENT_STATUS_PAID)) {
                    jsonResponse(['error' => 'Payment must be marked paid before completion.'], 409);
                }
                if ($currentStatus === 'CANCELLED' && $targetStatus !== 'CANCELLED') {
                    reserveServiceRequestSlots($db, $rawId, serviceQuantityFromInfo((string) ($request['CUSTOMER_INFO'] ?? '')));
                }
                if ($currentStatus !== 'CANCELLED' && $targetStatus === 'CANCELLED') {
                    restoreServiceRequestSlots($db, $rawId, serviceQuantityFromInfo((string) ($request['CUSTOMER_INFO'] ?? '')));
                }
                applyServiceRequestStatus($db, $rawId, $targetStatus);
            } else {
                $order = productOrderPaymentStatus($db, $merchantId, $rawId);
                $currentStatus = productOrderCurrentStatus($db, $merchantId, $rawId);
                if ($targetStatus === 'COMPLETED' && (!$order || canonicalPaymentStatus($order['PAYMENT_STATUS'] ?? null) !== PAYMENT_STATUS_PAID)) {
                    jsonResponse(['error' => 'Payment must be marked paid before completion.'], 409);
                }
                if ($currentStatus === 'CANCELLED' && $targetStatus !== 'CANCELLED') {
                    reserveProductOrderInventory($db, $rawId);
                }
                if ($currentStatus !== 'CANCELLED' && $targetStatus === 'CANCELLED') {
                    restoreProductOrderInventory($db, $rawId);
                }
                applyProductOrderStatus($db, $rawId, $targetStatus);
            }
        } else {
            $targetPayment = trim((string) $latest['oldValue']);
            if ($targetPayment === '') {
                throw new RuntimeException('Invalid undo payment target.');
            }

            if ($source === 'service_request') {
                $request = serviceRequestPaymentStatus($db, $merchantId, $rawId);
                if (!$request) {
                    jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
                }
                updateServicePaymentInfo($db, $rawId, $targetPayment, servicePaymentMethod((string) ($request['CUSTOMER_INFO'] ?? '')) ?: 'cod');
            } else {
                $stmt = $db->prepare(
                    "UPDATE ORDERS
                     SET PAYMENT_STATUS = :payment_status
                     WHERE ORDER_ID = :order_id"
                );
                $stmt->execute([
                    ':payment_status' => $targetPayment,
                    ':order_id' => $rawId,
                ]);
            }
        }

        insertOrderActivityLog(
            $db,
            $source,
            $rawId,
            'undo',
            (string) $latest['newValue'],
            (string) $latest['oldValue'],
            actorPayload($sessionUser),
            $items,
            'Merchant undid: ' . (string) $latest['summary'],
            $logId
        );
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
}

$sessionUser = requireMerchantForOrders($db);
$merchantId = (int) $sessionUser['id'];
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    try {
        ensurePaymentProofColumn($db);
        ensureOrderActivityLogTable($db);
        jsonResponse(['orders' => merchantOrderPayloads($db, $merchantId)]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to load merchant orders.'], 500);
    }
}

if ($method !== 'POST' && $method !== 'PATCH') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = jsonInput();
$source = strtolower(trim((string) ($data['source'] ?? '')));
$rawId = (int) ($data['rawId'] ?? ($data['orderId'] ?? 0));
$action = strtolower(trim((string) ($data['action'] ?? '')));
$status = trim((string) ($data['status'] ?? ''));
$shippingService = trim((string) ($data['shippingService'] ?? ''));
$shippingReference = trim((string) ($data['shippingReference'] ?? ''));
$allowed = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];

if ($rawId <= 0) {
    jsonResponse(['error' => 'Invalid order status update.'], 422);
}

try {
    ensureOrderActivityLogTable($db);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to prepare order activity log.'], 500);
}

if ($action === 'undo') {
    try {
        undoMerchantOrderAction($db, $merchantId, $sessionUser, $source, $rawId, (int) ($data['logId'] ?? 0));
        jsonResponse([
            'ok' => true,
            'orders' => merchantOrderPayloads($db, $merchantId),
        ]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to undo this order action.'], 500);
    }
}

if ($action === 'mark_paid') {
    try {
        $items = activityItemsForSource($db, $source, $rawId);
        $oldPaymentStatus = '';
        if ($source === 'service_request') {
            $request = serviceRequestPaymentStatus($db, $merchantId, $rawId);
            if (!$request) {
                jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
            }

            $oldPaymentStatus = servicePaymentStatus((string) ($request['CUSTOMER_INFO'] ?? ''));
            $method = servicePaymentMethod((string) ($request['CUSTOMER_INFO'] ?? '')) ?: 'cod';
            $allowedPaymentId = resolveAllowedPaymentId($db, $merchantId, (int) $request['SERVICE_ID'], $method);
            $db->beginTransaction();
            updateServicePaymentInfo($db, $rawId, PAYMENT_STATUS_PAID, $method);
            if ($allowedPaymentId !== null) {
                ensurePaymentRecord(
                    $db,
                    null,
                    $rawId,
                    $allowedPaymentId,
                    moneyValue($request['TOTAL_PRICE'] ?? 0),
                    strtoupper($method) . '-SRV-' . $rawId . '-' . date('YmdHis')
                );
            }
        } else {
            $order = productOrderPaymentStatus($db, $merchantId, $rawId);
            if (!$order) {
                jsonResponse(['error' => 'Order not found for this merchant.'], 404);
            }

            $oldPaymentStatus = canonicalPaymentStatus($order['PAYMENT_STATUS'] ?? null);
            $primaryOfferingId = orderPrimaryOffering($db, $rawId, $merchantId);
            $db->beginTransaction();
            if ($primaryOfferingId !== null) {
                $allowedPaymentId = resolveAllowedPaymentId($db, $merchantId, $primaryOfferingId, 'cod');
                if ($allowedPaymentId !== null) {
                    ensurePaymentRecord($db, $rawId, null, $allowedPaymentId, moneyValue($order['TOTAL_AMOUNT'] ?? 0), 'COD-ORD-' . $rawId . '-' . date('YmdHis'));
                }
            }

            $stmt = $db->prepare(
                "UPDATE ORDERS
                 SET PAYMENT_STATUS = :payment_status
                 WHERE ORDER_ID = :order_id"
            );
            $stmt->execute([
                ':payment_status' => PAYMENT_STATUS_PAID,
                ':order_id' => $rawId,
            ]);
        }
        insertOrderActivityLog(
            $db,
            $source,
            $rawId,
            'payment_confirmed',
            $oldPaymentStatus,
            PAYMENT_STATUS_PAID,
            actorPayload($sessionUser),
            $items,
            'Merchant confirmed payment.'
        );
        $db->commit();

        jsonResponse([
            'ok' => true,
            'orders' => merchantOrderPayloads($db, $merchantId),
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logApiError($e);
        jsonResponse(['error' => 'Unable to mark payment as paid.'], 500);
    }
}

if (!in_array($status, $allowed, true)) {
    jsonResponse(['error' => 'Invalid order status update.'], 422);
}

$dbStatus = mapUiStatusToDb($status);
if ($dbStatus === '') {
    jsonResponse(['error' => 'Invalid order status value.'], 422);
}

try {
    $items = activityItemsForSource($db, $source, $rawId);
    if ($source === 'service_request') {
        if (!merchantOwnsServiceRequest($db, $merchantId, $rawId)) {
            jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
        }
        $request = serviceRequestPaymentStatus($db, $merchantId, $rawId);
        if ($dbStatus === 'COMPLETED' && (!$request || servicePaymentStatus((string) ($request['CUSTOMER_INFO'] ?? '')) !== PAYMENT_STATUS_PAID)) {
            jsonResponse(['error' => 'Payment must be marked paid before completion.'], 409);
        }
        $currentStatus = strtoupper((string) ($request['REQ_STATUS'] ?? ''));
        if ($dbStatus === 'CANCELLED' && in_array($currentStatus, ['COMPLETED', 'DELIVERED', 'CANCELLED'], true)) {
            jsonResponse(['error' => 'Service request can no longer be cancelled.'], 409);
        }

        $db->beginTransaction();
        applyServiceRequestStatus($db, $rawId, $dbStatus);
        if ($dbStatus === 'CANCELLED') {
            restoreServiceRequestSlots($db, $rawId, serviceQuantityFromInfo((string) ($request['CUSTOMER_INFO'] ?? '')));
        }
        insertOrderActivityLog(
            $db,
            $source,
            $rawId,
            'status_changed',
            mapDbStatusToUi($currentStatus),
            $status,
            actorPayload($sessionUser),
            $items,
            'Merchant changed order status from ' . mapDbStatusToUi($currentStatus) . ' to ' . $status . '.'
        );
        $db->commit();
    } else {
        if (!merchantOwnsProductOrder($db, $merchantId, $rawId)) {
            jsonResponse(['error' => 'Order not found for this merchant.'], 404);
        }
        $order = productOrderPaymentStatus($db, $merchantId, $rawId);
        if ($dbStatus === 'COMPLETED' && (!$order || canonicalPaymentStatus($order['PAYMENT_STATUS'] ?? null) !== PAYMENT_STATUS_PAID)) {
            jsonResponse(['error' => 'Payment must be marked paid before completion.'], 409);
        }
        $currentStatus = productOrderCurrentStatus($db, $merchantId, $rawId);
        if ($dbStatus === 'CANCELLED' && in_array((string) $currentStatus, ['COMPLETED', 'DELIVERED', 'CANCELLED'], true)) {
            jsonResponse(['error' => 'Order can no longer be cancelled.'], 409);
        }

        if ($dbStatus === 'SHIPPED' && productOrderRequiresShippingDetails($db, $merchantId, $rawId)) {
            if ($shippingService === '' || $shippingReference === '') {
                jsonResponse(['error' => 'Shipping service and reference code are required before marking this order as shipped.'], 422);
            }
        }

        $db->beginTransaction();
        applyProductOrderStatus($db, $rawId, $dbStatus);
        if ($dbStatus === 'CANCELLED') {
            restoreProductOrderInventory($db, $rawId);
        }

        $summary = 'Merchant changed order status from ' . mapDbStatusToUi((string) $currentStatus) . ' to ' . $status . '.';
        if ($dbStatus === 'SHIPPED' && $shippingService !== '' && $shippingReference !== '') {
            $summary .= ' Shipping details: ' . $shippingService . ' (' . $shippingReference . ').';
        }

        insertOrderActivityLog(
            $db,
            $source,
            $rawId,
            'status_changed',
            mapDbStatusToUi((string) $currentStatus),
            $status,
            actorPayload($sessionUser),
            $items,
            $summary
        );
        $db->commit();
    }

    jsonResponse([
        'ok' => true,
        'orders' => merchantOrderPayloads($db, $merchantId),
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    logApiError($e);
    jsonResponse(['error' => 'Unable to update order status.'], 500);
}
