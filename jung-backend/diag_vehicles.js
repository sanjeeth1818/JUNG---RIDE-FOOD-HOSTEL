const mysql = require('mysql2/promise');

async function checkData() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('--- PARTNERS & VEHICLES ---');
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.email, v.vehicle_type, v.model 
            FROM partners p 
            LEFT JOIN vehicles v ON p.id = v.partner_id
        `);
        console.table(rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkData();
