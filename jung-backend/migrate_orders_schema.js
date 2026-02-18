const mysql = require('mysql2/promise');

(async () => {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    });

    try {
        console.log('Adding restaurant_id to orders table...');

        // Check if column exists first
        const [columns] = await pool.query('SHOW COLUMNS FROM orders LIKE "restaurant_id"');

        if (columns.length === 0) {
            await pool.query('ALTER TABLE orders ADD COLUMN restaurant_id INT AFTER partner_id');
            await pool.query('ALTER TABLE orders ADD CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL');
            console.log('Column restaurant_id added successfully.');
        } else {
            console.log('Column restaurant_id already exists.');
        }

        console.log('Database migration successful!');
    } catch (err) {
        console.error('Database migration failed:', err);
    } finally {
        await pool.end();
    }
})();
