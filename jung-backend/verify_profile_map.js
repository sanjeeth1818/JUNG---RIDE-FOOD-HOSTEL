async function testProfileMapUpdate() {
    const uniqueId = Date.now();

    // 1. Create a Partner
    const partnerData = {
        name: `Profile Update User ${uniqueId}`,
        business_name: `Profile Update Biz ${uniqueId}`,
        phone: '0771234567',
        location: 'Colombo',
        email: `profile${uniqueId}@test.com`,
        password: 'password123',
        type: 'Room',
        property_type: 'Boarding'
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

        // 2. Update Profile with Coordinates
        const updateData = {
            business_name: partnerData.business_name,
            email: partnerData.email,
            phone: partnerData.phone,
            location: 'Kandy', // Changed location
            latitude: 7.2906,
            longitude: 80.6337
        };

        console.log(`Updating profile for ID ${partnerId}...`);
        const updateRes = await fetch(`http://localhost:5000/api/partners/${partnerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        const updateResData = await updateRes.json();

        if (!updateRes.ok) throw new Error('Update failed: ' + JSON.stringify(updateResData));

        // 3. Verify
        // Since I don't have a direct "get partner" API that returns all fields easily without login sessions,
        // and GET /api/partners/:id might not exist or might be protected.
        // Let's rely on login payload again as it returns the user object.

        console.log('Logging in to verify updated coordinates...');
        const loginRes = await fetch('http://localhost:5000/api/partners/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: partnerData.email, password: partnerData.password })
        });
        const loginData = await loginRes.json();
        const updatedPartner = loginData.partner;

        if (updatedPartner.latitude == 7.2906 && updatedPartner.longitude == 80.6337) {
            console.log('✅ VERIFIED: Profile updated with new coordinates.');
        } else {
            console.error(`❌ FAILED: Expected 7.2906, 80.6337. Got: ${updatedPartner.latitude}, ${updatedPartner.longitude}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testProfileMapUpdate();
