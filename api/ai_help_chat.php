<?php

require_once(__DIR__ . '/config.php');

const AI_HELP_MAX_BODY_BYTES = 12000;
const AI_HELP_RATE_LIMIT_COUNT = 20;
const AI_HELP_RATE_LIMIT_SECONDS = 60;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > AI_HELP_MAX_BODY_BYTES) {
    jsonResponse(['error' => 'Message is too large.'], 413);
}

$user = currentUser($db);
if (!$user) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

function aiHelpEnforceRateLimit(int $userId): void {
    startApiSession();

    $now = time();
    if (!isset($_SESSION['ai_help_rate']) || !is_array($_SESSION['ai_help_rate'])) {
        $_SESSION['ai_help_rate'] = [];
    }

    $key = (string) $userId;
    $bucket = $_SESSION['ai_help_rate'][$key] ?? ['started_at' => $now, 'count' => 0];
    if (!is_array($bucket) || $now - (int) ($bucket['started_at'] ?? 0) >= AI_HELP_RATE_LIMIT_SECONDS) {
        $bucket = ['started_at' => $now, 'count' => 0];
    }

    $bucket['count'] = (int) ($bucket['count'] ?? 0) + 1;
    $_SESSION['ai_help_rate'][$key] = $bucket;

    if ($bucket['count'] > AI_HELP_RATE_LIMIT_COUNT) {
        jsonResponse(['error' => 'Too many AI help requests. Please wait a minute and try again.'], 429);
    }
}

aiHelpEnforceRateLimit((int) $user['id']);

function aiHelpString(mixed $value, int $maxLength = 500): string {
    $text = trim((string) ($value ?? ''));
    $text = preg_replace('/\s+/', ' ', $text) ?? '';
    if (strlen($text) > $maxLength) {
        return substr($text, 0, $maxLength);
    }

    return $text;
}

function aiHelpMoney(float $value): string {
    return 'PHP ' . number_format($value, 2);
}

function aiHelpDebugEnabled(): bool {
    $value = strtolower(trim((string) getenv('AI_HELP_DEBUG')));
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
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

function aiHelpPublicCatalogItem(array $row): array {
    $originalPrice = (float) ($row['price'] ?? 0);
    $discountLabel = aiHelpDiscountLabel($row['discount_type'] ?? null, $row['discount_value'] ?? null);

    return [
        'id' => (int) $row['id'],
        'type' => $row['type'] === 'P' ? 'product' : 'service',
        'name' => aiHelpString($row['name'] ?? '', 100),
        'category' => aiHelpString($row['category'] ?? 'Uncategorized', 70),
        'merchantId' => (int) ($row['merchant_id'] ?? 0),
        'merchant' => aiHelpString($row['merchant_name'] ?? 'Merchant', 70),
        'price' => aiHelpDiscountedPrice($originalPrice, $row['discount_type'] ?? null, $row['discount_value'] ?? null),
        'originalPrice' => round($originalPrice, 2),
        'discount' => $discountLabel,
        'stock' => $row['stock'] !== null ? (int) $row['stock'] : null,
        'slots' => $row['slots'] !== null ? (int) $row['slots'] : null,
        'rateType' => aiHelpString($row['rate_type'] ?? '', 35),
        'rating' => $row['average_rating'] !== null ? round((float) $row['average_rating'], 1) : null,
        'reviewCount' => (int) ($row['review_count'] ?? 0),
        'recentReviews' => [],
    ];
}

function aiHelpTokenize(string $text): array {
    $normalized = strtolower(preg_replace('/[^a-z0-9\s]/i', ' ', $text) ?? '');
    $words = preg_split('/\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);
    if (!is_array($words)) {
        return [];
    }

    $stopWords = [
        'a' => true, 'an' => true, 'and' => true, 'are' => true,
        'can' => true, 'current' => true, 'do' => true, 'find' => true, 'for' => true, 'have' => true,
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

function aiHelpIsCatalogQuestion(string $message): bool {
    $normalized = strtolower($message);
    return (bool) preg_match(
        '/\b(product|products|service|services|price|prices|discount|discounted|available|availability|stock|slots|merchant|store|shop|buy|book|recommend|list|show|find|have|sell|offer|offers)\b/',
        $normalized
    );
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
                o.MERCHANT_ID AS merchant_id,
                COALESCE(m.SHOP_NAME, u.USERNAME) AS merchant_name,
                reviews.average_rating,
                COALESCE(reviews.review_count, 0) AS review_count,
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
         LEFT JOIN (
             SELECT OFFERING_ID, AVG(RATING) AS average_rating, COUNT(REVIEW_ID) AS review_count
             FROM REVIEW
             GROUP BY OFFERING_ID
         ) reviews ON reviews.OFFERING_ID = o.OFFERING_ID
         WHERE UPPER(o.AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED')
         ORDER BY o.OFFERING_ID DESC
         LIMIT 250"
    );

    $terms = aiHelpTokenize($query);
    $items = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $item = aiHelpPublicCatalogItem($row);

        $haystack = strtolower(implode(' ', [
            $item['name'],
            aiHelpString($row['description'] ?? '', 180),
            $item['category'],
            $item['merchant'],
            $item['type'],
        ]));
        $score = 0;
        foreach ($terms as $term) {
            if (strtolower($item['name']) === $term) {
                $score += 5;
            } elseif (str_contains(strtolower($item['name']), $term)) {
                $score += 3;
            } elseif (str_contains(strtolower($item['category']), $term)) {
                $score += 2;
            } elseif (str_contains($haystack, $term)) {
                $score += 1;
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
    $catalog = array_slice($catalog, 0, $matched ? 30 : 12);

    $catalog = array_map(function (array $item): array {
        unset($item['_score']);
        return $item;
    }, $catalog);

    $catalog = aiHelpAttachListingReviews($db, $catalog);

    return [
        'items' => $catalog,
        'matchedCount' => count($matched),
        'totalCount' => count($items),
        'terms' => $terms,
    ];
}

function aiHelpAttachListingReviews(PDO $db, array $items): array {
    $offeringIds = array_values(array_unique(array_filter(
        array_map(fn (array $item): int => (int) ($item['id'] ?? 0), $items),
        fn (int $id): bool => $id > 0
    )));
    if (!$offeringIds) {
        return $items;
    }

    $placeholders = implode(',', array_fill(0, count($offeringIds), '?'));
    $stmt = $db->prepare(
        "SELECT r.OFFERING_ID, r.RATING, r.DESCRIPTION, r.REVIEWED_ON,
                COALESCE(c.DISPLAY_NAME, TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), 'Customer') AS customer_name
         FROM REVIEW r
         INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = r.CUSTOMER_ID
         INNER JOIN USERS u ON u.USER_ID = c.CUSTOMER_ID
         WHERE r.OFFERING_ID IN ({$placeholders})
         ORDER BY r.OFFERING_ID ASC, r.REVIEWED_ON DESC, r.REVIEW_ID DESC"
    );
    $stmt->execute($offeringIds);

    $reviewsByOffering = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $offeringId = (int) $row['OFFERING_ID'];
        if (count($reviewsByOffering[$offeringId] ?? []) >= 3) {
            continue;
        }
        $reviewsByOffering[$offeringId][] = [
            'rating' => (int) $row['RATING'],
            'description' => aiHelpString($row['DESCRIPTION'] ?? '', 180),
            'customer' => aiHelpString($row['customer_name'] ?? 'Customer', 60),
            'reviewedOn' => aiHelpString($row['REVIEWED_ON'] ?? '', 30),
        ];
    }

    foreach ($items as &$item) {
        $item['recentReviews'] = $reviewsByOffering[(int) ($item['id'] ?? 0)] ?? [];
    }
    unset($item);

    return $items;
}

function aiHelpMerchantList(PDO $db, string $query): array {
    $stmt = $db->query(
        "SELECT u.USER_ID AS id,
                COALESCE(NULLIF(m.SHOP_NAME, ''), u.USERNAME) AS name,
                m.SHOP_DESC AS description,
                m.ADDRESS AS address,
                COALESCE(counts.product_count, 0) AS product_count,
                COALESCE(counts.service_count, 0) AS service_count,
                COALESCE(counts.total_count, 0) AS total_count,
                reviews.average_rating,
                COALESCE(reviews.review_count, 0) AS review_count
         FROM USERS u
         INNER JOIN MERCHANT m ON m.MERCHANT_ID = u.USER_ID
         LEFT JOIN (
             SELECT MERCHANT_ID,
                    SUM(CASE WHEN OFFERING_TYPE = 'P' THEN 1 ELSE 0 END) AS product_count,
                    SUM(CASE WHEN OFFERING_TYPE = 'S' THEN 1 ELSE 0 END) AS service_count,
                    COUNT(*) AS total_count
             FROM OFFERING
             WHERE UPPER(AVAIL_STATUS) IN ('ACTIVE', 'AVAILABLE', 'APPROVED')
             GROUP BY MERCHANT_ID
         ) counts ON counts.MERCHANT_ID = u.USER_ID
         LEFT JOIN (
             SELECT o.MERCHANT_ID, AVG(r.RATING) AS average_rating, COUNT(r.REVIEW_ID) AS review_count
             FROM REVIEW r
             INNER JOIN OFFERING o ON o.OFFERING_ID = r.OFFERING_ID
             GROUP BY o.MERCHANT_ID
         ) reviews ON reviews.MERCHANT_ID = u.USER_ID
         WHERE u.STATUS = 'ACTIVE'
         ORDER BY total_count DESC, review_count DESC, name ASC
         LIMIT 120"
    );

    $terms = aiHelpTokenize($query);
    $merchants = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $merchant = [
            'id' => (int) $row['id'],
            'name' => aiHelpString($row['name'] ?? 'Merchant', 80),
            'description' => aiHelpString($row['description'] ?? '', 180),
            'address' => aiHelpString($row['address'] ?? '', 100),
            'productCount' => (int) ($row['product_count'] ?? 0),
            'serviceCount' => (int) ($row['service_count'] ?? 0),
            'totalListings' => (int) ($row['total_count'] ?? 0),
            'rating' => $row['average_rating'] !== null ? round((float) $row['average_rating'], 1) : null,
            'reviewCount' => (int) ($row['review_count'] ?? 0),
            'recentReviews' => [],
        ];

        $haystack = strtolower(implode(' ', [
            $merchant['name'],
            $merchant['description'],
            $merchant['address'],
        ]));
        $score = 0;
        foreach ($terms as $term) {
            if (str_contains(strtolower($merchant['name']), $term)) {
                $score += 3;
            } elseif (str_contains($haystack, $term)) {
                $score += 1;
            }
        }
        $merchant['_score'] = $score;
        $merchants[] = $merchant;
    }

    usort($merchants, fn (array $a, array $b): int =>
        ($b['_score'] <=> $a['_score'])
        ?: ($b['totalListings'] <=> $a['totalListings'])
        ?: ($b['reviewCount'] <=> $a['reviewCount'])
        ?: strcmp($a['name'], $b['name'])
    );

    $matched = array_values(array_filter($merchants, fn (array $merchant): bool => (int) $merchant['_score'] > 0));
    $selected = array_slice($matched ?: $merchants, 0, $matched ? 20 : 12);
    $selected = array_map(function (array $merchant): array {
        unset($merchant['_score']);
        return $merchant;
    }, $selected);

    return aiHelpAttachMerchantReviews($db, $selected);
}

function aiHelpAttachMerchantReviews(PDO $db, array $merchants): array {
    $merchantIds = array_values(array_unique(array_filter(
        array_map(fn (array $merchant): int => (int) ($merchant['id'] ?? 0), $merchants),
        fn (int $id): bool => $id > 0
    )));
    if (!$merchantIds) {
        return $merchants;
    }

    $placeholders = implode(',', array_fill(0, count($merchantIds), '?'));
    $stmt = $db->prepare(
        "SELECT o.MERCHANT_ID, o.OFFERING_NAME, r.RATING, r.DESCRIPTION, r.REVIEWED_ON,
                COALESCE(c.DISPLAY_NAME, TRIM(CONCAT(u.FNAME, ' ', u.LNAME)), 'Customer') AS customer_name
         FROM REVIEW r
         INNER JOIN OFFERING o ON o.OFFERING_ID = r.OFFERING_ID
         INNER JOIN CUSTOMER c ON c.CUSTOMER_ID = r.CUSTOMER_ID
         INNER JOIN USERS u ON u.USER_ID = c.CUSTOMER_ID
         WHERE o.MERCHANT_ID IN ({$placeholders})
         ORDER BY o.MERCHANT_ID ASC, r.REVIEWED_ON DESC, r.REVIEW_ID DESC"
    );
    $stmt->execute($merchantIds);

    $reviewsByMerchant = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $merchantId = (int) $row['MERCHANT_ID'];
        if (count($reviewsByMerchant[$merchantId] ?? []) >= 3) {
            continue;
        }
        $reviewsByMerchant[$merchantId][] = [
            'listing' => aiHelpString($row['OFFERING_NAME'] ?? '', 80),
            'rating' => (int) $row['RATING'],
            'description' => aiHelpString($row['DESCRIPTION'] ?? '', 180),
            'customer' => aiHelpString($row['customer_name'] ?? 'Customer', 60),
            'reviewedOn' => aiHelpString($row['REVIEWED_ON'] ?? '', 30),
        ];
    }

    foreach ($merchants as &$merchant) {
        $merchant['recentReviews'] = $reviewsByMerchant[(int) ($merchant['id'] ?? 0)] ?? [];
    }
    unset($merchant);

    return $merchants;
}

function aiHelpMessages(array $input): array {
    $messages = $input['messages'] ?? [];
    if (!is_array($messages)) {
        return [];
    }

    $clean = [];
    foreach (array_slice($messages, -6) as $message) {
        if (!is_array($message)) {
            continue;
        }
        $role = ($message['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
        $content = aiHelpString($message['content'] ?? '', 700);
        if ($content === '') {
            continue;
        }
        $clean[] = ['role' => $role, 'content' => $content];
    }

    return $clean;
}

try {
    $apiKey = trim((string) getenv('GROQ_API_KEY'));
    if ($apiKey === '') {
        jsonResponse(['error' => 'Groq API key is not configured.'], 500);
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
    $merchants = aiHelpMerchantList($db, $latestUserMessage);
    $model = trim((string) getenv('GROQ_MODEL')) ?: 'llama-3.1-8b-instant';
    $catalogItems = $catalog['items'] ?? [];
    $publicContext = [
        'listings' => $catalogItems,
        'merchants' => $merchants,
    ];

    $payload = [
        'model' => $model,
        'messages' => array_merge([
            [
                'role' => 'system',
                'content' =>
                    "You are IskoMart's product and service help assistant. " .
                    "You provide read-only guidance about public IskoMart listings and merchants. " .
                    "For listing, price, discount, review, merchant, stock, slot, and availability questions, use only the public IskoMart context JSON provided in this request. " .
                    "You have read-only access to public product listings, service listings, listing reviews, merchant summaries, merchant review summaries, active listing discounts, and listed prices. " .
                    "You cannot checkout, book services, edit carts, manage wishlists, apply vouchers, place orders, message merchants, or change account data. " .
                    "You do not have access to vouchers, voucher codes, accounts, carts, orders, passwords, private merchant data, or the database. Never answer voucher questions with voucher details. " .
                    "Do not invent listings, prices, discounts, reviews, stock, slots, merchants, or availability. " .
                    "If the user asks about a listing that is not in the catalog, say it is not currently shown in the available listings, then suggest close alternatives from the catalog when possible. " .
                    "When asked for a product or service, recommend the closest matching catalog item and include the current price after active item discount. " .
                    "If an item has a discount, mention the original price and discount label. " .
                    "When asked about reviews, summarize the average rating, review count, and recent review comments from the context only. " .
                    "When asked about merchants, mention product count, service count, total listings, rating, review count, and recent merchant reviews when present. " .
                    "Example catalog answer: Test Item from LighthalStore is ₱900.00 after discount. It was ₱1,000.00 with -₱100 off. " .
                    "Format listing answers with short plain-text lines, not markdown tables. Put each detail on its own bullet line. " .
                    "For greetings, small talk, and non-catalog help questions, answer normally without saying there is no matching listing. " .
                    "Use the ₱ symbol for peso amounts. Keep replies concise."
            ],
            [
                'role' => 'system',
                'content' => 'Public IskoMart context JSON: ' . json_encode($publicContext, JSON_UNESCAPED_SLASHES)
            ],
        ], $messages),
        'temperature' => 0.2,
        'max_tokens' => 350,
    ];

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'User-Agent: IskoMart Local Help Chat',
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
        logApiError(new RuntimeException('Groq connection failed: ' . $curlError));
        if (aiHelpDebugEnabled()) {
            jsonResponse([
                'error' => 'AI service is unavailable.',
                'debug' => [
                    'status' => 0,
                    'message' => aiHelpString($curlError ?: 'No response from Groq.', 500),
                ],
            ], 502);
        }
        jsonResponse(['error' => 'AI service is unavailable.'], 502);
    }

    $decoded = json_decode($raw, true);
    if ($status < 200 || $status >= 300) {
        logApiError(new RuntimeException('Groq request failed with HTTP ' . $status . ': ' . substr((string) $raw, 0, 500)));
        if (aiHelpDebugEnabled()) {
            $debugMessage = is_array($decoded)
                ? ($decoded['error']['message'] ?? 'AI service request failed.')
                : substr((string) $raw, 0, 500);
            jsonResponse([
                'error' => 'AI service request failed.',
                'debug' => [
                    'status' => $status,
                    'message' => aiHelpString($debugMessage, 500),
                ],
            ], 502);
        }
        jsonResponse(['error' => 'AI service request failed. Please try again later.'], 502);
    }

    $reply = aiHelpString($decoded['choices'][0]['message']['content'] ?? '', 3000);
    if ($reply === '') {
        $reply = 'I could not find a matching answer from the available listings.';
    }

    jsonResponse([
        'reply' => $reply,
        'catalogCount' => count($catalogItems),
        'source' => 'ai',
    ]);
} catch (Throwable $e) {
    logApiError($e);
    jsonResponse(['error' => 'Unable to process AI help request.'], 500);
}
