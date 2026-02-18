const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const tablesToClear = [
    'ride_request_responses',
    'ride_requests',
    'rider_locations',
    'reviews',
    'order_items',
    'orders',
    'bookings',
    'rooms',
    'vehicles',
    'menu_items',
    'restaurants',
    'partners',
    'users'
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const connection = await mysql.createConnection(dbConfig);

    console.log('WARNING: This will DELETE ALL DATA from the following tables:');
    console.log(tablesToClear.join(', '));
    console.log('\nConfiguration tables (locations, food_categories, vehicle_config, admins) will be preserved.');

    rl.question('Are you sure you want to proceed? Type "yes" to confirm: ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
            try {
                console.log('Disabling foreign key checks...');
                await connection.query('SET FOREIGN_KEY_CHECKS = 0');

                for (const table of tablesToClear) {
                    try {
                        console.log(`Clearing table: ${table}...`);
                        await connection.query(`TRUNCATE TABLE ${table}`);
                    } catch (err) {
                        if (err.code === 'ER_NO_SUCH_TABLE') {
                            console.log(`Table ${table} does not exist, skipping.`);
                        } else {
                            console.error(`Error clearing ${table}:`, err.message);
                        }
                    }
                }

                console.log('Enabling foreign key checks...');
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');

                console.log('✅ All specified tables have been cleared.');
            } catch (err) {
                console.error('Database error:', err);
            } finally {
                await connection.end();
                process.exit(0);
            }
        } else {
            console.log('Operation cancelled.');
            await connection.end();
            process.exit(0);
        }
    });
})();
