<?php

    # Database connection details

    $db_host = getenv('DB_HOST') ?: '127.0.0.1';
    $db_user = getenv('DB_USER') ?: 'root';
    $db_pass = getenv('DB_PASS') ?: '';
    $db_name = getenv('DB_NAME') ?: 'iskomartdb';

    //pdo instead of mysqli, because it is more secure and easier to use
    $db = new PDO(
        'mysql:host=' . $db_host . ';dbname=' . $db_name . ';charset=utf8mb4',
        $db_user,
        $db_pass
    );

    //set some db attributes
    //supposedly makes db connection faster
    $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // PHP 8.5 deprecates PDO::MYSQL_ATTR_USE_BUFFERED_QUERY in favor of Pdo\Mysql::ATTR_USE_BUFFERED_QUERY
    $bufferedQueryAttr = null;
    if (defined('Pdo\\Mysql::ATTR_USE_BUFFERED_QUERY')) {
        $bufferedQueryAttr = constant('Pdo\\Mysql::ATTR_USE_BUFFERED_QUERY');
    } elseif (defined('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY')) {
        $bufferedQueryAttr = constant('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY');
    }

    if ($bufferedQueryAttr !== null) {
        $db->setAttribute($bufferedQueryAttr, true);
    }

    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    define('APP_NAME', 'ISKOMART');
?>
