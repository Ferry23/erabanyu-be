// src/controllers/productController.js

const db = require('../config/db');

// ==========================================================
// RUTE PUBLIK (READ)
// ==========================================================

// GET /api/products/
const getAllProducts = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error saat mengambil semua produk:', err);
        res.status(500).json({ error: 'Gagal mengambil data produk dari database.' });
    }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error saat mengambil produk ID ${id}:`, err);
        res.status(500).json({ error: 'Gagal mengambil data produk.' });
    }
};

// ==========================================================
// RUTE ADMIN (CREATE, UPDATE, DELETE)
// ==========================================================

// POST /api/products/
const createProduct = async (req, res) => {
    // Mengubah penamaan variabel agar sesuai dengan skema DB: stock -> stock_quantity
    const { 
        name, 
        description, 
        price, 
        stock_quantity, // <-- Diubah dari 'stock'
        image_url, 
        category,        // <-- Ditambahkan 
        is_customizable  // <-- Ditambahkan 
    } = req.body;
    
    // Validasi input minimal (name, price, stock_quantity wajib diisi)
    if (!name || price === undefined || stock_quantity === undefined) {
        return res.status(400).json({ error: 'Nama, harga, dan stock_quantity wajib diisi.' });
    }

    try {
        const query = `
            INSERT INTO products (name, description, price, stock_quantity, image_url, category, is_customizable)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        
        // Pastikan is_customizable diisi (default ke false jika tidak ada)
        const isCustomizableValue = is_customizable === undefined ? false : is_customizable;
        
        const values = [
            name, 
            description || '', 
            price, 
            stock_quantity, 
            image_url || '',
            category || null, // NULL karena category nullable
            isCustomizableValue 
        ];
        
        const result = await db.query(query, values);
        
        res.status(201).json({ 
            message: 'Produk berhasil dibuat.',
            product: result.rows[0]
        });
    } catch (err) {
        console.error('Error saat membuat produk baru:', err);
        // Log error SQL yang sebenarnya untuk debugging
        console.error('SQL Error Detail:', err.detail); 
        res.status(500).json({ error: 'Gagal membuat produk baru.' });
    }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
    const { id } = req.params;
    // Mengubah penamaan variabel agar sesuai dengan skema DB
    const { name, description, price, stock_quantity, image_url, category, is_customizable } = req.body;

    // Pastikan ada sesuatu yang diperbarui
    if (!name && !description && price === undefined && stock_quantity === undefined && !image_url && !category && is_customizable === undefined) {
        return res.status(400).json({ error: 'Setidaknya satu field harus diisi untuk pembaruan.' });
    }

    try {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
        if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description); }
        if (price !== undefined) { fields.push(`price = $${paramIndex++}`); values.push(price); }
        if (stock_quantity !== undefined) { fields.push(`stock_quantity = $${paramIndex++}`); values.push(stock_quantity); } // <-- Diubah
        if (image_url !== undefined) { fields.push(`image_url = $${paramIndex++}`); values.push(image_url); }
        if (category !== undefined) { fields.push(`category = $${paramIndex++}`); values.push(category); }                 // <-- Ditambahkan
        if (is_customizable !== undefined) { fields.push(`is_customizable = $${paramIndex++}`); values.push(is_customizable); } // <-- Ditambahkan
        
        values.push(id); 

        const query = `
            UPDATE products 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex} 
            RETURNING *;
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan atau tidak ada perubahan.' });
        }
        
        res.status(200).json({ 
            message: 'Produk berhasil diperbarui.',
            product: result.rows[0]
        });

    } catch (err) {
        console.error(`Error saat memperbarui produk ID ${id}:`, err);
        res.status(500).json({ error: 'Gagal memperbarui produk.' });
    }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }
        
        res.status(200).json({ message: 'Produk berhasil dihapus.' });
    } catch (err) {
        console.error(`Error saat menghapus produk ID ${id}:`, err);
        res.status(500).json({ error: 'Gagal menghapus produk.' });
    }
};


module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};