// server.js - Local development server
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(__dirname));

// All routes to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log(`📁 Open in browser: http://localhost:${PORT}/index.html`);
});
