// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Pastikan JWT_SECRET dimuat. Kita asumsikan sudah dimuat di server.js
// Jika belum, Anda mungkin perlu memuatnya di sini juga.
// require('dotenv').config({ path: '../.env' }); 
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware untuk memverifikasi JWT
const authenticateToken = (req, res, next) => {
    // Ambil token dari header 'Authorization'. Formatnya: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized: Tidak ada token disediakan
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    // Verifikasi token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // 403 Forbidden: Token tidak valid atau kedaluwarsa
            return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa.' });
        }
        
        // Token valid, simpan payload user (id, role) di objek request
        req.user = user; 
        
        // Lanjutkan ke handler route berikutnya
        next();
    });
};

// Middleware untuk membatasi akses berdasarkan peran (role)
const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        // Cek apakah middleware authenticateToken sudah berjalan
        if (!req.user) {
            // Ini seharusnya tidak terjadi jika authenticateToken digunakan sebelum ini
            return res.status(500).json({ error: 'Kesalahan server: User data tidak tersedia.' });
        }

        if (req.user.role !== requiredRole) {
            // 403 Forbidden: Pengguna tidak memiliki izin yang diperlukan
            return res.status(403).json({ error: `Akses dilarang. Hanya peran '${requiredRole}' yang diizinkan.` });
        }

        // Pengguna memiliki peran yang tepat
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole,
};