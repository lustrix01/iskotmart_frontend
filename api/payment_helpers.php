<?php

const PAYMENT_STATUS_UNPAID = 'UNPAID';
const PAYMENT_STATUS_PENDING_REVIEW = 'PENDING_PAYMENT_REVIEW';
const PAYMENT_STATUS_PAID = 'PAID';

function canonicalPaymentStatus(?string $status): string {
    $normalized = strtoupper(trim((string) $status));
    $map = [
        'PAID' => PAYMENT_STATUS_PAID,
        'PAYMENT_PAID' => PAYMENT_STATUS_PAID,
        'PENDING_PAYMENT_REVIEW' => PAYMENT_STATUS_PENDING_REVIEW,
        'PENDING REVIEW' => PAYMENT_STATUS_PENDING_REVIEW,
        'FOR_REVIEW' => PAYMENT_STATUS_PENDING_REVIEW,
        'UNPAID' => PAYMENT_STATUS_UNPAID,
        'NOT_PAID' => PAYMENT_STATUS_UNPAID,
        '' => PAYMENT_STATUS_UNPAID,
    ];

    return $map[$normalized] ?? PAYMENT_STATUS_UNPAID;
}

function paymentStatusLabel(?string $status): string {
    return match (canonicalPaymentStatus($status)) {
        PAYMENT_STATUS_PAID => 'Paid',
        PAYMENT_STATUS_PENDING_REVIEW => 'Pending payment review',
        default => 'Unpaid',
    };
}

function decodeServicePaymentInfo(?string $payload): array {
    $decoded = json_decode((string) $payload, true);
    return is_array($decoded) ? $decoded : [];
}

function servicePaymentStatus(?string $payload): string {
    $info = decodeServicePaymentInfo($payload);
    return canonicalPaymentStatus($info['paymentStatus'] ?? null);
}

function servicePaymentMethod(?string $payload): string {
    $info = decodeServicePaymentInfo($payload);
    return strtolower(trim((string) ($info['paymentMethod'] ?? '')));
}

function serviceQuantityFromInfo(?string $payload): int {
    $info = decodeServicePaymentInfo($payload);
    return max(1, (int) ($info['quantity'] ?? 1));
}

function updateServicePaymentInfo(PDO $db, int $requestId, string $paymentStatus, ?string $paymentMethod = null): void {
    $lookup = $db->prepare(
        "SELECT CUSTOMER_INFO
         FROM SERVICE_REQUEST
         WHERE REQUEST_ID = :request_id
         LIMIT 1"
    );
    $lookup->execute([':request_id' => $requestId]);
    $payload = (string) ($lookup->fetchColumn() ?: '');

    $info = decodeServicePaymentInfo($payload);
    $info['paymentStatus'] = canonicalPaymentStatus($paymentStatus);
    if ($paymentMethod !== null && trim($paymentMethod) !== '') {
        $info['paymentMethod'] = strtolower(trim($paymentMethod));
    }

    $encoded = json_encode($info);
    $stmt = $db->prepare(
        "UPDATE SERVICE_REQUEST
         SET CUSTOMER_INFO = :customer_info
         WHERE REQUEST_ID = :request_id"
    );
    $stmt->execute([
        ':customer_info' => $encoded !== false ? $encoded : '{}',
        ':request_id' => $requestId,
    ]);
}

function resolveAllowedPaymentId(PDO $db, int $merchantId, int $offeringId, string $paymentMethod): ?int {
    $needle = strtolower(trim($paymentMethod));
    $stmt = $db->prepare(
        "SELECT ap.ALLOWED_PM_ID, pm.SERVICE
         FROM ALLOWED_PAYMENT ap
         INNER JOIN PAYMENT_METHOD pm ON pm.PM_ID = ap.PM_ID
         WHERE ap.OFFERING_ID = :offering_id
           AND ap.STATUS = 'ACTIVE'
           AND pm.MERCHANT_ID = :merchant_id
         ORDER BY ap.ALLOWED_PM_ID ASC"
    );
    $stmt->execute([
        ':offering_id' => $offeringId,
        ':merchant_id' => $merchantId,
    ]);

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $label = strtolower(trim((string) ($row['SERVICE'] ?? '')));
        $isGcash = str_contains($label, 'gcash');
        $isCash = str_contains($label, 'cod')
            || str_contains($label, 'cash on delivery')
            || str_contains($label, 'cash')
            || str_contains($label, 'meetup');

        if (($needle === 'gcash' && $isGcash) || ($needle === 'cod' && $isCash)) {
            return (int) $row['ALLOWED_PM_ID'];
        }
    }

    return null;
}

function orderPrimaryOffering(PDO $db, int $orderId, int $merchantId): ?int {
    $stmt = $db->prepare(
        "SELECT p.PROD_ID
         FROM ORDER_ITEM oi
         INNER JOIN PRODUCT p ON p.PROD_ID = oi.PRODUCT_ID
         WHERE oi.ORDER_ID = :order_id AND p.MERCHANT_ID = :merchant_id
         ORDER BY oi.ORDERITEM_ID ASC
         LIMIT 1"
    );
    $stmt->execute([
        ':order_id' => $orderId,
        ':merchant_id' => $merchantId,
    ]);
    $value = $stmt->fetchColumn();
    return $value ? (int) $value : null;
}

function ensurePaymentRecord(PDO $db, ?int $orderId, ?int $requestId, int $allowedPaymentId, float $amount, string $reference): void {
    $where = $orderId !== null ? 'ORDER_ID = :order_id' : 'REQUEST_ID = :request_id';
    $lookup = $db->prepare("SELECT PAYMENT_ID FROM PAYMENT WHERE {$where} LIMIT 1");
    $lookup->execute($orderId !== null ? [':order_id' => $orderId] : [':request_id' => $requestId]);
    if ($lookup->fetch(PDO::FETCH_ASSOC)) {
        return;
    }

    $stmt = $db->prepare(
        "INSERT INTO PAYMENT (REF_NUM, AMOUNT, ORDER_ID, REQUEST_ID, ALLOWED_PM_ID)
         VALUES (:ref_num, :amount, :order_id, :request_id, :allowed_pm_id)"
    );
    $stmt->execute([
        ':ref_num' => $reference,
        ':amount' => (int) round($amount),
        ':order_id' => $orderId,
        ':request_id' => $requestId,
        ':allowed_pm_id' => $allowedPaymentId,
    ]);
}
