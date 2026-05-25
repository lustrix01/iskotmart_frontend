-- IskoMart Database Seeder
-- Populates categories, subcategories, merchants, products, services, allowed payments, delivery methods, display images, and mock orders to test the UI and dashboard.

-- 1. Insert service categories if not exist
INSERT INTO service_cat (SERCAT_ID, CAT_NAME) VALUES
(1, 'Academics & Tutoring'),
(2, 'Creative Services'),
(3, 'Tech Support'),
(4, 'Errands & Tasks')
ON DUPLICATE KEY UPDATE CAT_NAME=VALUES(CAT_NAME);

-- 2. Insert service subcategories if not exist
INSERT INTO service_subcat (SERSUBCAT_ID, SUBCAT_NAME, SERCAT_ID) VALUES
(1, 'Academics & Tutoring', 1),
(2, 'Graphic Design', 2),
(3, 'Video Editing', 2),
(4, 'Tech Support', 3),
(5, 'Errands & Tasks', 4)
ON DUPLICATE KEY UPDATE SUBCAT_NAME=VALUES(SUBCAT_NAME);

-- 3. Insert additional merchant users
-- Password hash is bcrypt for 'password123'
INSERT INTO users (USER_ID, FNAME, LNAME, DOB, PHONE, EMAIL, USERNAME, GENDER, STATUS, PASSWORD_HASH, AVATAR_URL, CREATED_ON, ROLE)
VALUES (6, 'John', 'Tech', '2001-01-01', '+639123456789', 'techhub@bicol-u.edu.ph', 'techhub', 'MALE', 'ACTIVE', '$2y$10$YHykDlGV27nKbZk59XUvReSjY.DLGWZb17EN34ZzRlL/fKpsetwRi', NULL, '2026-05-01', 'MRC')
ON DUPLICATE KEY UPDATE ROLE='MRC';

INSERT INTO merchant (MERCHANT_ID, BU_EMAIL, SHOP_NAME, SHOP_DESC, ADDRESS, STUDENT_NUM, ACCEPTS_COD, ACCEPTS_GCASH, ALLOW_MEETUP, ALLOW_DELIVERY, DELIVERY_FEE)
VALUES (6, 'techhub@bicol-u.edu.ph', 'BU Tech Hub', 'Your campus destination for electronics, gadgets, and software services.', 'BU CS Building, Legazpi City', '2023-1111-22222', 1, 1, 1, 1, 35)
ON DUPLICATE KEY UPDATE SHOP_NAME='BU Tech Hub';

INSERT INTO users (USER_ID, FNAME, LNAME, DOB, PHONE, EMAIL, USERNAME, GENDER, STATUS, PASSWORD_HASH, AVATAR_URL, CREATED_ON, ROLE)
VALUES (7, 'Sarah', 'Style', '2002-05-05', '+639123456780', 'streetwear@bicol-u.edu.ph', 'streetwear', 'FEMALE', 'ACTIVE', '$2y$10$YHykDlGV27nKbZk59XUvReSjY.DLGWZb17EN34ZzRlL/fKpsetwRi', NULL, '2026-05-01', 'MRC')
ON DUPLICATE KEY UPDATE ROLE='MRC';

INSERT INTO merchant (MERCHANT_ID, BU_EMAIL, SHOP_NAME, SHOP_DESC, ADDRESS, STUDENT_NUM, ACCEPTS_COD, ACCEPTS_GCASH, ALLOW_MEETUP, ALLOW_DELIVERY, DELIVERY_FEE)
VALUES (7, 'streetwear@bicol-u.edu.ph', 'Streetwear Corner', 'Aesthetic and thrifted clothing for students. Cool hoodies, bags, and accessories.', 'BU CAL Building, Legazpi City', '2023-3333-44444', 1, 1, 1, 1, 30)
ON DUPLICATE KEY UPDATE SHOP_NAME='Streetwear Corner';

-- 4. Clean up existing offerings, products, services, allowed_payment, delivery_method, display_img, order_item, orders, payments
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE allowed_payment;
TRUNCATE TABLE delivery_method;
TRUNCATE TABLE display_img;
TRUNCATE TABLE order_item;
TRUNCATE TABLE orders;
TRUNCATE TABLE payment;
TRUNCATE TABLE review;
TRUNCATE TABLE review_attach;
TRUNCATE TABLE customer_wishlist;
TRUNCATE TABLE user_likes;
TRUNCATE TABLE product;
TRUNCATE TABLE service;
TRUNCATE TABLE offering;
SET FOREIGN_KEY_CHECKS = 1;

-- 5. Insert payment methods for merchants
INSERT INTO payment_method (PM_ID, SERVICE, LINK, QR_URL, NUMBER, USERNAME, OTHER, MERCHANT_ID) VALUES
(1, 'COD / Cash on Delivery', NULL, NULL, NULL, NULL, 'Cash payment on delivery or meetup.', 2),
(2, 'GCash', NULL, NULL, '09998887777', 'Owhie Santillan', NULL, 2),
(3, 'COD / Cash on Delivery', NULL, NULL, NULL, NULL, 'Cash payment on delivery or meetup.', 6),
(4, 'GCash', NULL, NULL, '09123456789', 'John Tech', NULL, 6),
(5, 'COD / Cash on Delivery', NULL, NULL, NULL, NULL, 'Cash payment on delivery or meetup.', 7),
(6, 'GCash', NULL, NULL, '09123456780', 'Sarah Style', NULL, 7)
ON DUPLICATE KEY UPDATE NUMBER=VALUES(NUMBER), USERNAME=VALUES(USERNAME);

-- 6. Insert offerings (products & services)
INSERT INTO offering (OFFERING_ID, OFFERING_NAME, OFFERING_TYPE, AVAIL_STATUS, OFFERING_DESC, MERCHANT_ID) VALUES
(1, 'Handmade Beaded Bracelet', 'P', 'Active', 'Stunning hand-crafted beaded bracelets. Multiple colors available. Perfect accessory for any outfit.', 2),
(2, 'Legit BU Hoodie', 'P', 'Active', 'High-quality cotton hoodie featuring Bicol University branding. Warm, cozy, and perfect for cold classrooms.', 7),
(3, 'Handwoven Bicol Abaca Bag', 'P', 'Active', 'Eco-friendly and durable handbag made from authentic Bicol abaca fibers. Perfect for books and everyday use.', 7),
(4, 'Sari-Sari Snack Pack (Pili Nuts & Taro Chips)', 'P', 'Active', 'A delicious combo of local Albay Pili Nuts and crunchy Taro Chips. Great for study break snacking.', 2),
(5, 'Ergonomic LED Study Lamp', 'P', 'Active', 'Rechargeable LED desk lamp with adjustable brightness levels and flexible neck. Ideal for late-night review sessions.', 6),
(6, 'Wireless Ergonomic Mouse', 'P', 'Active', '2.4GHz silent wireless mouse with adjustable DPI. Sleek design, long battery life, compatible with all laptops.', 6),
(7, 'Organic Matte Lip Balm', 'P', 'Active', '100% natural, moisturizing lip balm with a subtle matte finish. Made with shea butter and coconut oil.', 2),
(8, 'Python & Web Development Tutoring', 'S', 'Active', 'One-on-one tutoring sessions for Python, JavaScript, React, and general computer programming. 1 hour per session.', 6),
(9, 'Custom Logo & Graphic Design', 'S', 'Active', 'Professional custom logo, banner, or social media graphics designed to your specifications. Includes 3 revisions.', 7),
(10, 'PC Cleaning & OS Reinstallation', 'S', 'Active', 'Slow laptop? Get complete internal dust cleaning, thermal paste replacement, and fresh OS installation.', 6),
(11, 'Dorm Moving & Errand Services', 'S', 'Active', 'Need help moving your things to a new dorm or boarding house? We provide reliable help and campus deliveries.', 7),
(12, 'Professional Video Editing', 'S', 'Active', 'High-quality video editing for school projects, vlogs, presentations, or social media. Rate per minute of final video.', 7);

-- 7. Insert corresponding product details
INSERT INTO product (PROD_ID, PRICE, PROD_DESC, STOCK_QTY, IS_PREORDER, POSTED_ON, STATUS, MERCHANT_ID, PRODSUBCAT_ID) VALUES
(1, 75, 'Stunning hand-crafted beaded bracelets. Multiple colors available. Perfect accessory for any outfit.', 15, 0, NOW(), 'Active', 2, 9),
(2, 650, 'High-quality cotton hoodie featuring Bicol University branding. Warm, cozy, and perfect for cold classrooms.', 8, 0, NOW(), 'Active', 7, 6),
(3, 350, 'Eco-friendly and durable handbag made from authentic Bicol abaca fibers. Perfect for books and everyday use.', 12, 0, NOW(), 'Active', 7, 9),
(4, 120, 'A delicious combo of local Albay Pili Nuts and crunchy Taro Chips. Great for study break snacking.', 25, 0, NOW(), 'Active', 2, 23),
(5, 450, 'Rechargeable LED desk lamp with adjustable brightness levels and flexible neck. Ideal for late-night review sessions.', 6, 0, NOW(), 'Active', 6, 14),
(6, 299, '2.4GHz silent wireless mouse with adjustable DPI. Sleek design, long battery life, compatible with all laptops.', 10, 0, NOW(), 'Active', 6, 2),
(7, 99, '100% natural, moisturizing lip balm with a subtle matte finish. Made with shea butter and coconut oil.', 30, 0, NOW(), 'Active', 2, 15);

-- 8. Insert corresponding service details
INSERT INTO service (SERVICE_ID, SER_DESC, PRICE, DEPOSIT, SLOTS, STATUS, DELIVERY_METHOD, POSTED_ON, MERCHANT_ID, SERSUBCAT_ID) VALUES
(8, 'One-on-one tutoring sessions for Python, JavaScript, React, and general computer programming. 1 hour per session.', 250, 0, 4, 'Active', 'Online / Zoom', NOW(), 6, 1),
(9, 'Professional custom logo, banner, or social media graphics designed to your specifications. Includes 3 revisions.', 400, 100, 2, 'Active', 'Online', NOW(), 7, 2),
(10, 'Slow laptop? Get complete internal dust cleaning, thermal paste replacement, and fresh OS installation.', 500, 0, 3, 'Active', 'Meetup / Campus', NOW(), 6, 4),
(11, 'Need help moving your things to a new dorm or boarding house? We provide reliable help and campus deliveries.', 300, 0, 5, 'Active', 'Meetup / Local', NOW(), 7, 5),
(12, 'High-quality video editing for school projects, vlogs, presentations, or social media. Rate per minute of final video.', 150, 50, 3, 'Active', 'Online', NOW(), 7, 3);

-- 9. Insert display images
INSERT INTO display_img (DISPLAY_IMG_ID, IMAGE_URL, IS_DEFAULT, OFFERING_ID) VALUES
(1, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500', 1, 1),
(2, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 1, 2),
(3, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500', 1, 3),
(4, 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500', 1, 4),
(5, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 1, 5),
(6, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', 1, 6),
(7, 'https://images.unsplash.com/photo-1617897903246-719242758050?w=500', 1, 7),
(8, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500', 1, 8),
(9, 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500', 1, 9),
(10, 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500', 1, 10),
(11, 'https://images.unsplash.com/photo-1533512930330-4ac257c86793?w=500', 1, 11),
(12, 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=500', 1, 12);

-- 10. Insert delivery methods for products
INSERT INTO delivery_method (DM_ID, DM_NAME, DM_FEE, DM_PROVIDER, NOTE, PROD_ID) VALUES
(3, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 1),
(4, 'Campus Delivery', 15, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 1),
(5, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 2),
(6, 'Campus Delivery', 30, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 2),
(7, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 3),
(8, 'Campus Delivery', 30, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 3),
(9, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 4),
(10, 'Campus Delivery', 15, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 4),
(11, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 5),
(12, 'Campus Delivery', 35, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 5),
(13, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 6),
(14, 'Campus Delivery', 35, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 6),
(15, 'Campus Meetup', 0, 'Self', 'Meetup at BU CS or CAL Buildings', 7),
(16, 'Campus Delivery', 15, 'Campus Rider', 'Direct delivery to your BU classroom or dorm', 7);

-- 11. Insert allowed payment methods
-- Merchant 2 (PM_ID 1, 2)
INSERT INTO allowed_payment (ALLOWED_PM_ID, STATUS, PM_ID, OFFERING_ID) VALUES
(1, 'ACTIVE', 1, 1),
(2, 'ACTIVE', 2, 1),
(3, 'ACTIVE', 1, 4),
(4, 'ACTIVE', 2, 4),
(5, 'ACTIVE', 1, 7),
(6, 'ACTIVE', 2, 7);
-- Merchant 6 (PM_ID 3, 4)
INSERT INTO allowed_payment (ALLOWED_PM_ID, STATUS, PM_ID, OFFERING_ID) VALUES
(7, 'ACTIVE', 3, 5),
(8, 'ACTIVE', 4, 5),
(9, 'ACTIVE', 3, 6),
(10, 'ACTIVE', 4, 6),
(11, 'ACTIVE', 3, 8),
(12, 'ACTIVE', 4, 8),
(13, 'ACTIVE', 3, 10),
(14, 'ACTIVE', 4, 10);
-- Merchant 7 (PM_ID 5, 6)
INSERT INTO allowed_payment (ALLOWED_PM_ID, STATUS, PM_ID, OFFERING_ID) VALUES
(15, 'ACTIVE', 5, 2),
(16, 'ACTIVE', 6, 2),
(17, 'ACTIVE', 5, 3),
(18, 'ACTIVE', 6, 3),
(19, 'ACTIVE', 5, 9),
(20, 'ACTIVE', 6, 9),
(21, 'ACTIVE', 5, 11),
(22, 'ACTIVE', 6, 11),
(23, 'ACTIVE', 5, 12),
(24, 'ACTIVE', 6, 12);

-- 12. Insert mock orders to generate analytics graph points
-- Orders for Merchant 2 (Sari Sari Store, MERCHANT_ID=2)
-- Customers: 3, 4, 5
INSERT INTO orders (ORDER_ID, ORDERED_ON, TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECEIVED_ON, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, CUSTOMER_ID, DM_ID) VALUES
(1, DATE_SUB(NOW(), INTERVAL 10 DAY), 150, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Angela Castillo', '+639123456701', 'BU Dorm A', 0, 'Delivered', 4, 3),
(2, DATE_SUB(NOW(), INTERVAL 8 DAY), 240, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Jazmin Nator', '+639123456702', 'BU Dorm B', 0, 'Delivered', 5, 4),
(3, DATE_SUB(NOW(), INTERVAL 5 DAY), 99, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Delivered', 3, 3),
(4, DATE_SUB(NOW(), INTERVAL 3 DAY), 195, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Angela Castillo', '+639123456701', 'BU Dorm A', 0, 'Delivered', 4, 4),
(5, DATE_SUB(NOW(), INTERVAL 1 DAY), 75, 'Completed', 'Paid', NOW(), 'Jazmin Nator', '+639123456702', 'BU Dorm B', 0, 'Delivered', 5, 3),
(6, NOW(), 120, 'Pending', 'Pending', NULL, 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Pending', 3, 4);

INSERT INTO order_item (ORDERITEM_ID, PRICE, QUANTITY, ORDER_ID, PRODUCT_ID) VALUES
(1, 75, 2, 1, 1),
(2, 120, 2, 2, 4),
(3, 99, 1, 3, 7),
(4, 120, 1, 4, 4),
(5, 75, 1, 4, 1),
(6, 75, 1, 5, 1),
(7, 120, 1, 6, 4);

-- Orders for Merchant 6 (BU Tech Hub, MERCHANT_ID=6)
INSERT INTO orders (ORDER_ID, ORDERED_ON, TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECEIVED_ON, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, CUSTOMER_ID, DM_ID) VALUES
(7, DATE_SUB(NOW(), INTERVAL 12 DAY), 450, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Jazmin Nator', '+639123456702', 'BU Dorm B', 0, 'Delivered', 5, 11),
(8, DATE_SUB(NOW(), INTERVAL 9 DAY), 299, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Delivered', 3, 11),
(9, DATE_SUB(NOW(), INTERVAL 6 DAY), 897, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Angela Castillo', '+639123456701', 'BU Dorm A', 0, 'Delivered', 4, 12),
(10, DATE_SUB(NOW(), INTERVAL 2 DAY), 450, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Jazmin Nator', '+639123456702', 'BU Dorm B', 0, 'Delivered', 5, 11),
(11, NOW(), 299, 'Preparing', 'Paid', NULL, 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Pending', 3, 11);

INSERT INTO order_item (ORDERITEM_ID, PRICE, QUANTITY, ORDER_ID, PRODUCT_ID) VALUES
(8, 450, 1, 7, 5),
(9, 299, 1, 8, 6),
(10, 299, 3, 9, 6),
(11, 450, 1, 10, 5),
(12, 299, 1, 11, 6);

-- Orders for Merchant 7 (Streetwear Corner, MERCHANT_ID=7)
INSERT INTO orders (ORDER_ID, ORDERED_ON, TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, RECEIVED_ON, RECIPIENT_NAME, PHONE_NUM, ADDRESS, DISCOUNT_AMT, DELIVERY_STATUS, CUSTOMER_ID, DM_ID) VALUES
(12, DATE_SUB(NOW(), INTERVAL 15 DAY), 650, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Delivered', 3, 5),
(13, DATE_SUB(NOW(), INTERVAL 11 DAY), 350, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Angela Castillo', '+639123456701', 'BU Dorm A', 0, 'Delivered', 4, 5),
(14, DATE_SUB(NOW(), INTERVAL 7 DAY), 1350, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Jazmin Nator', '+639123456702', 'BU Dorm B', 0, 'Delivered', 5, 6),
(15, DATE_SUB(NOW(), INTERVAL 4 DAY), 650, 'Completed', 'Paid', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Owhie Lumbang', '+639123456703', 'BU East Campus', 0, 'Delivered', 3, 5),
(16, NOW(), 350, 'Pending', 'Pending', NULL, 'Angela Castillo', '+639123456701', 'BU Dorm A', 0, 'Pending', 4, 5);

INSERT INTO order_item (ORDERITEM_ID, PRICE, QUANTITY, ORDER_ID, PRODUCT_ID) VALUES
(13, 650, 1, 12, 2),
(14, 350, 1, 13, 3),
(15, 350, 2, 14, 3),
(16, 650, 1, 14, 2),
(17, 650, 1, 15, 2),
(18, 350, 1, 16, 3);
