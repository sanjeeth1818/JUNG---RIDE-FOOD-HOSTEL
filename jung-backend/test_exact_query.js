const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('=== TESTING EXACT QUERY FROM API ===\n');

        // This is the exact query the API should be running
        const query = `
            SELECT r.*, p.name as owner_name, p.phone as owner_phone, p.avatar_url as owner_avatar
            FROM rooms r
            LEFT JOIN partners p ON r.partner_id = p.id
            WHERE r.is_available = 1 AND r.status = 'Available'
            AND (p.location LIKE ? OR p.location LIKE ?)
            ORDER BY r.id DESC
        `;

        const [rows] = await pool.query(query, ['%Colombo%', '%Colombo%']);

        console.log(`Found ${rows.length} rooms:\n`);
        rows.forEach(room => {
            console.log(`✓ ${room.title}`);
            console.log(`  ID: ${room.id}`);
            console.log(`  Status: ${room.status}`);
            console.log(`  Available: ${room.is_available}`);
            console.log(`  Owner: ${room.owner_name}`);
            console.log(`  Room Location: ${room.location_name}`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

testQuery();
