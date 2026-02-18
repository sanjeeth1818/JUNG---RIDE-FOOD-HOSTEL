const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'jungapp_db'
};

const locations = [
    { name: 'Colombo', type: 'City', lat: 6.9271, lng: 79.8612 },
    { name: 'Kandy', type: 'City', lat: 7.2906, lng: 80.6337 },
    { name: 'Galle', type: 'City', lat: 6.0367, lng: 80.2170 },
    { name: 'Jaffna', type: 'City', lat: 9.6615, lng: 80.0255 },
    { name: 'Negombo', type: 'City', lat: 7.2083, lng: 79.8353 },
    { name: 'Anuradhapura', type: 'City', lat: 8.3114, lng: 80.4037 },
    { name: 'Matara', type: 'City', lat: 5.9549, lng: 80.5550 },
    { name: 'Ratnapura', type: 'City', lat: 6.6828, lng: 80.3992 },
    { name: 'Kurunegala', type: 'City', lat: 7.4817, lng: 80.3609 },
    { name: 'Batticaloa', type: 'City', lat: 7.7170, lng: 81.7010 },
    { name: 'Trincomalee', type: 'City', lat: 8.5873, lng: 81.2152 },
    { name: 'Nuwara Eliya', type: 'City', lat: 6.9497, lng: 80.7891 },
    { name: 'Badulla', type: 'City', lat: 6.9934, lng: 81.0550 },
    { name: 'Kalutara', type: 'City', lat: 6.5854, lng: 79.9607 },
    { name: 'Gampaha', type: 'City', lat: 7.0873, lng: 79.9924 },
    { name: 'Kegalle', type: 'City', lat: 7.2513, lng: 80.3464 },
    { name: 'Ampara', type: 'City', lat: 7.2912, lng: 81.6724 },
    { name: 'Vavuniya', type: 'City', lat: 8.7542, lng: 80.4982 },
    { name: 'Mullaitivu', type: 'City', lat: 9.2671, lng: 80.8142 },
    { name: 'Kilinochchi', type: 'City', lat: 9.3803, lng: 80.3970 },
    { name: 'Polonnaruwa', type: 'City', lat: 7.9325, lng: 81.0003 },
    { name: 'Puttalam', type: 'City', lat: 8.0330, lng: 79.8259 },
    { name: 'Hambantota', type: 'City', lat: 6.1246, lng: 81.1185 },
    { name: 'Moneragala', type: 'City', lat: 6.8722, lng: 81.3507 },
    { name: 'University of Colombo', type: 'University', lat: 6.9001, lng: 79.8584 },
    { name: 'University of Peradeniya', type: 'University', lat: 7.2525, lng: 80.5925 },
    { name: 'University of Moratuwa', type: 'University', lat: 6.7950, lng: 79.9007 },
    { name: 'University of Kelaniya', type: 'University', lat: 6.9740, lng: 79.9149 },
    { name: 'University of Sri Jayewardenepura', type: 'University', lat: 6.8528, lng: 79.9036 },
    { name: 'University of Jaffna', type: 'University', lat: 9.6848, lng: 80.0216 },
    { name: 'University of Ruhuna', type: 'University', lat: 5.9381, lng: 80.5762 },
    { name: 'Eastern University of Sri Lanka', type: 'University', lat: 7.7944, lng: 81.5790 },
    { name: 'South Eastern University of Sri Lanka', type: 'University', lat: 7.3000, lng: 81.8500 },
    { name: 'Rajarata University of Sri Lanka', type: 'University', lat: 8.3582, lng: 80.4900 },
    { name: 'Sabaragamuwa University of Sri Lanka', type: 'University', lat: 6.7122, lng: 80.7874 },
    { name: 'Wayamba University of Sri Lanka', type: 'University', lat: 7.3225, lng: 79.9881 },
    { name: 'Uva Wellassa University', type: 'University', lat: 6.9814, lng: 81.0763 }
];

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add columns if they don't exist
        const [columns] = await connection.query('SHOW COLUMNS FROM locations');
        const hasLat = columns.some(c => c.Field === 'latitude');
        const hasLng = columns.some(c => c.Field === 'longitude');

        if (!hasLat) {
            await connection.query('ALTER TABLE locations ADD COLUMN latitude DECIMAL(10, 8)');
            console.log('Added latitude column.');
        }
        if (!hasLng) {
            await connection.query('ALTER TABLE locations ADD COLUMN longitude DECIMAL(11, 8)');
            console.log('Added longitude column.');
        }

        // 2. Seed data
        console.log('Seeding locations...');
        for (const loc of locations) {
            await connection.query(
                `INSERT INTO locations (name, type, latitude, longitude) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 latitude = VALUES(latitude), 
                 longitude = VALUES(longitude),
                 type = VALUES(type)`,
                [loc.name, loc.type, loc.lat, loc.lng]
            );
        }
        console.log('Seeding completed.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
