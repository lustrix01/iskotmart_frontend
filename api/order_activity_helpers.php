<?php

function ensureOrderActivityLogTable(PDO $db): void {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `ORDER_ACTIVITY_LOG` (
            `LOG_ID` int(11) NOT NULL AUTO_INCREMENT,
            `SOURCE_TYPE` varchar(32) NOT NULL,
            `SOURCE_ID` int(11) NOT NULL,
            `EVENT_TYPE` varchar(64) NOT NULL,
            `OLD_VALUE` varchar(255) DEFAULT NULL,
            `NEW_VALUE` varchar(255) DEFAULT NULL,
            `ACTOR_ID` int(11) DEFAULT NULL,
            `ACTOR_ROLE` varchar(45) DEFAULT NULL,
            `ACTOR_NAME` varchar(255) DEFAULT NULL,
            `ITEMS_SNAPSHOT` text DEFAULT NULL,
            `SUMMARY` text DEFAULT NULL,
            `UNDO_OF_LOG_ID` int(11) DEFAULT NULL,
            `CREATED_AT` datetime(1) NOT NULL DEFAULT current_timestamp(1),
            PRIMARY KEY (`LOG_ID`),
            KEY `ORDER_ACTIVITY_SOURCE_IDX` (`SOURCE_TYPE`, `SOURCE_ID`, `CREATED_AT`),
            KEY `ORDER_ACTIVITY_UNDO_IDX` (`UNDO_OF_LOG_ID`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci"
    );
}

function normalizeActivitySource(string $source): string {
    $normalized = strtolower(trim($source));
    return $normalized === 'service_request' ? 'service_request' : 'order';
}

function actorPayload(array $user): array {
    return [
        'id' => (int) ($user['id'] ?? 0),
        'role' => (string) ($user['role'] ?? ''),
        'name' => trim((string) ($user['name'] ?? '')) ?: trim((string) ($user['username'] ?? 'User')),
    ];
}

function insertOrderActivityLog(
    PDO $db,
    string $source,
    int $sourceId,
    string $eventType,
    ?string $oldValue,
    ?string $newValue,
    array $actor,
    array $itemsSnapshot,
    string $summary,
    ?int $undoOfLogId = null
): int {
    $itemsJson = json_encode(array_values($itemsSnapshot), JSON_UNESCAPED_SLASHES);
    if ($itemsJson === false) {
        $itemsJson = '[]';
    }

    $stmt = $db->prepare(
        "INSERT INTO ORDER_ACTIVITY_LOG
            (SOURCE_TYPE, SOURCE_ID, EVENT_TYPE, OLD_VALUE, NEW_VALUE, ACTOR_ID, ACTOR_ROLE, ACTOR_NAME, ITEMS_SNAPSHOT, SUMMARY, UNDO_OF_LOG_ID)
         VALUES
            (:source_type, :source_id, :event_type, :old_value, :new_value, :actor_id, :actor_role, :actor_name, :items_snapshot, :summary, :undo_of_log_id)"
    );
    $stmt->execute([
        ':source_type' => normalizeActivitySource($source),
        ':source_id' => $sourceId,
        ':event_type' => $eventType,
        ':old_value' => $oldValue,
        ':new_value' => $newValue,
        ':actor_id' => (int) ($actor['id'] ?? 0) ?: null,
        ':actor_role' => trim((string) ($actor['role'] ?? '')) ?: null,
        ':actor_name' => trim((string) ($actor['name'] ?? '')) ?: 'User',
        ':items_snapshot' => $itemsJson,
        ':summary' => $summary,
        ':undo_of_log_id' => $undoOfLogId,
    ]);

    return (int) $db->lastInsertId();
}

function activityItemsForProductOrder(PDO $db, int $orderId): array {
    $stmt = $db->prepare(
        "SELECT o.OFFERING_NAME, oi.QUANTITY, oi.PRICE
         FROM ORDER_ITEM oi
         INNER JOIN OFFERING o ON o.OFFERING_ID = oi.PRODUCT_ID
         WHERE oi.ORDER_ID = :order_id
         ORDER BY oi.ORDERITEM_ID"
    );
    $stmt->execute([':order_id' => $orderId]);

    return array_map(
        fn (array $row): array => [
            'name' => (string) ($row['OFFERING_NAME'] ?? 'Order item'),
            'qty' => max(1, (int) ($row['QUANTITY'] ?? 1)),
            'price' => round((float) ($row['PRICE'] ?? 0), 2),
        ],
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );
}

function activityItemsForServiceRequest(PDO $db, int $requestId): array {
    $stmt = $db->prepare(
        "SELECT COALESCE(o.OFFERING_NAME, 'Service Request') AS service_name,
                sr.TOTAL_PRICE, sr.CUSTOMER_INFO
         FROM SERVICE_REQUEST sr
         INNER JOIN SERVICE s ON s.SERVICE_ID = sr.SERVICE_ID
         LEFT JOIN OFFERING o ON o.OFFERING_ID = s.SERVICE_ID
         WHERE sr.REQUEST_ID = :request_id
         LIMIT 1"
    );
    $stmt->execute([':request_id' => $requestId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return [];
    }

    $quantity = function_exists('serviceQuantityFromInfo')
        ? serviceQuantityFromInfo((string) ($row['CUSTOMER_INFO'] ?? ''))
        : 1;
    $total = round((float) ($row['TOTAL_PRICE'] ?? 0), 2);

    return [[
        'name' => (string) ($row['service_name'] ?? 'Service Request'),
        'qty' => max(1, $quantity),
        'price' => $quantity > 0 ? round($total / $quantity, 2) : $total,
    ]];
}

function activityItemsForSource(PDO $db, string $source, int $sourceId): array {
    return normalizeActivitySource($source) === 'service_request'
        ? activityItemsForServiceRequest($db, $sourceId)
        : activityItemsForProductOrder($db, $sourceId);
}

function activityRowsForSource(PDO $db, string $source, int $sourceId, int $limit = 20): array {
    ensureOrderActivityLogTable($db);
    $stmt = $db->prepare(
        "SELECT LOG_ID, SOURCE_TYPE, SOURCE_ID, EVENT_TYPE, OLD_VALUE, NEW_VALUE,
                ACTOR_ID, ACTOR_ROLE, ACTOR_NAME, ITEMS_SNAPSHOT, SUMMARY,
                UNDO_OF_LOG_ID, CREATED_AT
         FROM ORDER_ACTIVITY_LOG
         WHERE SOURCE_TYPE = :source_type AND SOURCE_ID = :source_id
         ORDER BY CREATED_AT DESC, LOG_ID DESC
         LIMIT {$limit}"
    );
    $stmt->execute([
        ':source_type' => normalizeActivitySource($source),
        ':source_id' => $sourceId,
    ]);

    return array_map(function (array $row): array {
        $items = json_decode((string) ($row['ITEMS_SNAPSHOT'] ?? '[]'), true);
        return [
            'id' => (int) $row['LOG_ID'],
            'source' => (string) $row['SOURCE_TYPE'],
            'rawId' => (int) $row['SOURCE_ID'],
            'eventType' => (string) $row['EVENT_TYPE'],
            'oldValue' => (string) ($row['OLD_VALUE'] ?? ''),
            'newValue' => (string) ($row['NEW_VALUE'] ?? ''),
            'actorId' => (int) ($row['ACTOR_ID'] ?? 0),
            'actorRole' => (string) ($row['ACTOR_ROLE'] ?? ''),
            'actorName' => (string) ($row['ACTOR_NAME'] ?? 'User'),
            'items' => is_array($items) ? $items : [],
            'summary' => (string) ($row['SUMMARY'] ?? ''),
            'undoOfLogId' => $row['UNDO_OF_LOG_ID'] !== null ? (int) $row['UNDO_OF_LOG_ID'] : null,
            'createdAt' => (string) ($row['CREATED_AT'] ?? ''),
            'createdAtLabel' => ($timestamp = strtotime((string) ($row['CREATED_AT'] ?? '')))
                ? date('M j, Y g:i A', $timestamp)
                : (string) ($row['CREATED_AT'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function latestActivityRow(PDO $db, string $source, int $sourceId): ?array {
    $rows = activityRowsForSource($db, $source, $sourceId, 1);
    return $rows[0] ?? null;
}
