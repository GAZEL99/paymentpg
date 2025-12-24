[file name]: proxy-server.js
[file content begin]
// proxy-server.js - Untuk development lokal saja
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi
const ATLANTIC_API = 'https://atlantich2h.com';
const API_KEY = 'Bt9DeRbmGa49JWOvRAOiaSzI94pU1l6aHxX9llCxpcpRtYk3kFPf3Dzlkx0p7EckHqHG65wR9kARjLWJN3SnU36ZiAK2VQemEt5';

// Endpoint proxy untuk create payment
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount } = req.body;
        
        const response = await axios.post(`${ATLANTIC_API}/deposit/create`, 
            new URLSearchParams({
                reff_id: 'PAY' + Date.now(),
                type: 'ewallet',
                metode: 'QRISFAST',
                nominal: amount,
                api_key: API_KEY
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint proxy untuk check status
app.post('/api/check-status', async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        const response = await axios.post(`${ATLANTIC_API}/deposit/status`,
            new URLSearchParams({
                id: paymentId,
                api_key: API_KEY
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint proxy untuk cancel payment
app.post('/api/cancel-payment', async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        const response = await axios.post(`${ATLANTIC_API}/deposit/cancel`,
            new URLSearchParams({
                id: paymentId,
                api_key: API_KEY
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Atlantic Payment Proxy is running locally',
        timestamp: new Date().toISOString()
    });
});

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server untuk development lokal
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Development server running on http://localhost:${PORT}`);
    console.log(`📁 Payment gateway: http://localhost:${PORT}/`);
});
[file content end]