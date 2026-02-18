const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Manual configuration matching server.js
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

async function testPasswordUpdate() {
    console.log('🧪 Starting Password Update Test...');
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to DB');

        // 1. Fetch a partner to test with (e.g., the first one)
        const [partners] = await connection.execute('SELECT id, email, password_hash FROM partners LIMIT 1');

        if (partners.length === 0) {
            console.error('❌ No partners found in DB to test with.');
            return;
        }

        const partner = partners[0];
        console.log(`👤 Testing with Partner ID: ${partner.id} (${partner.email})`);

        // 2. Generate new password hash
        const newPassword = 'test_new_password_123';
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        console.log('🔑 Generated New Hash:', newHash);

        // 3. Update Password
        console.log('Wait... Updating password...');
        const [result] = await connection.execute(
            'UPDATE partners SET password_hash = ? WHERE id = ?',
            [newHash, partner.id]
        );

        console.log(`✅ Update Result: Affected Rows = ${result.affectedRows}`);

        // 4. Verify Update
        const [updatedPartners] = await connection.execute('SELECT password_hash FROM partners WHERE id = ?', [partner.id]);
        const updatedHash = updatedPartners[0].password_hash;

        console.log('🔍 Verified Hash in DB:', updatedHash);

        if (updatedHash === newHash) {
            console.log('🎉 SUCCESS: Database was updated correctly.');

            // 5. Verify Compare
            const isMatch = await bcrypt.compare(newPassword, updatedHash);
            console.log(`🔓 bcrypt.compare(newPassword, dbHash) = ${isMatch}`);
        } else {
            console.error('❌ FAILURE: Database hash does not match generated hash!');
            console.error('Expected:', newHash);
            console.error('Actual:  ', updatedHash);
        }

        // Cleanup: Revert (Optional, but good manners)
        // await connection.execute('UPDATE partners SET password_hash = ? WHERE id = ?', [partner.password_hash, partner.id]);
        // console.log('Restored original password.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

testPasswordUpdate();
