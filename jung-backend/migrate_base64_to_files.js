const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const saveBase64Image = (base64Str, prefix) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
        return null;
    }

    try {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const matches = base64Str.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        return `/uploads/${filename}`;
    } catch (err) {
        console.error('Error saving base64 image:', err);
        return null;
    }
};

(async () => {
    const pool = mysql.createPool(dbConfig);
    console.log('🚀 Starting migration: base64 to files...');

    try {
        // 1. Migrate Partners
        const [partners] = await pool.query('SELECT id, name, id_front_image, id_back_image, profile_picture FROM partners');
        console.log(`Found ${partners.length} partners to check.`);

        for (const partner of partners) {
            const updates = [];
            const params = [];

            if (partner.id_front_image?.startsWith('data:image')) {
                const path = saveBase64Image(partner.id_front_image, `partner_${partner.id}_id_front`);
                if (path) { updates.push('id_front_image = ?'); params.push(path); }
            }
            if (partner.id_back_image?.startsWith('data:image')) {
                const path = saveBase64Image(partner.id_back_image, `partner_${partner.id}_id_back`);
                if (path) { updates.push('id_back_image = ?'); params.push(path); }
            }
            if (partner.profile_picture?.startsWith('data:image')) {
                const path = saveBase64Image(partner.profile_picture, `partner_${partner.id}_profile`);
                if (path) { updates.push('profile_picture = ?'); params.push(path); }
            }

            if (updates.length > 0) {
                params.push(partner.id);
                await pool.query(`UPDATE partners SET ${updates.join(', ')} WHERE id = ?`, params);
                console.log(`✅ Updated partner: ${partner.name} (ID: ${partner.id})`);
            }
        }

        // 2. Migrate Vehicles
        const [vehicles] = await pool.query('SELECT id, partner_id, vehicle_image, vehicle_book FROM vehicles');
        console.log(`Found ${vehicles.length} vehicles to check.`);

        for (const vehicle of vehicles) {
            const updates = [];
            const params = [];

            if (vehicle.vehicle_image?.startsWith('data:image')) {
                const path = saveBase64Image(vehicle.vehicle_image, `vehicle_${vehicle.id}_image`);
                if (path) { updates.push('vehicle_image = ?'); params.push(path); }
            }
            if (vehicle.vehicle_book?.startsWith('data:image')) {
                const path = saveBase64Image(vehicle.vehicle_book, `vehicle_${vehicle.id}_book`);
                if (path) { updates.push('vehicle_book = ?'); params.push(path); }
            }

            if (updates.length > 0) {
                params.push(vehicle.id);
                await pool.query(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, params);
                console.log(`✅ Updated vehicle ID: ${vehicle.id} for partner ID: ${vehicle.partner_id}`);
            }
        }

        console.log('✨ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
