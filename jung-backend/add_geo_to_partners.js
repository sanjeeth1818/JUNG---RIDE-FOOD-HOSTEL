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

async function addGeoColumns() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to database');

        try {
            // Check if column exists
            const [columns] = await connection.execute(
                "SHOW COLUMNS FROM partners LIKE 'latitude'"
            );

            if (columns.length === 0) {
                console.log('Adding latitude/longitude columns...');
                await connection.execute(
                    "ALTER TABLE partners ADD COLUMN latitude DECIMAL(10, 8), ADD COLUMN longitude DECIMAL(11, 8)"
                );
                console.log('✅ Columns added successfully');
            } else {
                console.log('ℹ️ Columns already exist');
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

addGeoColumns();
