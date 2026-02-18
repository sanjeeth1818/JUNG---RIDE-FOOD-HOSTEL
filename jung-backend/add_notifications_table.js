const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function addNotificationsTable() {
    try {
        console.log('🔄 Creating notifications table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT, -- For users
                partner_id INT, -- For partners (riders/restaurants)
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type ENUM('info', 'warning', 'success', 'error', 'ride_request', 'system') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
            );
        `);

        // Insert some mock notifications for testing
        // Check if table is empty first
        const [rows] = await pool.query('SELECT count(*) as count FROM notifications');
        if (rows[0].count === 0) {
            const [partners] = await pool.query('SELECT id FROM partners LIMIT 1');
            if (partners.length > 0) {
                const pid = partners[0].id;
                await pool.query(`
                    INSERT INTO notifications (partner_id, title, message, type) VALUES 
                    (?, 'Welcome to JUNG!', 'You are now a registered partner. Go online to start earning.', 'success'),
                    (?, 'High Demand Area!', 'Lots of ride requests in Colombo 03 right now.', 'info'),
                    (?, 'Tips for Success', 'Keep your vehicle clean to get 5-star ratings.', 'info')
                 `, [pid, pid, pid]);
                console.log('✅ Added mock notifications.');
            }
        }

        console.log('✅ Notifications table setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addNotificationsTable();
