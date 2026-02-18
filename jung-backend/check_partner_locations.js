const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPartnerLocations() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('=== PARTNER LOCATIONS AND THEIR ROOMS ===\n');

        const [results] = await pool.query(`
            SELECT 
                p.id as partner_id,
                p.name as partner_name,
                p.location as partner_location,
                r.id as room_id,
                r.title as room_title,
                r.location_name as room_location
            FROM partners p
            LEFT JOIN rooms r ON p.id = r.partner_id
            WHERE p.type = 'Room'
            ORDER BY p.id, r.id
        `);

        let currentPartnerId = null;
        results.forEach(row => {
            if (row.partner_id !== currentPartnerId) {
                console.log(`\n📍 Partner: ${row.partner_name}`);
                console.log(`   Base Location: "${row.partner_location}"`);
                console.log(`   Rooms:`);
                currentPartnerId = row.partner_id;
            }
            if (row.room_id) {
                console.log(`   - ${row.room_title} (room location: "${row.room_location || 'N/A'}")`);
            } else {
                console.log(`   - No rooms yet`);
            }
        });

        console.log('\n\n=== TESTING NEW FILTER ===');
        console.log('When "University of Colombo" is selected, it will search for partners with location containing "University of Colombo" or "Colombo"');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkPartnerLocations();
