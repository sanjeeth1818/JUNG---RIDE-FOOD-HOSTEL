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
        console.log('Inspecting "partners" table columns...');
        const [columns] = await connection.query(`DESCRIBE partners`);
        console.table(columns);
    } catch (err) {
        console.error('❌ Error inspecting table:', err.message);
    } finally {
        await connection.end();
    }
})();
