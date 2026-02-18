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

async function addPropertyType() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to database');

        try {
            // Check if column exists
            const [columns] = await connection.execute(
                "SHOW COLUMNS FROM partners LIKE 'property_type'"
            );

            if (columns.length === 0) {
                console.log('Adding property_type column...');
                await connection.execute(
                    "ALTER TABLE partners ADD COLUMN property_type ENUM('Boarding', 'Hostel', 'Apartment', 'House') DEFAULT NULL"
                );
                console.log('✅ property_type column added successfully');
            } else {
                console.log('ℹ️ property_type column already exists');
            }

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

addPropertyType();
