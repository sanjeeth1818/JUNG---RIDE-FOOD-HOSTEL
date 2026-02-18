const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function addLocationCoordinates() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to database');

        try {
            // 1. Add columns if not exist
            const [columns] = await connection.execute(
                "SHOW COLUMNS FROM locations LIKE 'latitude'"
            );

            if (columns.length === 0) {
                console.log('Adding latitude/longitude columns to locations...');
                await connection.execute(
                    "ALTER TABLE locations ADD COLUMN latitude DECIMAL(10, 8), ADD COLUMN longitude DECIMAL(11, 8)"
                );
            }

            // 2. Seed data
            const locations = [
                { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
                { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
                { name: 'Galle', lat: 6.0535, lng: 80.2210 },
                { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
                { name: 'Matara', lat: 5.9549, lng: 80.5550 },
                { name: 'Negombo', lat: 7.2081, lng: 79.8373 },
                { name: 'Kurunegala', lat: 7.4863, lng: 80.3647 },
                { name: 'Gampaha', lat: 7.0873, lng: 79.9925 },
                { name: 'Anuradhapura', lat: 8.3562, lng: 80.4037 },
                { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 }
            ];

            console.log('Updating location coordinates...');
            for (const loc of locations) {
                // Ensure location exists first, or insert if you want, but for now just update existing
                // Or better, UPSERT if name is unique
                await connection.execute(
                    `UPDATE locations SET latitude = ?, longitude = ? WHERE name = ?`,
                    [loc.lat, loc.lng, loc.name]
                );
            }
            console.log('✅ Locations updated successfully');

        } catch (err) {
            console.error('Error modifying table:', err);
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await pool.end();
    }
}

addLocationCoordinates();
