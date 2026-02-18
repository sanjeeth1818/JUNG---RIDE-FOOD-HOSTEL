const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
        multipleStatements: true
    });

    try {
        console.log('🌱 Reading populate_data.sql...');
        const sqlPath = path.join(__dirname, 'populate_data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing SQL statements...');
        // Execute the entire script
        await connection.query(sql);

        console.log('✅ Data population complete!');

    } catch (err) {
        console.error('❌ Error populating data:', err);
    } finally {
        await connection.end();
    }
})();
