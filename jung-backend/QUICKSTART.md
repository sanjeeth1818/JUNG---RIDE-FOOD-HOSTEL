# 🚀 JUNG Backend Quickstart Guide

Follow these 4 steps to get your backend running and connected to your app.

### 1. Prepare MySQL
1. Open your MySQL client (like phpMyAdmin or MySQL Workbench).
2. Open the file [schema.sql](file:///c:/Users/94760/Downloads/application/jung-backend/schema.sql) and run all the code inside to create the database and tables.
3. Open the file [populate_data.sql](file:///c:/Users/94760/Downloads/application/jung-backend/populate_data.sql) and run the code inside to add initial restaurants and rooms.

> **Note:** The default password for all test accounts is `password123`.


### 2. Configure Environment
1. Check the [.env](file:///c:/Users/94760/Downloads/application/jung-backend/.env) file in the `jung-backend` directory.
2. Ensure `DB_USER` and `DB_PASSWORD` match your MySQL settings (usually `root` and empty).

### 3. Start the Server
1. Open a terminal in the `jung-backend` folder.
2. Run:
   ```bash
   node server.js
   ```
3. You should see: `✅ Connected to MySQL Database`.

### 4. Connect the App
The frontend is already configured to talk to `http://localhost:5000`. Once your server is running, the **Food**, **Rooms**, and **Profile** pages will automatically start showing data from your MySQL database instead of the JSON file.

---
**Need help?**
If you see an error like `ER_ACCESS_DENIED_ERROR`, double-check your `.env` password!
