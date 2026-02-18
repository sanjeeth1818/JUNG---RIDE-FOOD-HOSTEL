const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Migration Script: Add Rider-Specific Fields
 * 
 * Adds the following columns:
 * - partners.profile_picture (MEDIUMTEXT)
 * - vehicles.vehicle_image (MEDIUMTEXT)
 * - vehicles.vehicle_book (MEDIUMTEXT)
 */

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jungapp_db',
        multipleStatements: true
    });

    try {
        console.log('🚀 Starting migration: Add Rider Fields...\n');

        // === PARTNERS TABLE ===
        console.log('📋 Checking partners table...');
        const [partnerColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'jungapp_db'}' 
            AND TABLE_NAME = 'partners' 
            AND COLUMN_NAME = 'profile_picture';
        `);

        if (partnerColumns.length === 0) {
            console.log('  ➕ Adding profile_picture column to partners table...');
            await connection.query(`ALTER TABLE partners ADD COLUMN profile_picture MEDIUMTEXT;`);
            console.log('  ✅ Added profile_picture to partners table');
        } else {
            console.log('  ℹ️  profile_picture column already exists in partners table');
        }

        // === VEHICLES TABLE ===
        console.log('\n📋 Checking vehicles table...');
        const [vehicleColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'jungapp_db'}' 
            AND TABLE_NAME = 'vehicles' 
            AND COLUMN_NAME IN ('vehicle_image', 'vehicle_book');
        `);

        const hasVehicleImage = vehicleColumns.some(c => c.COLUMN_NAME === 'vehicle_image');
        const hasVehicleBook = vehicleColumns.some(c => c.COLUMN_NAME === 'vehicle_book');

        if (!hasVehicleImage) {
            console.log('  ➕ Adding vehicle_image column to vehicles table...');
            await connection.query(`ALTER TABLE vehicles ADD COLUMN vehicle_image MEDIUMTEXT;`);
            console.log('  ✅ Added vehicle_image to vehicles table');
        } else {
            console.log('  ℹ️  vehicle_image column already exists in vehicles table');
        }

        if (!hasVehicleBook) {
            console.log('  ➕ Adding vehicle_book column to vehicles table...');
            await connection.query(`ALTER TABLE vehicles ADD COLUMN vehicle_book MEDIUMTEXT;`);
            console.log('  ✅ Added vehicle_book to vehicles table');
        } else {
            console.log('  ℹ️  vehicle_book column already exists in vehicles table');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Verifying changes...');

        // Verify partners table
        const [partnersDesc] = await connection.query('DESCRIBE partners');
        const profilePictureField = partnersDesc.find(col => col.Field === 'profile_picture');
        if (profilePictureField) {
            console.log(`  ✓ partners.profile_picture: ${profilePictureField.Type}`);
        }

        // Verify vehicles table
        const [vehiclesDesc] = await connection.query('DESCRIBE vehicles');
        const vehicleImageField = vehiclesDesc.find(col => col.Field === 'vehicle_image');
        const vehicleBookField = vehiclesDesc.find(col => col.Field === 'vehicle_book');
        if (vehicleImageField) {
            console.log(`  ✓ vehicles.vehicle_image: ${vehicleImageField.Type}`);
        }
        if (vehicleBookField) {
            console.log(`  ✓ vehicles.vehicle_book: ${vehicleBookField.Type}`);
        }

        console.log('\n🎉 All checks passed!');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
})();
