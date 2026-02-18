const mysql = require('mysql2/promise');

(async () => {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    });

    try {
        console.log('Creating food_categories table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS food_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Seeding food_categories...');
        const categories = [
            'Appetizers',
            'Main Course',
            'Desserts',
            'Beverages',
            'Sides',
            'Specials',
            'Uncategorized'
        ];

        for (const cat of categories) {
            await pool.query('INSERT IGNORE INTO food_categories (name) VALUES (?)', [cat]);
        }

        console.log('Database update successful!');
    } catch (err) {
        console.error('Database update failed:', err);
    } finally {
        await pool.end();
    }
})();
