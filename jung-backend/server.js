const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { calculateDistance, calculateDynamicRadius } = require('./utils/geoCalculations');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendRegistrationEmail, sendPartnerRegistrationEmail, sendApprovalEmail, sendRejectionEmail } = require('./utils/emailService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Config for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper to save base64 image
const saveBase64Image = (base64Str, prefix) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
        return base64Str; // Return as is if not a base64 string or already a path
    }

    try {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Extract metadata and base64 data
        const matches = base64Str.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return base64Str;
        }

        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        console.log(`Saved base64 image to ${filepath}`);

        return `/uploads/${filename}`;
    } catch (err) {
        console.error('Error saving base64 image:', err);
        return base64Str;
    }
};

// Database Connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jungapp_db'
};

const pool = mysql.createPool(dbConfig);

// Check and add is_active column to users table
(async () => {
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_active'");
        if (columns.length === 0) {
            await pool.query("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1");
            console.log("Added is_active column to users table");
        }
    } catch (err) {
        // Table might not exist yet if fresh install, ignore
        console.log("Skipping users table check (might not exist yet)");
    }
})();

// Check and update status column in partners table to ENUM
(async () => {
    try {
        // 1. First update any 'Suspended' status to 'Inactive' to prevent data truncation/errors
        await pool.query("UPDATE partners SET status = 'Inactive' WHERE status = 'Suspended'");

        // 2. Execute the alter query to restrict the enum values
        await pool.query("ALTER TABLE partners MODIFY COLUMN status ENUM('Active', 'Inactive', 'Pending', 'Rejected') DEFAULT 'Pending'");
        console.log("Successfully migrated partner statuses and updated schema.");
    } catch (err) {
        console.log("Migration warning (safe to ignore if already updated):", err.message);
    }
})();

// Session Store
const sessionStore = new MySQLStore({}, pool);
app.use(session({
    key: 'jung_session',
    secret: 'super_secret_key', // In production, use env variable
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true
    }
}));

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- AUTHENTICATION ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, phone, type, user_type } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const isPartnerType = ['Food', 'Rider', 'Room'].includes(type);

        if (isPartnerType && !user_type) { // Partner registration
            const [result] = await pool.query(
                'INSERT INTO partners (email, password_hash, name, phone, type, status) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, name, phone, type, 'Pending']
            );
            res.json({ success: true, partnerId: result.insertId });
        } else { // User registration
            const finalUserType = user_type || (type && !isPartnerType ? type : 'student');
            const [result] = await pool.query(
                'INSERT INTO users (email, password_hash, name, phone, user_type, is_active) VALUES (?, ?, ?, ?, ?, 1)',
                [email, hashedPassword, name, phone, finalUserType]
            );

            // Send Welcome Email
            sendRegistrationEmail(email, name).catch(console.error);

            res.json({ success: true, userId: result.insertId });
        }
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const table = role === 'partner' ? 'partners' : 'users';
        const [rows] = await pool.query(`
            SELECT t.*, v.vehicle_type, v.model as vehicle_model 
            FROM ${table} t 
            LEFT JOIN vehicles v ON t.id = v.partner_id 
            WHERE t.email = ?
        `, [email]);

        if (rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const data = rows[0];

        // CHECK ACTIVE STATUS FOR USERS
        if (table === 'users' && data.is_active === 0) {
            return res.status(401).json({ success: false, error: 'Your account has been deactivated. Please contact support.' });
        }
        // CHECK STATUS FOR PARTNERS
        if (table === 'partners') {
            if (data.status === 'Pending') return res.status(401).json({ success: false, error: 'Your account is pending admin approval. Please wait.' });
            if (data.status !== 'Active') return res.status(401).json({ success: false, error: 'Your partner account is not active.' });
        }

        const valid = await bcrypt.compare(password, data.password_hash);
        if (!valid) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        delete data.password_hash;

        req.session.user = { ...data, role: role || (data.user_type ? 'user' : 'partner') };

        res.json({
            success: true,
            user: {
                ...data,
                type: role || data.user_type || 'student'
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- PARTNER REGISTRATION ---
app.post('/api/partners/register', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            email, password, name, phone, type,
            business_name, location, university_id, property_type,
            latitude, longitude,
            id_front_image, id_back_image, profile_picture,
            vehicle_type, vehicle_number, vehicle_image, vehicle_book
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        // Decode base64 images to files
        const id_front_path = saveBase64Image(id_front_image, 'id_front');
        const id_back_path = saveBase64Image(id_back_image, 'id_back');
        const profile_path = saveBase64Image(profile_picture, 'profile');
        const vehicle_image_path = saveBase64Image(vehicle_image, 'vehicle');
        const vehicle_book_path = saveBase64Image(vehicle_book, 'vehicle_book');

        // 1. Insert into partners
        const [partnerResult] = await connection.query(
            `INSERT INTO partners (
                email, password_hash, name, phone, type, status,
                business_name, location, university_id, property_type,
                latitude, longitude, id_front_image, id_back_image, profile_picture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                email, hashedPassword, name, phone, type, 'Pending',
                business_name || name, location, university_id || null, property_type || null,
                latitude || 0, longitude || 0, id_front_path, id_back_path, profile_path
            ]
        );

        const partnerId = partnerResult.insertId;

        // 2. Insert into specific service tables
        if (type === 'Food') {
            await connection.query(
                'INSERT INTO restaurants (partner_id, name, cuisine_type, address, category) VALUES (?, ?, ?, ?, ?)',
                [partnerId, business_name || name, 'General', location, university_id ? 'uni' : 'city']
            );
        } else if (type === 'Rider') {
            await connection.query(
                'INSERT INTO vehicles (partner_id, vehicle_type, plate_number, vehicle_image, vehicle_book) VALUES (?, ?, ?, ?, ?)',
                [partnerId, vehicle_type, vehicle_number, vehicle_image_path, vehicle_book_path]
            );
            // Also initialize rider location
            await connection.query(
                'INSERT INTO rider_locations (rider_id, current_lat, current_lng, is_online, is_available) VALUES (?, ?, ?, 0, 0)',
                [partnerId, latitude || 0, longitude || 0]
            );
        } else if (type === 'Room') {
            await connection.query(
                'INSERT INTO rooms (partner_id, title, address, property_type, location_name) VALUES (?, ?, ?, ?, ?)',
                [partnerId, business_name || name, location, property_type, location]
            );
        }

        await connection.commit();

        // Send Partner Registration Email
        sendPartnerRegistrationEmail(email, name).catch(console.error);

        res.json({ success: true, partnerId });
    } catch (err) {
        await connection.rollback();
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
});

app.post('/api/partners/login', async (req, res) => {
    const { email, password, type } = req.body;
    try {
        const [rows] = await pool.query(`
            SELECT p.*, v.vehicle_type, v.model as vehicle_model 
            FROM partners p 
            LEFT JOIN vehicles v ON p.id = v.partner_id 
            WHERE p.email = ?
        `, [email]);

        if (rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const partner = rows[0];

        // STRICT STATUS CHECK
        if (partner.status === 'Pending') {
            return res.status(401).json({ success: false, error: 'Your account is pending admin approval. Please wait.' });
        }
        if (partner.status !== 'Active') {
            return res.status(401).json({ success: false, error: 'Your partner account is not active.' });
        }

        const valid = await bcrypt.compare(password, partner.password_hash);
        delete partner.password_hash;

        req.session.user = { ...partner, role: 'partner' };

        res.json({
            success: true,
            partner: partner
        });
    } catch (err) {
        console.error('Partner login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/auth/me', async (req, res) => {
    if (req.session.user) {
        try {
            const role = req.session.user.role || (req.session.user.user_type ? 'user' : 'partner');
            const table = role === 'partner' ? 'partners' : 'users';

            // Re-fetch fresh data from DB including vehicle info if partner
            const [rows] = await pool.query(`
                SELECT t.*, v.vehicle_type, v.model as vehicle_model 
                FROM ${table} t 
                LEFT JOIN vehicles v ON t.id = v.partner_id 
                WHERE t.id = ?
            `, [req.session.user.id]);

            if (rows.length > 0) {
                const refreshedUser = rows[0];
                delete refreshedUser.password_hash;
                req.session.user = { ...refreshedUser, role };

                return res.json({
                    authenticated: true,
                    type: role,
                    [role]: req.session.user
                });
            }
        } catch (err) {
            console.error('Session refresh error:', err);
        }

        // Fallback to existing session if DB refresh fails
        const type = req.session.user.role === 'partner' ? 'partner' : 'user';
        res.json({
            authenticated: true,
            type: type,
            [type]: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;
    const role = req.session.user.role || (req.session.user.user_type ? 'user' : 'partner');
    const table = role === 'partner' ? 'partners' : 'users';

    try {
        // 1. Get current password hash
        const [rows] = await pool.query(`SELECT password_hash FROM ${table} WHERE id = ?`, [userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!valid) {
            return res.status(400).json({ success: false, error: 'Incorrect current password' });
        }

        // 2. Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update database
        await pool.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [hashedNewPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    if (req.session.user && req.session.user.role === 'partner') {
        try {
            await pool.query('UPDATE rider_locations SET is_online = 0, is_available = 0 WHERE rider_id = ?', [req.session.user.id]);
        } catch (err) {
            console.error('Logout status update error:', err);
        }
    }
    req.session.destroy();
    res.json({ success: true });
});

// --- ADMIN ENDPOINTS ---

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid username or password' });

        const admin = rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) return res.status(401).json({ success: false, error: 'Invalid username or password' });

        delete admin.password_hash;
        req.session.user = { ...admin, role: 'admin' };

        // Update last login
        await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

        res.json({ success: true, admin });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/change-password', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    try {
        const [rows] = await pool.query('SELECT password_hash FROM admins WHERE id = ?', [req.session.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Admin not found' });

        const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!valid) return res.status(400).json({ success: false, error: 'Incorrect current password' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.session.user.id]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Admin password change error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [totalPartners] = await pool.query('SELECT COUNT(*) as count FROM partners');
        const [foodPartners] = await pool.query('SELECT COUNT(*) as count FROM partners WHERE type = "food"');
        const [rooms] = await pool.query('SELECT COUNT(*) as count FROM rooms');
        const [rides] = await pool.query('SELECT COUNT(*) as count FROM ride_requests');
        const [recentUsers] = await pool.query('SELECT name, email, user_type, created_at FROM users ORDER BY created_at DESC LIMIT 5');

        res.json({
            totalUsers: users[0].count,
            totalPartners: totalPartners[0].count,
            totalFoodPartners: foodPartners[0].count,
            totalRooms: rooms[0].count,
            totalRides: rides[0].count,
            recentUsers
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/users', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { search } = req.query;
    try {
        let query = 'SELECT id, email, name, phone, user_type, is_active, created_at FROM users';
        let params = [];
        if (search) {
            query += ' WHERE name LIKE ? OR email LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/partners', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { search, status } = req.query;
    try {
        let query = `
            SELECT p.id, p.email, p.name, p.phone, p.type, p.status, p.business_name, p.location, p.created_at,
                   p.profile_picture, p.id_front_image, p.id_back_image,
                   v.vehicle_type, v.model as vehicle_model, v.plate_number, v.vehicle_image, v.vehicle_book
            FROM partners p
            LEFT JOIN vehicles v ON p.id = v.partner_id
        `;
        let params = [];
        let conditions = [];
        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ? OR business_name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/admin/partners/:id/status', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.body;
    try {
        // Fetch partner details first for email
        const [partners] = await pool.query('SELECT email, name, type FROM partners WHERE id = ?', [req.params.id]);

        await pool.query('UPDATE partners SET status = ? WHERE id = ?', [status, req.params.id]);

        if (partners.length > 0) {
            const { email, name, type } = partners[0];
            if (status === 'Active') {
                sendApprovalEmail(email, name, type || 'Partner').catch(console.error);
            } else if (status === 'Rejected') {
                sendRejectionEmail(email, name, type || 'Partner').catch(console.error);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/partners/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        await pool.query('DELETE FROM partners WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/admin/users/:id/status', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { status } = req.body;
    try {
        // Fetch user details first
        const [users] = await pool.query('SELECT email, name, user_type FROM users WHERE id = ?', [req.params.id]);

        const isActive = status === 'Active' ? 1 : 0;
        await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, req.params.id]);

        if (users.length > 0) {
            const { email, name, user_type } = users[0];
            // Only send email if status actually implies approval/rejection (Active vs Inactive/Rejected)
            if (status === 'Active') {
                sendApprovalEmail(email, name, user_type || 'User').catch(console.error);
            } else if (status === 'Inactive' || status === 'Rejected') { // Handling potential 'Rejected' text if sent from frontend
                sendRejectionEmail(email, name, user_type || 'User').catch(console.error);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- LOCATIONS ---

app.get('/api/locations', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM locations ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/universities', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM locations WHERE type = 'University' ORDER BY name");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin CRUD for Locations & Universities
app.get('/api/admin/config/locations', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        const [rows] = await pool.query("SELECT * FROM locations WHERE type = 'City' ORDER BY name");
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/config/universities', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        const [rows] = await pool.query("SELECT * FROM locations WHERE type = 'University' ORDER BY name");
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/admin/config/locations', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    const { name, type, latitude, longitude } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO locations (name, type, latitude, longitude) VALUES (?, ?, ?, ?)',
            [name, type || 'City', latitude, longitude]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/config/locations/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    const { name, type, latitude, longitude } = req.body;
    try {
        await pool.query(
            'UPDATE locations SET name = ?, type = ?, latitude = ?, longitude = ? WHERE id = ?',
            [name, type, latitude, longitude, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/config/locations/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        await pool.query('DELETE FROM locations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Admin CRUD for Food Categories
app.get('/api/admin/config/food-categories', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        const [rows] = await pool.query('SELECT * FROM food_categories ORDER BY name');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/config/food-categories', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    const { name } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO food_categories (name) VALUES (?)', [name]);
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/config/food-categories/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        await pool.query('DELETE FROM food_categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Admin Management for Vehicle Configuration
app.get('/api/admin/config/vehicle-types', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        const [rows] = await pool.query('SELECT * FROM vehicle_config ORDER BY name');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/config/vehicle-types', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    const { vehicle_type, name, base_rate, per_km_rate, icon, color, eta_default } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO vehicle_config (vehicle_type, name, base_rate, per_km_rate, icon, color, eta_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [vehicle_type, name, base_rate, per_km_rate, icon, color, eta_default]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/config/vehicle-types/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    const { name, base_rate, per_km_rate, icon, color, eta_default, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE vehicle_config SET name = ?, base_rate = ?, per_km_rate = ?, icon = ?, color = ?, eta_default = ?, is_active = ? WHERE id = ?',
            [name, base_rate, per_km_rate, icon, color, eta_default, is_active, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/config/vehicle-types/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        await pool.query('DELETE FROM vehicle_config WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// Public Endpoint to fetch vehicle config (for User App)
app.get('/api/config/vehicle-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vehicle_config WHERE is_active = 1');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin View: All Vehicles
app.get('/api/admin/vehicles', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(401).json({ success: false });
    try {
        const [rows] = await pool.query(`
            SELECT v.*, p.name as owner_name, p.business_name, p.email as owner_email 
            FROM vehicles v
            JOIN partners p ON v.partner_id = p.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- RIDE HAILING (Partner/Driver Side) ---

// Get current driver location and status
app.get('/api/riders/:id/location', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT current_lat, current_lng, is_online, is_available FROM rider_locations WHERE rider_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.json(null);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restore active ride if any
app.get('/api/riders/:id/active-ride', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, u.name as passenger_name, u.phone as passenger_phone
            FROM ride_requests r
            JOIN users u ON r.passenger_id = u.id
            WHERE r.assigned_rider_id = ? AND r.status IN ('accepted', 'arrived', 'picked_up')
            LIMIT 1
        `, [req.params.id]);

        res.json({ active_ride: rows.length > 0 ? rows[0] : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Online/Offline status
app.put('/api/riders/:id/status', async (req, res) => {
    const { is_online, is_available } = req.body;
    try {
        await pool.query(
            `INSERT INTO rider_locations (rider_id, is_online, is_available, current_lat, current_lng) 
             VALUES (?, ?, ?, 6.9271, 79.8612) 
             ON DUPLICATE KEY UPDATE is_online = ?, is_available = ?`,
            [req.params.id, is_online, is_available, is_online, is_available]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update Driver Location
app.post('/api/riders/:id/location', async (req, res) => {
    const { lat, lng } = req.body;
    try {
        await pool.query(
            `UPDATE rider_locations SET current_lat = ?, current_lng = ? WHERE rider_id = ?`,
            [lat, lng, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/riders/:id/location', async (req, res) => {
    const { lat, lng } = req.body;
    try {
        await pool.query(
            `UPDATE rider_locations SET current_lat = ?, current_lng = ? WHERE rider_id = ?`,
            [lat, lng, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Nearby Requests
app.get('/api/riders/:id/nearby-requests', async (req, res) => {
    const riderId = req.params.id;
    const searchRadius = parseFloat(req.query.radius) || 10; // Default to 10km for better coverage
    try {
        // 1. Get rider's current location and vehicle type
        const [riderInfo] = await pool.query(`
            SELECT rl.current_lat, rl.current_lng, v.vehicle_type 
            FROM rider_locations rl 
            JOIN vehicles v ON rl.rider_id = v.partner_id 
            WHERE rl.rider_id = ?
        `, [riderId]);

        if (riderInfo.length === 0) {
            console.log(`⚠️ No location or vehicle info for rider ${riderId}`);
            return res.json({ requests: [] });
        }

        const { current_lat, current_lng, vehicle_type } = riderInfo[0];
        console.log(`🔍 Polling nearby requests for Rider ${riderId} (${vehicle_type}) at ${current_lat}, ${current_lng}`);

        // 2. Fetch all pending requests that match the rider's vehicle type
        // AND haven't been declined by this specific rider
        const [requests] = await pool.query(`
            SELECT r.*, u.name as passenger_name, u.phone as passenger_phone
            FROM ride_requests r
            JOIN users u ON r.passenger_id = u.id
            LEFT JOIN ride_request_responses res ON r.id = res.request_id AND res.rider_id = ?
            WHERE r.status = 'pending' 
            AND r.assigned_rider_id IS NULL
            AND r.vehicle_type = ?
            AND res.response IS NULL
        `, [riderId, vehicle_type]);

        // 3. Filter by distance
        const nearby = requests.filter(request => {
            const dist = calculateDistance(
                parseFloat(current_lat),
                parseFloat(current_lng),
                parseFloat(request.pickup_lat),
                parseFloat(request.pickup_lng)
            );
            request.distance_from_you = dist;
            return dist <= searchRadius;
        });

        console.log(`✅ Found ${nearby.length} matching nearby requests for rider ${riderId}`);

        const hour = new Date().getHours();
        const recommendedRadius = calculateDynamicRadius(hour, 10);

        res.json({ requests: nearby, recommended_radius: recommendedRadius });
    } catch (err) {
        console.error('Nearby Requests Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Accept Ride Request
app.post('/api/riders/:id/requests/:requestId/accept', async (req, res) => {
    const { id: riderId, requestId } = req.params;
    try {
        await pool.query(
            'UPDATE ride_requests SET status = "accepted", assigned_rider_id = ?, accepted_at = NOW() WHERE id = ?',
            [riderId, requestId]
        );
        await pool.query('UPDATE rider_locations SET is_available = 0 WHERE rider_id = ?', [riderId]);

        const [rides] = await pool.query(`
            SELECT r.*, u.name as passenger_name, u.phone as passenger_phone
            FROM ride_requests r
            JOIN users u ON r.passenger_id = u.id
            WHERE r.id = ?
        `, [requestId]);

        res.json({ success: true, ride: rides[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Decline Ride Request
app.post('/api/riders/:id/requests/:requestId/decline', async (req, res) => {
    try {
        await pool.query(
            'INSERT INTO ride_request_responses (request_id, rider_id, response) VALUES (?, ?, "declined") ON DUPLICATE KEY UPDATE response = "declined"',
            [req.params.requestId, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Complete Ride
app.post('/api/riders/:id/requests/:requestId/complete', async (req, res) => {
    const { id: riderId, requestId } = req.params;
    try {
        await pool.query(
            'UPDATE ride_requests SET status = "completed", completed_at = NOW() WHERE id = ?',
            [requestId]
        );
        await pool.query('UPDATE rider_locations SET is_available = 1 WHERE rider_id = ?', [riderId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Stats & History
app.get('/api/riders/:id/stats', async (req, res) => {
    try {
        const [todayRows] = await pool.query(
            'SELECT COALESCE(SUM(estimated_fare), 0) as total_earnings, COUNT(*) as total_rides FROM ride_requests WHERE assigned_rider_id = ? AND status = "completed" AND DATE(completed_at) = CURDATE()',
            [req.params.id]
        );
        const [weeklyRows] = await pool.query(
            'SELECT COALESCE(SUM(estimated_fare), 0) as weekly_earnings FROM ride_requests WHERE assigned_rider_id = ? AND status = "completed" AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            [req.params.id]
        );
        res.json({ today: todayRows[0], weekly_earnings: weeklyRows[0].weekly_earnings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/riders/:id/history', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM ride_requests WHERE assigned_rider_id = ? ORDER BY requested_at DESC LIMIT 20',
            [req.params.id]
        );
        res.json({ history: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notifications
app.get('/api/partners/:id/notifications', async (req, res) => {
    try {
        // Notifications table might not exist in some setups, check schema first or handle error
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? AND role = "partner" ORDER BY created_at DESC LIMIT 20',
            [req.params.id]
        ).catch(() => [[]]); // Gracefully handle missing table
        res.json({ notifications: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RIDE HAILING (User/Passenger Side) ---

app.post('/api/ride-requests', async (req, res) => {
    const {
        passenger_id,
        pickup_location, pickup_lat, pickup_lng,
        dropoff_location, dropoff_lat, dropoff_lng,
        vehicle_type, estimated_fare, distance_km
    } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO ride_requests 
             (passenger_id, pickup_location, pickup_lat, pickup_lng, dropoff_location, dropoff_lat, dropoff_lng, vehicle_type, estimated_fare, distance_km) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [passenger_id, pickup_location, pickup_lat, pickup_lng, dropoff_location, dropoff_lat, dropoff_lng, vehicle_type, estimated_fare, distance_km]
        );
        res.json({ success: true, id: result.insertId }); // Frontend expects 'id'
    } catch (err) {
        console.error('Ride Request Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Active Ride for student
app.get('/api/ride-requests/active/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, p.name as driver_name, p.phone as driver_phone, p.avatar_url as driver_avatar,
                   rl.current_lat as driver_lat, rl.current_lng as driver_lng,
                   v.vehicle_type, v.model as vehicle_model, v.plate_number
            FROM ride_requests r
            LEFT JOIN partners p ON r.assigned_rider_id = p.id
            LEFT JOIN rider_locations rl ON p.id = rl.rider_id
            LEFT JOIN vehicles v ON p.id = v.partner_id
            WHERE r.passenger_id = ? 
            AND (
                r.status IN ('pending', 'accepted', 'arrived', 'picked_up')
                OR (r.status = 'completed' AND r.completed_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE))
            )
            ORDER BY r.requested_at DESC LIMIT 1
        `, [req.params.userId]);

        if (rows.length === 0) return res.json(null);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Nearby Riders for student map
app.get('/api/riders/nearby', async (req, res) => {
    const { lat, lng, radius = 10 } = req.query; // Use higher default or as sent

    // Prevent browser caching of real-time locations
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        // Fetch specific vehicle types from the vehicles table
        // CRITICAL: Filter out riders who haven't updated location in > 2 minutes (heartbeat check)
        const [rows] = await pool.query(`
            SELECT rl.rider_id, rl.current_lat, rl.current_lng, rl.is_online, rl.is_available,
                   v.vehicle_type, rl.last_updated
            FROM rider_locations rl
            INNER JOIN vehicles v ON rl.rider_id = v.partner_id
            WHERE rl.is_online = 1 
            AND rl.is_available = 1
            AND rl.last_updated >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
        `);

        // Filter by distance in memory for accuracy
        const nearby = rows.filter(rider => {
            const dist = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                parseFloat(rider.current_lat),
                parseFloat(rider.current_lng)
            );
            return dist <= parseFloat(radius);
        });

        res.json(nearby);
    } catch (err) {
        console.error('Nearby Riders Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/ride-requests/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, p.name as driver_name, p.phone as driver_phone, p.avatar_url as driver_avatar,
                   rl.current_lat as driver_lat, rl.current_lng as driver_lng
            FROM ride_requests r
            LEFT JOIN partners p ON r.assigned_rider_id = p.id
            LEFT JOIN rider_locations rl ON p.id = rl.rider_id
            WHERE r.id = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/ride-requests/:id', async (req, res) => {
    try {
        const [ride] = await pool.query('SELECT assigned_rider_id FROM ride_requests WHERE id = ?', [req.params.id]);
        await pool.query('UPDATE ride_requests SET status = "cancelled" WHERE id = ?', [req.params.id]);
        if (ride.length > 0 && ride[0].assigned_rider_id) {
            await pool.query('UPDATE rider_locations SET is_available = 1 WHERE rider_id = ?', [ride[0].assigned_rider_id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mark driver arrived at pickup
app.post('/api/ride-requests/:id/arrived', async (req, res) => {
    try {
        await pool.query('UPDATE ride_requests SET status = "arrived" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start trip (driver picked up passenger)
app.post('/api/ride-requests/:id/start-trip', async (req, res) => {
    try {
        await pool.query('UPDATE ride_requests SET status = "picked_up" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Complete ride
app.post('/api/ride-requests/:id/complete', async (req, res) => {
    try {
        await pool.query(
            'UPDATE ride_requests SET status = "completed", completed_at = NOW() WHERE id = ?',
            [req.params.id]
        );

        // Make driver available again
        const [ride] = await pool.query('SELECT assigned_rider_id FROM ride_requests WHERE id = ?', [req.params.id]);
        if (ride.length > 0 && ride[0].assigned_rider_id) {
            await pool.query('UPDATE rider_locations SET is_available = 1 WHERE rider_id = ?', [ride[0].assigned_rider_id]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get trip history for a student with driver and vehicle details
app.get('/api/ride-requests/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        let query = `
            SELECT 
                rr.id,
                rr.pickup_location,
                rr.dropoff_location,
                rr.pickup_lat,
                rr.pickup_lng,
                rr.dropoff_lat,
                rr.dropoff_lng,
                rr.distance_km,
                rr.estimated_fare,
                rr.vehicle_type,
                rr.status,
                rr.requested_at,
                rr.accepted_at,
                rr.completed_at,
                p.name AS driver_name,
                p.phone AS driver_phone,
                p.avatar_url AS driver_avatar,
                v.model AS vehicle_model,
                v.plate_number AS vehicle_plate,
                v.color AS vehicle_color
            FROM ride_requests rr
            LEFT JOIN partners p ON rr.assigned_rider_id = p.id
            LEFT JOIN vehicles v ON p.id = v.partner_id AND v.vehicle_type = rr.vehicle_type
            WHERE rr.passenger_id = ?
                AND rr.status IN ('completed', 'cancelled')
        `;

        const params = [userId];

        // Add date filtering if provided
        if (startDate) {
            query += ' AND rr.completed_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND rr.completed_at <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY rr.completed_at DESC';

        const [trips] = await pool.query(query, params);
        res.json({ success: true, trips });
    } catch (err) {
        console.error('Trip history error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- PARTNER STATUS ---
app.put('/api/partners/:id/status', async (req, res) => {
    const { is_active } = req.body;
    try {
        await pool.query('UPDATE partners SET status = ? WHERE id = ?', [is_active ? 'Active' : 'Inactive', req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update Partner Profile Details
app.put('/api/partners/:id', async (req, res) => {
    const { business_name, email, phone, location } = req.body;
    try {
        await pool.query(
            `UPDATE partners SET 
                name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                phone = COALESCE(?, phone), 
                location = COALESCE(?, location),
                avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?`,
            [business_name || null, email || null, phone || null, location || null, req.body.avatar || null, req.params.id]
        );

        const [rows] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        const partner = rows[0];
        delete partner.password_hash;

        res.json({ success: true, partner });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update Partner Password
app.put('/api/partners/:id/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [rows] = await pool.query('SELECT password_hash FROM partners WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Partner not found' });

        const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Incorrect current password' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE partners SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.params.id]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upload Profile Image (Avatar)
app.post('/api/partners/:id/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    try {
        await pool.query('UPDATE partners SET avatar_url = ? WHERE id = ?', [avatarUrl, req.params.id]);
        res.json({ success: true, avatar_url: avatarUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upload User Profile Image (Avatar)
app.post('/api/users/:id/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    try {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.params.id]);
        res.json({ success: true, avatar_url: avatarUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update User Profile Details
app.put('/api/users/:id', async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        await pool.query(
            `UPDATE users SET 
                name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                phone = COALESCE(?, phone),
                avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?`,
            [name || null, email || null, phone || null, req.body.avatar || null, req.params.id]
        );

        const [rows] = await pool.query('SELECT id, email, name, phone, avatar_url, user_type FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- FOOD & RESTAURANTS ---

// Get all restaurants with location filtering
app.get('/api/restaurants', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        const { location, category } = req.query;
        let query = `
            SELECT r.*, p.avatar_url as partner_avatar, GROUP_CONCAT(mi.name) as food_names
            FROM restaurants r
            LEFT JOIN partners p ON r.partner_id = p.id
            LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
            WHERE r.is_open = 1
        `;
        const params = [];

        if (location) {
            const cityName = location.replace('University of ', '').replace(' NSBM Green University', 'Homagama');
            query += ' AND (r.address LIKE ? OR r.address LIKE ?)';
            params.push(`%${location}%`);
            params.push(`%${cityName}%`);
        }

        if (category) {
            if (category === 'uni') {
                query += ' AND (r.category = "uni" OR r.category = "city")';
            } else {
                query += ' AND r.category = ?';
                params.push(category);
            }
        }

        query += ' GROUP BY r.id';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Fetch restaurants error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get specific restaurant details
app.get('/api/restaurants/:id', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        const [rows] = await pool.query(`
            SELECT r.*, p.avatar_url as partner_avatar 
            FROM restaurants r
            LEFT JOIN partners p ON r.partner_id = p.id
            WHERE r.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get menu items for a restaurant
app.get('/api/restaurants/:id/menu', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create food order
app.post('/api/orders', async (req, res) => {
    const { user_id, restaurant_id, total_amount, payment_method, delivery_address, items } = req.body;

    if (!user_id || !restaurant_id || !items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required order fields: user_id, restaurant_id, or items' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Fetch partner_id for this restaurant
        const [restaurants] = await connection.query('SELECT partner_id FROM restaurants WHERE id = ?', [restaurant_id]);
        if (restaurants.length === 0) throw new Error(`Restaurant with ID ${restaurant_id} not found`);
        const partner_id = restaurants[0].partner_id;

        console.log(`📝 Creating order for User: ${user_id}, Restaurant: ${restaurant_id}, Partner: ${partner_id}`);

        // 2. Create the main order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, partner_id, restaurant_id, service_type, status, total_amount, payment_method, delivery_address) 
             VALUES (?, ?, ?, 'Food', 'Pending', ?, ?, ?)`,
            [user_id, partner_id, restaurant_id, total_amount, payment_method, delivery_address]
        );
        const orderId = orderResult.insertId;

        // 3. Add order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) 
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.id, item.quantity, item.price]
            );
        }

        await connection.commit();

        // 4. Update user profile phone if missing/new and provided
        if (req.body.phone) {
            try {
                await pool.query('UPDATE users SET phone = ? WHERE id = ? AND (phone IS NULL OR phone = "")', [req.body.phone, user_id]);
                console.log(`📱 Updated phone for user ${user_id}`);
            } catch (err) {
                console.error('Failed to update user phone:', err);
            }
        }

        console.log(`✅ Order created successfully: ID ${orderId}`);
        res.json({ success: true, orderId });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Order creation error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Get order history for a user
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.*, 
                   r.name as restaurant_name, r.image_url as restaurant_image, r.address as restaurant_address,
                   p.avatar_url as partner_avatar
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            LEFT JOIN partners p ON o.partner_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [req.params.userId]);

        // For each order, get detailed items
        const ordersWithItems = await Promise.all(rows.map(async (order) => {
            const [items] = await pool.query(`
                SELECT oi.*, mi.name, mi.image_url, mi.description
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
            `, [order.id]);
            return { ...order, items };
        }));

        res.json(ordersWithItems);
    } catch (err) {
        console.error('Order history error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get bookings/history for total count on profile
app.get('/api/partners/bookings/:id', async (req, res) => {
    try {
        // 1. Get partner type
        const [partners] = await pool.query('SELECT type FROM partners WHERE id = ?', [req.params.id]);
        if (partners.length === 0) return res.status(404).json({ error: 'Partner not found' });

        const type = partners[0].type;
        let rows = [];

        // 2. Query based on type
        if (type === 'Food') {
            [rows] = await pool.query('SELECT * FROM orders WHERE partner_id = ?', [req.params.id]);
        } else if (type === 'Rider') {
            [rows] = await pool.query('SELECT * FROM ride_requests WHERE assigned_rider_id = ?', [req.params.id]);
        } else if (type === 'Room') {
            [rows] = await pool.query(`
                SELECT b.*, r.title as room_title, COALESCE(b.total_price, r.price_per_month) as total_price
                FROM bookings b 
                JOIN rooms r ON b.room_id = r.id 
                WHERE b.partner_id = ?
            `, [req.params.id]);
        }

        res.json(rows);
    } catch (err) {
        console.error('Fetch partner bookings error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PARTNER FOOD DASHBOARD APIs ---

// Get partner-specific restaurant info
app.get('/api/partners/restaurants/:partnerId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM restaurants WHERE partner_id = ?', [req.params.partnerId]);
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROOMS ---

// Map for room image uploads
app.post('/api/upload/room-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// Get all rooms for a specific partner
app.get('/api/partners/rooms/:partnerId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rooms WHERE partner_id = ?', [req.params.partnerId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new room
app.post('/api/partners/rooms', async (req, res) => {
    const { partner_id, title, description, location_name, address, price, property_type, room_type, images, amenities, gender_restriction } = req.body;
    console.log(`[DEBUG] Creating Room: Title="${title}", InputPrice=${price}, Type=${room_type}`);
    try {
        const [result] = await pool.query(
            `INSERT INTO rooms (partner_id, title, description, location_name, address, price_per_month, property_type, room_type, images, amenities, gender_restriction) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [partner_id, title, description, location_name, address, price, property_type, room_type || 'Individual', JSON.stringify(images), JSON.stringify(amenities), gender_restriction || 'Any']
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update a room
app.put('/api/partners/rooms/:id', async (req, res) => {
    const { title, description, location_name, address, price, property_type, room_type, images, amenities, gender_restriction } = req.body;
    console.log(`[DEBUG] Updating Room ID ${req.params.id}: InputPrice=${price}`);
    try {
        await pool.query(
            `UPDATE rooms SET title = ?, description = ?, location_name = ?, address = ?, price_per_month = ?, 
             property_type = ?, room_type = ?, images = ?, amenities = ?, gender_restriction = ? WHERE id = ?`,
            [title, description, location_name, address, price, property_type, room_type || 'Individual', JSON.stringify(images), JSON.stringify(amenities), gender_restriction || 'Any', req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete a room
app.delete('/api/partners/rooms/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update room status
app.patch('/api/partners/rooms/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const is_available = status === 'Available';
        await pool.query('UPDATE rooms SET status = ?, is_available = ? WHERE id = ?', [status, is_available, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- BOOKINGS ---

// Create a new booking
app.post('/api/partners/bookings', async (req, res) => {
    const { partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO bookings (partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status || 'Confirmed']
        );

        // If booking is confirmed, mark room as occupied
        if (status === 'Confirmed') {
            await pool.query('UPDATE rooms SET status = "Occupied", is_available = 0 WHERE id = ?', [room_id]);
        }

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update booking details
app.put('/api/partners/bookings/:id', async (req, res) => {
    const { guest_name, guest_phone, check_in, check_out, total_price } = req.body;
    try {
        await pool.query(
            'UPDATE bookings SET guest_name = ?, guest_phone = ?, check_in = ?, check_out = ?, total_price = ? WHERE id = ?',
            [guest_name, guest_phone, check_in, check_out, total_price, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update booking status
app.put('/api/partners/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const [booking] = await pool.query('SELECT room_id FROM bookings WHERE id = ?', [req.params.id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const roomId = booking[0].room_id;

        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);

        // Handle room availability based on status
        if (status === 'Cancelled' || status === 'Completed') {
            await pool.query('UPDATE rooms SET status = "Available", is_available = 1 WHERE id = ?', [roomId]);
        } else if (status === 'Confirmed') {
            await pool.query('UPDATE rooms SET status = "Occupied", is_available = 0 WHERE id = ?', [roomId]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- EXISTING ROOMS API (Public) ---

// Get all rooms with location and search filtering
// Get all available rooms with filtering
app.get('/api/rooms', async (req, res) => {
    try {
        const { location, search, type, gender } = req.query;
        console.log('🔍 [ROOMS API] Incoming request:', { location, search, type, gender });

        // Build the SQL query
        let sql = `
            SELECT 
                r.*,
                p.name as owner_name,
                p.phone as owner_phone,
                p.avatar_url as owner_avatar,
                p.location as partner_location,
                p.latitude as partner_lat,
                p.longitude as partner_lng
            FROM rooms r
            LEFT JOIN partners p ON r.partner_id = p.id
            WHERE r.is_available = 1 
            AND r.status = 'Available'
            AND NOT EXISTS (
                SELECT 1 FROM bookings b 
                WHERE b.room_id = r.id 
                AND b.status = 'Confirmed'
                AND (b.check_out >= CURRENT_DATE OR b.check_out IS NULL)
            )
        `;
        const queryParams = [];

        // Location filtering - use partner's base location
        if (location && location.trim() !== '') {
            // Extract city name from university name
            let cityName = location;
            if (location.includes('University of ')) {
                cityName = location.replace('University of ', '').trim();
            }
            if (location.includes('NSBM Green University')) {
                cityName = 'Homagama';
            }

            console.log('📍 [ROOMS API] Location filter:', { input: location, cityName });
            sql += ' AND (p.location LIKE ? OR p.location LIKE ?)';
            queryParams.push(`%${location}%`, `%${cityName}%`);
        }

        // Search filtering
        if (search && search.trim() !== '') {
            sql += ' AND (r.title LIKE ? OR r.description LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Property type filtering
        if (type && type !== 'All') {
            sql += ' AND r.property_type = ?';
            queryParams.push(type);
        }

        // Gender filtering
        if (gender && gender !== 'Any') {
            sql += ' AND (r.gender_restriction = ? OR r.gender_restriction = "Any")';
            queryParams.push(gender);
        }

        sql += ' ORDER BY r.id DESC';

        console.log('🔧 [ROOMS API] Query params:', queryParams);

        const [rooms] = await pool.query(sql, queryParams);

        console.log(`✅ [ROOMS API] Found ${rooms.length} rooms`);
        if (rooms.length > 0) {
            console.log('📦 [ROOMS API] First room:', {
                id: rooms[0].id,
                title: rooms[0].title,
                partner_location: rooms[0].partner_location
            });
        }

        res.json(rooms);
    } catch (error) {
        console.error('❌ [ROOMS API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price } = req.body;

        if (!partner_id || !room_id || !guest_name || !guest_phone || !check_in) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.query(`
            INSERT INTO bookings (partner_id, room_id, guest_name, guest_phone, check_in, check_out, total_price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [partner_id, room_id, guest_name, guest_phone, check_in, check_out || null, total_price || 0]);

        res.status(201).json({ message: 'Booking created successfully', bookingId: result.insertId });
    } catch (error) {
        console.error('❌ [BOOKING API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user bookings by phone
app.get('/api/bookings/user/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        // Join with rooms and partners to get full details
        const sql = `
            SELECT 
                b.*,
                r.title as room_title,
                r.images as room_images,
                r.location_name as room_location,
                COALESCE(b.total_price, r.price_per_month) as total_price,
                p.name as partner_name,
                p.phone as partner_phone
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN partners p ON b.partner_id = p.id
            WHERE b.guest_phone = ?
            ORDER BY b.created_at DESC
        `;

        const [bookings] = await pool.query(sql, [phone]);
        res.json(bookings);
    } catch (error) {
        console.error('❌ [BOOKING HISTORY API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get restaurant orders for partner
app.get('/api/partners/orders/:partnerId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.user_type, u.location_name as user_default_location
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.partner_id = ? AND o.service_type = 'Food'
            ORDER BY o.created_at DESC
        `, [req.params.partnerId]);

        // For each order, get items
        const ordersWithItems = await Promise.all(rows.map(async (order) => {
            const [items] = await pool.query(`
                SELECT oi.*, mi.name, mi.image_url
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
            `, [order.id]);
            return { ...order, items };
        }));

        res.json(ordersWithItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    console.log(`Updating order ${req.params.id} status to: ${status}`);
    try {
        const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Menu Item CRUD
app.post('/api/restaurants/menu', async (req, res) => {
    const { restaurant_id, name, description, price, category, image_url } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [restaurant_id, name, description, price, category, image_url]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/menu_items/:id', async (req, res) => {
    const { name, description, price, category, image_url } = req.body;
    try {
        await pool.query(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?',
            [name, description, price, category, image_url, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/menu_items/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Menu Image Upload
app.post('/api/upload/menu-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

app.get('/api/food-categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM food_categories ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROOT & STATIC ---
app.get('/', (req, res) => {
    res.send('JUNG Super App Backend API - Online');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
