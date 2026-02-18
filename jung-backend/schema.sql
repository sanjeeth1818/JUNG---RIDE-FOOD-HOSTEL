-- Final Database Schema for JUNG Super App
-- Covers Users, Partners, functionality for Food, Rooms, Rides, and Orders.

CREATE DATABASE IF NOT EXISTS jungapp_db;
USE jungapp_db;

-- ==========================================
-- 1. AUTHENTICATION & PROFILES
-- ==========================================

-- Users (Students / Workers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For real auth
    name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    user_type ENUM('student', 'worker') DEFAULT 'student',
    
    -- Location Preferences
    location_type VARCHAR(50), -- 'university' or 'city'
    location_name VARCHAR(255),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Locations (Dropdown values)
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('University', 'City') DEFAULT 'City',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Seed Locations (Major Cities and Universities in Sri Lanka)
-- Major Cities
INSERT IGNORE INTO locations (name, type, latitude, longitude) VALUES 
('Colombo', 'City', 6.9271, 79.8612),
('Kandy', 'City', 7.2906, 80.6337),
('Galle', 'City', 6.0367, 80.2170),
('Jaffna', 'City', 9.6615, 80.0255),
('Negombo', 'City', 7.2083, 79.8353),
('Anuradhapura', 'City', 8.3114, 80.4037),
('Matara', 'City', 5.9549, 80.5550),
('Ratnapura', 'City', 6.6828, 80.3992),
('Kurunegala', 'City', 7.4817, 80.3609),
('Batticaloa', 'City', 7.7170, 81.7010),
('Trincomalee', 'City', 8.5873, 81.2152),
('Nuwara Eliya', 'City', 6.9497, 80.7891),
('Badulla', 'City', 6.9934, 81.0550),
('Kalutara', 'City', 6.5854, 79.9607),
('Gampaha', 'City', 7.0873, 79.9924),
('Kegalle', 'City', 7.2513, 80.3464),
('Ampara', 'City', 7.2912, 81.6724),
('Vavuniya', 'City', 8.7542, 80.4982),
('Mullaitivu', 'City', 9.2671, 80.8142),
('Kilinochchi', 'City', 9.3803, 80.3970),
('Polonnaruwa', 'City', 7.9325, 81.0003),
('Puttalam', 'City', 8.0330, 79.8259),
('Hambantota', 'City', 6.1246, 81.1185),
('Moneragala', 'City', 6.8722, 81.3507);

-- Universities
INSERT IGNORE INTO locations (name, type, latitude, longitude) VALUES 
('University of Colombo', 'University', 6.9001, 79.8584),
('University of Peradeniya', 'University', 7.2525, 80.5925),
('University of Moratuwa', 'University', 6.7950, 79.9007),
('University of Kelaniya', 'University', 6.9740, 79.9149),
('University of Sri Jayewardenepura', 'University', 6.8528, 79.9036),
('University of Jaffna', 'University', 9.6848, 80.0216),
('University of Ruhuna', 'University', 5.9381, 80.5762),
('Eastern University of Sri Lanka', 'University', 7.7944, 81.5790),
('South Eastern University of Sri Lanka', 'University', 7.3000, 81.8500),
('Rajarata University of Sri Lanka', 'University', 8.3582, 80.4900),
('Sabaragamuwa University of Sri Lanka', 'University', 6.7122, 80.7874),
('Wayamba University of Sri Lanka', 'University', 7.3225, 79.9881),
('Uva Wellassa University', 'University', 6.9814, 81.0763);

-- Partners (Service Providers: Restaurant Owners, Drivers, Landlords)
CREATE TABLE IF NOT EXISTS partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255), -- Business Name or Driver Name
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Partner Type determines which service they offer
    type ENUM('Food', 'Rider', 'Room') NOT NULL, 
    status ENUM('Pending', 'Active', 'Suspended') DEFAULT 'Pending',
    is_active BOOLEAN DEFAULT TRUE,
    location VARCHAR(255),
    
    -- Added for Registration
    business_name VARCHAR(255),
    property_type VARCHAR(100),
    university_id INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    id_front_image LONGTEXT,
    id_back_image LONGTEXT,
    profile_picture LONGTEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. SERVICE CATALOGS
-- ==========================================

-- FOOD: Categories
CREATE TABLE IF NOT EXISTS food_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial categories
INSERT IGNORE INTO food_categories (name) VALUES 
('Appetizers'), ('Main Course'), ('Desserts'), ('Beverages'), ('Sides'), ('Specials'), ('Uncategorized');

-- FOOD: Restaurants (Linked to a Partner)
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100), -- 'Rice & Curry', 'Fast Food'
    rating DECIMAL(2, 1) DEFAULT 0.0,
    delivery_time_min INT, -- e.g., 15
    delivery_time_max INT, -- e.g., 30
    image_url TEXT,
    category ENUM('uni', 'city') DEFAULT 'uni',
    address TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- FOOD: Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- RIDES: Vehicles (Linked to a Partner)
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    vehicle_type ENUM('Tuk', 'Bike', 'Car', 'Van') NOT NULL,
    model VARCHAR(100),
    plate_number VARCHAR(50),
    color VARCHAR(50),
    base_rate DECIMAL(10, 2) DEFAULT 0.00,
    per_km_rate DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    
    -- Added for Registration
    vehicle_image LONGTEXT,
    vehicle_book LONGTEXT,
    
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- ROOMS: Listings (Linked to a Partner)
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255),
    address TEXT,
    price_per_month DECIMAL(10, 2),
    property_type ENUM('Boarding', 'Hostel', 'Apartment', 'House'),
    images JSON, -- Store array of image URLs
    amenities JSON, -- Store array of strings e.g. ["WiFi", "Water"]
    gender_restriction ENUM('Any', 'Male', 'Female') DEFAULT 'Any',
    views INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    status ENUM('Available', 'Occupied', 'Maintenance', 'Hidden') DEFAULT 'Available',
    
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    room_id INT NOT NULL,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    check_in DATE,
    check_out DATE,
    total_price DECIMAL(10, 2),
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. TRANSACTIONS
-- ==========================================

-- Orders (Central table for all service bookings)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    partner_id INT, -- The provider fulfilling the order
    
    service_type ENUM('Food', 'Ride', 'Room') NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_method ENUM('Cash', 'Card') DEFAULT 'Cash',
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    
    delivery_address TEXT,
    pickup_address TEXT, -- For Rides
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- Order Items (Specific for Food orders)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT,
    quantity INT DEFAULT 1,
    price_at_time DECIMAL(10, 2), -- Price snapshot
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    partner_id INT NOT NULL, -- Who is being reviewed
    order_id INT, -- Verified purchase
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. RIDE HAILING SYSTEM
-- ==========================================

-- Rider Locations (Real-time GPS tracking)
CREATE TABLE IF NOT EXISTS rider_locations (
    rider_id INT PRIMARY KEY,
    current_lat DECIMAL(10, 8) NOT NULL,
    current_lng DECIMAL(11, 8) NOT NULL,
    is_online BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- Ride Requests (Student initiated requests)
CREATE TABLE IF NOT EXISTS ride_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT NOT NULL,
    assigned_rider_id INT,
    
    pickup_location TEXT,
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    
    dropoff_location TEXT,
    dropoff_lat DECIMAL(10, 8) NOT NULL,
    dropoff_lng DECIMAL(11, 8) NOT NULL,
    
    vehicle_type ENUM('Tuk', 'Bike', 'Car', 'Van') NOT NULL,
    status ENUM('pending', 'accepted', 'arrived', 'picked_up', 'dropped_off', 'completed', 'cancelled') DEFAULT 'pending',
    
    estimated_fare DECIMAL(10, 2),
    distance_km DECIMAL(10, 2),
    
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_rider_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- Ride Request Responses (Driver interaction logs)
CREATE TABLE IF NOT EXISTS ride_request_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    rider_id INT NOT NULL,
    response ENUM('shown', 'accepted', 'declined', 'timeout') DEFAULT 'shown',
    response_time_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY request_rider (request_id, rider_id),
    FOREIGN KEY (request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE
);
