const mysql = require('mysql2/promise');
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
        console.log('Updating schema for Universities...');

        // 1. Create universities table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS universities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location_name VARCHAR(255), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created universities table.');

        // 2. Add university_id to partners table if not exists
        // Check if column exists first to avoid error
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'jungapp_db'}' 
            AND TABLE_NAME = 'partners' 
            AND COLUMN_NAME = 'university_id';
        `);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE partners 
                ADD COLUMN university_id INT DEFAULT NULL,
                ADD FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL;
            `);
            console.log('✅ Added university_id to partners table.');
        } else {
            console.log('ℹ️ university_id column already exists in partners.');
        }

        // 3. Seed some University data
        // First delete existing to avoid dupes/mess during dev (Optional, be careful in prod)
        // For now, I'll just Insert Ignore
        const unis = [
            { name: 'University of Colombo', city: 'Colombo' },
            { name: 'University of Moratuwa', city: 'Moratuwa' },
            { name: 'University of Peradeniya', city: 'Kandy' },
            { name: 'University of Kelaniya', city: 'Kelaniya' },
            { name: 'University of Japura', city: 'Nugegoda' },
            { name: 'University of Jaffna', city: 'Jaffna' },
            { name: 'University of Ruhuna', city: 'Matara' },
            { name: 'University of Vavuniya', city: 'Vavuniya' }
        ];

        for (const uni of unis) {
            // Ensure location exists in locations table (optional but good for consistency)
            await connection.query(`INSERT IGNORE INTO locations (name, type) VALUES (?, 'City')`, [uni.city]);

            // Insert University
            await connection.query(`
                INSERT INTO universities (name, location_name) 
                SELECT ?, ? 
                WHERE NOT EXISTS (SELECT 1 FROM universities WHERE name = ?);
            `, [uni.name, uni.city, uni.name]);
        }
        console.log('✅ Seeded university data.');

    } catch (err) {
        console.error('❌ Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
})();
