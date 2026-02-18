/**
 * Database Migration: Add Ride Request System Tables
 * 
 * Creates three new tables:
 * 1. ride_requests - Store ride requests from passengers
 * 2. rider_locations - Track real-time GPS locations of riders
 * 3. ride_request_responses - Log rider responses to requests
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🚀 Starting Ride Request System Migration...\n');

        // 1. Create ride_requests table
        console.log('📋 Creating ride_requests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ride_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                passenger_id INT NOT NULL,
                pickup_location VARCHAR(255) NOT NULL,
                pickup_lat DECIMAL(10, 8) NOT NULL,
                pickup_lng DECIMAL(11, 8) NOT NULL,
                dropoff_location VARCHAR(255),
                dropoff_lat DECIMAL(10, 8),
                dropoff_lng DECIMAL(11, 8),
                estimated_fare DECIMAL(10, 2),
                distance_km DECIMAL(10, 2),
                vehicle_type ENUM('Tuk', 'Bike', 'Car', 'Van') NOT NULL,
                status ENUM('pending', 'accepted', 'declined', 'cancelled', 'completed') DEFAULT 'pending',
                assigned_rider_id INT NULL,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                
                FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_rider_id) REFERENCES partners(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_location (pickup_lat, pickup_lng),
                INDEX idx_requested_at (requested_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('  ✅ ride_requests table created\n');

        // 2. Create rider_locations table
        console.log('📍 Creating rider_locations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rider_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rider_id INT NOT NULL,
                current_lat DECIMAL(10, 8) NOT NULL,
                current_lng DECIMAL(11, 8) NOT NULL,
                is_online BOOLEAN DEFAULT FALSE,
                is_available BOOLEAN DEFAULT TRUE,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE,
                UNIQUE KEY unique_rider (rider_id),
                INDEX idx_online_available (is_online, is_available),
                INDEX idx_location (current_lat, current_lng)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('  ✅ rider_locations table created\n');

        // 3. Create ride_request_responses table
        console.log('📝 Creating ride_request_responses table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ride_request_responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                rider_id INT NOT NULL,
                response ENUM('shown', 'accepted', 'declined', 'timeout') NOT NULL,
                response_time_seconds INT,
                responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
                FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE,
                INDEX idx_request (request_id),
                INDEX idx_rider (rider_id),
                INDEX idx_response (response)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('  ✅ ride_request_responses table created\n');

        // Verify tables
        console.log('🔍 Verifying tables...\n');

        const [rideRequests] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ride_requests' 
            AND TABLE_SCHEMA = DATABASE()
            ORDER BY ORDINAL_POSITION
        `);
        console.log('✓ ride_requests columns:', rideRequests.length);

        const [riderLocations] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'rider_locations' 
            AND TABLE_SCHEMA = DATABASE()
            ORDER BY ORDINAL_POSITION
        `);
        console.log('✓ rider_locations columns:', riderLocations.length);

        const [responses] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ride_request_responses' 
            AND TABLE_SCHEMA = DATABASE()
            ORDER BY ORDINAL_POSITION
        `);
        console.log('✓ ride_request_responses columns:', responses.length);

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   • ride_requests: For storing ride requests from passengers');
        console.log('   • rider_locations: For tracking real-time GPS of riders');
        console.log('   • ride_request_responses: For logging accept/decline actions');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
