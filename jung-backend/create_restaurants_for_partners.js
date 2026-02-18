const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRestaurantForFoodPartners() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🔍 Checking for food partners without restaurants...');

        // Find all food partners
        const [partners] = await connection.execute(
            `SELECT id, name as business_name, location 
             FROM partners 
             WHERE type = 'Food'`
        );

        console.log(`Found ${partners.length} food partners`);

        for (const partner of partners) {
            // Check if restaurant already exists
            const [existing] = await connection.execute(
                'SELECT id FROM restaurants WHERE partner_id = ?',
                [partner.id]
            );

            if (existing.length === 0) {
                console.log(`Creating restaurant for partner ${partner.id} (${partner.business_name})`);

                // Create restaurant record
                await connection.execute(
                    `INSERT INTO restaurants 
                     (partner_id, name, cuisine_type, is_open) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        partner.id,
                        partner.business_name || 'Restaurant',
                        'General', // Default cuisine type
                        1 // Open by default
                    ]
                );

                console.log(`✅ Restaurant created for partner ${partner.id}`);
            } else {
                console.log(`✓ Restaurant already exists for partner ${partner.id}`);
            }
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the migration
createRestaurantForFoodPartners()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
