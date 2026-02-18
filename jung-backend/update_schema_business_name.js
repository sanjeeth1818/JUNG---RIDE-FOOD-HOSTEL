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
        console.log('Updating schema for Business Name...');

        // Check if column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'jungapp_db'}' 
            AND TABLE_NAME = 'partners' 
            AND COLUMN_NAME = 'business_name';
        `);

        if (columns.length === 0) {
            await connection.query(`ALTER TABLE partners ADD COLUMN business_name VARCHAR(255) AFTER name;`);
            console.log('✅ Added business_name column.');
        } else {
            console.log('ℹ️ business_name column already exists.');
        }

    } catch (err) {
        console.error('❌ Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
})();
