const express = require('express');
const router = express.Router();
const db = require('./db/db'); // Mengimpor konfigurasi koneksi

let loginAttempts = {}; // Menyimpan jumlah percobaan login setiap admin
const MAX_ATTEMPTS = 3;

// Endpoint login menggunakan metode POST
router.post('/login', (req, res) => {
    const { username, password } = req.body; // Mengambil username dan password dari body request

    // Cek jumlah percobaan login
    if (loginAttempts[username] && loginAttempts[username] >= MAX_ATTEMPTS) {
        return res.status(403).json({ message: "Akun terkunci, coba lagi nanti" });
    }

    // Query untuk mengambil data admin berdasarkan username
    const query = 'SELECT * FROM admin WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        // Cek apakah pengguna ditemukan dan password cocok
        if (results.length > 0 && results[0].password === password) {
            loginAttempts[username] = 0; // Reset percobaan login
            return res.json({ message: "Login berhasil", access: "dashboard" });
        } else {
            // Jika login gagal
            loginAttempts[username] = (loginAttempts[username] || 0) + 1;
            if (loginAttempts[username] >= MAX_ATTEMPTS) {
                return res.status(403).json({ message: "Akun terkunci, coba lagi nanti" });
            }
            return res.status(401).json({ message: "Username atau password salah" });
        }
    });
});

// Endpoint registrasi
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // Query untuk memeriksa apakah email atau username sudah ada
    const checkQuery = 'SELECT * FROM admin WHERE email = ? OR username = ?';
    db.query(checkQuery, [email, username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email atau username sudah digunakan' });
        }

        // Query untuk menambahkan admin baru
        const insertQuery = 'INSERT INTO admin (username, email, password) VALUES (?, ?, ?)';
        db.query(insertQuery, [username, email, password], (err, result) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ 
                message: 'Registrasi berhasil, sekarang Anda bisa login', 
                adminId: result.insertId // Mengembalikan ID admin yang baru
            });
        });
    });
});

module.exports = router;
