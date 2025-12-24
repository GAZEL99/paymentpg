// config.js - Konfigurasi API
const CONFIG = {
    // API Key Atlantic H2H - GANTI DENGAN API KEY KAMU
    api_key: 'Bt9DeRbmGa49JWOvRAOiaSzI94pXU1l6aHxX9llCxpcpRtYk3kFPf3Dzlkx0p7EckHqHG65wR9kARjLWJN3SnU36ZiAK2VQemEt5',
    
    // URL Atlantic H2H
    base_url: 'https://atlantich2h.com',
    
    // CORS Proxy - PAKAI INI UNTUK HINDARI CORS ERROR
    proxy_url: 'https://corsproxy.io/?',
    use_proxy: true
};

// Global variables
let currentPayment = null;
let pollingInterval = null;

// Helper functions
function formatRupiah(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function generateRefId() {
    return 'PAY' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function showMessage(message, type = 'error') {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="${type}">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
            ${message}
        </div>
    `;
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}

function showLoading(show, buttonId = null) {
    if (buttonId) {
        const btn = document.getElementById(buttonId);
        if (show) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            btn.disabled = true;
        } else {
            if (buttonId === 'createBtn') {
                btn.innerHTML = '<i class="fas fa-bolt"></i> Buat Pembayaran QRIS';
            } else {
                btn.innerHTML = '<i class="fas fa-search"></i> Cek Status';
            }
            btn.disabled = false;
        }
    }
}
