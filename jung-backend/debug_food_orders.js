const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    const partnerId = 14;

    try {
        console.log(`Testing query for Partner ID: ${partnerId}`);
        // 1. Fetch Orders
        const [orders] = await pool.execute(`
            SELECT o.*, u.name as user_name, u.phone as user_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.partner_id = ?
            ORDER BY o.created_at DESC`,
            [partnerId]
        );

        if (orders.length === 0) {
            console.log('No orders found.');
            return;
        }

        // 2. Fetch items
        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(`
            SELECT oi.*, mi.name 
            FROM order_items oi 
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // 3. Combine
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: JSON.stringify(items.filter(item => item.order_id === order.id))
        }));

        console.log('✅ Query successful!');
        console.log('Orders found:', ordersWithItems.length);
        console.log(JSON.stringify(ordersWithItems, null, 2));
    } catch (err) {
        console.error('❌ Query failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('Full Error:', err);
    } finally {
        await pool.end();
    }
}

testQuery();
