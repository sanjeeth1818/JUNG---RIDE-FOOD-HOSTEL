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
        console.log('Checking current max_allowed_packet...');
        const [rows] = await connection.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
        console.log(`Current Value: ${rows[0].Value} bytes (${Math.round(rows[0].Value / 1024 / 1024)} MB)`);

        console.log('Attempting to increase max_allowed_packet to 64MB...');
        // 64MB = 64 * 1024 * 1024 = 67108864
        await connection.query("SET GLOBAL max_allowed_packet = 67108864");
        console.log('✅ Command executed. Note: This might require a DB server restart or might not persist if not set in my.ini.');

        const [newRows] = await connection.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
        console.log(`New Value (Session might need reconnection to see effect): ${newRows[0].Value} bytes`);

    } catch (err) {
        console.error('❌ Error updating variable:', err.message);
        console.log('Hint: You might need to change "max_allowed_packet=64M" in your my.ini file manually if this failed.');
    } finally {
        await connection.end();
    }
})();
