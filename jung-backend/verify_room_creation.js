async function testRoomCreation() {
    const uniqueId = Date.now();

    // 1. First, we need a partner. Use the one we created before or create new.
    // For simplicity, let's create a new partner to ensure clean state.
    const partnerData = {
        name: `Room Partner ${uniqueId}`,
        business_name: `Room Property ${uniqueId}`,
        phone: '0771234567',
        location: 'Colombo',
        university_id: null,
        id_front_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwAEQAAAABJRU5ErkJggg==',
        id_back_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwAEQAAAABJRU5ErkJggg==',
        email: `roomowner${uniqueId}@test.com`,
        password: 'password123',
        type: 'Room',
        property_type: 'Boarding' // Ensure this is set!
    };

    try {
        console.log('Creating partner...');
        const regRes = await fetch('http://localhost:5000/api/partners/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partnerData)
        });
        const regData = await regRes.json();

        if (!regRes.ok) throw new Error('Registration failed: ' + JSON.stringify(regData));
        const partnerId = regData.partner.id;
        console.log(`✅ Partner created (ID: ${partnerId}) with property_type: Boarding`);

        // 2. Now create a room WITHOUT explicitly sending 'type' (PartnerRoom.jsx might send it now, but let's test)
        // Actually, my change in PartnerRoom.jsx sends: type: partnerData.property_type || newRoom.type
        // So I should simulate what the frontend sends.

        const roomData = {
            partner_id: partnerId,
            title: 'Room 101',
            price: 15000,
            location: 'Building A',
            description: 'A nice room',
            images: [],
            amenities: [],
            // Simulate the frontend sending the type from partner data
            type: 'Boarding'
        };

        console.log('Creating room...');
        const roomRes = await fetch('http://localhost:5000/api/partners/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        const roomResData = await roomRes.json();

        if (!roomRes.ok) throw new Error('Room creation failed: ' + JSON.stringify(roomResData));
        console.log(`✅ Room created (ID: ${roomResData.id})`);

        // 3. Verify the room has the correct property_type in the DB
        // Fetch all rooms for this partner
        const roomsListRes = await fetch(`http://localhost:5000/api/partners/rooms/${partnerId}`);
        const roomsList = await roomsListRes.json();

        const createdRoom = roomsList.find(r => r.id === roomResData.id);

        if (createdRoom.property_type === 'Boarding') {
            console.log('✅ VERIFICATION SUCCESS: Room has correct property_type (Boarding)');
        } else {
            console.error(`❌ VERIFICATION FAILED: Expected Boarding, got ${createdRoom.property_type}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRoomCreation();
