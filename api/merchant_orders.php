<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');
require_once(__DIR__ . '/order_inventory_helpers.php');

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
        "SELECT sr.REQUEST_ID, sr.REQUEST_DATE, sr.REQ_STATUS, sr.TOTAL_PRICE, sr.PHONE_NUM, sr.ADDRESS,
                sr.RECEIPT_NAME, sr.RECIPIENT_NAME, sr.CUSTOMER_INFO, u.EMAIL,
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
            'total' => $total,
            'method' => 'Service booking',
            'paymentStatus' => paymentStatusLabel($paymentStatus),
            'paymentStatusCode' => $paymentStatus,
            'paymentMethod' => $paymentMethod === 'gcash' ? 'GCash' : 'COD / Cash',
            'paymentReference' => (string) ($info['referenceNumber'] ?? ''),
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

    return array_map(function (array $order): array {
        unset($order['sortDate']);
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

$sessionUser = requireMerchantForOrders($db);
$merchantId = (int) $sessionUser['id'];
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    try {
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
$allowed = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];

if ($rawId <= 0) {
    jsonResponse(['error' => 'Invalid order status update.'], 422);
}

if ($action === 'mark_paid') {
    try {
        if ($source === 'service_request') {
            $request = serviceRequestPaymentStatus($db, $merchantId, $rawId);
            if (!$request) {
                jsonResponse(['error' => 'Service request not found for this merchant.'], 404);
            }

            $method = servicePaymentMethod((string) ($request['CUSTOMER_INFO'] ?? '')) ?: 'cod';
            $allowedPaymentId = resolveAllowedPaymentId($db, $merchantId, (int) $request['SERVICE_ID'], $method);
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

            $primaryOfferingId = orderPrimaryOffering($db, $rawId, $merchantId);
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

        jsonResponse([
            'ok' => true,
            'orders' => merchantOrderPayloads($db, $merchantId),
        ]);
    } catch (Throwable $e) {
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
        $stmt = $db->prepare(
            "UPDATE SERVICE_REQUEST
             SET REQ_STATUS = :status
             WHERE REQUEST_ID = :request_id"
        );
        $stmt->execute([
            ':status' => $dbStatus,
            ':request_id' => $rawId,
        ]);
        if ($dbStatus === 'CANCELLED') {
            restoreServiceRequestSlots($db, $rawId, serviceQuantityFromInfo((string) ($request['CUSTOMER_INFO'] ?? '')));
        }
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

        $db->beginTransaction();
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
            ':order_id' => $rawId,
        ]);
        if ($dbStatus === 'CANCELLED') {
            restoreProductOrderInventory($db, $rawId);
        }
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
