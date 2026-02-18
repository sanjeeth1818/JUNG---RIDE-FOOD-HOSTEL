const fetch = require('node-fetch');

async function testLocationFiltering() {
    try {
        console.log('=== Testing Location Filtering ===\n');

        // Test 1: All rooms
        console.log('1. Fetching ALL rooms:');
        const allResponse = await fetch('http://localhost:5000/api/rooms?location=&search=&type=All');
        const allRooms = await allResponse.json();
        console.log(`   Found ${allRooms.length} rooms total\n`);

        // Test 2: Filter by "University of Colombo"
        console.log('2. Fetching rooms for "University of Colombo":');
        const colomboResponse = await fetch('http://localhost:5000/api/rooms?location=University%20of%20Colombo&search=&type=All');
        const colomboRooms = await colomboResponse.json();
        console.log(`   Found ${colomboRooms.length} rooms`);
        colomboRooms.forEach(room => {
            console.log(`   - ${room.title} (Location: ${room.location_name}, Address: ${room.address || 'N/A'})`);
        });

        // Test 3: Filter by "Colombo" directly
        console.log('\n3. Fetching rooms for "Colombo":');
        const colomboDirectResponse = await fetch('http://localhost:5000/api/rooms?location=Colombo&search=&type=All');
        const colomboDirectRooms = await colomboDirectResponse.json();
        console.log(`   Found ${colomboDirectRooms.length} rooms`);
        colomboDirectRooms.forEach(room => {
            console.log(`   - ${room.title} (Location: ${room.location_name}, Address: ${room.address || 'N/A'})`);
        });

        // Show all room locations
        console.log('\n4. All room locations in database:');
        allRooms.forEach(room => {
            console.log(`   - ${room.title}: location_name="${room.location_name}", address="${room.address || 'N/A'}"`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

testLocationFiltering();
