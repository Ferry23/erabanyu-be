// src/middleware/errorMiddleware.js

/**
 * Middleware penanganan error global.
 * Fungsi ini harus memiliki 4 parameter (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => {
    // Tentukan status code. Default 500 (Internal Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode);

    // Kirim respons JSON
    res.json({
        message: err.message,
        // Di lingkungan Development, kirim stack trace untuk debugging
        // Di lingkungan Production, pastikan stack: process.env.NODE_ENV === 'production' ? null : err.stack
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
        detail: err.detail || null // Untuk detail error Postgres jika ada
    });

    // Logging di konsol server
    console.error(`[GLOBAL ERROR] Status ${statusCode}: ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }
};

module.exports = {
    errorHandler
};