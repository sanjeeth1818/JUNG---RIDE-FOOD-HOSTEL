/**
 * Test Script: Create Sample Ride Requests
 * 
 * This creates test ride requests in the database so you can test
 * the rider dashboard and see ride requests appear on the map.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🧪 Creating Sample Ride Requests...\n');

        // First, check if there's a test user to use as passenger
        const [users] = await connection.query('SELECT id FROM users LIMIT 1');

        if (users.length === 0) {
            console.log('⚠️  No users found. Creating a test user...');
            await connection.query(`
                INSERT INTO users (name, email, password_hash, phone, university_id)
                VALUES ('Test Passenger', 'passenger@test.com', '$2a$10$testHash', '+94771234567', NULL)
            `);
            const [newUsers] = await connection.query('SELECT id FROM users WHERE email = "passenger@test.com"');
            var passengerId = newUsers[0].id;
            console.log(`   ✓ Created test user (ID: ${passengerId})\n`);
        } else {
            var passengerId = users[0].id;
            console.log(`   ✓ Using existing user (ID: ${passengerId})\n`);
        }

        // Sample locations around Colombo
        const sampleRequests = [
            {
                pickup_location: 'Colombo Fort Railway Station',
                pickup_lat: 6.9344,
                pickup_lng: 79.8428,
                dropoff_location: 'Galle Face Green',
                dropoff_lat: 6.9271,
                dropoff_lng: 79.8431,
                estimated_fare: 250,
                distance_km: 1.2
            },
            {
                pickup_location: 'Mount Lavinia Beach',
                pickup_lat: 6.8389,
                pickup_lng: 79.8628,
                dropoff_location: 'Kollupitiya',
                dropoff_lat: 6.9175,
                dropoff_lng: 79.8500,
                estimated_fare: 450,
                distance_km: 9.5
            },
            {
                pickup_location: 'Bambalapitiya Junction',
                pickup_lat: 6.8939,
                pickup_lng: 79.8547,
                dropoff_location: 'Dehiwala Zoo',
                dropoff_lat: 6.8569,
                dropoff_lng: 79.8797,
                estimated_fare: 350,
                distance_km: 5.2
            },
            {
                pickup_location: 'Kandy City Centre',
                pickup_lat: 7.2906,
                pickup_lng: 80.6337,
                dropoff_location: 'Temple of the Tooth',
                dropoff_lat: 7.2939,
                dropoff_lng: 80.6414,
                estimated_fare: 200,
                distance_km: 1.5
            }
        ];

        console.log('📋 Creating ride requests...\n');

        for (const request of sampleRequests) {
            const [result] = await connection.query(`
                INSERT INTO ride_requests 
                (passenger_id, pickup_location, pickup_lat, pickup_lng, dropoff_location, dropoff_lat, dropoff_lng, estimated_fare, distance_km, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [
                passengerId,
                request.pickup_location,
                request.pickup_lat,
                request.pickup_lng,
                request.dropoff_location,
                request.dropoff_lat,
                request.dropoff_lng,
                request.estimated_fare,
                request.distance_km
            ]);

            console.log(`   ✓ Created: ${request.pickup_location} → ${request.dropoff_location} (ID: ${result.insertId})`);
        }

        console.log('\n🎉 Sample data created successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • Created ${sampleRequests.length} ride requests`);
        console.log(`   • All requests are in "pending" status`);
        console.log(`   • Requests are located around Colombo and Kandy`);
        console.log('\n💡 Next steps:');
        console.log('   1. Start the backend: cd jung-backend && node server.js');
        console.log('   2. Start the frontend: cd jung-app && npm run dev');
        console.log('   3. Login as a Rider partner');
        console.log('   4. Navigate to /partner/dashboard/rider');
        console.log('   5. Click "Go Online" to start receiving requests!');

    } catch (err) {
        console.error('\n❌ Error creating sample data:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
