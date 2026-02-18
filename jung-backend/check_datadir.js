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
        console.log('🔍 Checking Data Directory...');
        const [rows] = await connection.query("SHOW VARIABLES LIKE 'datadir'");
        console.log('📂 Data Directory:', rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await connection.end();
    }
})();
