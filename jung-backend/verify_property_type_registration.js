async function testRegistration() {
    const uniqueId = Date.now();
    const partnerData = {
        name: `Test Partner ${uniqueId}`,
        business_name: `Test Property ${uniqueId}`,
        phone: '0771234567',
        location: 'Colombo',
        university_id: null,
        id_front_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwAEQAAAABJRU5ErkJggg==',
        id_back_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwAEQAAAABJRU5ErkJggg==',
        email: `partner${uniqueId}@test.com`,
        password: 'password123',
        type: 'Room',
        property_type: 'Boarding'
    };

    try {
        console.log('Sending registration request...');
        const response = await fetch('http://localhost:5000/api/partners/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partnerData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registration successful:', response.status);
            console.log('User:', data.partner);

            // Create a simple check script or use mysql2 to verify DB content if needed.
            // For now, logging the successful ID is good validation of the API contract.
            console.log('⚠️  Please verify in DB manually that property_type is "Boarding" for partner ID:', data.partner.id);
        } else {
            console.error('❌ Registration failed:', data);
        }

    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testRegistration();
