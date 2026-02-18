async function testRoomDetails() {
    const uniqueId = Date.now();

    // 1. Create Partner
    const partnerData = {
        name: `Details Partner ${uniqueId}`,
        business_name: `Details Property ${uniqueId}`,
        phone: '0771234567',
        location: 'Kandy',
        email: `details${uniqueId}@test.com`,
        password: 'password123',
        type: 'Room',
        property_type: 'Hostel'
    };

    try {
        console.log('Creating partner...');
        const regRes = await fetch('http://localhost:5000/api/partners/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partnerData)
        });
        const regData = await regRes.json();
        const partnerId = regData.partner.id;

        // 2. Create Room with specific details
        const roomData = {
            partner_id: partnerId,
            title: 'Shared Room 101',
            price: 5000,
            location: 'Near Temple',
            description: 'Shared room test',
            images: [],
            // Frontend sends 'attached_bathroom' in amenities array
            amenities: ['attached_bathroom', 'wifi'],
            type: 'Hostel',
            room_type: 'Shared' // Testing the new field
        };

        console.log('Creating room with details...');
        const roomRes = await fetch('http://localhost:5000/api/partners/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        const roomResData = await roomRes.json();

        // 3. Verify
        const roomsListRes = await fetch(`http://localhost:5000/api/partners/rooms/${partnerId}`);
        const roomsList = await roomsListRes.json();
        const createdRoom = roomsList.find(r => r.id === roomResData.id);

        // Check Room Type
        if (createdRoom.room_type === 'Shared') {
            console.log('✅ VERIFIED: room_type is Shared');
        } else {
            console.error(`❌ FAILED: Expected Shared, got ${createdRoom.room_type}`);
        }

        // Check Attached Bathroom (in amenities)
        // Amenities come back as a JSON string or object depending on driver, but usually text unless parsed.
        // My code in server automatically stringifies on insert, but on select it might be string.
        let amenities = createdRoom.amenities;
        if (typeof amenities === 'string') {
            try { amenities = JSON.parse(amenities); } catch (e) { }
        }

        if (Array.isArray(amenities) && amenities.includes('attached_bathroom')) {
            console.log('✅ VERIFIED: attached_bathroom is in amenities');
        } else {
            console.error(`❌ FAILED: attached_bathroom missing. Got: ${JSON.stringify(amenities)}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRoomDetails();
