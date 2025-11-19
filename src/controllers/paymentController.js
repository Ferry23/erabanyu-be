// src/controllers/paymentController.js

/**
 * Fungsi untuk memulai proses pembayaran.
 * Ini adalah placeholder, logika integrasi payment gateway akan diletakkan di sini.
 * Contoh: Memanggil API Midtrans untuk mendapatkan transaction token.
 */
const initiatePayment = async (req, res) => {
    // Logika sebenarnya:
    // 1. Dapatkan order_id dari req.body.
    // 2. Ambil detail pesanan (total_amount, items, etc.) dari database.
    // 3. Panggil API Payment Gateway (misal, Midtrans.createTransaction).
    // 4. Kirim kembali transaction_token atau payment_url ke client.

    // Placeholder Response
    res.status(200).json({
        message: 'Endpoint initiatePayment berhasil dipanggil. Siap untuk integrasi payment gateway.',
        order_id: req.body.order_id,
        transaction_token: 'DUMMY-TRANSACTION-TOKEN-12345'
    });
};

/**
 * Fungsi untuk menangani notifikasi pembayaran dari Payment Gateway (Webhook).
 * Ini sangat penting karena digunakan oleh gateway untuk memberitahu server tentang status pembayaran.
 */
const handleWebhook = async (req, res) => {
    // Logika sebenarnya:
    // 1. Verifikasi signature/hash dari request (KEAMANAN KRUSIAL).
    // 2. Ambil order_id dan status pembayaran dari req.body/payload.
    // 3. Update status pesanan di database (misalnya: 'Pending' -> 'Paid').
    
    console.log('[WEBHOOK] Menerima notifikasi dari Payment Gateway.');
    
    // Gateway harus menerima respons 200 agar tidak mengirim ulang notifikasi.
    res.status(200).send('Webhook diterima dan diproses.');
};

module.exports = {
    initiatePayment,
    handleWebhook
};