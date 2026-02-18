-- Sample Data Population for JUNG Super App
-- Run this AFTER creating the tables with schema.sql

USE jungapp_db;

-- ==========================================
-- 1. PARTNERS (Providers)
-- ==========================================
INSERT INTO partners (email, password_hash, name, phone, type, status) VALUES
('canteen@uni.com', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Campus Canteen', '0771112222', 'Food', 'Active'),
('citywok@gmail.com', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'City Wok', '0773334444', 'Food', 'Active'),
('saman@rider.com', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Saman Perera', '0715556666', 'Rider', 'Active'),
('kamal@hostel.com', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Kamal Gunarathna', '0779998888', 'Room', 'Active');

-- Store IDs for reference (assuming auto-increment starts at 1, 2, 3, 4)
-- 1: Campus Canteen
-- 2: City Wok
-- 3: Saman Perera
-- 4: Kamal Gunarathna

-- ==========================================
-- 2. USERS (Customers)
-- ==========================================
INSERT INTO users (email, password_hash, name, phone, user_type, location_type, location_name) VALUES
('student@uni.ac.lk', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Nimal Student', '0701234567', 'student', 'university', 'Vavuniya Campus'),
('worker@city.com', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Sunil Worker', '0761234567', 'worker', 'city', 'Vavuniya Town');

-- ==========================================
-- 3. RESTAURANTS
-- ==========================================
INSERT INTO restaurants (partner_id, name, cuisine_type, rating, delivery_time_min, delivery_time_max, image_url, category, address) VALUES
(1, 'Campus Main Canteen', 'Rice & Curry', 4.5, 10, 20, '#4CAF50', 'uni', 'Near Science Block'),
(1, 'Science Cafe', 'Short Eats', 4.2, 5, 15, '#8BC34A', 'uni', 'Science Faculty'),
(2, 'City Wok', 'Chinese', 4.6, 25, 40, '#FF5722', 'city', 'Main Street, Vavuniya'),
(2, 'Burger House', 'Fast Food', 4.3, 20, 35, '#FF9800', 'city', '2nd Cross Street');

-- ==========================================
-- 4. MENU ITEMS
-- ==========================================
-- For Campus Canteen (Restaurant ID 1)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url) VALUES
(1, 'Fish Rice & Curry', 'Red rice with fish curry and 3 vegetables', 350.00, '#'),
(1, 'Chicken Fried Rice', 'Spicy fried rice with chicken piece', 450.00, '#'),
(1, 'Plain Tea', 'Hot plain tea with sugar', 30.00, '#');

-- For City Wok (Restaurant ID 3)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url) VALUES
(3, 'Nasi Goreng', 'Mixed rice with fried egg and satay', 1200.00, '#'),
(3, 'Hot Butter Cuttlefish', 'Spicy batter fried cuttlefish', 1500.00, '#');

-- ==========================================
-- 5. VEHICLES
-- ==========================================
-- For Saman Perera (Partner ID 3)
INSERT INTO vehicles (partner_id, vehicle_type, model, plate_number, color, base_rate, per_km_rate) VALUES
(3, 'Tuk', 'Bajaj RE', 'ABC-1234', 'Green', 100.00, 80.00),
(3, 'Bike', 'Honda Dio', 'BCA-5678', 'Black', 50.00, 40.00);

-- ==========================================
-- 6. ROOMS (Boarding)
-- ==========================================
-- For Kamal (Partner ID 4)
INSERT INTO rooms (partner_id, title, description, price_per_month, property_type, location_name) VALUES
(4, 'Single Room for Student', 'Quiet room with table and bed. Walking distance to campus.', 8500.00, 'Boarding', 'Pampaimadu'),
(4, 'Luxury Annex', '2 Bedrooms, attached bathroom. Ideal for students sharing.', 25000.00, 'House', 'Vavuniya Town');

-- ==========================================
-- 7. REVIEWS
-- ==========================================
INSERT INTO reviews (user_id, partner_id, rating, comment) VALUES
(1, 1, 5, 'Best rice and curry in the area! Very affordable.'),
(2, 3, 4, 'Good ride, but the tuk was a bit old.');
