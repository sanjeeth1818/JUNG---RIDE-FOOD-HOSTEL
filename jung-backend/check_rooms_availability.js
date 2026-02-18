const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRoomsAvailability() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('--- CHECKING ROOMS TABLE STRUCTURE ---');
        const [columns] = await pool.query('DESCRIBE rooms');
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        console.log('\n--- ALL ROOMS ---');
        const [allRooms] = await pool.query('SELECT id, title, status, is_available, property_type FROM rooms');
        console.log(JSON.stringify(allRooms, null, 2));

        console.log('\n--- AVAILABLE ROOMS (as per API query) ---');
        const [availableRooms] = await pool.query(`
            SELECT id, title, status, is_available, property_type 
            FROM rooms 
            WHERE is_available = 1 AND status = 'Available'
        `);
        console.log(JSON.stringify(availableRooms, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkRoomsAvailability();
