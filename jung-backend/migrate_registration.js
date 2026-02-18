const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const migrate = async () => {
    const connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Running migrations...');

    try {
        // Partners table columns
        const partnerCols = [
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS property_type VARCHAR(100)',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS university_id INT',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS id_front_image LONGTEXT',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS id_back_image LONGTEXT',
            'ALTER TABLE partners ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT'
        ];

        for (const sql of partnerCols) {
            try { await connection.query(sql); } catch (e) { /* Ignore if exists */ }
        }

        // Vehicles table columns
        const vehicleCols = [
            'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_image LONGTEXT',
            'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_book LONGTEXT'
        ];

        for (const sql of vehicleCols) {
            try { await connection.query(sql); } catch (e) { /* Ignore if exists */ }
        }

        console.log('✅ Migrations complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await connection.end();
    }
};

migrate();
