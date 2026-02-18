const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
const RIDER_ID = 6; // James Bond, Car

async function testStatusToggle() {
    console.log('--- Testing Status Toggle ---');

    // 1. Set online
    console.log('Setting Rider 6 to ONLINE...');
    await fetch(`${BASE_URL}/riders/${RIDER_ID}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: 1, is_available: 1 })
    });

    // 2. Check nearby
    let res = await fetch(`${BASE_URL}/riders/nearby?lat=6.9271&lng=79.8612&radius=10`);
    let data = await res.json();
    console.log('Nearby Riders (Online):', data.map(r => r.rider_id));

    // 3. Set offline
    console.log('Setting Rider 6 to OFFLINE...');
    await fetch(`${BASE_URL}/riders/${RIDER_ID}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: 0, is_available: 0 })
    });

    // 4. Check nearby again
    res = await fetch(`${BASE_URL}/riders/nearby?lat=6.9271&lng=79.8612&radius=10`);
    data = await res.json();
    console.log('Nearby Riders (Offline):', data.map(r => r.rider_id));
}

testStatusToggle();
