const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

async function verifyPartnerProfile() {
    const partnerId = 7;
    const baseUrl = 'http://localhost:5000/api';

    console.log('--- Verifying Partner Profile Management ---');

    // 1. Verify Profile Update
    console.log('1. Updating profile details...');
    const updateRes = await fetch(`${baseUrl}/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            business_name: 'Super Speed Rider',
            email: 'speedy@example.com',
            phone: '0771234567',
            location: 'Colombo'
        })
    });
    const updateData = await updateRes.json();
    console.log('Update result:', updateData.success ? '✅ SUCCESS' : '❌ FAILURE');

    // 2. Verify Password Change
    console.log('2. Changing password...');
    // Note: Assuming 'pass123' is the current password. If not, this might fail.
    // However, we can test the endpoint logic itself.
    const passRes = await fetch(`${baseUrl}/partners/${partnerId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            currentPassword: 'password123', // Hardcoded for test
            newPassword: 'newpassword123'
        })
    });
    const passData = await passRes.json();
    console.log('Password change result:', passData.success ? '✅ SUCCESS' : '❌ FAILURE (Expected if password mismatch)');

    // 3. Verify Avatar Upload
    console.log('3. Uploading avatar...');
    // Create a dummy image file for testing
    const filePath = './test_avatar.jpg';
    fs.writeFileSync(filePath, 'dummy content');

    const form = new FormData();
    form.append('avatar', fs.createReadStream(filePath));

    const avatarRes = await fetch(`${baseUrl}/partners/${partnerId}/avatar`, {
        method: 'POST',
        body: form
    });
    const avatarData = await avatarRes.json();
    console.log('Avatar upload result:', avatarData.success ? '✅ SUCCESS' : '❌ FAILURE');
    if (avatarData.avatar_url) {
        console.log('Avatar URL:', avatarData.avatar_url);
    }

    // Cleanup
    fs.unlinkSync(filePath);
}

verifyPartnerProfile();
