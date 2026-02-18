const fetch = require('node-fetch');

async function verifyDeclineFiltering() {
    const userId = 1;
    const riderId = 7;

    console.log('--- Verifying Ride Request Decline Filtering ---');

    // 0. Set rider location close to pickup
    console.log('0. Setting rider location close to pickup...');
    await fetch(`http://localhost:5000/api/riders/${riderId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 6.7951, lng: 79.9009 })
    });

    // 1. Create a ride request
    console.log('1. Creating a ride request...');
    const createRes = await fetch('http://localhost:5000/api/ride-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            passenger_id: userId,
            pickup_location: 'UoM', pickup_lat: 6.7951, pickup_lng: 79.9009,
            dropoff_location: 'Galle Face', dropoff_lat: 6.9271, dropoff_lng: 79.8431,
            vehicle_type: 'Car', estimated_fare: 500, distance_km: 15
        })
    });
    const { id: requestId } = await createRes.json();
    console.log(`Created ride ID: ${requestId}`);

    // 2. Poll nearby requests (should see it)
    console.log('2. Polling nearby requests (Before Decline)...');
    let res = await fetch(`http://localhost:5000/api/riders/${riderId}/nearby-requests?radius=20`);
    let data = await res.json();
    let found = data.requests.some(r => r.id === requestId);
    console.log(`Request found in poll: ${found}`);

    if (!found) {
        console.log('❌ FAILURE: Request not found in initial poll.');
        console.log('Nearby requests found:', data.requests.map(r => r.id));
        return;
    }

    // 3. Decline the request
    console.log('3. Declining the request...');
    await fetch(`http://localhost:5000/api/riders/${riderId}/requests/${requestId}/decline`, {
        method: 'POST'
    });

    // 4. Poll again (should NOT see it)
    console.log('4. Polling nearby requests (After Decline)...');
    res = await fetch(`http://localhost:5000/api/riders/${riderId}/nearby-requests?radius=20`);
    data = await res.json();
    found = data.requests.some(r => r.id === requestId);
    console.log(`Request found in poll: ${found}`);

    if (!found) {
        console.log('✅ SUCCESS: Declined request correctly filtered out!');
    } else {
        console.log('❌ FAILURE: Declined request still visible in poll.');
    }
}

verifyDeclineFiltering();
