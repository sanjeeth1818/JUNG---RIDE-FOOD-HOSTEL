const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TABLES_TO_FIX = [
    {
        name: 'partners',
        query: `CREATE TABLE IF NOT EXISTS partners (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            name VARCHAR(255),
            phone VARCHAR(50),
            avatar_url TEXT,
            type ENUM('Food', 'Rider', 'Room') NOT NULL, 
            status ENUM('Pending', 'Active', 'Suspended') DEFAULT 'Pending',
            is_active BOOLEAN DEFAULT TRUE,
            location VARCHAR(255),
            business_name VARCHAR(255),
            university_id VARCHAR(255),
            id_front_image TEXT,
            id_back_image TEXT,
            profile_picture TEXT,
            property_type VARCHAR(255),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'restaurants',
        query: `CREATE TABLE IF NOT EXISTS restaurants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            partner_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            cuisine_type VARCHAR(100),
            rating DECIMAL(2, 1) DEFAULT 0.0,
            delivery_time_min INT,
            delivery_time_max INT,
            image_url TEXT,
            category ENUM('uni', 'city') DEFAULT 'uni',
            address TEXT,
            is_open BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'menu_items',
        query: `CREATE TABLE IF NOT EXISTS menu_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            category VARCHAR(100),
            image_url TEXT,
            is_available BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'vehicles',
        query: `CREATE TABLE IF NOT EXISTS vehicles (
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
            vehicle_image TEXT,
            vehicle_book TEXT,
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'rooms',
        query: `CREATE TABLE IF NOT EXISTS rooms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            partner_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            location_name VARCHAR(255),
            address TEXT,
            price_per_month DECIMAL(10, 2),
            property_type ENUM('Boarding', 'Hostel', 'Apartment', 'House'),
            images JSON,
            amenities JSON,
            gender_restriction ENUM('Any', 'Male', 'Female') DEFAULT 'Any',
            views INT DEFAULT 0,
            is_available BOOLEAN DEFAULT TRUE,
            status ENUM('Available', 'Occupied', 'Maintenance', 'Hidden') DEFAULT 'Available',
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'bookings',
        query: `CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            partner_id INT NOT NULL,
            room_id INT NOT NULL,
            guest_name VARCHAR(255),
            guest_phone VARCHAR(50),
            check_in DATE,
            check_out DATE,
            total_price DECIMAL(10, 2),
            status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`
    },
    {
        name: 'orders',
        query: `CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            partner_id INT,
            service_type ENUM('Food', 'Ride', 'Room') NOT NULL,
            status ENUM('Pending', 'Confirmed', 'Preparing', 'OnTheWay', 'Completed', 'Cancelled') DEFAULT 'Pending',
            total_amount DECIMAL(10, 2) DEFAULT 0.00,
            payment_method ENUM('Cash', 'Card') DEFAULT 'Cash',
            payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
            delivery_address TEXT,
            pickup_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
        )`
    },
    {
        name: 'order_items',
        query: `CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            menu_item_id INT,
            quantity INT DEFAULT 1,
            price_at_time DECIMAL(10, 2),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
        )`
    },
    {
        name: 'reviews',
        query: `CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            partner_id INT NOT NULL,
            order_id INT,
            rating INT CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'rider_locations',
        query: `CREATE TABLE IF NOT EXISTS rider_locations (
            rider_id INT PRIMARY KEY,
            current_lat DECIMAL(10, 8) NOT NULL,
            current_lng DECIMAL(11, 8) NOT NULL,
            is_online BOOLEAN DEFAULT TRUE,
            is_available BOOLEAN DEFAULT TRUE,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    },
    {
        name: 'ride_requests',
        query: `CREATE TABLE IF NOT EXISTS ride_requests (
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
            status ENUM('pending', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled') DEFAULT 'pending',
            estimated_fare DECIMAL(10, 2),
            distance_km DECIMAL(10, 2),
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accepted_at TIMESTAMP NULL DEFAULT NULL,
            completed_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_rider_id) REFERENCES partners(id) ON DELETE SET NULL
        )`
    },
    {
        name: 'ride_request_responses',
        query: `CREATE TABLE IF NOT EXISTS ride_request_responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            rider_id INT NOT NULL,
            response ENUM('shown', 'accepted', 'declined', 'timeout') DEFAULT 'shown',
            response_time_seconds INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY request_rider (request_id, rider_id),
            FOREIGN KEY (request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE
        )`
    }
];

(async () => {
    // 1. Force override foreign keys during cleanup
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
        multipleStatements: true
    });

    try {
        console.log('👷 STARTING MASS REPAIR...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TABLES_TO_FIX) {
            console.log(`\n🔧 Repairing "${table.name}"...`);

            // A. Remove orphan .ibd
            const ibdPath = path.join('C:\\xampp\\mysql\\data\\jungapp_db', `${table.name}.ibd`);
            if (fs.existsSync(ibdPath)) {
                try {
                    fs.unlinkSync(ibdPath);
                    console.log(`   ✅ Deleted orphan .ibd: ${ibdPath}`);
                } catch (fsErr) {
                    console.error(`   ❌ Failed to delete .ibd: ${fsErr.message}`);
                }
            } else {
                console.log(`   ℹ️ No .ibd found (proceeding to drop)`);
            }

            // B. Drop Table
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table.name}`);
                console.log(`   ✅ Dropped table ${table.name}`);
            } catch (err) {
                console.log(`   ⚠️ Drop warning: ${err.message}`);
            }

            // C. Create Table
            try {
                await connection.query(table.query);
                console.log(`   ✅ Created table ${table.name}`);
            } catch (err) {
                console.error(`   ❌ Create failed: ${err.message}`);
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n🎉 MASS REPAIR COMPLETE!');

    } catch (err) {
        console.error('❌ FATAL ERROR:', err);
    } finally {
        await connection.end();
    }
})();
