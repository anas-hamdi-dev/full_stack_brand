const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary with optimizations
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Folder path (e.g., 'brands', 'products', 'profiles')
 * @param {Object} options - Additional options
 * @returns {Promise<{publicId: string, imageUrl: string}>}
 */
async function uploadImage(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      // Single optimized size: max width 1200px, auto height
      transformation: [
        {
          width: 1200,
          height: null, // auto height
          crop: 'limit', // don't crop, just limit size
          quality: 'auto', // automatic quality
          fetch_format: 'auto', // automatic format (WebP/AVIF)
        }
      ],
      // Don't keep original - only store optimized version
      overwrite: false,
      unique_filename: true,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          publicId: result.public_id,
          imageUrl: result.secure_url,
        });
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Upload multiple images
 * @param {Buffer[]} buffers - Array of image buffers
 * @param {string} folder - Folder path
 * @returns {Promise<Array<{publicId: string, imageUrl: string}>>}
 */
async function uploadMultipleImages(buffers, folder) {
  const uploadPromises = buffers.map(buffer => uploadImage(buffer, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Error deleting image ${publicId}:`, error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Delete multiple images
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<void>}
 */
async function deleteMultipleImages(publicIds) {
  const deletePromises = publicIds.map(publicId => deleteImage(publicId));
  await Promise.all(deletePromises);
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
};

