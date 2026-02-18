const mysql = require('mysql2/promise');
(async () => {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    };
    const pool = mysql.createPool(config);
    try {
        const [rows] = await pool.query('SELECT r.id, r.name, r.partner_id, r.image_url, p.avatar_url as partner_avatar FROM restaurants r LEFT JOIN partners p ON r.partner_id = p.id WHERE r.name = "Vaani Vilas"');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
})();
