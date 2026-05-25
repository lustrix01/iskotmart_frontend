<?php

function ensureReviewContextColumns(PDO $db): void {
    requireTableColumns($db, 'REVIEW', ['ORDER_ID', 'REQUEST_ID']);
}
