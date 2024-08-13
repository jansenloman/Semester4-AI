const multer = require("multer");
const path = require("path");

// Konfigurasi multer untuk menyimpan file ke dalam folder 'storage'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../storage"));
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime().toString() + '_' + file.originalname);
  },
});
const upload = multer({ storage: storage });
module.exports = upload;