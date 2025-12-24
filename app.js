// app.js - Main application logic

// CREATE PAYMENT WITH PROXY
async function createPayment() {
    const amount = document.getElementById('amount').value;
    const customerId = document.getElementById('customerId').value || `customer-${Date.now()}`;
    const description = document.getElementById('description').value;
    
    if (!amount || amount < 500) {
        showMessage('Minimal pembayaran Rp 500!', 'error');
        return;
    }
    
    showLoading(true, 'createBtn');
    
    try {
        const refId = generateRefId();
        
        const formData = new URLSearchParams();
        formData.append('reff_id', refId);
        formData.append('type', 'ewallet');
        formData.append('metode', 'QRISFAST');
        formData.append('nominal', amount);
        formData.append('api_key', CONFIG.api_key);
        
        // Use proxy to avoid CORS
        const proxyUrl = CONFIG.use_proxy ? 
            CONFIG.proxy_url + encodeURIComponent(CONFIG.base_url + '/deposit/create') : 
            CONFIG.base_url + '/deposit/create';
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === true) {
            currentPayment = {
                refId: data.data.reff_id,
                payId: data.data.id,
                amount: data.data.nominal,
                fee: data.data.fee || 0,
                total: data.data.get_balance,
                qrString: data.data.qr_string,
                createdAt: data.data.created_at,
                customerId: customerId,
                description: description
            };
            
            showQRCode();
            startPollingStatus(data.data.id);
            showMessage('Pembayaran berhasil dibuat! Scan QR code untuk melanjutkan.', 'success');
        } else {
            showMessage(data.message || 'Gagal membuat pembayaran', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    } finally {
        showLoading(false, 'createBtn');
    }
}

// SHOW QR CODE
function showQRCode() {
    if (!currentPayment) return;
    
    document.getElementById('qrCode').innerHTML = '';
    
    new QRCode(document.getElementById('qrCode'), {
        text: currentPayment.qrString,
        width: 250,
        height: 250,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('paymentDetails').innerHTML = `
        <p><strong>ID Referensi:</strong> ${currentPayment.refId}</p>
        <p><strong>Jumlah:</strong> ${formatRupiah(currentPayment.amount)}</p>
        <p><strong>Biaya:</strong> ${formatRupiah(currentPayment.fee)}</p>
        <p><strong>Diterima:</strong> ${formatRupiah(currentPayment.total)}</p>
        <p><strong>Status:</strong> <span class="status-badge status-pending">MENUNGGU</span></p>
        <p><strong>Kadaluarsa:</strong> 5 menit lagi</p>
        <p><strong>Deskripsi:</strong> ${currentPayment.description}</p>
    `;
    
    document.getElementById('qrModal').style.display = 'flex';
}

// CLOSE MODAL
function closeModal() {
    document.getElementById('qrModal').style.display = 'none';
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// COPY QR
function copyQR() {
    if (!currentPayment || !currentPayment.qrString) {
        alert('Tidak ada QR code untuk disalin!');
        return;
    }
    
    navigator.clipboard.writeText(currentPayment.qrString)
        .then(() => alert('QR string berhasil disalin!'))
        .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = currentPayment.qrString;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('QR string berhasil disalin!');
        });
}

// CHECK PAYMENT STATUS
async function checkPaymentStatus() {
    const paymentId = document.getElementById('paymentId').value.trim();
    
    if (!paymentId) {
        showMessage('Masukkan ID Pembayaran!', 'error');
        return;
    }
    
    showLoading(true, 'checkBtn');
    
    try {
        const result = await fetchPaymentStatus(paymentId);
        
        if (result.success) {
            showStatusResult(result.data);
        } else {
            showMessage(result.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    } finally {
        showLoading(false, 'checkBtn');
    }
}

// FETCH PAYMENT STATUS
async function fetchPaymentStatus(paymentId) {
    const formData = new URLSearchParams();
    formData.append('id', paymentId);
    formData.append('api_key', CONFIG.api_key);
    
    const proxyUrl = CONFIG.use_proxy ? 
        CONFIG.proxy_url + encodeURIComponent(CONFIG.base_url + '/deposit/status') : 
        CONFIG.base_url + '/deposit/status';
    
    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (data.status === true) {
        return {
            success: true,
            data: {
                refId: data.data.reff_id,
                status: data.data.status,
                amount: data.data.nominal,
                received: data.data.get_balance,
                fee: data.data.fee || 0,
                createdAt: data.data.created_at
            }
        };
    } else {
        return {
            success: false,
            error: data.message
        };
    }
}

// SHOW STATUS RESULT
function showStatusResult(statusData) {
    let statusClass = 'status-pending';
    let statusIcon = '⏳';
    
    switch(statusData.status) {
        case 'success':
            statusClass = 'status-success';
            statusIcon = '✅';
            break;
        case 'failed':
            statusClass = 'status-failed';
            statusIcon = '❌';
            break;
        case 'cancel':
            statusClass = 'status-failed';
            statusIcon = '🚫';
            break;
    }
    
    const resultHTML = `
        <div class="status-result">
            <h3>${statusIcon} Status Pembayaran</h3>
            <div class="payment-details">
                <p><strong>ID:</strong> ${statusData.refId}</p>
                <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusData.status.toUpperCase()}</span></p>
                <p><strong>Jumlah:</strong> ${formatRupiah(statusData.amount)}</p>
                <p><strong>Diterima:</strong> ${formatRupiah(statusData.received)}</p>
                <p><strong>Biaya:</strong> ${formatRupiah(statusData.fee)}</p>
                <p><strong>Waktu:</strong> ${statusData.createdAt}</p>
            </div>
        </div>
    `;
    
    document.getElementById('qrCode').innerHTML = resultHTML;
    document.getElementById('paymentDetails').innerHTML = '';
    document.getElementById('qrModal').style.display = 'flex';
}

// START POLLING STATUS
function startPollingStatus(paymentId) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    let attempts = 0;
    const maxAttempts = 60;
    
    pollingInterval = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
            clearInterval(pollingInterval);
            showMessage('Pembayaran kadaluarsa!', 'error');
            updatePaymentStatus('expired');
            return;
        }
        
        try {
            const result = await fetchPaymentStatus(paymentId);
            
            if (result.success) {
                const status = result.data.status;
                
                if (status === 'success') {
                    clearInterval(pollingInterval);
                    showMessage('🎉 Pembayaran berhasil!', 'success');
                    updatePaymentStatus('success', result.data);
                } else if (status === 'failed' || status === 'cancel') {
                    clearInterval(pollingInterval);
                    showMessage(`Pembayaran ${status}`, 'error');
                    updatePaymentStatus(status, result.data);
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000);
}

// UPDATE PAYMENT STATUS
function updatePaymentStatus(status, data = null) {
    const statusElement = document.querySelector('.status-badge');
    if (!statusElement) return;
    
    statusElement.classList.remove('status-pending', 'status-success', 'status-failed');
    
    switch(status) {
        case 'success':
            statusElement.textContent = 'BERHASIL';
            statusElement.classList.add('status-success');
            if (data) {
                const details = document.getElementById('paymentDetails');
                details.innerHTML += `
                    <p><strong>Dibayar:</strong> ${formatRupiah(data.received)}</p>
                    <p><strong>Waktu sukses:</strong> ${new Date().toLocaleString()}</p>
                `;
            }
            break;
            
        case 'failed':
            statusElement.textContent = 'GAGAL';
            statusElement.classList.add('status-failed');
            break;
            
        case 'cancel':
            statusElement.textContent = 'DIBATALKAN';
            statusElement.classList.add('status-failed');
            break;
            
        case 'expired':
            statusElement.textContent = 'KADALUARSA';
            statusElement.classList.add('status-failed');
            break;
    }
}

// CHECK CURRENT STATUS
async function checkCurrentStatus() {
    if (!currentPayment) {
        showMessage('Tidak ada pembayaran aktif', 'error');
        return;
    }
    
    try {
        const result = await fetchPaymentStatus(currentPayment.payId);
        
        if (result.success) {
            updatePaymentStatus(result.data.status, result.data);
            
            if (result.data.status === 'success') {
                showMessage('Pembayaran sudah berhasil!', 'success');
            }
        } else {
            showMessage(result.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// CANCEL PAYMENT
async function cancelPayment() {
    if (!currentPayment || !confirm('Batalkan pembayaran ini?')) {
        return;
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append('id', currentPayment.payId);
        formData.append('api_key', CONFIG.api_key);
        
        const proxyUrl = CONFIG.use_proxy ? 
            CONFIG.proxy_url + encodeURIComponent(CONFIG.base_url + '/deposit/cancel') : 
            CONFIG.base_url + '/deposit/cancel';
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === true) {
            showMessage('Pembayaran berhasil dibatalkan', 'success');
            updatePaymentStatus('cancel');
            closeModal();
        } else {
            showMessage(data.message || 'Gagal membatalkan', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// EVENT LISTENERS
window.onclick = function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target === modal) {
        closeModal();
    }
}

document.getElementById('amount').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') createPayment();
});

document.getElementById('paymentId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkPaymentStatus();
});
