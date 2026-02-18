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
        console.log('Creating locations table...');

        // Create Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                type ENUM('University', 'City') DEFAULT 'City'
            )
        `);
        console.log('✅ Connected/Created locations table.');

        // Seed Data
        console.log('Seeding locations...');
        const locations = [
            ['SLIIT Malabe', 'University'],
            ['NSBM Green University', 'University'],
            ['Colombo', 'City'],
            ['Kandy', 'City'],
            ['Galle', 'City'],
            ['Malabe', 'City'],
            ['Kaduwela', 'City'],
            ['Nugegoda', 'City']
        ];

        for (const [name, type] of locations) {
            try {
                await connection.execute('INSERT INTO locations (name, type) VALUES (?, ?)', [name, type]);
                console.log(`   Added: ${name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    // console.log(`   Skipped (Exists): ${name}`);
                } else {
                    console.error(`   Error adding ${name}:`, err.message);
                }
            }
        }
        console.log('✅ Seeding complete.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
    }
})();
