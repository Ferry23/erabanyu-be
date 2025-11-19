// src/controllers/authController.js

const db = require('../config/db');
const bcrypt = require('bcrypt'); // Untuk membandingkan hash password
const jwt = require('jsonwebtoken'); // Untuk membuat token
// Memuat JWT_SECRET dari .env. Pastikan path relatifnya benar.
require('dotenv').config({ path: '../.env' }); 

// Fungsi untuk menangani proses login
const login = async (req, res) => {
    // Ambil email dan password dari body request (format JSON)
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password harus diisi.' });
    }

    try {
        // 1. Cari user di Database berdasarkan email
        const userResult = await db.query(
            'SELECT id, password_hash, role FROM users WHERE email = $1', 
            [email]
        );

        // Jika user tidak ditemukan
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Kredensial tidak valid.' });
        }
        
        const user = userResult.rows[0];

        // ==========================================================
        // DEBUGGING LOGS: LIHAT APA YANG SEDANG DIBANDINGKAN BCRYPT
        // ==========================================================
        console.log('--- DEBUG BCRYPT COMPARE ---');
        console.log('Password dari Postman (mentah):', password);
        console.log('Hash dari Database (diharapkan):', user.password_hash);
        console.log('------------------------------');
        // ==========================================================
        
        // 2. Bandingkan password yang dimasukkan dengan hash di DB
        const match = await bcrypt.compare(password, user.password_hash);
        
        // Jika password tidak cocok
        if (!match) {
            // Jika match=false, server akan mencetak log di atas dan mengembalikan error ini
            return res.status(401).json({ error: 'Kredensial tidak valid.' });
        }

        // 3. Buat JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, // Kunci rahasia dari .env
            { expiresIn: '1h' } 
        );

        // 4. Kirim token ke client
        res.status(200).json({ 
            message: 'Login berhasil!', 
            token, 
            role: user.role 
        });

    } catch (err) {
        console.error('Terjadi error saat proses login:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
    }
};

module.exports = {
    login,
};