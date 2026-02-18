const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    try {
        console.log('🚀 Starting Config Migration...');

        // 1. Vehicle Config Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_type VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                base_rate DECIMAL(10, 2) NOT NULL,
                per_km_rate DECIMAL(10, 2) NOT NULL,
                icon VARCHAR(10) NOT NULL,
                color VARCHAR(20) NOT NULL,
                eta_default VARCHAR(50) DEFAULT '5 mins',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ vehicle_config table ready');

        // 2. Seed Vehicle Config if empty
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM vehicle_config');
        if (rows[0].count === 0) {
            await pool.query(`
                INSERT INTO vehicle_config (vehicle_type, name, base_rate, per_km_rate, icon, color, eta_default) VALUES 
                ('Tuk', 'Premium Tuk', 120, 60, '🛺', '#10B981', '2 mins'),
                ('Bike', 'Flash Bike', 80, 40, '🏍️', '#3B82F6', '1 min'),
                ('Car', 'Luxury Car', 250, 120, '🚗', '#EC4899', '5 mins'),
                ('Van', 'Family Van', 400, 150, '🚐', '#F59E0B', '8 mins')
            `);
            console.log('🌱 Seeded vehicle_config');
        }

        console.log('✨ Config Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
