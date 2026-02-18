/**
 * Migration Script: Create Ride Hailing Tables
 * 
 * Creates:
 * - rider_locations: tracking active riders
 * - ride_requests: student-initiated ride requests
 * - ride_request_responses: driver interaction logs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
        multipleStatements: true
    });

    try {
        console.log('🚀 Starting migration: Create Ride Tables...\n');

        // 1. rider_locations
        console.log('📋 Creating rider_locations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rider_locations (
                rider_id INT PRIMARY KEY,
                current_lat DECIMAL(10, 8) NOT NULL,
                current_lng DECIMAL(11, 8) NOT NULL,
                is_online BOOLEAN DEFAULT TRUE,
                is_available BOOLEAN DEFAULT TRUE,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (rider_id) REFERENCES partners(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Created rider_locations');

        // 2. ride_requests
        console.log('\n📋 Creating ride_requests table...');
        await connection.query(`
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
                status ENUM('pending', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled') DEFAULT 'pending',
                
                estimated_fare DECIMAL(10, 2),
                distance_km DECIMAL(10, 2),
                
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP,
                completed_at TIMESTAMP,
                
                FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_rider_id) REFERENCES partners(id) ON DELETE SET NULL
            )
        `);
        console.log('  ✅ Created ride_requests');

        // 3. ride_request_responses
        console.log('\n📋 Creating ride_request_responses table...');
        await connection.query(`
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
            )
        `);
        console.log('  ✅ Created ride_request_responses');

        console.log('\n✅ Migration completed successfully!');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
