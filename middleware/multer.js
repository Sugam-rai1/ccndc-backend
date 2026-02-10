import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define allowed image types
const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log(`🖼️ Incoming file type: ${file.mimetype}`);
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`❌ Rejected file type: ${file.mimetype}`);
    cb(new Error('Only .jpg, .jpeg, and .png image formats are allowed.'));
  }
};

// Multer middleware instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size: 10MB
  },
  fileFilter,
});

export default upload;
