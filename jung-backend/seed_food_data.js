const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const seedData = async () => {
    const pool = mysql.createPool(dbConfig);
    console.log('🌱 Seeding food data...');

    try {
        // 1. Get or Create a Partner for Food
        let [partners] = await pool.query("SELECT id FROM partners WHERE type = 'Food' LIMIT 1");
        let partnerId;

        if (partners.length === 0) {
            console.log('⚠️ No food partner found. Creating a temporary one...');
            const [result] = await pool.query(
                "INSERT INTO partners (email, password_hash, name, phone, type, status) VALUES (?, ?, ?, ?, ?, ?)",
                ['food_test@example.com', '$2a$10$9X/5X..', 'Test Food Partner', '0000000000', 'Food', 'Active']
            );
            partnerId = result.insertId;
        } else {
            partnerId = partners[0].id;
        }

        console.log(`🔗 Using Partner ID: ${partnerId}`);

        // 2. Add Restaurants for Universities
        await pool.query(`
            INSERT INTO restaurants (partner_id, name, category, address, cuisine_type, rating, delivery_time_min, delivery_time_max, is_open) 
            VALUES 
            (?, 'University Main Canteen', 'uni', 'NSBM Green University, Homagama', 'Rice & Curry', 4.8, 10, 15, 1),
            (?, 'Campus Cafe', 'uni', 'NSBM Green University, Homagama', 'Fast Food', 4.5, 15, 25, 1),
            (?, 'Tech Hub Diner', 'uni', 'University of Moratuwa, Moratuwa', 'Rice & Curry', 4.6, 12, 20, 1),
            (?, 'Faculty Lounge', 'uni', 'University of Moratuwa, Moratuwa', 'Drinks & Snacks', 4.2, 5, 10, 1),
            (?, 'Heritage Kitchen', 'uni', 'University of Peradeniya, Kandy', 'Traditional', 4.9, 20, 35, 1)
            ON DUPLICATE KEY UPDATE name=name
        `, [partnerId, partnerId, partnerId, partnerId, partnerId]);

        // Get IDs
        const [restaurants] = await pool.query('SELECT id, name FROM restaurants');
        const getResId = (name) => restaurants.find(r => r.name === name)?.id;

        // 3. Add Menu Items
        const dishes = [
            [getResId('University Main Canteen'), 'Classic Chicken Rice', 'Traditional Sri Lankan rice and curry with 4 veg sides', 450.00],
            [getResId('University Main Canteen'), 'Veg Rice & Curry', 'Healthy selection of 5 organic vegetable curries', 350.00],
            [getResId('Campus Cafe'), 'Crispy Chicken Burger', 'Crispy patty with secret sauce and fresh lettuce', 650.00],
            [getResId('Campus Cafe'), 'Cheese Loaded Fries', 'Golden fries topped with melted mozzarella and herbs', 450.00],
            [getResId('Tech Hub Diner'), 'Spicy Seafood Fried Rice', 'Fresh mixed seafood with basmati rice and chili paste', 850.00],
            [getResId('Faculty Lounge'), 'Iced Coffee', 'Freshly brewed local coffee with creamy milk', 250.00],
            [getResId('Faculty Lounge'), 'Chocolate Muffin', 'Soft muffin with dark chocolate chips', 180.00],
            [getResId('Heritage Kitchen'), 'Claypot Rice', 'Slow cooked rice in traditional clay pot', 750.00]
        ];

        for (const dish of dishes) {
            if (dish[0]) {
                await pool.query(
                    'INSERT INTO menu_items (restaurant_id, name, description, price, is_available) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name=name',
                    dish
                );
            }
        }

        console.log('✅ Seeding complete!');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
};

seedData();
