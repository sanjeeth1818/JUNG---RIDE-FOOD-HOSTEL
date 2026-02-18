const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugUniversityOfColombo() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        const location = 'University of Colombo';
        const cityName = location.replace('University of ', '').replace(' NSBM Green University', 'Homagama');

        console.log('=== DEBUGGING "University of Colombo" FILTER ===\n');
        console.log('Input location:', location);
        console.log('Extracted city name:', cityName);
        console.log('');

        // Test the query with partner location
        console.log('1. Testing with partner location (NEW logic):');
        const query1 = `
            SELECT r.*, p.name as owner_name, p.location as partner_location
            FROM rooms r
            LEFT JOIN partners p ON r.partner_id = p.id
            WHERE r.is_available = 1 AND r.status = 'Available'
            AND (p.location LIKE ? OR p.location LIKE ?)
            ORDER BY r.id DESC
        `;
        const [rows1] = await pool.query(query1, [`%${location}%`, `%${cityName}%`]);
        console.log(`   Found ${rows1.length} rooms`);
        rows1.forEach(r => console.log(`   - ${r.title} (partner location: "${r.partner_location}")`));

        console.log('\n2. All partners and their locations:');
        const [partners] = await pool.query('SELECT id, name, location FROM partners WHERE type = "Room"');
        partners.forEach(p => console.log(`   - ${p.name}: "${p.location}"`));

        console.log('\n3. Testing if "Colombo" matches:');
        const [rows2] = await pool.query(query1, [`%Colombo%`, `%Colombo%`]);
        console.log(`   Found ${rows2.length} rooms`);
        rows2.forEach(r => console.log(`   - ${r.title} (partner location: "${r.partner_location}")`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

debugUniversityOfColombo();
