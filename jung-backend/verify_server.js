const { spawn } = require('child_process');
const http = require('http');

console.log('Starting temporary server on port 5001...');
const server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: 5001 },
    cwd: __dirname,
    stdio: 'inherit' // Pipe output so we can see it
});

// Give it some time to start
setTimeout(() => {
    console.log('Testing /api/universities endpoint...');

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/universities?location=Colombo',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`BODY: ${data}`);
            server.kill(); // Kill the server after test
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        server.kill();
        process.exit(1);
    });

    req.end();

}, 3000); // Wait 3 seconds for server to boot
