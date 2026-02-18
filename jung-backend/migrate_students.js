const mysql = require('mysql2/promise');

async function migrate() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jungapp_db'
    };

    const connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Starting student/worker migration...');

    try {
        // 1. Find misplaced users in partners table
        // criteria: type is student/worker OR type is empty and business_name/property_type is null
        const [misplaced] = await connection.execute(
            `SELECT * FROM partners 
             WHERE type IN ('student', 'worker', '', 'studnt') 
             OR (type = '' AND business_name IS NULL AND property_type IS NULL)`
        );

        console.log(`🔍 Found ${misplaced.length} misplaced accounts.`);

        for (const account of misplaced) {
            console.log(`📦 Migrating: ${account.email} (${account.type})`);

            // 2. Check if user already exists in users table to avoid duplicates
            const [existing] = await connection.execute(
                "SELECT id FROM users WHERE email = ?",
                [account.email]
            );

            if (existing.length === 0) {
                const finalType = (account.type === 'worker') ? 'worker' : 'student';
                // 3. Insert into users table
                await connection.execute(
                    `INSERT INTO users (email, password_hash, name, phone, user_type, avatar_url, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        account.email,
                        account.password_hash,
                        account.name,
                        account.phone,
                        finalType,
                        account.avatar_url,
                        account.created_at
                    ]
                );
                console.log(`✅ successfully moved ${account.email} to users table.`);
            } else {
                console.log(`⚠️ User ${account.email} already exists in users table. skipping insert.`);
            }

            // 4. Delete from partners table
            await connection.execute(
                "DELETE FROM partners WHERE id = ?",
                [account.id]
            );
            console.log(`🗑️ Removed ${account.email} from partners table.`);
        }

        console.log('🎉 Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
