PT Era Banyu Segara - Backend API

Repositori ini berisi kode backend untuk proyek E-Commerce PT Era Banyu Segara, dibangun menggunakan Node.js, Express, dan PostgreSQL. API ini berfungsi sebagai otak aplikasi, menangani otentikasi, manajemen produk, transaksi pesanan, dan integrasi pembayaran.

Daftar Isi

Fitur Utama

Teknologi yang Digunakan

Instalasi dan Setup Proyek

Struktur Database

Daftar Endpoint API

1. Fitur Utama

Otentikasi & Otorisasi: Login, registrasi (diperlukan untuk user), dan otorisasi berdasarkan peran (Admin/User) menggunakan JWT.

Manajemen Produk (Admin): CRUD produk lengkap.

Transaksi Pesanan: Proses pembuatan pesanan yang aman, mencakup:

Pengurangan stok produk otomatis.

Penggunaan transaksi database (ROLLBACK jika gagal).

Payment Gateway: Struktur siap untuk integrasi dengan Midtrans/Xendit (saat ini dalam mode placeholder).

Error Handling: Middleware penanganan error global untuk respons JSON yang konsisten.

2. Teknologi yang Digunakan

Runtime: Node.js

Framework: Express.js

Database: PostgreSQL (Library: pg)

Keamanan: JWT (JSON Web Token), bcrypt untuk hashing password.

Pembayaran: midtrans-client (Sudah terinstal, namun dinonaktifkan sementara di controller).

3. Instalasi dan Setup Proyek

Ikuti langkah-langkah ini untuk menjalankan proyek secara lokal.

A. Clone Repositori

git clone [https://github.com/](https://github.com/)<username_anda>/erabanyu-be.git
cd erabanyu-be


B. Instalasi Dependencies

npm install


C. Setup Database (PostgreSQL)

Pastikan PostgreSQL sudah terinstal dan berjalan.

Buat database baru dengan nama erabanyu.

Jalankan script SQL di bawah ini untuk membuat tabel.

Script SQL (Migration Sederhana)

-- HANYA UNTUK MEMBUAT TABEL JIKA BELUM ADA

-- 1. Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'admin' atau 'user'
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Product Info
CREATE TABLE product_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    is_customizable BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- Pending, Paid, Shipped, Delivered, Cancelled
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE
);

-- 4. Tabel Order Items (Detail Pesanan)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES product_info(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);


D. Konfigurasi Environment (.env)

Buat file baru bernama .env di root proyek. Salin template ini dan isi nilainya sesuai dengan konfigurasi PostgreSQL lokal Anda.

# SERVER CONFIGURATION
PORT=3000

# POSTGRESQL DATABASE CONFIGURATION
DB_USER=postgres 
DB_HOST=localhost
DB_NAME=erabanyu
DB_PASSWORD=your_local_db_password
DB_PORT=5432 

# JWT AUTHENTICATION
JWT_SECRET=R4h4s!aP3nuhR3s1k0T0k3n_3r4Banyu5egara_2024


E. Jalankan Server

npm start
# atau
node server.js


Server akan berjalan di http://localhost:3000.

4. Struktur Database

Tabel

Deskripsi

Keterangan

users

Informasi pengguna (Admin/User).

Role Admin diperlukan untuk CRUD produk.

product_info

Detail semua produk yang dijual.

Kolom stock_quantity diupdate saat order.

orders

Header setiap transaksi.

Mencatat total harga, status, dan alamat kirim.

order_items

Detail item dalam setiap pesanan.

Menyimpan harga saat order dibuat (unit_price).

5. Daftar Endpoint API

Semua endpoint diawali dengan http://localhost:3000/api.

Route

Method

Keterangan

Otorisasi

/auth/login

POST

Login user atau admin. Mengembalikan JWT.

Publik

/products

GET

Melihat daftar semua produk.

Publik

/products

POST

Menambah produk baru.

Admin

/products/:id

PUT

Mengupdate detail produk.

Admin

/products/:id

DELETE

Menghapus produk.

Admin

/orders

POST

Membuat pesanan baru (membutuhkan product_id dan quantity).

User/Admin

/orders

GET

Melihat semua pesanan (khusus Admin).

Admin

/orders/my-orders

GET

Melihat riwayat pesanan sendiri.

User/Admin

/payment/initiate

POST

Menginisiasi pembayaran (saat ini placeholder).

User/Admin

/payment/webhook

POST

Menerima notifikasi dari Payment Gateway (misal Midtrans).

Publik (Eksternal)
