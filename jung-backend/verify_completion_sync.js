const fetch = require('node-fetch');

async function verifyCompletionSync() {
    const userId = 1; // Assuming user ID 1 is the student
    const riderId = 6; // Assuming rider ID 6 is the driver

    console.log('--- Verifying Ride Completion Sync ---');

    // 1. Create a ride
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

    // 2. Accept the ride
    console.log('2. Accepting the ride...');
    await fetch(`http://localhost:5000/api/riders/${riderId}/requests/${requestId}/accept`, {
        method: 'POST'
    });

    // 3. Complete the ride
    console.log('3. Completing the ride...');
    await fetch(`http://localhost:5000/api/riders/${riderId}/requests/${requestId}/complete`, {
        method: 'POST'
    });

    // 4. Poll active ride for student
    console.log('4. Polling active ride for student (should return completed ride)...');
    const pollRes = await fetch(`http://localhost:5000/api/ride-requests/active/${userId}`);
    const activeRide = await pollRes.json();

    if (activeRide && activeRide.status === 'completed') {
        console.log('✅ SUCCESS: Recently completed ride found in active list!');
        console.log(`Ride ID: ${activeRide.id}, Status: ${activeRide.status}`);
    } else {
        console.log('❌ FAILURE: Completed ride not found or status incorrect.');
        console.log('Response:', activeRide);
    }
}

verifyCompletionSync();
