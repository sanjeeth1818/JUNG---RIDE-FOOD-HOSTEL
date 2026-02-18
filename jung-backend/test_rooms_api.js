// SIMPLE TEST - Run this AFTER restarting the server
const fetch = require('node-fetch');

async function testEndpoint() {
    console.log('═══════════════════════════════════════');
    console.log('  TESTING /api/rooms ENDPOINT');
    console.log('═══════════════════════════════════════\n');

    // Test 1: Get ALL rooms (no filters)
    console.log('TEST 1: Get ALL rooms');
    console.log('URL: http://localhost:5000/api/rooms\n');

    try {
        const res1 = await fetch('http://localhost:5000/api/rooms');
        const all = await res1.json();
        console.log(`✅ SUCCESS! Found ${all.length} total rooms`);
        all.forEach((r, i) => console.log(`   ${i + 1}. ${r.title} (Partner: ${r.owner_name})`));
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        console.log('\n⚠️  Is the server running? Start it with: node server.js\n');
        return;
    }

    // Test 2: Filter by Colombo
    console.log('\n\nTEST 2: Filter by "Colombo"');
    console.log('URL: http://localhost:5000/api/rooms?location=Colombo\n');

    try {
        const res2 = await fetch('http://localhost:5000/api/rooms?location=Colombo');
        const colombo = await res2.json();
        console.log(`✅ Found ${colombo.length} rooms in Colombo`);
        colombo.forEach((r, i) => console.log(`   ${i + 1}. ${r.title} (Partner location: ${r.partner_location})`));
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
    }

    // Test 3: Filter by University of Colombo
    console.log('\n\nTEST 3: Filter by "University of Colombo"');
    console.log('URL: http://localhost:5000/api/rooms?location=University%20of%20Colombo\n');

    try {
        const res3 = await fetch('http://localhost:5000/api/rooms?location=University%20of%20Colombo');
        const uni = await res3.json();
        console.log(`✅ Found ${uni.length} rooms for University of Colombo`);
        uni.forEach((r, i) => console.log(`   ${i + 1}. ${r.title} (Partner location: ${r.partner_location})`));
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  TESTS COMPLETE');
    console.log('═══════════════════════════════════════\n');
}

testEndpoint();
