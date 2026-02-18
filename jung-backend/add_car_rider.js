const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCarRider() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🚀 Adding Car Rider...');

        // 1. Create Partner
        const [pResult] = await pool.execute(
            `INSERT INTO partners (name, email, phone, password_hash, type, status, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['James Bond', 'car-rider@test.com', '0777999888', '$2b$10$VuYNxDV1a6hMoNSdYrX18OiunHHGrtTqTM1JwECPyiBHNoWLfIH9K', 'Rider', 'Active', true]
        );
        const riderId = pResult.insertId;
        console.log(`✅ Partner Created: ID ${riderId}`);

        // 2. Create Vehicle
        await pool.execute(
            `INSERT INTO vehicles (partner_id, vehicle_type, model, plate_number, color, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [riderId, 'Car', 'Aston Martin', 'DB-007', 'Silver', true]
        );
        console.log('✅ Vehicle Created: Car');

        // 3. Set Location (Near Colombo default)
        await pool.execute(
            `INSERT INTO rider_locations (rider_id, current_lat, current_lng, is_online, is_available) 
             VALUES (?, ?, ?, ?, ?)`,
            [riderId, 6.9280, 79.8620, true, true]
        );
        console.log('✅ Location Set: 6.9280, 79.8620');

        console.log('\n✨ Test Car Rider added successfully! You can now login with:');
        console.log('Email: car-rider@test.com');
        console.log('Password: password123 (if using the default hash)');

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log('⚠️ Rider already exists. Skipping insertion.');
        } else {
            console.error('❌ Error adding car rider:', err);
        }
    } finally {
        await pool.end();
    }
}

addCarRider();
