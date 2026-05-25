<?php

require_once(__DIR__ . '/config.php');

function requireCustomerForAddress(PDO $db): array {
    $user = currentUser($db);
    if (!$user) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }

    if (($user['role'] ?? '') !== 'customer') {
        jsonResponse(['error' => 'Customer account required'], 403);
    }

    return $user;
}

function addressPayloadFromRow(array $row): array {
    return [
        'id' => (int) $row['ADD_ID'],
        'recipientName' => $row['RECEPIENT_NAME'],
        'phone' => $row['PHONE_NO'],
        'region' => $row['REGION'],
        'province' => $row['PROVINCE'],
        'city' => $row['MUNCIT'],
        'specific' => $row['SPECIFIC'],
        'unitFloor' => $row['UNIT_FLOOR'],
        'postalCode' => $row['POSTAL_CODE'],
        'category' => $row['ADDRESS_CAT'],
        'isDefault' => (bool) $row['IS_DEFAULT'],
    ];
}

function listAddresses(PDO $db, int $customerId): array {
    $stmt = $db->prepare(
        "SELECT `ADD_ID`, `RECEPIENT_NAME`, `PHONE_NO`, `REGION`, `PROVINCE`, `MUNCIT`,
                `SPECIFIC`, `UNIT_FLOOR`, `POSTAL_CODE`, `ADDRESS_CAT`, `IS_DEFAULT`
         FROM `ADDRESS_BOOK`
         WHERE `CUSTOMER_ID` = :customer_id
         ORDER BY `IS_DEFAULT` DESC, `ADD_ID` DESC"
    );
    $stmt->execute([':customer_id' => $customerId]);

    return array_map('addressPayloadFromRow', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function readAddressData(): array {
    $data = jsonInput();
    requireFields($data, ['recipientName', 'phone', 'region', 'province', 'city', 'specific', 'category']);

    $address = [
        'recipientName' => trim((string) $data['recipientName']),
        'phone' => trim((string) $data['phone']),
        'region' => trim((string) $data['region']),
        'province' => trim((string) $data['province']),
        'city' => trim((string) $data['city']),
        'specific' => trim((string) $data['specific']),
        'unitFloor' => trim((string) ($data['unitFloor'] ?? '')),
        'postalCode' => trim((string) ($data['postalCode'] ?? '')),
        'category' => trim((string) $data['category']),
        'isDefault' => filter_var($data['isDefault'] ?? false, FILTER_VALIDATE_BOOLEAN),
    ];

    foreach (['recipientName', 'phone', 'region', 'province', 'city', 'specific', 'category'] as $field) {
        if ($address[$field] === '') {
            jsonResponse(['error' => 'Required address fields cannot be blank.'], 422);
        }
    }

    return $address;
}

$sessionUser = requireCustomerForAddress($db);
$customerId = (int) $sessionUser['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['addresses' => listAddresses($db, $customerId)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $address = readAddressData();

    try {
        $db->beginTransaction();

        if ($address['isDefault']) {
            $clearStmt = $db->prepare(
                "UPDATE `ADDRESS_BOOK` SET `IS_DEFAULT` = 0 WHERE `CUSTOMER_ID` = :customer_id"
            );
            $clearStmt->execute([':customer_id' => $customerId]);
        }

        $idStmt = $db->query("SELECT COALESCE(MAX(`ADD_ID`), 0) + 1 AS next_id FROM `ADDRESS_BOOK` FOR UPDATE");
        $nextId = (int) $idStmt->fetch(PDO::FETCH_ASSOC)['next_id'];

        $stmt = $db->prepare(
            "INSERT INTO `ADDRESS_BOOK`
                (`ADD_ID`, `RECEPIENT_NAME`, `PHONE_NO`, `REGION`, `PROVINCE`, `MUNCIT`,
                 `SPECIFIC`, `UNIT_FLOOR`, `POSTAL_CODE`, `ADDRESS_CAT`, `IS_DEFAULT`, `CUSTOMER_ID`)
             VALUES
                (:id, :recipient_name, :phone, :region, :province, :city,
                 :specific, :unit_floor, :postal_code, :category, :is_default, :customer_id)"
        );
        $stmt->execute([
            ':id' => $nextId,
            ':recipient_name' => $address['recipientName'],
            ':phone' => $address['phone'],
            ':region' => $address['region'],
            ':province' => $address['province'],
            ':city' => $address['city'],
            ':specific' => $address['specific'],
            ':unit_floor' => $address['unitFloor'] !== '' ? $address['unitFloor'] : null,
            ':postal_code' => $address['postalCode'] !== '' ? $address['postalCode'] : null,
            ':category' => $address['category'],
            ':is_default' => $address['isDefault'] ? 1 : 0,
            ':customer_id' => $customerId,
        ]);

        $db->commit();
        jsonResponse(['addresses' => listAddresses($db, $customerId)], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        logApiError($e);
        jsonResponse(['error' => 'Unable to create address. Please try again.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = jsonInput();
    $addressId = (int) ($data['id'] ?? 0);
    if ($addressId <= 0) {
        jsonResponse(['error' => 'Missing address id.'], 422);
    }

    $address = readAddressData();

    try {
        $db->beginTransaction();

        $ownedStmt = $db->prepare(
            "SELECT `ADD_ID` FROM `ADDRESS_BOOK` WHERE `ADD_ID` = :id AND `CUSTOMER_ID` = :customer_id LIMIT 1"
        );
        $ownedStmt->execute([':id' => $addressId, ':customer_id' => $customerId]);
        if (!$ownedStmt->fetch(PDO::FETCH_ASSOC)) {
            $db->rollBack();
            jsonResponse(['error' => 'Address not found.'], 404);
        }

        if ($address['isDefault']) {
            $clearStmt = $db->prepare(
                "UPDATE `ADDRESS_BOOK` SET `IS_DEFAULT` = 0 WHERE `CUSTOMER_ID` = :customer_id"
            );
            $clearStmt->execute([':customer_id' => $customerId]);
        }

        $stmt = $db->prepare(
            "UPDATE `ADDRESS_BOOK`
             SET `RECEPIENT_NAME` = :recipient_name,
                 `PHONE_NO` = :phone,
                 `REGION` = :region,
                 `PROVINCE` = :province,
                 `MUNCIT` = :city,
                 `SPECIFIC` = :specific,
                 `UNIT_FLOOR` = :unit_floor,
                 `POSTAL_CODE` = :postal_code,
                 `ADDRESS_CAT` = :category,
                 `IS_DEFAULT` = :is_default
             WHERE `ADD_ID` = :id AND `CUSTOMER_ID` = :customer_id"
        );
        $stmt->execute([
            ':recipient_name' => $address['recipientName'],
            ':phone' => $address['phone'],
            ':region' => $address['region'],
            ':province' => $address['province'],
            ':city' => $address['city'],
            ':specific' => $address['specific'],
            ':unit_floor' => $address['unitFloor'] !== '' ? $address['unitFloor'] : null,
            ':postal_code' => $address['postalCode'] !== '' ? $address['postalCode'] : null,
            ':category' => $address['category'],
            ':is_default' => $address['isDefault'] ? 1 : 0,
            ':id' => $addressId,
            ':customer_id' => $customerId,
        ]);

        $db->commit();
        jsonResponse(['addresses' => listAddresses($db, $customerId)]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }

        logApiError($e);
        jsonResponse(['error' => 'Unable to update address. Please try again.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = jsonInput();
    $addressId = (int) ($data['id'] ?? ($_GET['id'] ?? 0));
    if ($addressId <= 0) {
        jsonResponse(['error' => 'Missing address id.'], 422);
    }

    try {
        $stmt = $db->prepare(
            "DELETE FROM `ADDRESS_BOOK` WHERE `ADD_ID` = :id AND `CUSTOMER_ID` = :customer_id"
        );
        $stmt->execute([':id' => $addressId, ':customer_id' => $customerId]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['error' => 'Address not found.'], 404);
        }

        jsonResponse(['addresses' => listAddresses($db, $customerId)]);
    } catch (Throwable $e) {
        logApiError($e);
        jsonResponse(['error' => 'Unable to delete address. Please try again.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
