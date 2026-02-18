const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('🚀 Connected to database...');

        // 1. Create admins table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);
        console.log('✅ Admins table ready.');

        // 2. Seed default admin
        const username = 'admin';
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [existing] = await connection.execute('SELECT id FROM admins WHERE username = ?', [username]);

        if (existing.length === 0) {
            await connection.execute(
                'INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)',
                [username, hash, 'System Administrator']
            );
            console.log(`🎉 Default admin created: ${username} / ${password}`);
        } else {
            console.log('ℹ️ Admin account already exists.');
        }

        await connection.end();
        console.log('👋 Setup complete.');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    }
}

setupAdmin();
