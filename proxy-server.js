// proxy-server.js - Server Proxy untuk bypass CORS
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi
const ATLANTIC_API = 'https://atlantich2h.com';
const API_KEY = 'Bt9DeRbmGa49JWOvRAOiaSzI94pXU1l6aHxX9llCxpcpRtYk3kFPf3Dzlkx0p7EckHqHG65wR9kARjLWJN3SnU36ZiAK2VQemEt5';

// Endpoint proxy untuk create payment
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, customerId } = req.body;
        
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

// Serve static files
app.use(express.static('.'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📁 Payment gateway: http://localhost:${PORT}/index.html`);
});
