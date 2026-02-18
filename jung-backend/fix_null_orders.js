const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixOrders() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🔍 Searching for orders with missing information...');

        // Find orders where restaurant_id is null? (Actually they were null in my check)
        // Wait, in my check I saw: 
        // {"id":2,"user_id":1,"partner_id":null,"restaurant_id":null,"service_type":"Food",...}

        // Let's try to recover them if possible. 
        // Since we don't know which restaurant they belonged to (because it's null),
        // and we only have 1 order in the system, we can assume it's the "Vaani Vilas" (ID 15) for testing.

        const [orders] = await pool.query('SELECT * FROM orders WHERE restaurant_id IS NULL OR partner_id IS NULL');

        if (orders.length === 0) {
            console.log('✅ No broken orders found.');
            return;
        }

        console.log(`Found ${orders.length} broken orders.`);

        for (const order of orders) {
            console.log(`Fixing order ID: ${order.id}`);
            // Attempt to find the restaurant from order_items if possible
            const [items] = await pool.query(`
                SELECT mi.restaurant_id, r.partner_id 
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE oi.order_id = ? 
                LIMIT 1
            `, [order.id]);

            if (items.length > 0) {
                const { restaurant_id, partner_id } = items[0];
                await pool.query(
                    'UPDATE orders SET restaurant_id = ?, partner_id = ? WHERE id = ?',
                    [restaurant_id, partner_id, order.id]
                );
                console.log(`   ✅ Recovered info from menu items: Restaurant ${restaurant_id}, Partner ${partner_id}`);
            } else {
                console.log(`   ⚠️ Could not recover info for order ${order.id}. No matching menu items found.`);
            }
        }

    } catch (err) {
        console.error('❌ Error fixing orders:', err);
    } finally {
        await pool.end();
    }
}

fixOrders();
