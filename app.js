const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS
const app = express(); // Inisialisasi app harus di bagian atas

// Middleware untuk memparsing body dalam format JSON
app.use(cors()); // Tambahkan CORS untuk mengizinkan permintaan dari frontend
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mengimpor controller
const authController = require('./authController');
app.use('/auth', authController);

const menuController = require('./menuController');
app.use('/menu', menuController);

// Menyajikan folder uploads sebagai folder statis
app.use('/uploads', express.static('uploads'));

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
