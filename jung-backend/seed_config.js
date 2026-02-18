const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const seedData = async () => {
    const connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Connected to database...');

    try {
        // 1. ADMIN USER
        console.log('👤 Seeding Admin User...');
        const adminUsername = 'admin';
        const adminPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);

        // Ensure table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);

        await connection.query(
            'INSERT IGNORE INTO admins (username, password_hash, name) VALUES (?, ?, ?)',
            [adminUsername, hash, 'System Administrator']
        );
        console.log('✅ Admin initialized.');


        // 2. LOCATIONS (CITIES)
        console.log('🏙️ Seeding Cities...');
        const cities = [
            ['Colombo', 'City', 6.9271, 79.8612],
            ['Kandy', 'City', 7.2906, 80.6337],
            ['Galle', 'City', 6.0367, 80.2170],
            ['Jaffna', 'City', 9.6615, 80.0255],
            ['Negombo', 'City', 7.2083, 79.8353],
            ['Anuradhapura', 'City', 8.3114, 80.4037],
            ['Matara', 'City', 5.9549, 80.5550],
            ['Ratnapura', 'City', 6.6828, 80.3992],
            ['Kurunegala', 'City', 7.4817, 80.3609],
            ['Batticaloa', 'City', 7.7170, 81.7010],
            ['Trincomalee', 'City', 8.5873, 81.2152],
            ['Nuwara Eliya', 'City', 6.9497, 80.7891],
            ['Badulla', 'City', 6.9934, 81.0550],
            ['Kalutara', 'City', 6.5854, 79.9607],
            ['Gampaha', 'City', 7.0873, 79.9924],
            ['Kegalle', 'City', 7.2513, 80.3464],
            ['Ampara', 'City', 7.2912, 81.6724],
            ['Vavuniya', 'City', 8.7542, 80.4982],
            ['Mullaitivu', 'City', 9.2671, 80.8142],
            ['Kilinochchi', 'City', 9.3803, 80.3970],
            ['Polonnaruwa', 'City', 7.9325, 81.0003],
            ['Puttalam', 'City', 8.0330, 79.8259],
            ['Hambantota', 'City', 6.1246, 81.1185],
            ['Moneragala', 'City', 6.8722, 81.3507]
        ];

        // Ensure table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                type ENUM('University', 'City') DEFAULT 'City',
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8)
            )
        `);

        for (const city of cities) {
            await connection.query(
                'INSERT IGNORE INTO locations (name, type, latitude, longitude) VALUES (?, ?, ?, ?)',
                city
            );
        }
        console.log(`✅ ${cities.length} Cities seeded.`);


        // 3. UNIVERSITIES
        console.log('🎓 Seeding Universities...');
        const universities = [
            ['University of Colombo', 'University', 6.9001, 79.8584],
            ['University of Peradeniya', 'University', 7.2525, 80.5925],
            ['University of Moratuwa', 'University', 6.7950, 79.9007],
            ['University of Kelaniya', 'University', 6.9740, 79.9149],
            ['University of Sri Jayewardenepura', 'University', 6.8528, 79.9036],
            ['University of Jaffna', 'University', 9.6848, 80.0216],
            ['University of Ruhuna', 'University', 5.9381, 80.5762],
            ['Eastern University of Sri Lanka', 'University', 7.7944, 81.5790],
            ['South Eastern University of Sri Lanka', 'University', 7.3000, 81.8500],
            ['Rajarata University of Sri Lanka', 'University', 8.3582, 80.4900],
            ['Sabaragamuwa University of Sri Lanka', 'University', 6.7122, 80.7874],
            ['Wayamba University of Sri Lanka', 'University', 7.3225, 79.9881],
            ['Uva Wellassa University', 'University', 6.9814, 81.0763]
        ];

        for (const uni of universities) {
            await connection.query(
                'INSERT IGNORE INTO locations (name, type, latitude, longitude) VALUES (?, ?, ?, ?)',
                uni
            );
        }
        console.log(`✅ ${universities.length} Universities seeded.`);


        // 4. VEHICLE TYPES
        console.log('🚗 Seeding Vehicle Types...');
        // Ensure table exists
        await connection.query(`
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

        const vehicles = [
            ['Tuk', 'Premium Tuk', 120, 60, '🛺', '#10B981', '2 mins'],
            ['Bike', 'Flash Bike', 80, 40, '🏍️', '#3B82F6', '1 min'],
            ['Car', 'Luxury Car', 250, 120, '🚗', '#EC4899', '5 mins'],
            ['Van', 'Family Van', 400, 150, '🚐', '#F59E0B', '8 mins']
        ];

        for (const v of vehicles) {
            await connection.query(
                `INSERT INTO vehicle_config (vehicle_type, name, base_rate, per_km_rate, icon, color, eta_default) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 name=VALUES(name), base_rate=VALUES(base_rate), per_km_rate=VALUES(per_km_rate), 
                 icon=VALUES(icon), color=VALUES(color), eta_default=VALUES(eta_default)`,
                v
            );
        }
        console.log(`✅ ${vehicles.length} Vehicle Types seeded.`);


        // 5. FOOD CATEGORIES
        console.log('🍔 Seeding Food Categories...');
        // Ensure table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS food_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const foodCategories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Sides', 'Specials', 'Uncategorized'];

        for (const cat of foodCategories) {
            await connection.query(
                'INSERT IGNORE INTO food_categories (name) VALUES (?)',
                [cat]
            );
        }
        console.log(`✅ ${foodCategories.length} Food Categories seeded.`);

        console.log('\n✨ Database Population Complete! ✨');

    } catch (err) {
        console.error('❌ Error Seeding Data:', err);
    } finally {
        await connection.end();
    }
};

seedData();
