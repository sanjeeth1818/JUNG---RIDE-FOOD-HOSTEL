const mysql = require('mysql2/promise');
require('dotenv').config();

const UNIVERSITIES = [
    { name: "University of Vavuniya", lat: 8.7542, lng: 80.4982 },
    { name: "University of Colombo", lat: 6.9016, lng: 79.8518 },
    { name: "University of Peradeniya", lat: 7.2522, lng: 80.5925 },
    { name: "University of Jaffna", lat: 9.6849, lng: 80.0216 },
    { name: "University of Kelaniya", lat: 6.9739, lng: 79.9153 },
    { name: "University of Moratuwa", lat: 6.7951, lng: 79.9009 },
    { name: "University of Ruhuna", lat: 5.9381, lng: 80.5761 },
    { name: "Eastern University", lat: 7.7126, lng: 81.7011 },
    { name: "South Eastern University", lat: 7.2974, lng: 81.8501 },
    { name: "Rajarata University", lat: 8.3565, lng: 80.4982 },
    { name: "Wayamba University", lat: 7.3225, lng: 79.9882 },
    { name: "Uva Wellassa University", lat: 6.9812, lng: 81.0763 },
    { name: "Open University", lat: 6.8839, lng: 79.8853 },
    { name: "SLIIT", lat: 6.9147, lng: 79.9731 },
    { name: "NSBM Green University", lat: 6.8213, lng: 80.0416 },
    { name: "KIU", lat: 6.9167, lng: 79.9472 },
    { name: "KDU", lat: 6.8194, lng: 79.8894 },
    { name: "APIIT", lat: 6.9142, lng: 79.8578 }
];

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jung_app',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log('🌱 Seeding Universities...');

    try {
        for (const uni of UNIVERSITIES) {
            await pool.query(
                'INSERT INTO locations (name, type, latitude, longitude) VALUES (?, "University", ?, ?) ON DUPLICATE KEY UPDATE name=name',
                [uni.name, uni.lat, uni.lng]
            );
            console.log(`✅ ${uni.name}`);
        }
        console.log('✨ Seeding Completed!');
    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
