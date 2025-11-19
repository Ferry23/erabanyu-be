// server.js
const express = require('express');
const app = express();
require('dotenv').config(); 

// Import koneksi DB
const db = require('./src/config/db'); 
const { errorHandler } = require('./src/middleware/errorMiddleware'); // Import Error Handler

// Import Routes
const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes'); 
const orderRoutes = require('./src/routes/orderRoutes'); 
const paymentRoutes = require('./src/routes/paymentRoutes'); // Import Payment Routes

// Middleware
// Middleware untuk mengurai body request dari format JSON
app.use(express.json()); 

// Root Route Test
app.get('/', (req, res) => {
    res.send('PT Era Banyu Segara API is running!'); 
});

// Implementasi Routes
// Rute untuk otentikasi (login admin)
app.use('/api/auth', authRoutes); 

// Rute untuk produk (publik dan admin)
app.use('/api/products', productRoutes); 

// Rute untuk pesanan (order)
app.use('/api/orders', orderRoutes); 

// Rute untuk pembayaran (integrasi payment gateway)
app.use('/api/payment', paymentRoutes); 

// ==========================================================
// ERROR HANDLING MIDDLEWARE
// Harus diletakkan di akhir semua routes!
// Middleware ini akan menangkap semua error yang tidak tertangani
// dan mengembalikannya dalam format JSON yang bersih.
// ==========================================================
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});