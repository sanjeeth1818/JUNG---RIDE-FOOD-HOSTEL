const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

async function migrate() {
    console.log('🚀 Starting Schema Migration: Adding `status` to `rooms` table...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to DB');

        // 1. Check if column exists
        const [columns] = await connection.execute("SHOW COLUMNS FROM rooms LIKE 'status'");
        if (columns.length > 0) {
            console.log('ℹ️ Column `status` already exists. Skipping add.');
        } else {
            // 2. Add Column
            console.log('➕ Adding `status` column...');
            await connection.execute(`
                ALTER TABLE rooms 
                ADD COLUMN status ENUM('Available', 'Occupied', 'Maintenance', 'Hidden') 
                DEFAULT 'Available' 
                AFTER is_available
            `);
            console.log('✅ Column added successfully.');
        }

        // 3. Sync existing data
        console.log('🔄 Syncing existing data (migrating is_available -> status)...');
        await connection.execute(`
            UPDATE rooms 
            SET status = CASE 
                WHEN is_available = 0 THEN 'Occupied' 
                ELSE 'Available' 
            END 
            WHERE status IS NULL OR status = 'Available' -- Only update if not already set manually
        `);
        console.log('✅ Data sync complete.');

    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        if (connection) await connection.end();
        console.log('👋 Migration Script Finished.');
    }
}

migrate();
