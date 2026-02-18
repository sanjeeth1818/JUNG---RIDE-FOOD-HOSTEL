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
        console.log('Creating "bookings" table...');

        const query = `
            CREATE TABLE IF NOT EXISTS bookings (
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

    } catch (err) {
        console.error('❌ Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
})();
