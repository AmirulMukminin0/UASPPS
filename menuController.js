const express = require('express');
const multer = require('multer');
const db = require('./db/db'); 
const path = require('path');
const router = express.Router();

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // menentukan tempat menyimpan file
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Menyimpan nama img dengan nama yang unik
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Membatasi ukuran upload img (maksimal 10Mb)
    fileFilter: function (req, file, cb) {
        // Hanya menerima file gambar (JPEG, PNG, GIF)
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed!'), false);
    }
});

// Menambahkan menu Makanan
router.post('/addMenu', upload.single('photo'), (req, res) => {
    console.log(req.body); 
    console.log(req.file);  

    const { name, description, price, category } = req.body;
    const photo = req.file ? req.file.filename : null;
    console.log('Photo filename:', photo);

    // Validasi data yang diterima
    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "Data tidak lengkap, silakan lengkapi data makanan" });
    }

    // Validasi nama menu sudah ada
    db.query('SELECT * FROM menu WHERE name = ?', [name], (err, results) => {
        if (err) {
            console.error('Database error during SELECT:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.length > 0) {
            return res.status(409).json({ message: "Nama menu sudah ada" }); // Gunakan status 409
        }

        // Simpan data ke database
        const query = 'INSERT INTO menu (name, description, price, category, photo) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [name, description, price, category, photo], (err, result) => {
            if (err) {
                console.error('Database error during INSERT:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.status(201).json({ message: "Data Daftar Menu Makanan Berhasil Disimpan" });
        });
    });
});


// Fungsi untuk mengambil data makanan dari database
const getMakananFromDatabase = () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM menu', (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };

// Endpoint untuk mengambil menu makanan
router.get('/admin/menu', async (req, res) => {
    try {
      const makanan = await getMakananFromDatabase();
      console.log(makanan);
      res.json(makanan);
    } catch (err) {
      console.error(err);
      res.status(500).send('Gagal mengambil data menu makanan.');
    }
});

router.put('/updateMenu/:id', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;
    const photo = req.file ? req.file.filename : null;

    db.query('SELECT * FROM menu WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        const fieldsToUpdate = [];
        const values = [];

        if (name) {
            fieldsToUpdate.push('name = ?');
            values.push(name);
        }
        if (description) {
            fieldsToUpdate.push('description = ?');
            values.push(description);
        }
        if (price) {
            fieldsToUpdate.push('price = ?');
            values.push(price);
        }
        if (category) {
            fieldsToUpdate.push('category = ?');
            values.push(category);
        }
        if (photo) {
            fieldsToUpdate.push('photo = ?');
            values.push(photo);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
        }

        values.push(id);

        const query = `UPDATE menu SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        db.query(query, values, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }

            db.query('SELECT * FROM menu WHERE id = ?', [id], (err, updatedResults) => {
                if (err) {
                    return res.status(500).json({ message: 'Database error', error: err });
                }
                res.status(200).json({ message: "Menu berhasil diperbarui", data: updatedResults[0] });
            });
        });
    });
});

router.delete('/deleteMenu/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM menu WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        db.query('DELETE FROM menu WHERE id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.status(200).json({ message: "Menu berhasil dihapus" });
        });
    });
});

router.get('/menu', (req, res) => {
    const { tableBarcode } = req.query;
    console.log("Barcode yang diterima:", tableBarcode); // Log barcode yang diterima

    if (!tableBarcode) {
        return res.status(400).json({ message: "Barcode tidak valid" });
    }

    db.query('SELECT * FROM tables WHERE barcode = ?', [tableBarcode], (err, tableResults) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (tableResults.length === 0) {
            return res.status(404).json({ message: "Barcode tidak dikenali" });
        }

        // Jika barcode ditemukan, log untuk memastikan query berhasil
        console.log("Barcode ditemukan:", tableResults);

        db.query('SELECT * FROM menu', (err, menuResults) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            // Log hasil menu yang ditemukan
            console.log("Menu yang ditemukan:", menuResults);
            res.json({ success: true, data: menuResults });
        });
    });
});


module.exports = router;
