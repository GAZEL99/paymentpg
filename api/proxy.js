[file name]: api/proxy.js
[file content begin]
// api/proxy.js - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Inisialisasi app Express untuk Vercel
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi
const ATLANTIC_API = 'https://atlantich2h.com';
const API_KEY = 'Bt9DeRbmGa49JWOvRAOiaSzI94pU1l6aHxX9llCxpcpRtYk3kFPf3Dzlkx0p7EckHqHG65wR9kARjLWJN3SnU36ZiAK2VQemEt5';

// Helper function untuk membuat request ke Atlantic API
async function makeAtlanticRequest(endpoint, params) {
  try {
    const response = await axios.post(`${ATLANTIC_API}${endpoint}`, 
      new URLSearchParams(params),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Atlantic API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Endpoint proxy untuk create payment
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, customerId } = req.body;
    
    const data = await makeAtlanticRequest('/deposit/create', {
      reff_id: 'PAY' + Date.now() + Math.random().toString(36).substr(2, 5),
      type: 'ewallet',
      metode: 'QRISFAST',
      nominal: amount,
      api_key: API_KEY
    });
    
    res.json(data);
  } catch (error) {
    console.error('Create Payment Error:', error);
    res.status(500).json({ 
      status: false, 
      message: error.response?.data?.message || error.message || 'Internal server error'
    });
  }
});

// Endpoint proxy untuk check status
app.post('/api/check-status', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    const data = await makeAtlanticRequest('/deposit/status', {
      id: paymentId,
      api_key: API_KEY
    });
    
    res.json(data);
  } catch (error) {
    console.error('Check Status Error:', error);
    res.status(500).json({ 
      status: false, 
      message: error.response?.data?.message || error.message || 'Internal server error'
    });
  }
});

// Endpoint proxy untuk cancel payment
app.post('/api/cancel-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    const data = await makeAtlanticRequest('/deposit/cancel', {
      id: paymentId,
      api_key: API_KEY
    });
    
    res.json(data);
  } catch (error) {
    console.error('Cancel Payment Error:', error);
    res.status(500).json({ 
      status: false, 
      message: error.response?.data?.message || error.message || 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Atlantic Payment Proxy is running',
    timestamp: new Date().toISOString()
  });
});

// OPTIONS handler untuk CORS preflight
app.options('*', cors());

// Handle 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    status: false, 
    message: 'API endpoint not found' 
  });
});

// Export untuk Vercel
module.exports = app;
[file content end]
