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
        console.log('=== PARTNERS TABLE ===');
        const [partners] = await connection.query('DESCRIBE partners');
        console.table(partners);

        console.log('\n=== VEHICLES TABLE ===');
        const [vehicles] = await connection.query('DESCRIBE vehicles');
        console.table(vehicles);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
})();
