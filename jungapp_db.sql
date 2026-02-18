-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 13, 2026 at 06:58 AM
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
-- Database: `jungapp_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `name`, `created_at`, `last_login`) VALUES
(1, 'admin', '$2b$10$GWrM.DCKcBP/yWa8VIXuT.RxefCJPkKp6TTuyoqv1oMsDz0GTZt4O', 'System Administrator', '2026-02-08 14:27:17', '2026-02-09 17:10:28');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `guest_name` varchar(255) DEFAULT NULL,
  `guest_phone` varchar(50) DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `status` enum('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Confirmed',
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `food_categories`
--

CREATE TABLE `food_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food_categories`
--

INSERT INTO `food_categories` (`id`, `name`, `created_at`) VALUES
(1, 'Appetizers', '2026-02-08 04:28:06'),
(2, 'Main Course', '2026-02-08 04:28:06'),
(3, 'Desserts', '2026-02-08 04:28:06'),
(4, 'Beverages', '2026-02-08 04:28:06'),
(5, 'Sides', '2026-02-08 04:28:06'),
(6, 'Specials', '2026-02-08 04:28:06'),
(7, 'Uncategorized', '2026-02-08 04:28:06'),
(15, 'Ricee', '2026-02-08 17:01:08');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('University','City') DEFAULT 'City',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `type`, `latitude`, `longitude`) VALUES
(1, 'Colombo', 'City', 6.92710000, 79.86120000),
(2, 'Kandy', 'City', 7.29060000, 80.63370000),
(3, 'Galle', 'City', 6.03670000, 80.21700000),
(4, 'NSBM Green University', 'University', NULL, NULL),
(5, 'SLIIT', 'University', NULL, NULL),
(6, 'IIT', 'University', NULL, NULL),
(10, 'Jaffna', 'City', 9.66150000, 80.02550000),
(11, 'Negombo', 'City', 7.20830000, 79.83530000),
(12, 'Anuradhapura', 'City', 8.31140000, 80.40370000),
(13, 'Matara', 'City', 5.95490000, 80.55500000),
(14, 'Ratnapura', 'City', 6.68280000, 80.39920000),
(15, 'Kurunegala', 'City', 7.48170000, 80.36090000),
(16, 'Batticaloa', 'City', 7.71700000, 81.70100000),
(17, 'Trincomalee', 'City', 8.58730000, 81.21520000),
(18, 'Nuwara Eliya', 'City', 6.94970000, 80.78910000),
(19, 'Badulla', 'City', 6.99340000, 81.05500000),
(20, 'Kalutara', 'City', 6.58540000, 79.96070000),
(21, 'Gampaha', 'City', 7.08730000, 79.99240000),
(22, 'Kegalle', 'City', 7.25130000, 80.34640000),
(23, 'Ampara', 'City', 7.29120000, 81.67240000),
(24, 'Vavuniya', 'City', 8.75420000, 80.49820000),
(25, 'Mullaitivu', 'City', 9.26710000, 80.81420000),
(26, 'Kilinochchi', 'City', 9.38030000, 80.39700000),
(27, 'Polonnaruwa', 'City', 7.93250000, 81.00030000),
(28, 'Puttalam', 'City', 8.03300000, 79.82590000),
(29, 'Hambantota', 'City', 6.12460000, 81.11850000),
(30, 'Moneragala', 'City', 6.87220000, 81.35070000),
(31, 'University of Colombo', 'University', 6.90010000, 79.85840000),
(32, 'University of Peradeniya', 'University', 7.25250000, 80.59250000),
(33, 'University of Moratuwa', 'University', 6.79500000, 79.90070000),
(34, 'University of Kelaniya', 'University', 6.97400000, 79.91490000),
(35, 'University of Sri Jayewardenepura', 'University', 6.85280000, 79.90360000),
(36, 'University of Jaffna', 'University', 9.68480000, 80.02160000),
(37, 'University of Ruhuna', 'University', 5.93810000, 80.57620000),
(38, 'Eastern University of Sri Lanka', 'University', 7.79440000, 81.57900000),
(39, 'South Eastern University of Sri Lanka', 'University', 7.30000000, 81.85000000),
(40, 'Rajarata University of Sri Lanka', 'University', 8.35820000, 80.49000000),
(41, 'Sabaragamuwa University of Sri Lanka', 'University', 6.71220000, 80.78740000),
(42, 'Wayamba University of Sri Lanka', 'University', 7.32250000, 79.98810000),
(43, 'Uva Wellassa University', 'University', 6.98140000, 81.07630000),
(44, 'University of Vavuniya', 'University', 8.75420000, 80.49820000),
(51, 'Eastern University', 'University', 7.71260000, 81.70110000),
(52, 'South Eastern University', 'University', 7.29740000, 81.85010000),
(53, 'Rajarata University', 'University', 8.35650000, 80.49820000),
(54, 'Wayamba University', 'University', 7.32250000, 79.98820000),
(56, 'Open University', 'University', 6.88390000, 79.88530000),
(59, 'KIU', 'University', 6.91670000, 79.94720000),
(60, 'KDU', 'University', 6.81940000, 79.88940000),
(61, 'APIIT', 'University', 6.91420000, 79.85780000),
(62, 'ESU', 'City', 9.66403064, 80.01794791),
(63, 'bcass', 'University', 8.21581026, 80.19965562);

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `restaurant_id`, `name`, `description`, `price`, `category`, `image_url`, `is_available`) VALUES
(6, 10, 'Classic Chicken Rice', 'Traditional Sri Lankan rice and curry with 4 veg sides', 450.00, NULL, NULL, 1),
(7, 10, 'Veg Rice & Curry', 'Healthy selection of 5 organic vegetable curries', 350.00, NULL, NULL, 1),
(8, 11, 'Crispy Chicken Burger', 'Crispy patty with secret sauce and fresh lettuce', 650.00, NULL, NULL, 1),
(9, 11, 'Cheese Loaded Fries', 'Golden fries topped with melted mozzarella and herbs', 450.00, NULL, NULL, 1),
(10, 12, 'Spicy Seafood Fried Rice', 'Fresh mixed seafood with basmati rice and chili paste', 850.00, NULL, NULL, 1),
(11, 13, 'Iced Coffee', 'Freshly brewed local coffee with creamy milk', 250.00, NULL, NULL, 1),
(12, 13, 'Chocolate Muffin', 'Soft muffin with dark chocolate chips', 180.00, NULL, NULL, 1),
(13, 14, 'Claypot Rice', 'Slow cooked rice in traditional clay pot', 750.00, NULL, NULL, 1),
(14, 15, 'dfgh', 'etrht', 1000.00, 'Main Course', '/uploads/image-1770497752160-429633682.png', 1),
(15, 15, 'noodle', 'fdtfygjgfhdgf', 1200.00, 'Specials', 'http://localhost:5000/uploads/image-1770570131829-743633342.jpg', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('order','ride','system','promo') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `service_type` enum('Food','Ride','Room') NOT NULL,
  `status` enum('Pending','Confirmed','Preparing','Completed','Cancelled') DEFAULT 'Pending',
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `payment_method` enum('Cash','Card') DEFAULT 'Cash',
  `payment_status` enum('Pending','Paid') DEFAULT 'Pending',
  `delivery_address` text DEFAULT NULL,
  `pickup_address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `price_at_time` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

CREATE TABLE `partners` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `type` enum('Food','Rider','Room') NOT NULL,
  `status` enum('Active','Inactive','Pending','Rejected') DEFAULT 'Pending',
  `is_active` tinyint(1) DEFAULT 1,
  `location` varchar(255) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `university_id` varchar(255) DEFAULT NULL,
  `id_front_image` text DEFAULT NULL,
  `id_back_image` text DEFAULT NULL,
  `profile_picture` text DEFAULT NULL,
  `property_type` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partners`
--

INSERT INTO `partners` (`id`, `email`, `password`, `password_hash`, `name`, `phone`, `avatar_url`, `type`, `status`, `is_active`, `location`, `business_name`, `university_id`, `id_front_image`, `id_back_image`, `profile_picture`, `property_type`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(4, 'devilesixteen@gmail.com', NULL, '$2b$10$8wsCH9cTf8cbr4cDrPIh4elrCHAulXG7kI7zbzsmgXQ6LhHBuhk9y', 'sanjjjj', '0771234510', NULL, 'Food', 'Pending', 1, 'Gampaha', 'sanjjjj', NULL, '/uploads/id_front-1770658344967-436583874.jpg', '/uploads/id_back-1770658344968-426991941.jpg', NULL, NULL, 7.08730000, 79.99240000, '2026-02-09 17:32:24', '2026-02-09 17:32:24');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--
-- Error reading structure for table jungapp_db.properties: #1932 - Table &#039;jungapp_db.properties&#039; doesn&#039;t exist in engine
-- Error reading data for table jungapp_db.properties: #1064 - You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near &#039;FROM `jungapp_db`.`properties`&#039; at line 1

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cuisine_type` varchar(100) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT 0.0,
  `delivery_time_min` int(11) DEFAULT NULL,
  `delivery_time_max` int(11) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `category` enum('uni','city') DEFAULT 'uni',
  `address` text DEFAULT NULL,
  `is_open` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`id`, `partner_id`, `name`, `cuisine_type`, `rating`, `delivery_time_min`, `delivery_time_max`, `image_url`, `category`, `address`, `is_open`) VALUES
(4, 4, 'sanjjjj', 'General', 0.0, NULL, NULL, NULL, 'city', 'Gampaha', 1);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rider_locations`
--

CREATE TABLE `rider_locations` (
  `rider_id` int(11) NOT NULL,
  `current_lat` decimal(10,8) NOT NULL,
  `current_lng` decimal(11,8) NOT NULL,
  `is_online` tinyint(1) DEFAULT 1,
  `is_available` tinyint(1) DEFAULT 1,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rider_reviews`
--

CREATE TABLE `rider_reviews` (
  `id` int(11) NOT NULL,
  `ride_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `reviewed_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ride_requests`
--

CREATE TABLE `ride_requests` (
  `id` int(11) NOT NULL,
  `passenger_id` int(11) NOT NULL,
  `assigned_rider_id` int(11) DEFAULT NULL,
  `pickup_location` text DEFAULT NULL,
  `pickup_lat` decimal(10,8) NOT NULL,
  `pickup_lng` decimal(11,8) NOT NULL,
  `dropoff_location` text DEFAULT NULL,
  `dropoff_lat` decimal(10,8) NOT NULL,
  `dropoff_lng` decimal(11,8) NOT NULL,
  `vehicle_type` enum('Tuk','Bike','Car','Van') NOT NULL,
  `status` enum('pending','accepted','arrived','picked_up','completed','cancelled') DEFAULT 'pending',
  `estimated_fare` decimal(10,2) DEFAULT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ride_request_responses`
--

CREATE TABLE `ride_request_responses` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `rider_id` int(11) NOT NULL,
  `response` enum('shown','accepted','declined','timeout') DEFAULT 'shown',
  `response_time_seconds` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `price_per_month` decimal(10,2) DEFAULT NULL,
  `property_type` enum('Boarding','Hostel','Apartment','House') DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `gender_restriction` enum('Any','Male','Female') DEFAULT 'Any',
  `views` int(11) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `status` enum('Available','Occupied','Maintenance','Hidden') DEFAULT 'Available',
  `room_type` enum('Individual','Shared') DEFAULT 'Individual'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `user_type` enum('student','worker') DEFAULT 'student',
  `location_type` varchar(50) DEFAULT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `password_hash`, `name`, `phone`, `avatar_url`, `user_type`, `location_type`, `location_name`, `lat`, `lng`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'Student@gmail.com', NULL, '$2b$10$FoFmRoZXESS5EFmp6QRU1.K2ylGhJmtI2DJWFQqt4q559A4dDSOs.', 'Student', NULL, NULL, 'student', NULL, NULL, NULL, NULL, '2026-02-08 19:26:50', '2026-02-08 19:26:50', 1),
(2, 'devilesixteen@gmail.com', NULL, '$2b$10$KjqMGTP57uDyWiJiASIaOuMRAdUMSCswFC2WTna9VmXJGiAAI5aDy', 'sanjui', NULL, NULL, 'student', NULL, NULL, NULL, NULL, '2026-02-09 17:31:00', '2026-02-09 17:31:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `vehicle_type` enum('Tuk','Bike','Car','Van') NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `plate_number` varchar(50) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `base_rate` decimal(10,2) DEFAULT 0.00,
  `per_km_rate` decimal(10,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `current_lat` decimal(10,8) DEFAULT NULL,
  `current_lng` decimal(11,8) DEFAULT NULL,
  `vehicle_image` text DEFAULT NULL,
  `vehicle_book` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_config`
--

CREATE TABLE `vehicle_config` (
  `id` int(11) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `base_rate` decimal(10,2) NOT NULL,
  `per_km_rate` decimal(10,2) NOT NULL,
  `icon` varchar(10) NOT NULL,
  `color` varchar(20) NOT NULL,
  `eta_default` varchar(50) DEFAULT '5 mins',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicle_config`
--

INSERT INTO `vehicle_config` (`id`, `vehicle_type`, `name`, `base_rate`, `per_km_rate`, `icon`, `color`, `eta_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Tuk', 'Premium Tuk', 120.00, 60.00, '🛺', '#10B981', '2 mins', 1, '2026-02-08 15:02:07', '2026-02-08 15:02:07'),
(2, 'Bike', 'Flash Bike', 80.00, 40.00, '🏍️', '#3B82F6', '1 min', 1, '2026-02-08 15:02:07', '2026-02-08 15:02:07'),
(3, 'Car', 'Luxury Car', 250.00, 120.00, '🚗', '#EC4899', '5 mins', 1, '2026-02-08 15:02:07', '2026-02-08 15:02:07'),
(4, 'Van', 'Family Van', 400.00, 150.00, '🚐', '#F59E0B', '8 mins', 1, '2026-02-08 15:02:07', '2026-02-08 15:02:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `food_categories`
--
ALTER TABLE `food_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `fk_orders_restaurant` (`restaurant_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `partners`
--
ALTER TABLE `partners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `rider_locations`
--
ALTER TABLE `rider_locations`
  ADD PRIMARY KEY (`rider_id`);

--
-- Indexes for table `rider_reviews`
--
ALTER TABLE `rider_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ride_id` (`ride_id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `reviewed_id` (`reviewed_id`);

--
-- Indexes for table `ride_requests`
--
ALTER TABLE `ride_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `passenger_id` (`passenger_id`),
  ADD KEY `fk_assigned_rider` (`assigned_rider_id`);

--
-- Indexes for table `ride_request_responses`
--
ALTER TABLE `ride_request_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_rider` (`request_id`,`rider_id`),
  ADD KEY `rider_id` (`rider_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Indexes for table `vehicle_config`
--
ALTER TABLE `vehicle_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicle_type` (`vehicle_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_categories`
--
ALTER TABLE `food_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `partners`
--
ALTER TABLE `partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rider_reviews`
--
ALTER TABLE `rider_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ride_requests`
--
ALTER TABLE `ride_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ride_request_responses`
--
ALTER TABLE `ride_request_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=766;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle_config`
--
ALTER TABLE `vehicle_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rider_locations`
--
ALTER TABLE `rider_locations`
  ADD CONSTRAINT `rider_locations_ibfk_1` FOREIGN KEY (`rider_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rider_reviews`
--
ALTER TABLE `rider_reviews`
  ADD CONSTRAINT `rider_reviews_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `ride_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rider_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `rider_reviews_ibfk_3` FOREIGN KEY (`reviewed_id`) REFERENCES `partners` (`id`);

--
-- Constraints for table `ride_requests`
--
ALTER TABLE `ride_requests`
  ADD CONSTRAINT `fk_assigned_rider` FOREIGN KEY (`assigned_rider_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ride_requests_ibfk_1` FOREIGN KEY (`passenger_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ride_requests_ibfk_2` FOREIGN KEY (`assigned_rider_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ride_request_responses`
--
ALTER TABLE `ride_request_responses`
  ADD CONSTRAINT `ride_request_responses_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `ride_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ride_request_responses_ibfk_2` FOREIGN KEY (`rider_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
