<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = currentUser($db);
if (!$user) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

jsonResponse(['user' => $user]);
