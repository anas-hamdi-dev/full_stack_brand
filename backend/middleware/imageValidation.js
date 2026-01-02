/**
 * Image Validation Middleware
 * Validates image data URLs and provides size estimates
 */

/**
 * Validates and sanitizes image data URLs
 * @param {string} imageData - Base64 data URL or regular URL
 * @returns {Object} Validation result with size estimate
 */
function validateImageData(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return { valid: false, error: 'Image data is required' };
  }

  // If it's a regular URL, accept it
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return { valid: true, isUrl: true, size: 0 }; // Can't determine size for URLs
  }

  // If it's a data URL, validate it
  if (imageData.startsWith('data:image/')) {
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return { valid: false, error: 'Invalid data URL format' };
    }

    const [, format, base64Data] = matches;
    
    // Validate image format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return { valid: false, error: `Image format ${format} not supported. Use: ${allowedFormats.join(', ')}` };
    }

    // Calculate approximate size in bytes (base64 is ~33% larger than binary)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    // Check size limit (10MB for data URLs)
    const maxSizeMB = 10;
    if (sizeInMB > maxSizeMB) {
      return { 
        valid: false, 
        error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)` 
      };
    }

    return { 
      valid: true, 
      isUrl: false, 
      size: sizeInMB, 
      format: format.toLowerCase() 
    };
  }

  // If it's just an icon identifier (for legacy support), accept it
  return { valid: true, isIdentifier: true, size: 0 };
}

/**
 * Middleware to validate image fields in request body
 * @param {Object} options - Configuration options
 * @param {string[]} options.fields - Array of field names to validate (e.g., ['logo_url', 'icon'])
 * @param {number} options.maxSizeMB - Maximum size per image in MB (default: 10)
 * @param {boolean} options.allowMultiple - Whether field can contain multiple images (default: false)
 */
function validateImages(options = {}) {
  const { fields = [], maxSizeMB = 10, allowMultiple = false } = options;

  return (req, res, next) => {
    try {
      const errors = [];

      for (const field of fields) {
        const value = req.body[field];

        if (!value) {
          continue; // Skip if field is not present (optional fields)
        }

        if (allowMultiple && Array.isArray(value)) {
          // Validate array of images
          value.forEach((imageData, index) => {
            const validation = validateImageData(imageData);
            if (!validation.valid) {
              errors.push(`${field}[${index}]: ${validation.error}`);
            } else if (validation.size > maxSizeMB) {
              errors.push(`${field}[${index}]: Image size (${validation.size.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`);
            }
          });
        } else if (!allowMultiple && Array.isArray(value)) {
          errors.push(`${field}: Expected single value, got array`);
        } else {
          // Validate single image
          const validation = validateImageData(value);
          if (!validation.valid) {
            errors.push(`${field}: ${validation.error}`);
          } else if (!validation.isUrl && !validation.isIdentifier && validation.size > maxSizeMB) {
            errors.push(`${field}: Image size (${validation.size.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`);
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Image validation failed', 
          details: errors 
        });
      }

      next();
    } catch (error) {
      return res.status(400).json({ 
        error: 'Image validation error', 
        message: error.message 
      });
    }
  };
}

/**
 * Middleware to validate product images array
 */
function validateProductImages(req, res, next) {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return next(); // Let model validation handle required check
    }

    const errors = [];
    const maxSizeMB = 10;

    images.forEach((imageData, index) => {
      const validation = validateImageData(imageData);
      if (!validation.valid) {
        errors.push(`images[${index}]: ${validation.error}`);
      } else if (!validation.isUrl && !validation.isIdentifier && validation.size > maxSizeMB) {
        errors.push(`images[${index}]: Image size (${validation.size.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Image validation failed', 
        details: errors 
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Image validation error', 
      message: error.message 
    });
  }
}

module.exports = {
  validateImages,
  validateProductImages,
  validateImageData
};
