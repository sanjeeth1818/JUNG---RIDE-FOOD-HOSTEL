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
        // 1. Check for orphan .ibd file and delete it manually
        const fs = require('fs');
        const path = require('path');
        const ibdPath = 'C:\\xampp\\mysql\\data\\jungapp_db\\users.ibd'; // Hardcoded based on investigation

        if (fs.existsSync(ibdPath)) {
            console.log(`⚠️ Discovered orphan file: ${ibdPath}`);
            try {
                fs.unlinkSync(ibdPath);
                console.log('✅ Successfully deleted orphan .ibd file.');
            } catch (fsErr) {
                console.error('❌ Failed to delete orphan .ibd file (Permission denied?):', fsErr.message);
                console.log('👉 You may need to stop MySQL, delete the file manually, and restart MySQL.');
            }
        }

        // 2. Drop the table if it exists
        console.log('🗑️ Dropping "users" table...');
        try {
            await connection.query('DROP TABLE IF EXISTS users');
            console.log('✅ DROP successful.');
        } catch (err) {
            console.warn('⚠️ DROP failed:', err.message);
        }

        // 3. Recreate the table
        console.log('🔨 Recreating "users" table...');
        const createQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                name VARCHAR(255),
                phone VARCHAR(50),
                avatar_url TEXT,
                user_type ENUM('student', 'worker') DEFAULT 'student',
                location_type VARCHAR(50),
                location_name VARCHAR(255),
                lat DECIMAL(10, 8),
                lng DECIMAL(11, 8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        await connection.query(createQuery);
        console.log('✅ "users" table created successfully.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await connection.end();
    }
})();
