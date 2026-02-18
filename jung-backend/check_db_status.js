const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 1
    });
    try {
        const [requests] = await pool.query('SELECT id, passenger_id, vehicle_type, status, pickup_lat, pickup_lng FROM ride_requests WHERE status = "pending"');
        const [locations] = await pool.query('SELECT * FROM rider_locations');
        console.log("Pending Requests:", JSON.stringify(requests, null, 2));
        console.log("Rider Locations:", JSON.stringify(locations, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
