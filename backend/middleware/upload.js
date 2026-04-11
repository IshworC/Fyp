import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDirs = ['profiles', 'venues', 'documents'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', 'uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';

    if (file.fieldname === 'profileImage') {
      folder += 'profiles';
    } else if (file.fieldname.includes('venue')) {
      folder += 'venues';
    } else {
      folder += 'documents';
    }

    cb(null, path.join(__dirname, '..', folder));
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId_fieldname_timestamp.ext
    const uniqueSuffix = `${req.userId}_${file.fieldname}_${Date.now()}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedDocTypes = /jpeg|jpg|png|pdf/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  // Check based on field type
  if (file.fieldname === 'profileImage' || file.fieldname.includes('venue')) {
    // Images only
    if (allowedImageTypes.test(extname) && /image\/(jpeg|jpg|png)/.test(mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG images are allowed for profile and venue images'), false);
    }
  } else {
    // Documents - images and PDF
    if (allowedDocTypes.test(extname) && (/image\/(jpeg|jpg|png)/.test(mimetype) || mimetype === 'application/pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, PDF files are allowed for documents'), false);
    }
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Maximum 10 files per request
  }
});

// Upload middleware for venue registration
export const uploadRegistrationFiles = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'venueImages', maxCount: 6 },
  { name: 'citizenshipFront', maxCount: 1 },
  { name: 'citizenshipBack', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'panCard', maxCount: 1 }
]);

// Single file upload middleware
export const uploadSingleFile = (fieldName) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultipleFiles = (fieldName, maxCount) => upload.array(fieldName, maxCount);

// Error handler middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name in upload'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
};

// Helper to get file URL from request
export const getFileUrl = (req, filename, folder) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${folder}/${filename}`;
};

// Helper to delete file
export const deleteFile = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default upload;
