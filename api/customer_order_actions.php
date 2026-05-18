<?php

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/payment_helpers.php');
require_once(__DIR__ . '/order_inventory_helpers.php');

function requireCustomerForOrderActions(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function parseOrderReference(string $reference): array {
    $normalized = strtoupper(trim($reference));

    if (preg_match('/^ORD-(\d+)$/', $normalized, $matches)) {
        return ['type' => 'product', 'id' => (int) $matches[1]];
    }

    if (preg_match('/^SRV-(\d+)$/', $normalized, $matches)) {
        return ['type' => 'service', 'id' => (int) $matches[1]];
    }

    return ['type' => '', 'id' => 0];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$sessionUser = requireCustomerForOrderActions($db);
$customerId = (int) $sessionUser['id'];
$data = jsonInput();
$reference = trim((string) ($data['reference'] ?? ''));
$action = strtolower(trim((string) ($data['action'] ?? '')));

if (!in_array($action, ['cancel', 'confirm'], true)) {
    jsonResponse(['error' => 'Invalid action.'], 422);
}

$parsed = parseOrderReference($reference);
if ($parsed['id'] <= 0 || $parsed['type'] === '') {
    jsonResponse(['error' => 'Invalid order reference.'], 422);
}

try {
    if ($parsed['type'] === 'product') {
        $lookup = $db->prepare(
            "SELECT ORDER_ID, ORDER_STATUS, PAYMENT_STATUS
             FROM ORDERS
             WHERE ORDER_ID = :order_id AND CUSTOMER_ID = :customer_id
             LIMIT 1"
        );
        $lookup->execute([
            ':order_id' => $parsed['id'],
            ':customer_id' => $customerId,
        ]);
        $order = $lookup->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            jsonResponse(['error' => 'Order not found.'], 404);
        }

        $currentStatus = strtoupper((string) ($order['ORDER_STATUS'] ?? ''));
        if ($action === 'cancel') {
            if (!in_array($currentStatus, ['PENDING', 'TO_CONFIRM', 'CONFIRMED', 'PROCESSING', 'TO_SHIP'], true)) {
                jsonResponse(['error' => 'Order can no longer be cancelled.'], 409);
            }

            $db->beginTransaction();
            try {
                $stmt = $db->prepare(
                    "UPDATE ORDERS
                     SET ORDER_STATUS = 'CANCELLED',
                         DELIVERY_STATUS = 'CANCELLED'
                     WHERE ORDER_ID = :order_id AND CUSTOMER_ID = :customer_id"
                );
                $stmt->execute([
                    ':order_id' => $parsed['id'],
                    ':customer_id' => $customerId,
                ]);
                restoreProductOrderInventory($db, $parsed['id']);
                $db->commit();
            } catch (Throwable $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                throw $e;
            }
            jsonResponse(['ok' => true, 'status' => 'Cancelled']);
        }

        if (!in_array($currentStatus, ['SHIPPED', 'IN_TRANSIT', 'TO_RECEIVE'], true)) {
            jsonResponse(['error' => 'Order is not ready for confirmation.'], 409);
        }
        if (canonicalPaymentStatus($order['PAYMENT_STATUS'] ?? null) !== PAYMENT_STATUS_PAID) {
            jsonResponse(['error' => 'Payment must be marked paid before confirming receipt.'], 409);
        }

        $stmt = $db->prepare(
            "UPDATE ORDERS
             SET ORDER_STATUS = 'COMPLETED',
                 DELIVERY_STATUS = 'DELIVERED',
                 RECEIVED_ON = NOW(1)
             WHERE ORDER_ID = :order_id AND CUSTOMER_ID = :customer_id"
        );
        $stmt->execute([
            ':order_id' => $parsed['id'],
            ':customer_id' => $customerId,
        ]);
        jsonResponse(['ok' => true, 'status' => 'Completed']);
    }

    $lookup = $db->prepare(
        "SELECT REQUEST_ID, REQ_STATUS, CUSTOMER_INFO
         FROM SERVICE_REQUEST
         WHERE REQUEST_ID = :request_id AND CUSTOMER_ID = :customer_id
         LIMIT 1"
    );
    $lookup->execute([
        ':request_id' => $parsed['id'],
        ':customer_id' => $customerId,
    ]);
    $request = $lookup->fetch(PDO::FETCH_ASSOC);
    if (!$request) {
        jsonResponse(['error' => 'Service request not found.'], 404);
    }

    $currentStatus = strtoupper((string) ($request['REQ_STATUS'] ?? ''));
    if ($action === 'cancel') {
        if (!in_array($currentStatus, ['PENDING', 'TO_CONFIRM', 'CONFIRMED', 'PROCESSING', 'TO_SHIP'], true)) {
            jsonResponse(['error' => 'Service request can no longer be cancelled.'], 409);
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare(
                "UPDATE SERVICE_REQUEST
                 SET REQ_STATUS = 'CANCELLED'
                 WHERE REQUEST_ID = :request_id AND CUSTOMER_ID = :customer_id"
            );
            $stmt->execute([
                ':request_id' => $parsed['id'],
                ':customer_id' => $customerId,
            ]);
            restoreServiceRequestSlots($db, $parsed['id'], serviceQuantityFromInfo((string) ($request['CUSTOMER_INFO'] ?? '')));
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
        jsonResponse(['ok' => true, 'status' => 'Cancelled']);
    }

    if (!in_array($currentStatus, ['SHIPPED', 'IN_TRANSIT', 'TO_RECEIVE'], true)) {
        jsonResponse(['error' => 'Service request is not ready for confirmation.'], 409);
    }
    if (servicePaymentStatus((string) ($request['CUSTOMER_INFO'] ?? '')) !== PAYMENT_STATUS_PAID) {
        jsonResponse(['error' => 'Payment must be marked paid before confirming receipt.'], 409);
    }

    $stmt = $db->prepare(
        "UPDATE SERVICE_REQUEST
         SET REQ_STATUS = 'COMPLETED'
         WHERE REQUEST_ID = :request_id AND CUSTOMER_ID = :customer_id"
    );
    $stmt->execute([
        ':request_id' => $parsed['id'],
        ':customer_id' => $customerId,
    ]);
    jsonResponse(['ok' => true, 'status' => 'Completed']);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    logApiError($e);
    jsonResponse(['error' => 'Unable to update order status. Please try again.'], 500);
}
