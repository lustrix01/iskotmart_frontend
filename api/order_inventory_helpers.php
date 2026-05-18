<?php

function restoreProductOrderInventory(PDO $db, int $orderId): void {
    $stmt = $db->prepare(
        "SELECT PRODUCT_ID, QUANTITY
         FROM ORDER_ITEM
         WHERE ORDER_ID = :order_id"
    );
    $stmt->execute([':order_id' => $orderId]);

    $restore = $db->prepare(
        "UPDATE PRODUCT
         SET STOCK_QTY = STOCK_QTY + :quantity
         WHERE PROD_ID = :product_id"
    );

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $restore->execute([
            ':quantity' => max(0, (int) ($row['QUANTITY'] ?? 0)),
            ':product_id' => (int) $row['PRODUCT_ID'],
        ]);
    }
}

function restoreServiceRequestSlots(PDO $db, int $requestId, int $quantity): void {
    $stmt = $db->prepare(
        "UPDATE SERVICE s
         INNER JOIN SERVICE_REQUEST sr ON sr.SERVICE_ID = s.SERVICE_ID
         SET s.SLOTS = s.SLOTS + :quantity
         WHERE sr.REQUEST_ID = :request_id"
    );
    $stmt->execute([
        ':quantity' => max(1, $quantity),
        ':request_id' => $requestId,
    ]);
}
