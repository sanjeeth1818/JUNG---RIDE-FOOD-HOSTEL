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
        console.log('🔍 Checking for missing columns in "bookings"...');

        // Check columns
        const [columns] = await connection.query(`SHOW COLUMNS FROM bookings`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('guest_name')) {
            console.log('➕ Adding "guest_name" column...');
            await connection.query(`ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255) AFTER user_id`);
        } else {
            console.log('✅ "guest_name" exists.');
        }

        if (!columnNames.includes('guest_phone')) {
            console.log('➕ Adding "guest_phone" column...');
            await connection.query(`ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(50) AFTER guest_name`);
        } else {
            console.log('✅ "guest_phone" exists.');
        }

        console.log('✅ Schema check complete. Seeding data...');

        // Retry Seeding
        const partnerId = 19;
        const [rooms] = await connection.execute('SELECT * FROM rooms WHERE partner_id = ?', [partnerId]);
        if (rooms.length > 0) {
            const roomId = rooms[0].id;
            const [bookings] = await connection.execute('SELECT * FROM bookings WHERE partner_id = ?', [partnerId]);
            if (bookings.length === 0) {
                await connection.execute(
                    `INSERT INTO bookings (partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status) 
                     VALUES (?, ?, 'John Doe', '0771234567', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 25000, 'Confirmed')`,
                    [partnerId, roomId]
                );
                console.log('✅ Sample Booking Created Successfully.');
            } else {
                console.log('ℹ️ Bookings already exist.');
            }
        }

    } catch (err) {
        console.error('❌ Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
})();
