const mysql = require('mysql2/promise');

async function check() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    };

    const connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Checking partners table...');

    try {
        const [rows] = await connection.execute(
            "SELECT id, email, name, type, business_name FROM partners"
        );

        const partners = rows.filter(r => !['Food', 'Rider', 'Room'].includes(r.type));
        console.log('NON-STANDARD PARTNERS:', JSON.stringify(partners, null, 2));
    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        await connection.end();
    }
}

check();
