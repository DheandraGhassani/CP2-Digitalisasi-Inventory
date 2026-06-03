const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads go to public/uploads (gitignored). Created on startup if missing.
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path
            .basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase();
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const fileFilter = (req, file, cb) => {
    cb(null, ALLOWED.includes(path.extname(file.originalname).toLowerCase()));
};

// Reusable upload middleware (max 5 MB). Use: upload.single('profile_photo'), etc.
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
