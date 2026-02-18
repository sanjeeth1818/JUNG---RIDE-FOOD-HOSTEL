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
        console.log('🗑️ Dropping incomplete "bookings" table...');
        await connection.query('DROP TABLE IF EXISTS bookings');

        console.log('🆕 Creating fresh "bookings" table...');
        const query = `
            CREATE TABLE bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                partner_id INT NOT NULL,
                user_id INT, -- Nullable for manual/walk-in bookings
                guest_name VARCHAR(255), -- For manual bookings
                guest_phone VARCHAR(50), -- Contact for manual bookings
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') DEFAULT 'Pending',
                total_price DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        await connection.query(query);
        console.log('✅ "bookings" table created successfully.');

        // Seed Data
        const partnerId = 19;
        const [rooms] = await connection.execute('SELECT * FROM rooms WHERE partner_id = ?', [partnerId]);
        if (rooms.length > 0) {
            console.log('🌱 Seeding sample booking...');
            await connection.execute(
                `INSERT INTO bookings (partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status) 
                 VALUES (?, ?, 'John Doe', '0771234567', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 25000, 'Confirmed')`,
                [partnerId, rooms[0].id]
            );
            console.log('✅ Sample booking added.');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
    }
})();
