const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
        multipleStatements: true
    });

    try {
        console.log('Updating schema for ID Images...');

        // Check if columns exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'jungapp_db'}' 
            AND TABLE_NAME = 'partners' 
            AND COLUMN_NAME IN ('id_front_image', 'id_back_image');
        `);

        if (columns.length < 2) {
            // We'll just run ALTER anyway, relying on IF NOT EXISTS logic isn't standard in ALTER locally without procedures, 
            // but since we checked count, we can try adding them safely. 
            // Simplest is to just try adding them one by one/ignore errors or do it clean.
            // Let's do it clean:

            if (!columns.some(c => c.COLUMN_NAME === 'id_front_image')) {
                await connection.query(`ALTER TABLE partners ADD COLUMN id_front_image MEDIUMTEXT;`);
                console.log('✅ Added id_front_image.');
            }

            if (!columns.some(c => c.COLUMN_NAME === 'id_back_image')) {
                await connection.query(`ALTER TABLE partners ADD COLUMN id_back_image MEDIUMTEXT;`);
                console.log('✅ Added id_back_image.');
            }
        } else {
            console.log('ℹ️ ID Image columns already exist.');
        }

    } catch (err) {
        console.error('❌ Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
})();
