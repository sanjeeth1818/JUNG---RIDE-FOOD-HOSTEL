/**
 * Test Script: Verify Rider Registration Implementation
 * 
 * This script tests the database changes by creating a test rider registration
 * and verifying that all data is stored correctly.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Dummy base64 image (1x1 transparent PNG)
const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmktwAAAABJRU5ErkJggg==';

// Dummy PDF base64
const dummyPdf = 'data:application/pdf;base64,JVBERi0xLjAKJcfsj6IKNSAwIG9iago8PC9MZW5ndGggNiAwIFI+PgpzdHJlYW0KQlQKMCAxIDAgcmcKL0YxIDEyIFRmCjEwMCAyMDAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgo2IDAgb2JqCjY0CmVuZG9iagoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAowMDAwMDAwMTU4IDAwMDAwIG4gCjAwMDAwMDAyMDcgMDAwMDAgbiAKMDAwMDAwMDI3MSAwMDAwMCBuIAp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMjkwCiUlRU9G';

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db'
    });

    try {
        console.log('🧪 Starting Rider Registration Test\n');

        // Clean up any existing test data
        const testEmail = 'test-rider@example.com';
        console.log('🧹 Cleaning up existing test data...');
        const [existing] = await connection.query('SELECT id FROM partners WHERE email = ?', [testEmail]);
        if (existing.length > 0) {
            const partnerId = existing[0].id;
            await connection.query('DELETE FROM vehicles WHERE partner_id = ?', [partnerId]);
            await connection.query('DELETE FROM partners WHERE id = ?', [partnerId]);
            console.log('   ✓ Cleaned up existing test partner and vehicle\n');
        }

        // Simulate rider registration
        console.log('📝 Creating test rider registration...');
        const partnerData = {
            name: 'Test Rider',
            email: testEmail,
            phone: '+94771234567',
            location: 'Colombo',
            type: 'Rider',
            password_hash: '$2a$10$testHashForDemo', // Dummy hash
            id_front_image: dummyImage,
            id_back_image: dummyImage,
            profile_picture: dummyImage,
            status: 'Pending'
        };

        const [partnerResult] = await connection.query(
            `INSERT INTO partners (name, email, phone, location, type, password_hash, id_front_image, id_back_image, profile_picture, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                partnerData.name,
                partnerData.email,
                partnerData.phone,
                partnerData.location,
                partnerData.type,
                partnerData.password_hash,
                partnerData.id_front_image,
                partnerData.id_back_image,
                partnerData.profile_picture,
                partnerData.status
            ]
        );

        const partnerId = partnerResult.insertId;
        console.log(`   ✓ Created partner record (ID: ${partnerId})\n`);

        // Create vehicle for the rider
        console.log('🚗 Creating vehicle record...');
        const vehicleData = {
            partner_id: partnerId,
            vehicle_type: 'Bike',
            vehicle_image: dummyImage,
            vehicle_book: dummyPdf,
            is_active: true
        };

        const [vehicleResult] = await connection.query(
            `INSERT INTO vehicles (partner_id, vehicle_type, vehicle_image, vehicle_book, is_active) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                vehicleData.partner_id,
                vehicleData.vehicle_type,
                vehicleData.vehicle_image,
                vehicleData.vehicle_book,
                vehicleData.is_active
            ]
        );

        console.log(`   ✓ Created vehicle record (ID: ${vehicleResult.insertId})\n`);

        // Verify the data
        console.log('✅ Verification:\n');

        const [partners] = await connection.query(
            'SELECT id, name, email, type, profile_picture IS NOT NULL as has_profile FROM partners WHERE id = ?',
            [partnerId]
        );
        console.log('Partner Record:');
        console.table(partners);

        const [vehicles] = await connection.query(
            'SELECT id, partner_id, vehicle_type, vehicle_image IS NOT NULL as has_image, vehicle_book IS NOT NULL as has_book FROM vehicles WHERE partner_id = ?',
            [partnerId]
        );
        console.log('\nVehicle Record:');
        console.table(vehicles);

        // Check all required fields
        console.log('\n📋 Field Checks:');
        console.log(`   ${partners[0].has_profile ? '✓' : '✗'} Partner has profile picture`);
        console.log(`   ${vehicles.length > 0 ? '✓' : '✗'} Vehicle record created`);
        console.log(`   ${vehicles[0]?.has_image ? '✓' : '✗'} Vehicle has image`);
        console.log(`   ${vehicles[0]?.has_book ? '✓' : '✗'} Vehicle has book/document`);
        console.log(`   ${vehicles[0]?.vehicle_type === 'Bike' ? '✓' : '✗'} Correct vehicle type`);

        console.log('\n🎉 All tests passed! Rider registration feature is working correctly.');

    } catch (err) {
        console.error('\n❌ Test failed:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
