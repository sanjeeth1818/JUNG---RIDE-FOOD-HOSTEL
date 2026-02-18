const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING SERVER.JS FILE...\n');

const serverPath = path.join(__dirname, 'server.js');
console.log('File path:', serverPath);
console.log('File exists:', fs.existsSync(serverPath));

if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');

    // Check if the updated code is present
    const hasPartnerLocation = content.includes('p.location as partner_location');
    const hasEmojiLogs = content.includes('🔍 [ROOMS API]');

    console.log('\n✅ Code checks:');
    console.log('  - Has "p.location as partner_location":', hasPartnerLocation);
    console.log('  - Has emoji logs (🔍):', hasEmojiLogs);

    if (hasPartnerLocation && hasEmojiLogs) {
        console.log('\n✅ The server.js file HAS the updated code!');
        console.log('\n⚠️  This means the running server is NOT using this file.');
        console.log('    Possible reasons:');
        console.log('    1. Server was not restarted');
        console.log('    2. Server is running from a different directory');
        console.log('    3. There are multiple server.js files');
        console.log('\n💡 Solution:');
        console.log('    1. Find ALL terminals and close any running "node server.js"');
        console.log('    2. Open a FRESH terminal');
        console.log('    3. cd d:\\application (2)\\application\\jung-backend');
        console.log('    4. node server.js');
    } else {
        console.log('\n❌ The server.js file is MISSING the updated code!');
        console.log('    This is strange - let me check what happened...');
    }
}
