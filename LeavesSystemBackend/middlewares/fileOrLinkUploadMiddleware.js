const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Set allowed file extensions
const allowedExtensions = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, DOCX, JPG, PNG'), false);
  }
};

// Define file size limit (e.g., 5 MB = 5 * 1024 * 1024)
const MAX_SIZE = 50 * 1024 * 1024;

// Export the configured multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

module.exports = upload.single('Attachment');
