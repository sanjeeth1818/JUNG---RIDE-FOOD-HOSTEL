require('dotenv').config();

console.log('DEBUG: Checking Environment Variables');
console.log('EMAIL_USER:', `"${process.env.EMAIL_USER}"`);
console.log('EMAIL_USER (length):', process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 'undefined');
console.log('EMAIL_PASS (length):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined');
console.log('EMAIL_PASS (first 4):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) : 'N/A');
console.log('EMAIL_PASS (last 4):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(process.env.EMAIL_PASS.length - 4) : 'N/A');
