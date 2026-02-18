const fetch = require('node-fetch');

async function testUpdatedFilter() {
    try {
        console.log('=== Testing UPDATED Location Filter (Using Partner Base Location) ===\n');

        // Test with "Colombo" directly
        console.log('1. Testing with "Colombo":');
        const colomboResponse = await fetch('http://localhost:5000/api/rooms?location=Colombo&search=&type=All');
        const colomboRooms = await colomboResponse.json();
        console.log(`   Found ${colomboRooms.length} rooms`);
        colomboRooms.forEach(room => {
            console.log(`   ✓ ${room.title}`);
            console.log(`      - Room location: ${room.location_name}`);
            console.log(`      - Owner: ${room.owner_name}`);
        });

        // Test with "University of Colombo"
        console.log('\n2. Testing with "University of Colombo":');
        const uniResponse = await fetch('http://localhost:5000/api/rooms?location=University%20of%20Colombo&search=&type=All');
        const uniRooms = await uniResponse.json();
        console.log(`   Found ${uniRooms.length} rooms`);
        uniRooms.forEach(room => {
            console.log(`   ✓ ${room.title}`);
            console.log(`      - Room location: ${room.location_name}`);
            console.log(`      - Owner: ${room.owner_name}`);
        });

        console.log('\n✅ Expected: Both "kabi Villa" AND "002" should appear');
        console.log('   (Because partner "kabi" is registered in Colombo and has both rooms)');

    } catch (err) {
        console.error('Error:', err);
    }
}

testUpdatedFilter();
