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
        console.log('Adding location column to partners table...');
        await connection.query("ALTER TABLE partners ADD COLUMN location VARCHAR(255);");
        console.log('✅ Successfully added location column.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column `location` already exists.');
        } else {
            console.error('❌ Error updating schema:', err.message);
        }
    } finally {
        await connection.end();
    }
})();
