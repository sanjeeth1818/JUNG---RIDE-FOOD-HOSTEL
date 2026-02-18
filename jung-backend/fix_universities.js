const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

(async () => {
    const connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Connected to database...');

    try {
        // 1. Check for Foreign Keys on partners
        console.log('Checking for foreign keys on partners...');
        const [fks] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'partners' 
            AND REFERENCED_TABLE_NAME = 'universities'
            AND TABLE_SCHEMA = '${dbConfig.database}';
        `);

        for (const fk of fks) {
            console.log(`Dropping FK: ${fk.CONSTRAINT_NAME}`);
            await connection.query(`ALTER TABLE partners DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        // 2. Drop the corrupted table
        console.log('Attempting to drop corrupted universities table...');
        try {
            await connection.query('DROP TABLE IF EXISTS universities');
            console.log('✅ Dropped universities table.');
        } catch (err) {
            console.warn('⚠️ Could not drop table normally (might be very corrupted). Error:', err.message);
        }

        // 3. Re-verify locations table has universities
        console.log('Verifying Universities in locations table...');
        const [rows] = await connection.query("SELECT COUNT(*) as count FROM locations WHERE type = 'University'");
        console.log(`ℹ️ Found ${rows[0].count} universities in 'locations' table.`);

        console.log('✨ Cleanup complete.');

    } catch (err) {
        console.error('❌ Error during cleanup:', err.message);
    } finally {
        await connection.end();
    }
})();
