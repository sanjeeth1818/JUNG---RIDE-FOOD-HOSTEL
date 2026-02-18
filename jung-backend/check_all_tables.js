const mysql = require('mysql2/promise');
require('dotenv').config();

const TABLES_TO_CHECK = [
    'users', 'partners', 'sessions', 'locations',
    'restaurants', 'menu_items', 'vehicles', 'rooms', 'bookings',
    'orders', 'order_items', 'reviews',
    'rider_locations', 'ride_requests', 'ride_request_responses'
];

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    console.log('🔍 Systematically checking tables...');

    for (const table of TABLES_TO_CHECK) {
        try {
            await connection.query(`SELECT 1 FROM ${table} LIMIT 1`);
            console.log(`✅ ${table}: OK`);
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_TABLESPACE_MISSING' || err.message.includes("doesn't exist in engine")) {
                console.log(`❌ ${table}: CORRUPTED/MISSING (${err.message})`);
            } else {
                console.log(`⚠️ ${table}: Error (${err.message})`);
            }
        }
    }

    await connection.end();
})();
