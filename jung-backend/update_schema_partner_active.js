const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
    });

    try {
        console.log('⏳ Adding is_active column to partners table...');
        await pool.execute('ALTER TABLE partners ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER status');
        console.log('✅ Successfully added is_active column.');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('ℹ️ Column is_active already exists.');
        } else {
            console.error('❌ Error updating database:', err.message);
        }
    } finally {
        await pool.end();
    }
}

updateSchema();
