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
        console.log('🔄 Updating Partner ID 19...');

        // Set Business Name and Location if missing
        await connection.query(
            `UPDATE partners 
             SET business_name = 'Luxury Stays Colombo', location = 'Colombo 07' 
             WHERE id = 19`
        );
        console.log('✅ Partner 19 details updated.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
    }
})();
