const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    // Connect without database selected to allow CREATE DATABASE
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema to database...');
        await connection.query(schemaSql);
        console.log('✅ Schema applied successfully.');
        console.log('Note: "CREATE TABLE IF NOT EXISTS" will not modify existing tables.');

    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
    } finally {
        await connection.end();
    }
})();
