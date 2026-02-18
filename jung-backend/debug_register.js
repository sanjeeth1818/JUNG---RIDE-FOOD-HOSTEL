const http = require('http');

// Small base64 image (1x1 pixel)
const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const data = JSON.stringify({
    name: "Debug User",
    email: "debug_" + Date.now() + "@example.com",
    phone: "1234567890",
    password: "password123",
    location: "Colombo",
    type: "Food",
    id_front_image: dummyImage,
    id_back_image: dummyImage,
    university_id: 1 // Assuming 1 exists, if not it might be null
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/partners/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending Registration Request...');
const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
        console.log(`BODY: ${responseBody}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
