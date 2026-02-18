const fetch = require('node-fetch');

async function quickTest() {
    console.log('Testing the REWRITTEN /api/rooms endpoint...\n');

    try {
        const url = 'http://localhost:5000/api/rooms?location=University%20of%20Colombo&search=&type=All';
        console.log('URL:', url);
        console.log('\nFetching...');

        const response = await fetch(url);
        const rooms = await response.json();

        console.log(`\n✅ SUCCESS! Found ${rooms.length} rooms\n`);

        if (rooms.length > 0) {
            rooms.forEach((room, i) => {
                console.log(`${i + 1}. ${room.title}`);
                console.log(`   Partner: ${room.owner_name} (Location: ${room.partner_location || 'N/A'})`);
            });
        } else {
            console.log('⚠️  No rooms found. Check server console for debug logs starting with 🔍');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n⚠️  Make sure the server is running on port 5000!');
    }
}

quickTest();
