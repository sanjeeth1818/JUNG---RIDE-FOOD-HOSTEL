const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBasicQuery() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('=== TESTING BASIC ROOMS QUERY ===\n');

        // Simple query - just get all available rooms
        const [rooms] = await pool.query(`
            SELECT 
                r.*,
                p.name as owner_name,
                p.phone as owner_phone,
                p.location as partner_location
            FROM rooms r
            LEFT JOIN partners p ON r.partner_id = p.id
            WHERE r.is_available = 1 AND r.status = 'Available'
            ORDER BY r.id DESC
        `);

        console.log(`Found ${rooms.length} available rooms:\n`);
        rooms.forEach((room, i) => {
            console.log(`${i + 1}. ${room.title}`);
            console.log(`   ID: ${room.id}`);
            console.log(`   Price: LKR ${room.price_per_month}`);
            console.log(`   Partner: ${room.owner_name}`);
            console.log(`   Partner Location: ${room.partner_location || 'N/A'}`);
            console.log(`   Room Location: ${room.location_name || 'N/A'}`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

testBasicQuery();
