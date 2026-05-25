-- ============================================================
-- IskoMart Additional Seed Data (v2)
-- Run AFTER seed_data.sql. Safe to run multiple times.
-- All IDs start after the existing maximums:
--   users      max=8   -> new start at 9
--   merchant   max=7   -> new start at 8
--   customer   max=8   -> new start at 9
--   offering   max=12  -> new start at 13
--   product    max=7   -> new start at 8
--   service    max=12  -> new start at 13
--   orders     max=16  -> new start at 17
--   order_item max=18  -> new start at 19
--   dm         max=16  -> new start at 17
--   display_img max=12 -> new start at 13
--   allowed_pm max=24  -> new start at 25
--   pm         max=6   -> new start at 7
--   voucher    max=1   -> new start at 2
--   discount   max=1   -> new start at 2
--   address    max=1   -> new start at 2
-- ============================================================

-- ----------------------------------------------------------------
-- 1. New customer users
-- ----------------------------------------------------------------
-- Password for all: Password123!
INSERT INTO users (USER_ID, FNAME, LNAME, DOB, PHONE, EMAIL, USERNAME, GENDER, STATUS, PASSWORD_HASH, AVATAR_URL, CREATED_ON, ROLE) VALUES
(9,  'Marco',   'Reyes',    '2002-03-15', '+639171234501', 'marco.reyes@gmail.com',     'marcoreyes',   'MALE',   'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-01', 'CUS'),
(10, 'Lara',    'Santos',   '2003-07-22', '+639171234502', 'lara.santos@gmail.com',     'larasantos',   'FEMALE', 'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-02', 'CUS'),
(11, 'Carl',    'Dela Cruz','2001-11-08', '+639171234503', 'carl.delacruz@gmail.com',   'carldc',       'MALE',   'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-03', 'CUS'),
(12, 'Bianca',  'Flores',   '2002-09-30', '+639171234504', 'bianca.flores@gmail.com',   'biancaflores', 'FEMALE', 'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-04', 'CUS'),
(13, 'Diego',   'Villanueva','2000-05-17','+639171234505', 'diego.villaneva@gmail.com', 'diegoville',   'MALE',   'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-05', 'CUS')
ON DUPLICATE KEY UPDATE FNAME=VALUES(FNAME);

-- customer profile rows
INSERT INTO customer (CUSTOMER_ID, DISPLAY_NAME, BIO) VALUES
(9,  'Marco Reyes',     'BU IT student. Love gadgets and coffee.'),
(10, 'Lara Santos',     'Future nurse. Into skincare and fashion.'),
(11, 'Carl Dela Cruz',  'Aspiring developer. Always buying snacks.'),
(12, 'Bianca Flores',   'Design enthusiast and art lover.'),
(13, 'Diego Villanueva','CS student. Always looking for good deals.')
ON DUPLICATE KEY UPDATE DISPLAY_NAME=VALUES(DISPLAY_NAME);

-- ----------------------------------------------------------------
-- 2. New merchant users
-- ----------------------------------------------------------------
INSERT INTO users (USER_ID, FNAME, LNAME, DOB, PHONE, EMAIL, USERNAME, GENDER, STATUS, PASSWORD_HASH, AVATAR_URL, CREATED_ON, ROLE) VALUES
(14, 'Rina',  'Bautista', '2001-02-14', '+639281234501', 'eatsbybrina@bicol-u.edu.ph', 'eatsbybrina', 'FEMALE', 'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-10', 'MRC'),
(15, 'Kevin', 'Morales',  '2000-08-25', '+639281234502', 'inkandcraft@bicol-u.edu.ph', 'inkandcraft', 'MALE',   'ACTIVE', '$2y$10$BYoew01ArWwFd4kHHk7NwOqKrEr0xP9mh0nPkke/buzhfZmoWiRUS', NULL, '2026-04-11', 'MRC')
ON DUPLICATE KEY UPDATE FNAME=VALUES(FNAME);

INSERT INTO merchant (MERCHANT_ID, BU_EMAIL, SHOP_NAME, SHOP_DESC, ADDRESS, STUDENT_NUM, ACCEPTS_COD, ACCEPTS_GCASH, ALLOW_MEETUP, ALLOW_DELIVERY, DELIVERY_FEE) VALUES
(14, 'eatsbybrina@bicol-u.edu.ph', 'Eats by Brina',   'Homemade Bicolano meals and snacks delivered around BU. Try our famous Laing and Bicol Express bento!', 'BU College of Allied Medicine, Legazpi City', '2023-5555-66666', 1, 1, 1, 1, 20),
(15, 'inkandcraft@bicol-u.edu.ph', 'Ink & Craft PH',  'Custom stickers, planner supplies, hand-lettered cards, and artsy accessories made by a BU Fine Arts student.', 'BU College of Arts & Letters, Legazpi City', '2023-7777-88888', 1, 1, 1, 0, 0)
ON DUPLICATE KEY UPDATE SHOP_NAME=VALUES(SHOP_NAME);

-- payment methods for new merchants
INSERT INTO payment_method (PM_ID, SERVICE, LINK, QR_URL, NUMBER, USERNAME, OTHER, MERCHANT_ID) VALUES
(7,  'COD / Cash on Delivery', NULL, NULL, NULL,          NULL,          'Cash on campus meetup or delivery.',                2),
(8,  'GCash',                  NULL, NULL, '09281234501', 'Rina Bautista', NULL,                                           14),
(9,  'COD / Cash on Delivery', NULL, NULL, NULL,          NULL,          'Cash on campus meetup.',                          15),
(10, 'GCash',                  NULL, NULL, '09281234502', 'Kevin Morales', NULL,                                           15)
ON DUPLICATE KEY UPDATE NUMBER=VALUES(NUMBER);

-- ----------------------------------------------------------------
-- 3. New offerings - products
-- ----------------------------------------------------------------
INSERT INTO offering (OFFERING_ID, OFFERING_NAME, OFFERING_TYPE, AVAIL_STATUS, OFFERING_DESC, MERCHANT_ID) VALUES
(13, 'Laing & Bicol Express Bento',          'P', 'Active', 'Classic Bicolano bento box featuring authentic Laing and Bicol Express paired with steamed rice. Order by 9AM for lunch delivery.', 14),
(14, 'Pili Polvoron (6 pcs)',                'P', 'Active', 'Buttery, melt-in-your-mouth polvoron made with roasted Bicol pili nuts. Perfect pasalubong or snack gift.', 14),
(15, 'Custom Holographic Sticker Set (10pcs)','P', 'Active', 'Personalized or pre-designed holographic sticker pack. Waterproof, durable, and perfect for laptops, planners, and water bottles.', 15),
(16, 'A5 Planner Kit (Weekly)',              'P', 'Active', 'Hand-assembled A5 weekly planner kit: refill sheets, sticker tabs, washi tape strips, and a bookmark. Great for organized students.', 15),
(17, 'Hand-lettered Greeting Card',         'P', 'Active', 'Personalized hand-lettered card for any occasion — birthday, graduation, valentines, or just because. Include your message at checkout.', 15),
(18, 'BU CS Department Tote Bag',           'P', 'Active', 'Heavy canvas tote bag with the BU Computer Science Department crest. Fits a 13-inch laptop. Durable and stylish for everyday campus use.', 7),
(19, 'Wireless Earbuds (TWS)',              'P', 'Active', 'True wireless stereo earbuds with 5-hour battery life, passive noise isolation, and quick-pair Bluetooth 5.3. Compatible with all devices.', 6),
(20, 'USB-C 65W Fast Charger',              'P', 'Active', '65W GaN USB-C fast charger with foldable plug. Charges laptops, tablets, and phones. Compact and perfect for students on the go.', 6)
ON DUPLICATE KEY UPDATE OFFERING_NAME=VALUES(OFFERING_NAME);

-- product detail rows (PROD_ID = OFFERING_ID for products)
INSERT INTO product (PROD_ID, PRICE, PROD_DESC, STOCK_QTY, IS_PREORDER, POSTED_ON, STATUS, MERCHANT_ID, PRODSUBCAT_ID) VALUES
(13, 180, 'Classic Bicolano bento box featuring authentic Laing and Bicol Express. Order by 9AM.', 20, 0, NOW(), 'Active', 14, 26),
(14, 110, 'Buttery pili polvoron 6-piece box, made fresh per batch.', 40, 0, NOW(), 'Active', 14, 23),
(15,  90, 'Custom holographic sticker set, 10 pieces, waterproof.', 50, 0, NOW(), 'Active', 15, 21),
(16, 250, 'A5 weekly planner kit with tabs, washi tape, and sticker sheets.', 15, 0, NOW(), 'Active', 15, 21),
(17,  80, 'Hand-lettered greeting card, personalized message.', 30, 0, NOW(), 'Active', 15, 21),
(18, 280, 'Heavy canvas BU CS Department tote bag, fits 13-inch laptop.', 18, 0, NOW(), 'Active', 7,  9),
(19, 599, 'True wireless earbuds Bluetooth 5.3, 5-hour battery.', 12, 0, NOW(), 'Active', 6,  3),
(20, 420, '65W GaN USB-C fast charger, foldable plug.', 20, 0, NOW(), 'Active', 6,  2)
ON DUPLICATE KEY UPDATE PRICE=VALUES(PRICE);

-- ----------------------------------------------------------------
-- 4. New offerings - services
-- ----------------------------------------------------------------
INSERT INTO offering (OFFERING_ID, OFFERING_NAME, OFFERING_TYPE, AVAIL_STATUS, OFFERING_DESC, MERCHANT_ID) VALUES
(21, 'Resume & Portfolio Review',           'S', 'Active', 'Get a professional review of your resume or design portfolio. Includes written feedback and an optional 30-min video call with suggestions.', 15),
(22, 'Custom Cake / Pastry Order',          'S', 'Active', 'Order custom-designed cakes, cupcakes, or pastries for any occasion. At least 3 days advance notice required. Price varies by size and design.', 14),
(23, 'Python Script Automation (1 task)',   'S', 'Active', 'Need a repetitive task automated? Send the requirements and get a working Python script delivered within 24–48 hours.', 6),
(24, 'Laundry Pickup & Fold Service',       'S', 'Active', 'Drop off your laundry and pick it up washed, dried, and folded. Campus collection points available. Per kilo pricing.', 14)
ON DUPLICATE KEY UPDATE OFFERING_NAME=VALUES(OFFERING_NAME);

INSERT INTO service (SERVICE_ID, SER_DESC, PRICE, DEPOSIT, SLOTS, STATUS, DELIVERY_METHOD, POSTED_ON, MERCHANT_ID, SERSUBCAT_ID) VALUES
(21, 'Resume or portfolio review with written feedback and optional video call.', 199,  0, 5, 'Active', 'Online / Chat',  NOW(), 15, 2),
(22, 'Custom-designed cake or pastry, 3-day advance notice required.',           350, 100, 3, 'Active', 'Meetup / Campus',NOW(), 14, 1),
(23, 'Python automation script for one defined task, delivered in 24–48 hours.', 300,   0, 4, 'Active', 'Online',         NOW(), 6,  1),
(24, 'Laundry wash, dry, and fold service. Per kilo, campus pickup available.',   60,   0, 8, 'Active', 'Meetup / Campus',NOW(), 14, 5)
ON DUPLICATE KEY UPDATE PRICE=VALUES(PRICE);

-- ----------------------------------------------------------------
-- 5. Display images for new offerings
-- ----------------------------------------------------------------
INSERT INTO display_img (DISPLAY_IMG_ID, IMAGE_URL, IS_DEFAULT, OFFERING_ID) VALUES
(13, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500', 1, 13),
(14, 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500', 1, 14),
(15, 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=500', 1, 15),
(16, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500', 1, 16),
(17, 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=500', 1, 17),
(18, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 1, 18),
(19, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 1, 19),
(20, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500', 1, 20),
(21, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500', 1, 21),
(22, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 1, 22),
(23, 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=500', 1, 23),
(24, 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=500', 1, 24)
ON DUPLICATE KEY UPDATE IMAGE_URL=VALUES(IMAGE_URL);

-- ----------------------------------------------------------------
-- 6. Delivery methods for new products
-- ----------------------------------------------------------------
INSERT INTO delivery_method (DM_ID, DM_NAME, DM_FEE, DM_PROVIDER, NOTE, PROD_ID) VALUES
(17, 'Campus Meetup',    0,  'Self',         'Meetup at CAM Building',               13),
(18, 'Campus Delivery', 20,  'Campus Rider', 'Delivery within BU campus, 2-hour window', 13),
(19, 'Campus Meetup',    0,  'Self',         'Meetup at CAM Building',               14),
(20, 'Campus Delivery', 15,  'Campus Rider', 'Delivery within BU campus',            14),
(21, 'Campus Meetup',    0,  'Self',         'Meetup at CAL Building',               15),
(22, 'Campus Delivery', 15,  'Campus Rider', 'Delivery within BU campus',            15),
(23, 'Campus Meetup',    0,  'Self',         'Meetup at CAL Building',               16),
(24, 'Campus Delivery', 15,  'Campus Rider', 'Delivery within BU campus',            16),
(25, 'Campus Meetup',    0,  'Self',         'Meetup at CAL Building',               17),
(26, 'Campus Meetup',    0,  'Self',         'Meetup at BU Main',                    18),
(27, 'Campus Delivery', 30,  'Campus Rider', 'Delivery within BU campus',            18),
(28, 'Campus Meetup',    0,  'Self',         'Meetup at BU CS Building',             19),
(29, 'Campus Delivery', 35,  'Campus Rider', 'Delivery within BU campus',            19),
(30, 'Campus Meetup',    0,  'Self',         'Meetup at BU CS Building',             20),
(31, 'Campus Delivery', 35,  'Campus Rider', 'Delivery within BU campus',            20)
ON DUPLICATE KEY UPDATE DM_NAME=VALUES(DM_NAME);

-- ----------------------------------------------------------------
-- 7. Allowed payment methods for new offerings
-- ----------------------------------------------------------------
INSERT INTO allowed_payment (ALLOWED_PM_ID, STATUS, PM_ID, OFFERING_ID) VALUES
-- Merchant 14 (Eats by Brina) - PM_ID 8 (GCash), 7 (COD)
(25, 'ACTIVE', 7, 13),
(26, 'ACTIVE', 8, 13),
(27, 'ACTIVE', 7, 14),
(28, 'ACTIVE', 8, 14),
-- Merchant 15 (Ink & Craft PH) - PM_ID 9 (COD), 10 (GCash)
(29, 'ACTIVE', 9,  15),
(30, 'ACTIVE', 10, 15),
(31, 'ACTIVE', 9,  16),
(32, 'ACTIVE', 10, 16),
(33, 'ACTIVE', 9,  17),
(34, 'ACTIVE', 10, 17),
-- Merchant 7 (Streetwear Corner) PM_ID 5 (COD), 6 (GCash)
(35, 'ACTIVE', 5, 18),
(36, 'ACTIVE', 6, 18),
-- Merchant 6 (BU Tech Hub) PM_ID 3 (COD), 4 (GCash)
(37, 'ACTIVE', 3, 19),
(38, 'ACTIVE', 4, 19),
(39, 'ACTIVE', 3, 20),
(40, 'ACTIVE', 4, 20),
-- Services
(41, 'ACTIVE', 9,  21),
(42, 'ACTIVE', 10, 21),
(43, 'ACTIVE', 7,  22),
(44, 'ACTIVE', 8,  22),
(45, 'ACTIVE', 3,  23),
(46, 'ACTIVE', 4,  23),
(47, 'ACTIVE', 7,  24),
(48, 'ACTIVE', 8,  24)
ON DUPLICATE KEY UPDATE STATUS=VALUES(STATUS);

-- ----------------------------------------------------------------
-- 8. Completed orders to fill up dashboard analytics
-- ----------------------------------------------------------------
INSERT INTO orders (ORDER_ID, ORDERED_ON, TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECEIVED_ON, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, CUSTOMER_ID, DM_ID) VALUES
-- Merchant 2 (Sari Sari Store) orders
(17, DATE_SUB(NOW(), INTERVAL 14 DAY), 150,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Delivered', 9,  3),
(18, DATE_SUB(NOW(), INTERVAL 13 DAY), 198,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Delivered', 10, 4),
(19, DATE_SUB(NOW(), INTERVAL 12 DAY), 99,   'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Carl Dela Cruz',  '+639171234503', 'BU East Annex',  0,    'Delivered', 11, 3),
(20, DATE_SUB(NOW(), INTERVAL 11 DAY), 75,   'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bianca Flores',   '+639171234504', 'BU West Wing',   0,    'Delivered', 12, 3),
(21, DATE_SUB(NOW(), INTERVAL 9 DAY),  240,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 8 DAY),  'Diego Villanueva','+639171234505', 'BU Library Area',0,    'Delivered', 13, 4),
(22, DATE_SUB(NOW(), INTERVAL 6 DAY),  99,   'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 5 DAY),  'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Delivered', 9,  3),
(23, DATE_SUB(NOW(), INTERVAL 2 DAY),  195,  'Pending',   'Pending', NULL,                          'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Pending',   10, 4),

-- Merchant 6 (BU Tech Hub) orders
(24, DATE_SUB(NOW(), INTERVAL 13 DAY), 1198, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Diego Villanueva','+639171234505', 'BU Library Area',0,    'Delivered', 13, 11),
(25, DATE_SUB(NOW(), INTERVAL 10 DAY), 420,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY),  'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Delivered', 9,  11),
(26, DATE_SUB(NOW(), INTERVAL 8 DAY),  599,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 7 DAY),  'Carl Dela Cruz',  '+639171234503', 'BU East Annex',  0,    'Delivered', 11, 12),
(27, DATE_SUB(NOW(), INTERVAL 5 DAY),  1019, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 4 DAY),  'Bianca Flores',   '+639171234504', 'BU West Wing',   0,    'Delivered', 12, 11),
(28, DATE_SUB(NOW(), INTERVAL 1 DAY),  840,  'Preparing', 'Paid', NULL,                             'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Pending',   10, 12),

-- Merchant 7 (Streetwear Corner) orders
(29, DATE_SUB(NOW(), INTERVAL 12 DAY), 560,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Delivered', 10, 5),
(30, DATE_SUB(NOW(), INTERVAL 10 DAY), 280,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY),  'Carl Dela Cruz',  '+639171234503', 'BU East Annex',  0,    'Delivered', 11, 7),
(31, DATE_SUB(NOW(), INTERVAL 7 DAY),  930,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 6 DAY),  'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Delivered', 9,  5),
(32, DATE_SUB(NOW(), INTERVAL 4 DAY),  650,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 3 DAY),  'Diego Villanueva','+639171234505', 'BU Library Area',0,    'Delivered', 13, 6),
(33, NOW(),                            280,  'Pending',   'Pending', NULL,                          'Bianca Flores',   '+639171234504', 'BU West Wing',   0,    'Pending',   12, 5),

-- Merchant 14 (Eats by Brina) orders
(34, DATE_SUB(NOW(), INTERVAL 11 DAY), 360,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Delivered', 9,  17),
(35, DATE_SUB(NOW(), INTERVAL 9 DAY),  220,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY),  'Angela Castillo', '+639123456701', 'BU Dorm A',      0,    'Delivered', 4,  18),
(36, DATE_SUB(NOW(), INTERVAL 7 DAY),  180,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 7 DAY),  'Bianca Flores',   '+639171234504', 'BU West Wing',   0,    'Delivered', 12, 17),
(37, DATE_SUB(NOW(), INTERVAL 5 DAY),  540,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 5 DAY),  'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Delivered', 10, 17),
(38, DATE_SUB(NOW(), INTERVAL 3 DAY),  400,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 3 DAY),  'Carl Dela Cruz',  '+639171234503', 'BU East Annex',  0,    'Delivered', 11, 18),
(39, DATE_SUB(NOW(), INTERVAL 1 DAY),  180,  'Preparing', 'Paid', NULL,                             'Diego Villanueva','+639171234505', 'BU Library Area',0,    'Pending',   13, 17),
(40, NOW(),                            110,  'Pending',   'Pending', NULL,                          'Marco Reyes',     '+639171234501', 'BU Dorm C',      0,    'Pending',   9,  19),

-- Merchant 15 (Ink & Craft PH) orders
(41, DATE_SUB(NOW(), INTERVAL 10 DAY), 250,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY),  'Lara Santos',     '+639171234502', 'BU Dorm D',      0,    'Delivered', 10, 21),
(42, DATE_SUB(NOW(), INTERVAL 8 DAY),  170,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 7 DAY),  'Jazmin Nator',    '+639123456702', 'BU Dorm B',      0,    'Delivered', 5,  23),
(43, DATE_SUB(NOW(), INTERVAL 6 DAY),  90,   'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 5 DAY),  'Bianca Flores',   '+639171234504', 'BU West Wing',   0,    'Delivered', 12, 21),
(44, DATE_SUB(NOW(), INTERVAL 3 DAY),  330,  'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 2 DAY),  'Angela Castillo', '+639123456701', 'BU Dorm A',      0,    'Delivered', 4,  23),
(45, DATE_SUB(NOW(), INTERVAL 1 DAY),  80,   'Pending',   'Pending', NULL,                          'Carl Dela Cruz',  '+639171234503', 'BU East Annex',  0,    'Pending',   11, 25)
ON DUPLICATE KEY UPDATE ORDER_STATUS=VALUES(ORDER_STATUS);

-- ----------------------------------------------------------------
-- 9. Order items
-- ----------------------------------------------------------------
INSERT INTO order_item (ORDERITEM_ID, PRICE, QUANTITY, ORDER_ID, PRODUCT_ID) VALUES
-- Merchant 2 orders
(19, 75,  2,  17, 1),   -- Bracelet x2
(20, 99,  2,  18, 7),   -- Lip Balm x2
(21, 99,  1,  19, 7),   -- Lip Balm x1
(22, 75,  1,  20, 1),   -- Bracelet x1
(23, 120, 2,  21, 4),   -- Snack Pack x2
(24, 99,  1,  22, 7),   -- Lip Balm x1
(25, 120, 1,  23, 4),   -- Snack Pack x1
(26, 75,  1,  23, 1),   -- Bracelet x1
-- Merchant 6 orders
(27, 599, 1,  24, 19),  -- Earbuds x1
(28, 599, 1,  24, 19),  -- Earbuds x1 (qty bug test: 2 rows)
(29, 420, 1,  25, 20),  -- Charger x1
(30, 599, 1,  26, 19),  -- Earbuds x1
(31, 420, 1,  27, 20),  -- Charger x1
(32, 599, 1,  27, 19),  -- Earbuds x1
(33, 420, 2,  28, 20),  -- Charger x2
-- Merchant 7 orders
(34, 280, 2,  29, 18),  -- Tote Bag x2
(35, 280, 1,  30, 18),  -- Tote Bag x1
(36, 650, 1,  31, 2),   -- BU Hoodie x1
(37, 280, 1,  31, 18),  -- Tote Bag x1
(38, 650, 1,  32, 2),   -- BU Hoodie x1
(39, 280, 1,  33, 18),  -- Tote Bag x1
-- Merchant 14 orders (Eats by Brina)
(40, 180, 2,  34, 13),  -- Bento x2
(41, 110, 2,  35, 14),  -- Polvoron x2
(42, 180, 1,  36, 13),  -- Bento x1
(43, 180, 3,  37, 13),  -- Bento x3
(44, 110, 2,  38, 14),  -- Polvoron x2
(45, 180, 1,  39, 13),  -- Bento x1 (active)
(46, 110, 1,  40, 14),  -- Polvoron x1 (pending)
-- Merchant 15 orders (Ink & Craft)
(47, 250, 1,  41, 16),  -- Planner Kit x1
(48, 90,  1,  42, 15),  -- Sticker Set x1
(49, 80,  1,  42, 17),  -- Greeting Card x1
(50, 90,  1,  43, 15),  -- Sticker Set x1
(51, 250, 1,  44, 16),  -- Planner Kit x1
(52, 80,  1,  44, 17),  -- Greeting Card x1
(53, 80,  1,  45, 17)   -- Greeting Card x1 (pending)
ON DUPLICATE KEY UPDATE PRICE=VALUES(PRICE);

-- ----------------------------------------------------------------
-- 10. Customer reviews (for completed orders only)
-- ----------------------------------------------------------------
INSERT INTO review (REVIEW_ID, RATING, DESCRIPTION, REVIEWED_ON, CUSTOMER_ID, OFFERING_ID, ORDER_ID, REQUEST_ID) VALUES
(1,  5, 'Love this bracelet! So pretty and well-made. Will buy again!',                        DATE_SUB(NOW(), INTERVAL 12 DAY), 9,  1,  17,  NULL),
(2,  4, 'Nice lip balm, smells great and moisturizes well.',                                    DATE_SUB(NOW(), INTERVAL 10 DAY), 10, 7,  18,  NULL),
(3,  5, 'Snack pack was delicious! Pili nuts are amazing.',                                     DATE_SUB(NOW(), INTERVAL 7 DAY),  13, 4,  21,  NULL),
(4,  5, 'Earbuds sound quality is great for the price. Fast delivery too!',                     DATE_SUB(NOW(), INTERVAL 11 DAY), 13, 19, 24,  NULL),
(5,  4, 'Charger works perfectly. Compact and fast. Highly recommend.',                         DATE_SUB(NOW(), INTERVAL 7 DAY),  9,  20, 25,  NULL),
(6,  5, 'Quality earbuds! Fits well and clear audio. Very satisfied.',                          DATE_SUB(NOW(), INTERVAL 6 DAY),  11, 19, 26,  NULL),
(7,  5, 'Hoodie is super comfy and the BU logo looks great!',                                   DATE_SUB(NOW(), INTERVAL 9 DAY),  10, 2,  29,  NULL),
(8,  5, 'Tote bag is sturdy and fits everything I need for class.',                             DATE_SUB(NOW(), INTERVAL 7 DAY),  11, 18, 30,  NULL),
(9,  4, 'Hoodie is good quality. Color is exactly as shown. Bit pricey but worth it.',          DATE_SUB(NOW(), INTERVAL 5 DAY),  9,  2,  31,  NULL),
(10, 5, 'Best Bicolano food on campus! Laing is authentic and delicious.',                      DATE_SUB(NOW(), INTERVAL 9 DAY),  9,  13, 34,  NULL),
(11, 4, 'Polvoron is yummy! A bit sweet for me but overall great snack.',                       DATE_SUB(NOW(), INTERVAL 7 DAY),  4,  14, 35,  NULL),
(12, 5, 'The bento is filling and tasty. Love the Bicol Express. Will order again!',            DATE_SUB(NOW(), INTERVAL 5 DAY),  12, 13, 36,  NULL),
(13, 5, 'Bento is consistently great. Fast and always on time.',                                DATE_SUB(NOW(), INTERVAL 3 DAY),  10, 13, 37,  NULL),
(14, 5, 'Planner kit is beautiful. Loved the washi tapes included!',                            DATE_SUB(NOW(), INTERVAL 7 DAY),  10, 16, 41,  NULL),
(15, 5, 'Sticker set is so aesthetic! Waterproof as advertised. Great quality.',                DATE_SUB(NOW(), INTERVAL 5 DAY),  5,  15, 42,  NULL),
(16, 4, 'Sticker set looks great on my laptop. A few had slight air bubbles but overall good.', DATE_SUB(NOW(), INTERVAL 3 DAY),  12, 15, 43,  NULL),
(17, 5, 'Planner kit exceeded expectations. Greeting card was so sweet too!',                   DATE_SUB(NOW(), INTERVAL 1 DAY),  4,  16, 44,  NULL)
ON DUPLICATE KEY UPDATE RATING=VALUES(RATING);

-- ----------------------------------------------------------------
-- 11. Vouchers for all active merchants
-- ----------------------------------------------------------------
INSERT INTO voucher (VOUCHER_ID, CODE, DISCOUNT_TYPE, DISCOUNT_VALUE, CAP, MIN_SPEND, USAGE_LIMIT, EXPIRY_DATE, STATUS, MERCHANT_ID) VALUES
(2,  'BRINA10',     'PERCENTAGE', 10,  50,  150, 20, DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE', 14),
(3,  'CRAFT15',     'PERCENTAGE', 15,  80,  200, 15, DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE', 15),
(4,  'TECHHUB50',   'FIXED',      50,  NULL, 300, 10, DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE', 6),
(5,  'SWEAR100',    'FIXED',      100, NULL, 500, 10, DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE', 7),
(6,  'SARISARI20',  'FIXED',      20,  NULL, 100, 30, DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE', 2),
(7,  'BRINA20',     'PERCENTAGE', 20,  100, 250, 5,  DATE_ADD(NOW(), INTERVAL 15 DAY), 'ACTIVE', 14),
(8,  'OPENINGDAY',  'PERCENTAGE', 25,  150, 300, 50, DATE_ADD(NOW(), INTERVAL 7 DAY),  'ACTIVE', 15)
ON DUPLICATE KEY UPDATE CODE=VALUES(CODE);

-- ----------------------------------------------------------------
-- 12. Discounts on popular products
-- ----------------------------------------------------------------
INSERT INTO discount (DISCOUNT_ID, TYPE, VALUE, START_DATE, END_DATE, STATUS, OFFERING_ID) VALUES
(2,  'PERCENTAGE', 10, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),  'ACTIVE', 13),
(3,  'PERCENTAGE', 15, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),  'ACTIVE', 15),
(4,  'PERCENTAGE', 10, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 'ACTIVE', 19),
(5,  'FIXED',      50, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY), 'ACTIVE', 16),
(6,  'PERCENTAGE', 20, NOW(),                           DATE_ADD(NOW(), INTERVAL 3 DAY),  'ACTIVE', 2)
ON DUPLICATE KEY UPDATE VALUE=VALUES(VALUE);

-- ----------------------------------------------------------------
-- 13. Address book for customers
-- ----------------------------------------------------------------
INSERT INTO address_book (ADD_ID, RECEPIENT_NAME, PHONE_NO, REGION, PROVINCE, MUNCIT, `SPECIFIC`, UNIT_FLOOR, POSTAL_CODE, ADDRESS_CAT, IS_DEFAULT, CUSTOMER_ID) VALUES
(2,  'Marco Reyes',      '+639171234501', 'Region V', 'Albay', 'Legazpi City', 'BU Dormitory C, Campus Rd', 'Room 203', '4500', 'Home',   1, 9),
(3,  'Lara Santos',      '+639171234502', 'Region V', 'Albay', 'Legazpi City', 'BU Dormitory D, Campus Rd', 'Room 115', '4500', 'Home',   1, 10),
(4,  'Carl Dela Cruz',   '+639171234503', 'Region V', 'Albay', 'Legazpi City', 'BU East Campus Annex',      'Room 301', '4500', 'School', 1, 11),
(5,  'Bianca Flores',    '+639171234504', 'Region V', 'Albay', 'Legazpi City', 'BU West Wing Dormitory',    'Room 210', '4500', 'Home',   1, 12),
(6,  'Diego Villanueva', '+639171234505', 'Region V', 'Albay', 'Legazpi City', 'Near BU Main Library',      'Boarding House B', '4500', 'Home', 1, 13),
(7,  'Angela Castillo',  '+639123456701', 'Region V', 'Albay', 'Legazpi City', 'BU Dormitory A, Campus Rd', 'Room 104', '4500', 'Home',   1, 4),
(8,  'Jazmin Nator',     '+639123456702', 'Region V', 'Albay', 'Legazpi City', 'BU Dormitory B, Campus Rd', 'Room 308', '4500', 'Home',   1, 5),
(9,  'Marco Reyes',      '+639171234501', 'Region V', 'Albay', 'Legazpi City', 'BU Engineering Building',   'Locker Area', '4500', 'School', 0, 9),
(10, 'Lara Santos',      '+639171234502', 'Region V', 'Albay', 'Legazpi City', 'BU College of Nursing',     NULL, '4500', 'School', 0, 10)
ON DUPLICATE KEY UPDATE RECEPIENT_NAME=VALUES(RECEPIENT_NAME);

-- ----------------------------------------------------------------
-- 14. Wishlists
-- ----------------------------------------------------------------
INSERT INTO customer_wishlist (WISHLIST_ID, CUSTOMER_ID, OFFERING_ID, ADDED_ON) VALUES
(1,  9,  2,  NOW()),
(2,  9,  19, NOW()),
(3,  10, 5,  NOW()),
(4,  10, 16, NOW()),
(5,  11, 6,  NOW()),
(6,  11, 13, NOW()),
(7,  12, 15, NOW()),
(8,  12, 2,  NOW()),
(9,  13, 20, NOW()),
(10, 13, 1,  NOW()),
(11, 4,  7,  NOW()),
(12, 5,  15, NOW()),
(13, 5,  16, NOW())
ON DUPLICATE KEY UPDATE ADDED_ON=VALUES(ADDED_ON);

-- ----------------------------------------------------------------
-- Done!
-- ----------------------------------------------------------------
SELECT CONCAT('Seed v2 complete. Users: ', (SELECT COUNT(*) FROM users),
  ', Merchants: ', (SELECT COUNT(*) FROM merchant),
  ', Offerings: ', (SELECT COUNT(*) FROM offering),
  ', Orders: ',    (SELECT COUNT(*) FROM orders),
  ', Reviews: ',   (SELECT COUNT(*) FROM review)) AS result;
