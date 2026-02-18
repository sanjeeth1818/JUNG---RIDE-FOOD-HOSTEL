const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🔧 Attempting to fix "locations" table...');

        // 1. Remove orphan .ibd file
        const ibdPath = 'C:\\xampp\\mysql\\data\\jungapp_db\\locations.ibd';

        if (fs.existsSync(ibdPath)) {
            console.log(`⚠️ Discovered orphan file: ${ibdPath}`);
            try {
                fs.unlinkSync(ibdPath);
                console.log('✅ Successfully deleted orphan .ibd file.');
            } catch (fsErr) {
                console.error('❌ Failed to delete orphan .ibd file:', fsErr.message);
            }
        } else {
            console.log('ℹ️ No orphan .ibd file found.');
        }

        // 2. Drop the table
        console.log('🗑️ Dropping "locations" table...');
        try {
            await connection.query('DROP TABLE IF EXISTS locations');
            console.log('✅ DROP successful.');
        } catch (err) {
            console.warn('⚠️ DROP failed:', err.message);
        }

        // 3. Recreate the table
        console.log('🔨 Recreating "locations" table...');
        const createQuery = `
            CREATE TABLE IF NOT EXISTS locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                type ENUM('University', 'City') DEFAULT 'City'
            );
        `;

        await connection.query(createQuery);
        console.log('✅ "locations" table created successfully.');

        // 4. Seed initial data
        console.log('🌱 Seeding "locations" table...');
        const initialLocations = [
            ['Colombo', 'City'],
            ['Kandy', 'City'],
            ['Galle', 'City'],
            ['NSBM Green University', 'University'],
            ['SLIIT', 'University'],
            ['IIT', 'University']
        ];

        for (const loc of initialLocations) {
            try {
                await connection.execute('INSERT INTO locations (name, type) VALUES (?, ?)', loc);
            } catch (ignore) { } // Ignore duplicates
        }
        console.log('✅ Seeding complete.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await connection.end();
    }
})();
