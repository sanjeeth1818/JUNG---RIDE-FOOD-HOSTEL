const express = require('express');
const path = require('path');

const app = express();

// Test static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/test', (req, res) => {
    res.send('Server is running');
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}/uploads/menu-images/menu-1770026514124-843069942.jpg`);
});
