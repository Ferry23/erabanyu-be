// src/config/db.js

const { Pool } = require('pg');

// Konfigurasi koneksi dari .env
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // ==========================================================
    // PERBAIKAN PENTING: Menonaktifkan SSL agar terhubung ke localhost
    // Server PostgreSQL lokal biasanya tidak menggunakan SSL.
    // ==========================================================
    ssl: false 
});

// Listener untuk error pada koneksi pool
pool.on('error', (err, client) => {
  console.error('Error pada koneksi PostgreSQL client/pool:', err.message, err.stack);
});

// Eksport objek Pool secara keseluruhan.
// Objek ini menyediakan metode .query() untuk query sederhana,
// dan metode .connect() untuk transaksi (yang diperlukan di orderController).
module.exports = pool;