/**
 * Patch Script: Fix ride_requests table schema
 * Ensures all required tables exist and have the correct columns.
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
        console.log('🚀 Starting Ride Hailing Schema Patch...\n');

        // 1. Ensure rider_locations exists
        console.log('📋 Checking rider_locations...');
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
        console.log('  ✅ rider_locations verified');

        // 2. Ensure ride_requests exists and has correct columns
        console.log('\n📋 Checking ride_requests...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ride_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                passenger_id INT NOT NULL,
                pickup_lat DECIMAL(10, 8) NOT NULL,
                pickup_lng DECIMAL(11, 8) NOT NULL,
                dropoff_lat DECIMAL(10, 8) NOT NULL,
                dropoff_lng DECIMAL(11, 8) NOT NULL,
                vehicle_type ENUM('Tuk', 'Bike', 'Car', 'Van') NOT NULL,
                FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check for missing columns in ride_requests
        const [columns] = await connection.query('SHOW COLUMNS FROM ride_requests');
        const colNames = columns.map(c => c.Field);

        const columnsToAdd = [
            { name: 'pickup_location', type: 'TEXT' },
            { name: 'dropoff_location', type: 'TEXT' },
            { name: 'vehicle_type', type: "ENUM('Tuk', 'Bike', 'Car', 'Van') NOT NULL" },
            { name: 'status', type: "ENUM('pending', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled') DEFAULT 'pending'" },
            { name: 'assigned_rider_id', type: 'INT' },
            { name: 'estimated_fare', type: 'DECIMAL(10, 2)' },
            { name: 'distance_km', type: 'DECIMAL(10, 2)' },
            { name: 'requested_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
            { name: 'accepted_at', type: 'TIMESTAMP NULL' },
            { name: 'completed_at', type: 'TIMESTAMP NULL' },
            { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ];

        for (const col of columnsToAdd) {
            if (!colNames.includes(col.name)) {
                console.log(`  ➕ Adding missing column: ${col.name}`);
                await connection.query(`ALTER TABLE ride_requests ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Add foreign key if missing (simplified check)
        if (!colNames.includes('assigned_rider_id_fk_checked')) {
            try {
                await connection.query('ALTER TABLE ride_requests ADD CONSTRAINT fk_assigned_rider FOREIGN KEY (assigned_rider_id) REFERENCES partners(id) ON DELETE SET NULL');
            } catch (e) {
                // Might already exist
            }
        }

        console.log('  ✅ ride_requests verified');

        // 3. Ensure ride_request_responses exists
        console.log('\n📋 Checking ride_request_responses...');
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

        // Check columns for ride_request_responses
        const [respColumns] = await connection.query('SHOW COLUMNS FROM ride_request_responses');
        const respColNames = respColumns.map(c => c.Field);

        if (!respColNames.includes('response_time_seconds')) {
            console.log('  ➕ Adding missing column: response_time_seconds');
            await connection.query('ALTER TABLE ride_request_responses ADD COLUMN response_time_seconds INT');
        }

        console.log('  ✅ ride_request_responses verified');

        console.log('\n✨ Database schema is now fully synchronized!');

    } catch (err) {
        console.error('\n❌ Patch failed:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
