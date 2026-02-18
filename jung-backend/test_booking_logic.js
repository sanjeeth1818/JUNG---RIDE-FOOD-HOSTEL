// Native fetch is available in Node 18+

async function testBookingLogic() {
    const baseUrl = 'http://localhost:5000/api/partners/bookings';

    // 1. Create a dummy room (or use existing one if known, let's assume room ID 1 exists and partner 1 exists)
    // For safety, let's just use hardcoded IDs which might exist. If they don't, this test might fail on FK constraints.
    // Better: Query rooms first? No, let's assume standard seed data or user's data.
    // Let's try to use room_id: 1, partner_id: 1.

    const booking1 = {
        partner_id: 1,
        room_id: 1,
        guest_name: "Test User 1",
        guest_phone: "1234567890",
        check_in: "2024-12-01",
        check_out: "2024-12-05",
        total_price: 1000,
        status: "Confirmed"
    };

    console.log("Creating Booking 1 (Dec 1 - Dec 5)...");
    try {
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking1)
        });
        const data1 = await res1.json();
        console.log("Booking 1 Result:", res1.status, data1);
    } catch (e) {
        console.log("Booking 1 Failed (Network/Server):", e.message);
    }

    // 2. Overlapping Booking (Dec 3 - Dec 7) - SHOULD FAIL
    const booking2 = {
        partner_id: 1,
        room_id: 1,
        guest_name: "Test User 2",
        guest_phone: "0987654321",
        check_in: "2024-12-03",
        check_out: "2024-12-07",
        total_price: 1000,
        status: "Confirmed"
    };

    console.log("\nCreating Booking 2 (Overlap: Dec 3 - Dec 7) - EXPECT FAILURE...");
    try {
        const res2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking2)
        });
        const data2 = await res2.json();
        console.log("Booking 2 Result:", res2.status, data2); // Expect 409
    } catch (e) { console.log(e.message); }

    // 3. Non-Overlapping Booking (Dec 6 - Dec 10) - SHOULD SUCCESS
    const booking3 = {
        partner_id: 1,
        room_id: 1,
        guest_name: "Test User 3",
        guest_phone: "1122334455",
        check_in: "2024-12-06",
        check_out: "2024-12-10",
        total_price: 1000,
        status: "Confirmed"
    };

    console.log("\nCreating Booking 3 (No Overlap: Dec 6 - Dec 10) - EXPECT SUCCESS...");
    try {
        const res3 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking3)
        });
        const data3 = await res3.json();
        console.log("Booking 3 Result:", res3.status, data3); // Expect 201
    } catch (e) { console.log(e.message); }
}

testBookingLogic();
