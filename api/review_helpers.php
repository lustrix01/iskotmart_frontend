<?php

function ensureReviewContextColumns(PDO $db): void {
    $columns = $db->query("SHOW COLUMNS FROM REVIEW")->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('ORDER_ID', $columns, true)) {
        $db->exec("ALTER TABLE REVIEW ADD COLUMN ORDER_ID int(11) DEFAULT NULL AFTER OFFERING_ID");
        $db->exec("ALTER TABLE REVIEW ADD KEY REVIEW_ORDER_ID_idx (ORDER_ID)");
    }

    if (!in_array('REQUEST_ID', $columns, true)) {
        $db->exec("ALTER TABLE REVIEW ADD COLUMN REQUEST_ID int(11) DEFAULT NULL AFTER ORDER_ID");
        $db->exec("ALTER TABLE REVIEW ADD KEY REVIEW_REQUEST_ID_idx (REQUEST_ID)");
    }
}
