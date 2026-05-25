-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 25, 2026 at 10:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `iskomartdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `address_book`
--

CREATE TABLE `address_book` (
  `ADD_ID` int(11) NOT NULL,
  `RECEPIENT_NAME` varchar(255) NOT NULL,
  `PHONE_NO` varchar(45) NOT NULL,
  `REGION` varchar(255) NOT NULL,
  `PROVINCE` varchar(255) NOT NULL,
  `MUNCIT` varchar(255) NOT NULL,
  `SPECIFIC` varchar(255) DEFAULT NULL,
  `UNIT_FLOOR` varchar(255) DEFAULT NULL,
  `POSTAL_CODE` varchar(45) DEFAULT NULL,
  `ADDRESS_CAT` varchar(255) DEFAULT NULL,
  `IS_DEFAULT` tinyint(4) DEFAULT NULL,
  `CUSTOMER_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `allowed_payment`
--

CREATE TABLE `allowed_payment` (
  `ALLOWED_PM_ID` int(11) NOT NULL,
  `STATUS` varchar(45) NOT NULL,
  `PM_ID` int(11) NOT NULL,
  `OFFERING_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `allowed_payment`
--

INSERT INTO `allowed_payment` (`ALLOWED_PM_ID`, `STATUS`, `PM_ID`, `OFFERING_ID`) VALUES
(1, 'ACTIVE', 1, 1),
(2, 'ACTIVE', 2, 1),
(3, 'ACTIVE', 1, 2),
(4, 'ACTIVE', 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `CUSTOMER_ID` int(11) NOT NULL,
  `DISPLAY_NAME` varchar(255) NOT NULL,
  `BIO` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`CUSTOMER_ID`, `DISPLAY_NAME`, `BIO`) VALUES
(2, 'Jazmin Erika Nator', NULL),
(3, 'Test Customer', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_wishlist`
--

CREATE TABLE `customer_wishlist` (
  `WISHLIST_ID` int(11) NOT NULL,
  `CUSTOMER_ID` int(11) NOT NULL,
  `OFFERING_ID` int(11) NOT NULL,
  `ADDED_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `customer_wishlist`
--

INSERT INTO `customer_wishlist` (`WISHLIST_ID`, `CUSTOMER_ID`, `OFFERING_ID`, `ADDED_ON`) VALUES
(1, 2, 1, '2026-05-18 23:30:47.4');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_method`
--

CREATE TABLE `delivery_method` (
  `DM_ID` int(11) NOT NULL,
  `DM_NAME` varchar(64) NOT NULL,
  `DM_FEE` double DEFAULT NULL,
  `DM_PROVIDER` varchar(255) DEFAULT NULL,
  `NOTE` tinytext DEFAULT NULL,
  `PROD_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `delivery_method`
--

INSERT INTO `delivery_method` (`DM_ID`, `DM_NAME`, `DM_FEE`, `DM_PROVIDER`, `NOTE`, `PROD_ID`) VALUES
(1, 'Campus Meetup', 0, 'Meetup', 'Default merchant fulfillment option', 1),
(2, 'Standard Delivery', 50, 'Campus Rider', 'Default merchant fulfillment option', 1);

-- --------------------------------------------------------

--
-- Table structure for table `discount`
--

CREATE TABLE `discount` (
  `DISCOUNT_ID` int(11) NOT NULL,
  `TYPE` varchar(45) NOT NULL,
  `VALUE` int(11) NOT NULL,
  `START_DATE` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `END_DATE` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `OFFERING_ID` int(11) NOT NULL,
  `STATUS` varchar(45) NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `discount`
--

INSERT INTO `discount` (`DISCOUNT_ID`, `TYPE`, `VALUE`, `START_DATE`, `END_DATE`, `OFFERING_ID`, `STATUS`) VALUES
(1, 'fixed', 20, '2026-05-18 00:00:00.0', '2026-05-24 23:59:59.0', 1, 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `display_img`
--

CREATE TABLE `display_img` (
  `DISPLAY_IMG_ID` int(11) NOT NULL,
  `IMAGE_URL` tinytext NOT NULL,
  `IS_DEFAULT` tinyint(4) NOT NULL DEFAULT 0,
  `OFFERING_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `display_img`
--

INSERT INTO `display_img` (`DISPLAY_IMG_ID`, `IMAGE_URL`, `IS_DEFAULT`, `OFFERING_ID`) VALUES
(1, '/api/uploads/offerings/offering-1-a2c45572a9241382a21b3b5c.jpg', 1, 1),
(2, '/api/uploads/offerings/offering-2-1d04bdf67567695f0ae888c1.jpg', 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `merchant`
--

CREATE TABLE `merchant` (
  `MERCHANT_ID` int(11) NOT NULL,
  `BU_EMAIL` varchar(255) NOT NULL,
  `SHOP_NAME` varchar(255) NOT NULL,
  `SHOP_DESC` text DEFAULT NULL,
  `SHOP_BANNER_URL` tinytext DEFAULT NULL,
  `ADDRESS` varchar(255) NOT NULL,
  `STUDENT_NUM` varchar(45) NOT NULL,
  `ID_IMAGE_URL` tinytext DEFAULT NULL,
  `ACCEPTS_COD` tinyint(1) NOT NULL DEFAULT 1,
  `ACCEPTS_GCASH` tinyint(1) NOT NULL DEFAULT 1,
  `ALLOW_MEETUP` tinyint(1) NOT NULL DEFAULT 1,
  `ALLOW_DELIVERY` tinyint(1) NOT NULL DEFAULT 1,
  `DELIVERY_FEE` double NOT NULL DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `merchant`
--

INSERT INTO `merchant` (`MERCHANT_ID`, `BU_EMAIL`, `SHOP_NAME`, `SHOP_DESC`, `SHOP_BANNER_URL`, `ADDRESS`, `STUDENT_NUM`, `ID_IMAGE_URL`, `ACCEPTS_COD`, `ACCEPTS_GCASH`, `ALLOW_MEETUP`, `ALLOW_DELIVERY`, `DELIVERY_FEE`) VALUES
(1, 'test.fname@bicol-u.edu.ph', 'Tindahan ni Isko', NULL, NULL, 'Legazpi / Albay', '2022-2222-22222', 'logo.png', 1, 1, 1, 1, 50),
(4, 'merchant@bicol-u.edu.ph', 'Test Merchant', NULL, NULL, 'Legazpi City / Albay', '2024-1980-56374', NULL, 1, 1, 1, 1, 50);

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `MSG_ID` int(11) NOT NULL,
  `MSG_TEXT` text NOT NULL,
  `SENT_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `STATUS` varchar(45) NOT NULL,
  `ATTACH_URL` varchar(255) DEFAULT NULL,
  `ATTACH_FILETYPE` varchar(45) DEFAULT NULL,
  `MESSAGEcol` varchar(45) DEFAULT NULL,
  `MSG_RECEIVER` int(11) DEFAULT NULL,
  `MSG_SENDER` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NOTIF_ID` int(11) NOT NULL,
  `SUBJECT` varchar(255) NOT NULL,
  `DESCRIPTION` mediumtext DEFAULT NULL,
  `IMAGE_URL` tinytext DEFAULT NULL,
  `REDIRECT_URL` tinytext DEFAULT NULL,
  `TIMESTAMP` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `STATUS` varchar(45) NOT NULL,
  `USER_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `offering`
--

CREATE TABLE `offering` (
  `OFFERING_ID` int(11) NOT NULL,
  `OFFERING_NAME` varchar(255) NOT NULL,
  `OFFERING_TYPE` char(1) NOT NULL,
  `AVAIL_STATUS` varchar(45) NOT NULL,
  `OFFERING_DESC` varchar(255) DEFAULT NULL,
  `MERCHANT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `offering`
--

INSERT INTO `offering` (`OFFERING_ID`, `OFFERING_NAME`, `OFFERING_TYPE`, `AVAIL_STATUS`, `OFFERING_DESC`, `MERCHANT_ID`) VALUES
(1, 'Nature\'s Spring', 'P', 'Active', NULL, 1),
(2, 'Caricature Illustrations', 'S', 'Active', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `ORDER_ID` int(11) NOT NULL,
  `ORDERED_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `TOTAL_AMOUNT` int(11) NOT NULL,
  `ORDER_STATUS` varchar(45) NOT NULL,
  `PAYMENT_STATUS` varchar(45) NOT NULL,
  `RECEIVED_ON` datetime(1) DEFAULT current_timestamp(1),
  `RECIPIENT_NAME` varchar(255) DEFAULT NULL,
  `PHONE_NUM` varchar(45) DEFAULT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `DISCOUNT_AMT` double DEFAULT NULL,
  `DELIVERY_STATUS` varchar(45) NOT NULL,
  `DISCOUNT_ID` int(11) DEFAULT NULL,
  `CUSTOMER_ID` int(11) NOT NULL,
  `DM_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `ORDERITEM_ID` int(11) NOT NULL,
  `PRICE` int(11) NOT NULL,
  `QUANTITY` int(11) NOT NULL,
  `ORDER_ID` int(11) NOT NULL,
  `PRODUCT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `RESET_ID` int(11) NOT NULL,
  `USER_ID` int(11) NOT NULL,
  `TOKEN_HASH` char(64) NOT NULL,
  `EXPIRES_AT` datetime NOT NULL,
  `USED_AT` datetime DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `PAYMENT_ID` int(11) NOT NULL,
  `REF_NUM` varchar(255) NOT NULL,
  `AMOUNT` int(11) NOT NULL,
  `PAID_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `ORDER_ID` int(11) DEFAULT NULL,
  `REQUEST_ID` int(11) DEFAULT NULL,
  `ALLOWED_PM_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_method`
--

CREATE TABLE `payment_method` (
  `PM_ID` int(11) NOT NULL,
  `SERVICE` varchar(255) NOT NULL,
  `LINK` varchar(255) DEFAULT NULL,
  `QR_URL` tinytext DEFAULT NULL,
  `NUMBER` varchar(45) DEFAULT NULL,
  `USERNAME` varchar(255) DEFAULT NULL,
  `OTHER` varchar(255) DEFAULT NULL,
  `MERCHANT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `payment_method`
--

INSERT INTO `payment_method` (`PM_ID`, `SERVICE`, `LINK`, `QR_URL`, `NUMBER`, `USERNAME`, `OTHER`, `MERCHANT_ID`) VALUES
(1, 'COD / Cash on Delivery', NULL, NULL, NULL, NULL, 'Cash payment on delivery or meetup.', 1),
(2, 'GCash', NULL, NULL, NULL, NULL, 'Merchant can provide GCash details through chat.', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `PROD_ID` int(11) NOT NULL,
  `PRICE` int(11) NOT NULL,
  `PROD_DESC` varchar(255) NOT NULL,
  `STOCK_QTY` int(11) NOT NULL,
  `IS_PREORDER` tinyint(4) NOT NULL DEFAULT 0,
  `POSTED_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `STATUS` varchar(45) NOT NULL,
  `MERCHANT_ID` int(11) NOT NULL,
  `PRODSUBCAT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`PROD_ID`, `PRICE`, `PROD_DESC`, `STOCK_QTY`, `IS_PREORDER`, `POSTED_ON`, `STATUS`, `MERCHANT_ID`, `PRODSUBCAT_ID`) VALUES
(1, 500, 'Nature\'s Spring', 5, 0, '2026-05-18 22:56:19.8', 'Active', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `prod_category`
--

CREATE TABLE `prod_category` (
  `PRODCAT_ID` int(11) NOT NULL,
  `CAT_NAME` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `prod_category`
--

INSERT INTO `prod_category` (`PRODCAT_ID`, `CAT_NAME`) VALUES
(1, 'Electronics & Technology'),
(2, 'Fashion & Apparel'),
(3, 'Home & Living'),
(4, 'Health & Beauty'),
(5, 'Books & Media'),
(6, 'Groceries & Essentials');

-- --------------------------------------------------------

--
-- Table structure for table `prod_subcat`
--

CREATE TABLE `prod_subcat` (
  `PRODSUBCAT_ID` int(11) NOT NULL,
  `SUBCAT_NAME` varchar(255) NOT NULL,
  `PRODCAT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `prod_subcat`
--

INSERT INTO `prod_subcat` (`PRODSUBCAT_ID`, `SUBCAT_NAME`, `PRODCAT_ID`) VALUES
(1, 'Computers', 1),
(2, 'Peripherals', 1),
(3, 'Mobile Devices', 1),
(4, 'Networking', 1),
(5, 'Software', 1),
(6, 'Men\'s Clothing', 2),
(7, 'Women\'s Clothing', 2),
(8, 'Footwear', 2),
(9, 'Accessories', 2),
(10, 'Unisex Clothing', 2),
(11, 'Furniture', 3),
(12, 'Appliances', 3),
(13, 'Kitchenware', 3),
(14, 'Home decor', 3),
(15, 'Skincare', 4),
(16, 'Personal Care', 4),
(17, 'Cosmetics', 4),
(18, 'Fiction', 5),
(19, 'Non-fiction', 5),
(20, 'Digital Media', 5),
(21, 'Stationary', 5),
(22, 'Fresh Produce', 6),
(23, 'Pantry Staples', 6),
(24, 'Beverages', 6),
(25, 'Household supplies', 6),
(26, 'Eats', 6);

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `REVIEW_ID` int(11) NOT NULL,
  `RATING` int(11) NOT NULL,
  `DESCRIPTION` text DEFAULT NULL,
  `REVIEWED_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `CUSTOMER_ID` int(11) NOT NULL,
  `OFFERING_ID` int(11) NOT NULL,
  `ORDER_ID` int(11) DEFAULT NULL,
  `REQUEST_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_attach`
--

CREATE TABLE `review_attach` (
  `ATTACH_ID` int(11) NOT NULL,
  `ATTACH_URL` tinytext NOT NULL,
  `FILE_TYPE` varchar(45) NOT NULL,
  `REVIEW_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service`
--

CREATE TABLE `service` (
  `SERVICE_ID` int(11) NOT NULL,
  `SER_DESC` varchar(255) NOT NULL,
  `PRICE` int(11) NOT NULL,
  `DEPOSIT` int(11) NOT NULL DEFAULT 0,
  `SLOTS` int(11) NOT NULL,
  `STATUS` varchar(45) NOT NULL,
  `DELIVERY_METHOD` varchar(255) NOT NULL,
  `POSTED_ON` datetime(1) NOT NULL,
  `MERCHANT_ID` int(11) NOT NULL,
  `SERSUBCAT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `service`
--

INSERT INTO `service` (`SERVICE_ID`, `SER_DESC`, `PRICE`, `DEPOSIT`, `SLOTS`, `STATUS`, `DELIVERY_METHOD`, `POSTED_ON`, `MERCHANT_ID`, `SERSUBCAT_ID`) VALUES
(2, 'Caricature Illustrations', 255, 0, 5, 'Active', 'Per Project', '2026-05-18 22:57:13.7', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `service_cat`
--

CREATE TABLE `service_cat` (
  `SERCAT_ID` int(11) NOT NULL,
  `CAT_NAME` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `service_cat`
--

INSERT INTO `service_cat` (`SERCAT_ID`, `CAT_NAME`) VALUES
(1, 'Creative Services');

-- --------------------------------------------------------

--
-- Table structure for table `service_request`
--

CREATE TABLE `service_request` (
  `REQUEST_ID` int(11) NOT NULL,
  `REQUEST_DATE` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `SCHEDULED_DATE` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `REQ_STATUS` varchar(45) NOT NULL,
  `TOTAL_PRICE` int(11) DEFAULT NULL,
  `CUSTOMER_INFO` text NOT NULL,
  `NOTE` varchar(255) DEFAULT NULL,
  `RECEIPT_NAME` varchar(255) NOT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `PHONE_NUM` varchar(45) DEFAULT NULL,
  `CUSTOMER_ID` int(11) NOT NULL,
  `SERVICE_ID` int(11) NOT NULL,
  `RECIPIENT_NAME` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_subcat`
--

CREATE TABLE `service_subcat` (
  `SERSUBCAT_ID` int(11) NOT NULL,
  `SUBCAT_NAME` varchar(255) NOT NULL,
  `SERCAT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `service_subcat`
--

INSERT INTO `service_subcat` (`SERSUBCAT_ID`, `SUBCAT_NAME`, `SERCAT_ID`) VALUES
(1, 'Creative Services', 1);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `STAFF_ID` int(11) NOT NULL,
  `LAST_LOGIN` datetime(1) DEFAULT NULL,
  `STAFF_TYPE` varchar(45) NOT NULL,
  `CREATION_DATE` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `STATUS` varchar(45) NOT NULL,
  `CAN_CREATE` tinyint(4) NOT NULL,
  `LAST_ACTION` datetime(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `USER_ID` int(11) NOT NULL,
  `FNAME` varchar(255) NOT NULL,
  `LNAME` varchar(255) NOT NULL,
  `DOB` date NOT NULL,
  `PHONE` varchar(24) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `USERNAME` varchar(255) NOT NULL,
  `GENDER` varchar(8) NOT NULL,
  `STATUS` varchar(255) NOT NULL,
  `PASSWORD_HASH` varchar(255) NOT NULL,
  `AVATAR_URL` tinytext DEFAULT NULL,
  `CREATED_ON` date NOT NULL,
  `ROLE` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`USER_ID`, `FNAME`, `LNAME`, `DOB`, `PHONE`, `EMAIL`, `USERNAME`, `GENDER`, `STATUS`, `PASSWORD_HASH`, `AVATAR_URL`, `CREATED_ON`, `ROLE`) VALUES
(1, 'TestFname', 'TestLname', '2005-12-20', '+639100030303', 'test.fname@bicol-u.edu.ph', 'testusername', 'FEMALE', 'ACTIVE', '$2y$10$lgxohad1hf102OvfGz9kmuV5nhUPEzkoCBKb1EB.kiC4BNJp4OF76', NULL, '2026-05-18', 'MRC'),
(2, 'Jazmin Erika', 'Nator', '2005-12-20', '+639310048121', 'jemn2023-4979-17061@bicol-u.edu.ph', 'jaznator', 'FEMALE', 'ACTIVE', '$2y$10$TRapLmp4kQrzHXc4ETs31.FNQpbvfEXpLHzOVAuixBeBgf10r3rBO', NULL, '2026-05-18', 'CUS'),
(3, 'Test', 'Customer', '2000-01-01', '+639000000000', 'customer@example.com', 'testcustomer', 'FEMALE', 'ACTIVE', '$2y$10$dgRAJKy1TMmSvavhUr6co.UEtkvs1xqxtvtZg8AjIXo7aNhToIjpC', NULL, '2026-05-20', 'CUS'),
(4, 'Test', 'Merchant', '2000-05-20', '+639300000000', 'merchant@bicol-u.edu.ph', 'testmerchant', 'MALE', 'ACTIVE', '$2y$10$kXBjU/3.KuV5UlqoHf7.pOTv6zREoAxYxMva3sLjs0rSCXhc2E5He', NULL, '2026-05-20', 'MRC');

-- --------------------------------------------------------

--
-- Table structure for table `user_likes`
--

CREATE TABLE `user_likes` (
  `LIKED_ID` int(11) NOT NULL,
  `LIKED_ON` datetime(1) NOT NULL DEFAULT current_timestamp(1),
  `CUSTOMER_ID` int(11) NOT NULL,
  `OFFERING_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voucher`
--

CREATE TABLE `voucher` (
  `VOUCHER_ID` int(11) NOT NULL,
  `CODE` varchar(255) NOT NULL,
  `DISCOUNT_TYPE` varchar(255) NOT NULL,
  `DISCOUNT_VALUE` int(11) NOT NULL,
  `CAP` int(11) DEFAULT NULL,
  `MIN_SPEND` int(11) NOT NULL,
  `USAGE_LIMIT` int(11) NOT NULL,
  `EXPIRY_DATE` date NOT NULL,
  `STATUS` varchar(45) NOT NULL,
  `MERCHANT_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `voucher`
--

INSERT INTO `voucher` (`VOUCHER_ID`, `CODE`, `DISCOUNT_TYPE`, `DISCOUNT_VALUE`, `CAP`, `MIN_SPEND`, `USAGE_LIMIT`, `EXPIRY_DATE`, `STATUS`, `MERCHANT_ID`) VALUES
(1, 'NTRSPRING20', 'percentage', 20, 500, 300, 1, '2026-12-20', 'ACTIVE', 1);

-- --------------------------------------------------------

--
-- Table structure for table `voucher_usage`
--

CREATE TABLE `voucher_usage` (
  `VU_ID` int(11) NOT NULL,
  `USED_ON` varchar(255) NOT NULL,
  `DISCOUNT_AMT` varchar(45) NOT NULL,
  `VOUCHER_ID` int(11) NOT NULL,
  `REQUEST_ID` int(11) DEFAULT NULL,
  `ORDER_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `address_book`
--
ALTER TABLE `address_book`
  ADD PRIMARY KEY (`ADD_ID`),
  ADD KEY `CUSTOMER_ID_idx` (`CUSTOMER_ID`);

--
-- Indexes for table `allowed_payment`
--
ALTER TABLE `allowed_payment`
  ADD PRIMARY KEY (`ALLOWED_PM_ID`),
  ADD KEY `OFFERING_ID_idx` (`OFFERING_ID`),
  ADD KEY `FK_ALLOWEDPM_PM_ID_idx` (`PM_ID`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`CUSTOMER_ID`);

--
-- Indexes for table `customer_wishlist`
--
ALTER TABLE `customer_wishlist`
  ADD PRIMARY KEY (`WISHLIST_ID`),
  ADD UNIQUE KEY `CUSTOMER_OFFERING_UNIQUE` (`CUSTOMER_ID`,`OFFERING_ID`),
  ADD KEY `CUSTOMER_WISHLIST_OFFERING_idx` (`OFFERING_ID`);

--
-- Indexes for table `delivery_method`
--
ALTER TABLE `delivery_method`
  ADD PRIMARY KEY (`DM_ID`),
  ADD KEY `FK_DM_PRODUCT_ID_idx` (`PROD_ID`);

--
-- Indexes for table `discount`
--
ALTER TABLE `discount`
  ADD PRIMARY KEY (`DISCOUNT_ID`),
  ADD KEY `OFFERING_ID_idx` (`OFFERING_ID`);

--
-- Indexes for table `display_img`
--
ALTER TABLE `display_img`
  ADD PRIMARY KEY (`DISPLAY_IMG_ID`),
  ADD KEY `OFFERING_ID_idx` (`OFFERING_ID`);

--
-- Indexes for table `merchant`
--
ALTER TABLE `merchant`
  ADD PRIMARY KEY (`MERCHANT_ID`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`MSG_ID`),
  ADD KEY `MSG_RECEIVER_idx` (`MSG_RECEIVER`),
  ADD KEY `MSG_SENDER_idx` (`MSG_SENDER`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NOTIF_ID`),
  ADD KEY `USER_ID_idx` (`USER_ID`);

--
-- Indexes for table `offering`
--
ALTER TABLE `offering`
  ADD PRIMARY KEY (`OFFERING_ID`),
  ADD KEY `MERCHANT_ID_idx` (`MERCHANT_ID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`ORDER_ID`),
  ADD UNIQUE KEY `ORDER_ID_UNIQUE` (`ORDER_ID`),
  ADD KEY `FK_ORDER_DISCOUNT_ID_idx` (`DISCOUNT_ID`),
  ADD KEY `FK_ORDER_CUSTOMER_ID_idx` (`CUSTOMER_ID`),
  ADD KEY `FK_ORDER_DM_ID_idx` (`DM_ID`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`ORDERITEM_ID`),
  ADD KEY `PRODUCT_ID_idx` (`PRODUCT_ID`),
  ADD KEY `ORDER_ID_idx` (`ORDER_ID`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`RESET_ID`),
  ADD UNIQUE KEY `PASSWORD_RESETS_TOKEN_UNIQUE` (`TOKEN_HASH`),
  ADD KEY `PASSWORD_RESETS_USER_IDX` (`USER_ID`),
  ADD KEY `PASSWORD_RESETS_EXPIRES_IDX` (`EXPIRES_AT`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`PAYMENT_ID`),
  ADD KEY `ORDER_ID_idx` (`ORDER_ID`),
  ADD KEY `REQUEST_ID_idx` (`REQUEST_ID`),
  ADD KEY `ALLOWED_PM_ID_idx` (`ALLOWED_PM_ID`);

--
-- Indexes for table `payment_method`
--
ALTER TABLE `payment_method`
  ADD PRIMARY KEY (`PM_ID`),
  ADD KEY `OFFERING_ID_idx` (`MERCHANT_ID`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`PROD_ID`),
  ADD KEY `MERCHANT_ID_idx` (`MERCHANT_ID`),
  ADD KEY `PRODSUBCAT_ID_idx` (`PRODSUBCAT_ID`);

--
-- Indexes for table `prod_category`
--
ALTER TABLE `prod_category`
  ADD PRIMARY KEY (`PRODCAT_ID`);

--
-- Indexes for table `prod_subcat`
--
ALTER TABLE `prod_subcat`
  ADD PRIMARY KEY (`PRODSUBCAT_ID`),
  ADD KEY `FK_SUBCAT_PRODCAT_ID` (`PRODCAT_ID`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`REVIEW_ID`),
  ADD KEY `CUSTOMER_ID_idx` (`CUSTOMER_ID`),
  ADD KEY `OFFERING_ID_idx` (`OFFERING_ID`),
  ADD KEY `REVIEW_ORDER_ID_idx` (`ORDER_ID`),
  ADD KEY `REVIEW_REQUEST_ID_idx` (`REQUEST_ID`);

--
-- Indexes for table `review_attach`
--
ALTER TABLE `review_attach`
  ADD PRIMARY KEY (`ATTACH_ID`),
  ADD KEY `REVIEW_ID_idx` (`REVIEW_ID`);

--
-- Indexes for table `service`
--
ALTER TABLE `service`
  ADD PRIMARY KEY (`SERVICE_ID`),
  ADD KEY `MERCHANT_ID_idx` (`MERCHANT_ID`),
  ADD KEY `SERSUBCAT_ID_idx` (`SERSUBCAT_ID`);

--
-- Indexes for table `service_cat`
--
ALTER TABLE `service_cat`
  ADD PRIMARY KEY (`SERCAT_ID`);

--
-- Indexes for table `service_request`
--
ALTER TABLE `service_request`
  ADD PRIMARY KEY (`REQUEST_ID`),
  ADD KEY `CUSTOMER_ID_idx` (`CUSTOMER_ID`),
  ADD KEY `SERVICE_ID_idx` (`SERVICE_ID`);

--
-- Indexes for table `service_subcat`
--
ALTER TABLE `service_subcat`
  ADD PRIMARY KEY (`SERSUBCAT_ID`),
  ADD KEY `SERCAT_ID_idx` (`SERCAT_ID`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`STAFF_ID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`USER_ID`),
  ADD UNIQUE KEY `USERNAME_UNIQUE` (`USERNAME`),
  ADD UNIQUE KEY `EMAIL_UNIQUE` (`EMAIL`);

--
-- Indexes for table `user_likes`
--
ALTER TABLE `user_likes`
  ADD PRIMARY KEY (`LIKED_ID`),
  ADD KEY `CUSTOMER_ID_idx` (`CUSTOMER_ID`),
  ADD KEY `OFFERING_ID_idx` (`OFFERING_ID`);

--
-- Indexes for table `voucher`
--
ALTER TABLE `voucher`
  ADD PRIMARY KEY (`VOUCHER_ID`),
  ADD KEY `MERCHANT_ID_idx` (`MERCHANT_ID`);

--
-- Indexes for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  ADD PRIMARY KEY (`VU_ID`),
  ADD KEY `VOUCHER_ID_idx` (`VOUCHER_ID`),
  ADD KEY `REQUEST_ID_idx` (`REQUEST_ID`),
  ADD KEY `ORDER_ID_idx` (`ORDER_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `allowed_payment`
--
ALTER TABLE `allowed_payment`
  MODIFY `ALLOWED_PM_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customer_wishlist`
--
ALTER TABLE `customer_wishlist`
  MODIFY `WISHLIST_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `delivery_method`
--
ALTER TABLE `delivery_method`
  MODIFY `DM_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `discount`
--
ALTER TABLE `discount`
  MODIFY `DISCOUNT_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `display_img`
--
ALTER TABLE `display_img`
  MODIFY `DISPLAY_IMG_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `MSG_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `NOTIF_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `offering`
--
ALTER TABLE `offering`
  MODIFY `OFFERING_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `ORDER_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `ORDERITEM_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `RESET_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `PAYMENT_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_method`
--
ALTER TABLE `payment_method`
  MODIFY `PM_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `prod_category`
--
ALTER TABLE `prod_category`
  MODIFY `PRODCAT_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `prod_subcat`
--
ALTER TABLE `prod_subcat`
  MODIFY `PRODSUBCAT_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `REVIEW_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review_attach`
--
ALTER TABLE `review_attach`
  MODIFY `ATTACH_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_cat`
--
ALTER TABLE `service_cat`
  MODIFY `SERCAT_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `service_request`
--
ALTER TABLE `service_request`
  MODIFY `REQUEST_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_subcat`
--
ALTER TABLE `service_subcat`
  MODIFY `SERSUBCAT_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `STAFF_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `USER_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_likes`
--
ALTER TABLE `user_likes`
  MODIFY `LIKED_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher`
--
ALTER TABLE `voucher`
  MODIFY `VOUCHER_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  MODIFY `VU_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `address_book`
--
ALTER TABLE `address_book`
  ADD CONSTRAINT `FK_ADRESSBOOK_CUSTOMER_ID` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `allowed_payment`
--
ALTER TABLE `allowed_payment`
  ADD CONSTRAINT `FK_ALLOWEDPM_OFFERING_ID` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_ALLOWEDPM_PM_ID` FOREIGN KEY (`PM_ID`) REFERENCES `payment_method` (`PM_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `customer`
--
ALTER TABLE `customer`
  ADD CONSTRAINT `FK_customer_id` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `customer_wishlist`
--
ALTER TABLE `customer_wishlist`
  ADD CONSTRAINT `FK_CUSTOMER_WISHLIST_CUSTOMER` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_CUSTOMER_WISHLIST_OFFERING` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `delivery_method`
--
ALTER TABLE `delivery_method`
  ADD CONSTRAINT `FK_DM_PRODUCT_ID` FOREIGN KEY (`PROD_ID`) REFERENCES `product` (`PROD_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `discount`
--
ALTER TABLE `discount`
  ADD CONSTRAINT `FK_DISCOUNT_OFFERING_ID` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `display_img`
--
ALTER TABLE `display_img`
  ADD CONSTRAINT `FK_DISPLAYIMG_OFFERING_ID` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `merchant`
--
ALTER TABLE `merchant`
  ADD CONSTRAINT `FK_MERCHANT_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `users` (`USER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `FK_MESSAGE_MSG_RECEIVER` FOREIGN KEY (`MSG_RECEIVER`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_MESSAGE_MSG_SENDER` FOREIGN KEY (`MSG_SENDER`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `FK_NOTIF_USER_ID` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `offering`
--
ALTER TABLE `offering`
  ADD CONSTRAINT `FK_OFFERING_MERCHANT_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `FK_ORDER_CUSTOMER_ID` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_ORDER_DISCOUNT_ID` FOREIGN KEY (`DISCOUNT_ID`) REFERENCES `discount` (`DISCOUNT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_ORDER_DM_ID` FOREIGN KEY (`DM_ID`) REFERENCES `delivery_method` (`DM_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `FK_ITEM_ORDER_ID` FOREIGN KEY (`ORDER_ID`) REFERENCES `orders` (`ORDER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_ITEM_PRODUCT_ID` FOREIGN KEY (`PRODUCT_ID`) REFERENCES `product` (`PROD_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `FK_PASSWORD_RESETS_USER` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `FK_PAYMENT_ALLOWED_PM_ID` FOREIGN KEY (`ALLOWED_PM_ID`) REFERENCES `allowed_payment` (`ALLOWED_PM_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_PAYMENT_ORDER_ID` FOREIGN KEY (`ORDER_ID`) REFERENCES `orders` (`ORDER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_PAYMENT_REQUEST_ID` FOREIGN KEY (`REQUEST_ID`) REFERENCES `service_request` (`REQUEST_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `payment_method`
--
ALTER TABLE `payment_method`
  ADD CONSTRAINT `FK_PAYMENTMETHOD_OFFERING_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `FK_PRODUCT_MERCHANT_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_PRODUCT_PRODSUBCAT_ID` FOREIGN KEY (`PRODSUBCAT_ID`) REFERENCES `prod_subcat` (`PRODSUBCAT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_PRODUCT_PROD_ID` FOREIGN KEY (`PROD_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `prod_subcat`
--
ALTER TABLE `prod_subcat`
  ADD CONSTRAINT `FK_SUBCAT_PRODCAT_ID` FOREIGN KEY (`PRODCAT_ID`) REFERENCES `prod_category` (`PRODCAT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `FK_REVIEW_CUSTOMER_ID` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_REVIEW_OFFERING_ID` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `review_attach`
--
ALTER TABLE `review_attach`
  ADD CONSTRAINT `FK_ATTACHMENT_REVIEW_ID` FOREIGN KEY (`REVIEW_ID`) REFERENCES `review` (`REVIEW_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `service`
--
ALTER TABLE `service`
  ADD CONSTRAINT `FK_SERVICE_ID` FOREIGN KEY (`SERVICE_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_SERVICE_MERCHANT_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_SERVICE_SERSUBCAT_ID` FOREIGN KEY (`SERSUBCAT_ID`) REFERENCES `service_subcat` (`SERSUBCAT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `service_request`
--
ALTER TABLE `service_request`
  ADD CONSTRAINT `FK_REQUEST_CUSTOMER_ID` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_REQUEST_SERVICE_ID` FOREIGN KEY (`SERVICE_ID`) REFERENCES `service` (`SERVICE_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `service_subcat`
--
ALTER TABLE `service_subcat`
  ADD CONSTRAINT `FK_SUBCAT_SERCAT_ID` FOREIGN KEY (`SERCAT_ID`) REFERENCES `service_cat` (`SERCAT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `STAFF_ID` FOREIGN KEY (`STAFF_ID`) REFERENCES `users` (`USER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `user_likes`
--
ALTER TABLE `user_likes`
  ADD CONSTRAINT `FK_USER_LIKES_CUSTOMER_ID` FOREIGN KEY (`CUSTOMER_ID`) REFERENCES `customer` (`CUSTOMER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_USER_LIKES_OFFERING_ID` FOREIGN KEY (`OFFERING_ID`) REFERENCES `offering` (`OFFERING_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `voucher`
--
ALTER TABLE `voucher`
  ADD CONSTRAINT `FK_VOUCHER_MERCHANT_ID` FOREIGN KEY (`MERCHANT_ID`) REFERENCES `merchant` (`MERCHANT_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  ADD CONSTRAINT `FK_VOUCHERUASGE_ORDER_ID` FOREIGN KEY (`ORDER_ID`) REFERENCES `orders` (`ORDER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_VOUCHERUSAGE_REQUEST_ID` FOREIGN KEY (`REQUEST_ID`) REFERENCES `service_request` (`REQUEST_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_VOUCHERUSAGE_VOUCHER_ID` FOREIGN KEY (`VOUCHER_ID`) REFERENCES `voucher` (`VOUCHER_ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
