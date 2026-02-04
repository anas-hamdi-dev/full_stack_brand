const multer = require('multer');
const { uploadImage, uploadMultipleImages } = require('../utils/cloudinary');

// Configure multer to store files in memory (no disk storage)
const storage = multer.memoryStorage();

// File filter for image validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP formats are supported.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max per file
  },
});

/**
 * Middleware to handle single image upload to Cloudinary
 * @param {string} folder - Cloudinary folder (e.g., 'brands', 'products', 'profiles')
 * @param {string} fieldName - Form field name (default: 'image')
 */
function uploadSingleImage(folder, fieldName = 'image') {
  return async (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds 2MB limit' });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }

      // If no file uploaded, continue without modification
      if (!req.file) {
        return next();
      }

      try {
        // Upload to Cloudinary
        const result = await uploadImage(req.file.buffer, folder);
        
        // Attach result to request
        req.uploadedImage = result;
        next();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    });
  };
}

/**
 * Middleware to handle multiple image uploads to Cloudinary
 * @param {string} folder - Cloudinary folder (e.g., 'brands', 'products', 'profiles')
 * @param {string} fieldName - Form field name (default: 'images')
 * @param {number} maxCount - Maximum number of files (default: 10)
 */
function uploadMultipleImagesMiddleware(folder, fieldName = 'images', maxCount = 10) {
  return async (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'One or more files exceed 2MB limit' });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: `Maximum ${maxCount} files allowed` });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }

      // If no files uploaded, continue without modification
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Upload all images to Cloudinary
        const buffers = req.files.map(file => file.buffer);
        const results = await uploadMultipleImages(buffers, folder);
        
        // Attach results to request
        req.uploadedImages = results;
        next();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload images' });
      }
    });
  };
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages: uploadMultipleImagesMiddleware,
  upload, // Export raw multer instance if needed
};



