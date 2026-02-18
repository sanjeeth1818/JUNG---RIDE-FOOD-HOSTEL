const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRooms() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        const [rows] = await pool.query('SELECT id, title, price_per_month, room_type, amenities FROM rooms');
        console.log('--- ROOMS DATA ---');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRooms();
