const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedColomboUniRestaurants() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🌱 Seeding University of Colombo restaurants...');

        // We use the same partner ID (1) for internal university canteens
        const partnerId = 1;

        const restaurants = [
            {
                name: 'Colombo Uni Main Canteen',
                cuisine_type: 'Rice & Curry',
                rating: 4.4,
                delivery_time_min: 10,
                delivery_time_max: 20,
                category: 'uni',
                address: 'University of Colombo, Reid Avenue'
            },
            {
                name: 'UCSC Cafe',
                cuisine_type: 'Short Eats',
                rating: 4.6,
                delivery_time_min: 5,
                delivery_time_max: 12,
                category: 'uni',
                address: 'UCSC, University of Colombo'
            },
            {
                name: 'Art Faculty Kitchen',
                cuisine_type: 'Local Snacks',
                rating: 4.3,
                delivery_time_min: 15,
                delivery_time_max: 25,
                category: 'uni',
                address: 'Faculty of Arts, University of Colombo'
            }
        ];

        for (const res of restaurants) {
            // Check if exists
            const [existing] = await connection.execute(
                'SELECT id FROM restaurants WHERE name = ? AND address = ?',
                [res.name, res.address]
            );

            if (existing.length === 0) {
                await connection.execute(
                    `INSERT INTO restaurants 
                     (partner_id, name, cuisine_type, rating, delivery_time_min, delivery_time_max, category, address, is_open) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [partnerId, res.name, res.cuisine_type, res.rating, res.delivery_time_min, res.delivery_time_max, res.category, res.address]
                );
                console.log(`✅ Added ${res.name}`);
            } else {
                console.log(`✓ ${res.name} already exists`);
            }
        }

        console.log('✅ Seeding completed!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seedColomboUniRestaurants();
