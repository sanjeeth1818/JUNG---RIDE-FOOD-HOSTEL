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
        console.log('🔧 Attempting to fix "notifications" table...');

        // 1. Remove orphan .ibd file
        const ibdPath = 'C:\\xampp\\mysql\\data\\jungapp_db\\notifications.ibd';

        if (fs.existsSync(ibdPath)) {
            console.log(`⚠️ Discovered orphan file: ${ibdPath}`);
            try {
                fs.unlinkSync(ibdPath);
                console.log('✅ Successfully deleted orphan .ibd file.');
            } catch (fsErr) {
                console.error('❌ Failed to delete orphan .ibd file:', fsErr.message);
            }
        } else {
            console.log('ℹ️ No orphan .ibd file found.');
        }

        // 2. Drop the table
        console.log('🗑️ Dropping "notifications" table...');
        try {
            await connection.query('DROP TABLE IF EXISTS notifications');
            console.log('✅ DROP successful.');
        } catch (err) {
            console.warn('⚠️ DROP failed:', err.message);
        }

        // 3. Recreate the table
        console.log('🔨 Recreating "notifications" table...');
        const createQuery = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                partner_id INT,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('order', 'ride', 'system', 'promo') DEFAULT 'system',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
            );
        `;

        await connection.query(createQuery);
        console.log('✅ "notifications" table created successfully.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await connection.end();
    }
})();
