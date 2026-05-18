<?php

require_once(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = currentUser($db);
if (!$user) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

function aiHelpString(mixed $value, int $maxLength = 500): string {
    $text = trim((string) ($value ?? ''));
    $text = preg_replace('/\s+/', ' ', $text) ?? '';
    if (strlen($text) > $maxLength) {
        return substr($text, 0, $maxLength);
    }

    return $text;
}

function aiHelpDiscountedPrice(float $price, ?string $type, mixed $value): float {
    $discountValue = (float) ($value ?? 0);
    if ($discountValue <= 0 || $type === null) {
        return round($price, 2);
    }

    $discounted = strtolower($type) === 'percentage'
        ? $price - ($price * ($discountValue / 100))
        : $price - $discountValue;

    return round(max(0, $discounted), 2);
}

function aiHelpDiscountLabel(?string $type, mixed $value): string {
    $discountValue = (float) ($value ?? 0);
    if ($discountValue <= 0 || $type === null) {
        return '';
    }

    return strtolower($type) === 'percentage'
        ? '-' . rtrim(rtrim(number_format($discountValue, 2), '0'), '.') . '%'
        : '-PHP ' . rtrim(rtrim(number_format($discountValue, 2), '0'), '.');
}

function aiHelpTokenize(string $text): array {
    $normalized = strtolower(preg_replace('/[^a-z0-9\s]/i', ' ', $text) ?? '');
    $words = preg_split('/\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);
    if (!is_array($words)) {
        return [];
    }

    $stopWords = [
        'a' => true, 'an' => true, 'and' => true, 'are' => true, 'available' => true,
        'can' => true, 'do' => true, 'find' => true, 'for' => true, 'have' => true,
        'how' => true, 'i' => true, 'is' => true, 'it' => true, 'me' => true,
        'need' => true, 'of' => true, 'on' => true, 'or' => true, 'please' => true,
        'price' => true, 'product' => true, 'products' => true, 'service' => true,
        'services' => true, 'show' => true, 'the' => true, 'to' => true, 'what' => true,
        'with' => true, 'you' => true,
    ];

    return array_values(array_unique(array_filter(
        $words,
        fn (string $word): bool => strlen($word) >= 3 && !isset($stopWords[$word])
    )));
}

function aiHelpCatalog(PDO $db, string $query): array {
    $stmt = $db->query(
        "SELECT o.OFFERING_ID AS id, o.OFFERING_TYPE AS type, o.OFFERING_NAME AS name,
                COALESCE(o.OFFERING_DESC, p.PROD_DESC, s.SER_DESC) AS description,
                COALESCE(pc.CAT_NAME, sc.CAT_NAME) AS category,
                COALESCE(p.PRICE, s.PRICE) AS price,
                p.STOCK_QTY AS stock,
                s.SLOTS AS slots,
                s.DELIVERY_METHOD AS rate_type,
                COALESCE(m.SHOP_NAME, u.USERNAME) AS merchant_name,
                discount.TYPE AS discount_type,
                discount.VALUE AS discount_value
         FROM OFFERING o
         INNER JOIN USERS u ON u.USER_ID = o.MERCHANT_ID AND u.STATUS = 'ACTIVE'
         LEFT JOIN MERCHANT m ON m.MERCHANT_ID = o.MERCHANT_ID
         LEFT JOIN PRODUCT p ON p.PROD_ID = o.OFFERING_ID
         LEFT JOIN PROD_SUBCAT ps ON ps.PRODSUBCAT_ID = p.PRODSUBCAT_ID
         LEFT JOIN PROD_CATEGORY pc ON pc.PRODCAT_ID = ps.PRODCAT_ID
         LEFT JOIN SERVICE s ON s.SERVICE_ID = o.OFFERING_ID
         LEFT JOIN SERVICE_SUBCAT ss ON ss.SERSUBCAT_ID = s.SERSUBCAT_ID
         LEFT JOIN SERVICE_CAT sc ON sc.SERCAT_ID = ss.SERCAT_ID
         LEFT JOIN (
             SELECT d.*
             FROM DISCOUNT d
             INNER JOIN (
                 SELECT OFFERING_ID, MAX(DISCOUNT_ID) AS DISCOUNT_ID
                 FROM DISCOUNT
                 WHERE START_DATE <= NOW(1)
                   AND END_DATE >= NOW(1)
                   AND COALESCE(STATUS, 'ACTIVE') = 'ACTIVE'
                 GROUP BY OFFERING_ID
             ) latest_discount ON latest_discount.DISCOUNT_ID = d.DISCOUNT_ID
         ) discount ON discount.OFFERING_ID = o.OFFERING_ID
         WHERE UPPER(o.AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED')
         ORDER BY o.OFFERING_ID DESC
         LIMIT 250"
    );

    $terms = aiHelpTokenize($query);
    $items = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $originalPrice = (float) ($row['price'] ?? 0);
        $discountLabel = aiHelpDiscountLabel($row['discount_type'] ?? null, $row['discount_value'] ?? null);
        $item = [
            'id' => (int) $row['id'],
            'type' => $row['type'] === 'P' ? 'product' : 'service',
            'name' => aiHelpString($row['name'] ?? '', 120),
            'description' => aiHelpString($row['description'] ?? '', 220),
            'category' => aiHelpString($row['category'] ?? 'Uncategorized', 80),
            'merchant' => aiHelpString($row['merchant_name'] ?? 'Merchant', 80),
            'price' => aiHelpDiscountedPrice($originalPrice, $row['discount_type'] ?? null, $row['discount_value'] ?? null),
            'originalPrice' => round($originalPrice, 2),
            'discount' => $discountLabel,
            'stock' => $row['stock'] !== null ? (int) $row['stock'] : null,
            'slots' => $row['slots'] !== null ? (int) $row['slots'] : null,
            'rateType' => aiHelpString($row['rate_type'] ?? '', 40),
        ];

        $haystack = strtolower(implode(' ', [
            $item['name'],
            $item['description'],
            $item['category'],
            $item['merchant'],
            $item['type'],
        ]));
        $score = 0;
        foreach ($terms as $term) {
            if (str_contains($haystack, $term)) {
                $score++;
            }
        }
        $item['_score'] = $score;
        $items[] = $item;
    }

    usort($items, fn (array $a, array $b): int =>
        ($b['_score'] <=> $a['_score'])
        ?: (($b['discount'] !== '') <=> ($a['discount'] !== ''))
        ?: ($b['id'] <=> $a['id'])
    );

    $matched = array_values(array_filter($items, fn (array $item): bool => (int) $item['_score'] > 0));
    $catalog = $matched ?: $items;
    $catalog = array_slice($catalog, 0, 60);

    return array_map(function (array $item): array {
        unset($item['_score']);
        return $item;
    }, $catalog);
}

function aiHelpMessages(array $input): array {
    $messages = $input['messages'] ?? [];
    if (!is_array($messages)) {
        return [];
    }

    $clean = [];
    foreach (array_slice($messages, -8) as $message) {
        if (!is_array($message)) {
            continue;
        }
        $role = ($message['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
        $content = aiHelpString($message['content'] ?? '', 900);
        if ($content === '') {
            continue;
        }
        $clean[] = ['role' => $role, 'content' => $content];
    }

    return $clean;
}

try {
    $apiKey = trim((string) getenv('OPENROUTER_API_KEY'));
    if ($apiKey === '') {
        jsonResponse(['error' => 'OpenRouter API key is not configured.'], 500);
    }

    if (!function_exists('curl_init')) {
        jsonResponse(['error' => 'PHP cURL extension is required for AI chat.'], 500);
    }

    $input = jsonInput();
    $messages = aiHelpMessages($input);
    if (!$messages) {
        jsonResponse(['error' => 'Message is required.'], 422);
    }

    $latestUserMessage = '';
    for ($i = count($messages) - 1; $i >= 0; $i--) {
        if ($messages[$i]['role'] === 'user') {
            $latestUserMessage = $messages[$i]['content'];
            break;
        }
    }

    $catalog = aiHelpCatalog($db, $latestUserMessage);
    $model = trim((string) getenv('OPENROUTER_MODEL')) ?: 'deepseek/deepseek-v4-flash:free';
    $siteUrl = trim((string) getenv('APP_URL')) ?: 'http://localhost:5173';

    $payload = [
        'model' => $model,
        'messages' => array_merge([
            [
                'role' => 'system',
                'content' =>
                    "You are IskoMart's product and service help assistant. " .
                    "You may answer general questions about how to use IskoMart, shopping, booking services, searching, wishlists, checkout, and merchant storefronts. " .
                    "For listing, price, discount, stock, slot, merchant, and availability questions, use only the public catalog JSON provided in this request. " .
                    "Do not claim access to accounts, carts, orders, vouchers, passwords, private merchant data, or the database. " .
                    "Do not invent listings, prices, discounts, stock, slots, merchants, or availability. " .
                    "If the user asks about a listing that is not in the catalog, say it is not currently shown in the available listings, then suggest close alternatives from the catalog when possible. " .
                    "When asked for a product or service, recommend the closest matching catalog item and include the current price after active item discount. " .
                    "If an item has a discount, mention the original price and discount label. " .
                    "For greetings, small talk, and non-catalog help questions, answer normally without saying there is no matching listing. " .
                    "Use PHP pesos. Keep replies concise."
            ],
            [
                'role' => 'system',
                'content' => 'Public catalog subset: ' . json_encode($catalog, JSON_UNESCAPED_SLASHES)
            ],
        ], $messages),
        'temperature' => 0.2,
        'max_tokens' => 350,
    ];

    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'HTTP-Referer: ' . $siteUrl,
            'X-OpenRouter-Title: IskoMart Local Help Chat',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 35,
    ]);

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $curlError !== '') {
        jsonResponse(['error' => 'AI service is unavailable.'], 502);
    }

    $decoded = json_decode($raw, true);
    if ($status < 200 || $status >= 300) {
        $message = is_array($decoded) ? ($decoded['error']['message'] ?? 'AI service request failed.') : 'AI service request failed.';
        jsonResponse(['error' => $message], 502);
    }

    $reply = aiHelpString($decoded['choices'][0]['message']['content'] ?? '', 3000);
    if ($reply === '') {
        $reply = 'I could not find a matching answer from the available listings.';
    }

    jsonResponse([
        'reply' => $reply,
        'catalogCount' => count($catalog),
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to process AI help request.'], 500);
}
