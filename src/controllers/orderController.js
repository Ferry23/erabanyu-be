// src/controllers/orderController.js

const db = require('../config/db');

// ==========================================================
// RUTE PELANGGAN
// ==========================================================

// POST /api/orders/
// Membutuhkan token login. Membuat pesanan baru dan mengurangi stok.
const createOrder = async (req, res) => {
    // ID pengguna berasal dari token yang divalidasi oleh authenticateToken
    const userId = req.user.id; 
    // Catatan: shipping_address harus diisi (sesuai alter table yang kita lakukan)
    const { items, shipping_address, payment_method } = req.body;

    // Validasi input
    if (!items || items.length === 0 || !shipping_address || !payment_method) {
        return res.status(400).json({ error: 'Data pesanan tidak lengkap: produk, alamat pengiriman, dan metode pembayaran wajib diisi.' });
    }

    let totalAmount = 0;
    
    // Gunakan koneksi klien tunggal untuk transaksi (penting untuk e-commerce)
    const client = await db.connect(); 

    try {
        await client.query('BEGIN'); // Mulai Transaksi

        // 1. Verifikasi Stok dan Hitung Total Harga
        for (const item of items) {
            const productQuery = 'SELECT price, stock_quantity FROM products WHERE id = $1';
            const productResult = await client.query(productQuery, [item.product_id]);

            if (productResult.rows.length === 0) {
                throw new Error(`Produk ID ${item.product_id} tidak ditemukan.`);
            }

            const product = productResult.rows[0];
            // Konversi price ke float, karena dari DB (NUMERIC) mungkin berupa string
            const unitPrice = parseFloat(product.price); 

            if (product.stock_quantity < item.quantity) {
                // Jika stok kurang, batalkan transaksi
                throw new Error(`Stok untuk produk ID ${item.product_id} (${product.stock_quantity}) tidak mencukupi untuk ${item.quantity} unit.`);
            }

            // Hitung subtotal dan tambahkan ke total pesanan
            totalAmount += unitPrice * item.quantity;
            item.unit_price = unitPrice; // Simpan harga saat ini di objek item
        }

        // 2. Buat Record di Tabel orders
        const orderQuery = `
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, order_date, status;
        `;
        // toFixed(2) memastikan total_amount sesuai dengan format DECIMAL(10, 2)
        const orderValues = [userId, totalAmount.toFixed(2), shipping_address, payment_method, 'Pending'];
        const orderResult = await client.query(orderQuery, orderValues);
        const orderId = orderResult.rows[0].id;

        // 3. Masukkan Detail ke Tabel order_items dan Kurangi Stok Produk
        for (const item of items) {
            // Insert ke order_items (menggunakan unit_price saat ini)
            const itemQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4);
            `;
            await client.query(itemQuery, [orderId, item.product_id, item.quantity, item.unit_price.toFixed(2)]);

            // Kurangi Stok Produk
            const stockUpdateQuery = `
                UPDATE products 
                SET stock_quantity = stock_quantity - $1
                WHERE id = $2;
            `;
            await client.query(stockUpdateQuery, [item.quantity, item.product_id]);
        }

        await client.query('COMMIT'); // Commit Transaksi (semua berhasil)

        res.status(201).json({ 
            message: 'Pesanan berhasil dibuat. Menunggu pembayaran.',
            order_id: orderId,
            total_amount: totalAmount.toFixed(2),
            status: orderResult.rows[0].status,
            order_date: orderResult.rows[0].order_date
        });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback jika ada error (stok tidak jadi berkurang, order tidak jadi dibuat)
        console.error('Transaksi pesanan gagal:', err.message || err);
        // Mengirimkan pesan error yang lebih spesifik kepada user (misalnya: Stok tidak mencukupi)
        res.status(500).json({ error: 'Gagal membuat pesanan.', detail: err.message });
    } finally {
        client.release(); // Lepaskan koneksi klien agar bisa digunakan oleh request lain
    }
};

// GET /api/orders/my
// Mengambil semua pesanan yang dimiliki user yang sedang login
const getOrdersByUser = async (req, res) => {
    const userId = req.user.id;
    try {
        const query = `
            SELECT id, order_date, total_amount, status, payment_method, shipping_address
            FROM orders
            WHERE user_id = $1
            ORDER BY order_date DESC;
        `;
        const result = await db.query(query, [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error saat mengambil pesanan user:', err);
        res.status(500).json({ error: 'Gagal mengambil data pesanan.' });
    }
};

// GET /api/orders/:id
// Mengambil detail pesanan (memastikan user hanya bisa melihat pesanan miliknya atau jika dia admin)
const getOrderById = async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    try {
        // Cek order header
        const checkQuery = 'SELECT user_id FROM orders WHERE id = $1';
        const checkResult = await db.query(checkQuery, [orderId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
        }

        // Jika bukan admin, pastikan ID user cocok
        if (req.user.role !== 'admin' && checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk melihat pesanan ini.' });
        }

        // Ambil data header order dan detail item
        const orderDetailsQuery = `
            SELECT 
                o.id, o.order_date, o.total_amount, o.status, o.payment_method, o.shipping_address,
                json_agg(json_build_object(
                    'product_id', oi.product_id,
                    'name', p.name,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price
                )) AS items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1
            GROUP BY o.id;
        `;

        const result = await db.query(orderDetailsQuery, [orderId]);

        if (result.rows.length === 0) {
            // Ini seharusnya tidak terjadi jika checkResult.rows.length > 0, 
            // tapi sebagai langkah pengamanan
            return res.status(404).json({ error: 'Pesanan tidak ditemukan atau tidak memiliki item.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Error saat mengambil detail pesanan:', err);
        res.status(500).json({ error: 'Gagal mengambil detail pesanan.' });
    }
};


// ==========================================================
// RUTE ADMIN
// ==========================================================

// GET /api/orders/
// Mengambil semua pesanan di sistem (Hanya Admin)
const getAllOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.id, o.order_date, o.total_amount, o.status, 
                u.email AS user_email, u.id AS user_id
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY order_date DESC;
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error saat mengambil semua pesanan:', err);
        res.status(500).json({ error: 'Gagal mengambil semua data pesanan.' });
    }
};

// PUT /api/orders/:id/status
// Memperbarui status pesanan (Hanya Admin)
const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status baru wajib diisi.' });
    }

    // Daftar status yang valid (Anda bisa menyesuaikannya)
    const validStatuses = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status tidak valid. Gunakan salah satu dari: ${validStatuses.join(', ')}` });
    }

    try {
        const query = `
            UPDATE orders
            SET status = $1
            WHERE id = $2
            RETURNING id, status, user_id;
        `;
        const result = await db.query(query, [status, orderId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
        }

        res.status(200).json({ 
            message: `Status pesanan ID ${orderId} berhasil diperbarui menjadi ${status}.`,
            order: result.rows[0]
        });

    } catch (err) {
        console.error(`Error saat memperbarui status pesanan ID ${orderId}:`, err);
        res.status(500).json({ error: 'Gagal memperbarui status pesanan.' });
    }
};


module.exports = {
    createOrder,
    getOrdersByUser,
    getOrderById,
    getAllOrders,
    updateOrderStatus
};