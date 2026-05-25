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

    $logId = (int) $db->lastInsertId();

    // attempt to send customer email for notable events
    try {
        sendOrderActivityEmail($db, $source, $sourceId, $eventType, $newValue, $actor, $itemsSnapshot ? json_decode($itemsJson, true) : [], $summary);
    } catch (Throwable $e) {
        error_log('[order activity email] ' . $e->getMessage());
    }

    return $logId;
}

function sendOrderActivityEmail(PDO $db, string $source, int $sourceId, string $eventType, ?string $newValue, array $actor, array $items, string $summary): void {
    // only send for notable events
    $notable = in_array($eventType, ['created', 'status_changed', 'payment_confirmed', 'customer_cancelled', 'customer_received'], true);
    if (!$notable) {
        return;
    }

    // load mailer helper
    try {
        require_once(INC_PATH . 'util/EmailHandler.php');
    } catch (Throwable $e) {
        error_log('[order email] mailer include failed: ' . $e->getMessage());
        return;
    }

    // determine recipient and display id
    $sourceNorm = normalizeActivitySource($source);
    $recipientEmail = '';
    $recipientName = '';
    $displayId = '';

    if ($sourceNorm === 'service_request') {
        $stmt = $db->prepare("SELECT sr.REQUEST_ID, sr.RECIPIENT_NAME, u.EMAIL, u.FNAME, u.LNAME FROM SERVICE_REQUEST sr INNER JOIN USERS u ON u.USER_ID = sr.CUSTOMER_ID WHERE sr.REQUEST_ID = :id LIMIT 1");
        $stmt->execute([':id' => $sourceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $recipientEmail = trim((string) ($row['EMAIL'] ?? ''));
            $recipientName = trim((string) ($row['RECIPIENT_NAME'] ?? '')) ?: trim((string) (($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')));
            $displayId = 'SRV-' . (int) $row['REQUEST_ID'];
        }
    } else {
        $stmt = $db->prepare("SELECT o.ORDER_ID, o.RECIPIENT_NAME, u.EMAIL, u.FNAME, u.LNAME FROM ORDERS o INNER JOIN USERS u ON u.USER_ID = o.CUSTOMER_ID WHERE o.ORDER_ID = :id LIMIT 1");
        $stmt->execute([':id' => $sourceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $recipientEmail = trim((string) ($row['EMAIL'] ?? ''));
            $recipientName = trim((string) ($row['RECIPIENT_NAME'] ?? '')) ?: trim((string) (($row['FNAME'] ?? '') . ' ' . ($row['LNAME'] ?? '')));
            $displayId = 'ORD-' . (int) $row['ORDER_ID'];
        }
    }

    if ($recipientEmail === '') {
        return;
    }

    $subject = '';
    $eventTitle = '';
    $description = '';
    switch ($eventType) {
        case 'created':
            $subject = "Your order {$displayId} has been placed";
            $eventTitle = 'Order placed successfully';
            $description = "We received your order <strong>{$displayId}</strong>. Our team is now reviewing it and we will notify you as it moves through the next stage.";
            break;
        case 'payment_confirmed':
            $subject = "Payment received for {$displayId}";
            $eventTitle = 'Payment confirmed';
            $description = "Your payment for <strong>{$displayId}</strong> has been confirmed. Thanks for completing checkout — your merchant is preparing the order.";
            break;
        case 'status_changed':
            $subject = "Update: {$displayId} is now {$newValue}";
            $eventTitle = 'Order status updated';
            $description = "The status of <strong>{$displayId}</strong> has changed to <strong>{$newValue}</strong>. We will keep you posted on the next update.";
            break;
        case 'customer_cancelled':
            $subject = "Your order {$displayId} was cancelled";
            $eventTitle = 'Order cancelled';
            $description = "Your order <strong>{$displayId}</strong> has been cancelled. If this was a mistake, please contact support and we can help you place a new order.";
            break;
        case 'customer_received':
            $subject = "Order {$displayId} completed";
            $eventTitle = 'Order completed';
            $description = "Your order <strong>{$displayId}</strong> has been marked as received. We hope you love it — thanks for shopping with us!";
            break;
        default:
            $subject = "Update on {$displayId}";
            $eventTitle = 'Order update';
            $description = htmlspecialchars($summary ?: 'There is an update to your order.', ENT_QUOTES | ENT_SUBSTITUTE);
            break;
    }

    $supportEmail = trim((string) (getenv('SUPPORT_EMAIL') ?: 'support@localhost'));
    $logoUrl = trim((string) (getenv('MAILER_LOGO_URL') ?: ''));
    $baseUrl = rtrim((string) getenv('APP_URL'), '/');
    $orderUrl = $baseUrl !== '' ? $baseUrl . "/profile/orders" : '';

    $itemRows = '';
    if (!empty($items) && is_array($items)) {
        foreach ($items as $item) {
            $name = htmlspecialchars((string) ($item['name'] ?? 'Item'), ENT_QUOTES | ENT_SUBSTITUTE);
            $qty = (int) ($item['qty'] ?? 1);
            $price = number_format((float) ($item['price'] ?? 0), 2);
            $itemRows .= '<tr>' .
                '<td style="padding:10px;border:1px solid #e5e7eb;">' . $name . '</td>' .
                '<td style="padding:10px;border:1px solid #e5e7eb;text-align:center;">' . $qty . '</td>' .
                '<td style="padding:10px;border:1px solid #e5e7eb;text-align:right;">&#8369;' . $price . '</td>' .
            '</tr>';
        }
    }

    $htmlParts = [];
    $htmlParts[] = '<div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f7f8fa;padding:24px;">';
    $htmlParts[] = '<div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.08);">';
    if ($logoUrl !== '') {
        $htmlParts[] = '<div style="padding:28px 32px 0;text-align:center;"><img src="' . htmlspecialchars($logoUrl, ENT_QUOTES | ENT_SUBSTITUTE) . '" alt="Iskomart" style="max-width:160px;height:auto;"/></div>';
    }
    $htmlParts[] = '<div style="padding:32px 32px 24px;color:#111;">';
    $htmlParts[] = '<p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Order update</p>';
    $htmlParts[] = '<h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;color:#111;">' . htmlspecialchars($eventTitle, ENT_QUOTES | ENT_SUBSTITUTE) . '</h1>';
    $htmlParts[] = '<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;">' . $description . '</p>';

    if ($itemRows !== '') {
        $htmlParts[] = '<div style="margin:24px 0 0;">';
        $htmlParts[] = '<table style="width:100%;border-collapse:collapse;font-size:15px;color:#374151;">';
        $htmlParts[] = '<thead><tr><th style="text-align:left;padding:12px 10px;border-bottom:2px solid #e5e7eb;">Item</th><th style="padding:12px 10px;border-bottom:2px solid #e5e7eb;">Qty</th><th style="text-align:right;padding:12px 10px;border-bottom:2px solid #e5e7eb;">Price</th></tr></thead>';
        $htmlParts[] = '<tbody>' . $itemRows . '</tbody>';
        $htmlParts[] = '</table>';
        $htmlParts[] = '</div>';
    }

    if ($orderUrl !== '') {
        $htmlParts[] = '<div style="margin:28px 0 0;text-align:center;">';
        $htmlParts[] = '<a href="' . htmlspecialchars($orderUrl, ENT_QUOTES | ENT_SUBSTITUTE) . '" style="display:inline-block;padding:14px 26px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">View order details</a>';
        $htmlParts[] = '</div>';
    }

    $htmlParts[] = '<div style="margin:32px 0 0;padding-top:24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;line-height:1.7;">';
    $htmlParts[] = '<p style="margin:0;">Thanks for choosing Iskomart.</p>';
    $htmlParts[] = '</div>';
    $htmlParts[] = '</div>';
    $htmlParts[] = '</div>';
    $htmlParts[] = '</div>';

    $html = implode('', $htmlParts);

    $altParts = [
        strtoupper($eventTitle),
        "",
        strip_tags($description),
    ];
    if ($itemRows !== '') {
        $altParts[] = 'Items:';
        foreach ($items as $item) {
            $altParts[] = '- ' . ($item['qty'] ?? 1) . ' x ' . ($item['name'] ?? 'Item') . ' @ PHP ' . number_format((float) ($item['price'] ?? 0), 2);
        }
    }
    if ($orderUrl !== '') {
        $altParts[] = "View order details: {$orderUrl}";
    }
    $altParts[] = "Support: {$supportEmail}";
    $alt = implode("\n", $altParts);

    try {
        sendEmail($recipientEmail, $recipientName ?: 'Customer', $subject, $html, $alt);
    } catch (Throwable $e) {
        error_log('[order email] failed to send: ' . $e->getMessage());
    }
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
