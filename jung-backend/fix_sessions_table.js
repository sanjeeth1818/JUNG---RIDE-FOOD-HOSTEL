const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🔧 Attempting to fix "sessions" table...');

        // 1. Remove orphan .ibd file
        const ibdPath = 'C:\\xampp\\mysql\\data\\jungapp_db\\sessions.ibd';

        if (fs.existsSync(ibdPath)) {
            console.log(`⚠️ Discovered orphan file: ${ibdPath}`);
            try {
                fs.unlinkSync(ibdPath);
                console.log('✅ Successfully deleted orphan .ibd file.');
            } catch (fsErr) {
                console.error('❌ Failed to delete orphan .ibd file:', fsErr.message);
            }
        } else {
            console.log('ℹ️ No orphan .ibd file found (that\'s good).');
        }

        // 2. Drop the table
        console.log('🗑️ Dropping "sessions" table...');
        try {
            await connection.query('DROP TABLE IF EXISTS sessions');
            console.log('✅ DROP successful.');
        } catch (err) {
            console.warn('⚠️ DROP failed:', err.message);
        }

        // 3. Recreate the table manually (to be safe, though library does it too)
        console.log('🔨 Recreating "sessions" table...');
        const createQuery = `
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
                expires INT(11) UNSIGNED NOT NULL,
                data MEDIUMTEXT COLLATE utf8mb4_bin,
                PRIMARY KEY (session_id)
            ) ENGINE=InnoDB;
        `;

        await connection.query(createQuery);
        console.log('✅ "sessions" table created successfully.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await connection.end();
    }
})();
