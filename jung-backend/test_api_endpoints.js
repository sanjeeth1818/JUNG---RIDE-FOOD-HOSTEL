const http = require('http');

function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`[${res.statusCode}] GET ${path}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`   ✅ Success! Response length: ${data.length}`);
                    if (data.length < 500) console.log(`   Data: ${data}`);
                } else {
                    console.log(`   ❌ Failed!`);
                    console.log(`   Data: ${data}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Problem with request to ${path}: ${e.message}`);
            resolve();
        });
        req.end();
    });
}

(async () => {
    console.log('🧪 Testing Backend API Endpoints...');
    await testEndpoint('/api/health'); // Should exist if server.js has it, or just root
    await testEndpoint('/'); // Root check
    await testEndpoint('/api/locations'); // The one that failed before
    await testEndpoint('/api/partners/19'); // Random partner check
    console.log('🏁 Test Complete.');
})();
