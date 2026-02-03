/**
 * Migration Script: Upload MongoDB Images to Cloudinary
 * 
 * This script migrates all existing images from MongoDB to Cloudinary:
 * - Product images (base64 data URLs or external URLs -> Cloudinary)
 * - Brand logos (base64 data URLs or external URLs -> Cloudinary)
 * 
 * Usage:
 *   node scripts/migrateImagesToCloudinary.js
 * 
 * Environment Variables Required:
 *   - MONGODB_URI
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const { uploadImage } = require('../utils/cloudinary');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Statistics
const stats = {
  products: {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
    imagesUploaded: 0
  },
  brands: {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
    logosUploaded: 0
  }
};

/**
 * Download image from URL and return buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Convert base64 data URL to buffer
 */
function base64ToBuffer(dataUrl) {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }
  return Buffer.from(matches[2], 'base64');
}

/**
 * Check if URL is already a Cloudinary URL
 */
function isCloudinaryUrl(url) {
  return typeof url === 'string' && (
    url.includes('res.cloudinary.com') || 
    url.includes('cloudinary.com')
  );
}

/**
 * Extract publicId from Cloudinary URL
 */
function extractCloudinaryPublicId(url) {
  if (!isCloudinaryUrl(url)) return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{folder}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
    const match = url.match(/\/upload\/(?:[^\/]+\/)*([^\/]+(?:\/[^\/]+)*)\.(jpg|jpeg|png|webp|gif|avif)/i);
    if (match) {
      // Return the full path including folder if present
      return match[1];
    }
  } catch (error) {
    console.error('Error extracting Cloudinary publicId:', error);
  }
  return null;
}

/**
 * Process a single image (base64, URL, or already Cloudinary)
 */
async function processImage(imageData, folder, imageType = 'image') {
  try {
    // Handle already processed images (new structure)
    if (typeof imageData === 'object' && imageData.publicId && imageData.imageUrl) {
      return imageData; // Already migrated
    }

    // Handle string URLs
    if (typeof imageData === 'string') {
      // Check if already Cloudinary URL
      if (isCloudinaryUrl(imageData)) {
        const publicId = extractCloudinaryPublicId(imageData);
        if (publicId) {
          // Return the Cloudinary URL with extracted publicId
          // Note: publicId might include folder (e.g., "products/image123" or just "image123")
          return {
            publicId: publicId,
            imageUrl: imageData
          };
        }
        // If we can't extract publicId, re-upload to ensure proper structure
        console.warn(`  ⚠️  Could not extract publicId from Cloudinary URL, re-uploading: ${imageData.substring(0, 50)}...`);
      }

      // Handle base64 data URLs
      if (imageData.startsWith('data:image/')) {
        console.log(`  📤 Uploading base64 ${imageType}...`);
        const buffer = base64ToBuffer(imageData);
        const result = await uploadImage(buffer, folder);
        console.log(`  ✅ Uploaded: ${result.imageUrl.substring(0, 50)}...`);
        return result;
      }

      // Handle external HTTP/HTTPS URLs
      if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        console.log(`  📥 Downloading ${imageType} from URL: ${imageData.substring(0, 50)}...`);
        try {
          const buffer = await downloadImage(imageData);
          console.log(`  📤 Uploading to Cloudinary...`);
          const result = await uploadImage(buffer, folder);
          console.log(`  ✅ Uploaded: ${result.imageUrl.substring(0, 50)}...`);
          return result;
        } catch (error) {
          console.error(`  ❌ Failed to download/upload from URL: ${error.message}`);
          throw error;
        }
      }
    }

    throw new Error(`Unsupported image format: ${typeof imageData}`);
  } catch (error) {
    console.error(`  ❌ Error processing ${imageType}:`, error.message);
    throw error;
  }
}

/**
 * Migrate product images
 */
async function migrateProducts() {
  console.log('\n🔄 Starting Product Images Migration...\n');
  
  // Use raw MongoDB query to fetch all products, even if they don't match new schema
  const products = await Product.find({}).lean();
  stats.products.total = products.length;
  
  console.log(`Found ${products.length} products to process\n`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i + 1}/${products.length}] Processing product: ${product.name} (${product._id})`);
    
    try {
      // Check if images need migration
      const needsMigration = product.images && product.images.length > 0 && 
        product.images.some(img => typeof img === 'string' || !img.publicId);
      
      if (!needsMigration) {
        console.log(`  ⏭️  Already migrated, skipping...`);
        stats.products.skipped++;
        continue;
      }

      const migratedImages = [];
      
      for (let j = 0; j < product.images.length; j++) {
        const image = product.images[j];
        try {
          const processedImage = await processImage(image, 'products', `image ${j + 1}`);
          migratedImages.push(processedImage);
          stats.products.imagesUploaded++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`  ❌ Failed to process image ${j + 1}: ${error.message}`);
          // Skip this image but continue with others
        }
      }

      if (migratedImages.length > 0) {
        // Use direct MongoDB update to bypass Mongoose validation during migration
        await Product.updateOne(
          { _id: product._id },
          { $set: { images: migratedImages } }
        );
        console.log(`  ✅ Updated product with ${migratedImages.length} images`);
        stats.products.processed++;
      } else {
        console.log(`  ⚠️  No images could be migrated`);
        stats.products.errors++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing product: ${error.message}`);
      stats.products.errors++;
    }
    
    console.log(''); // Empty line for readability
  }
}

/**
 * Migrate brand logos
 */
async function migrateBrands() {
  console.log('\n🔄 Starting Brand Logos Migration...\n');
  
  // Use raw MongoDB query to fetch all brands, even if they don't match new schema
  const brands = await Brand.find({}).lean();
  stats.brands.total = brands.length;
  
  console.log(`Found ${brands.length} brands to process\n`);

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    console.log(`[${i + 1}/${brands.length}] Processing brand: ${brand.name} (${brand._id})`);
    
    try {
      // Check if logo needs migration
      const logo = brand.logo_url;
      const needsMigration = logo && (
        typeof logo === 'string' || 
        !logo.publicId || 
        !logo.imageUrl
      );
      
      if (!needsMigration) {
        console.log(`  ⏭️  Already migrated, skipping...`);
        stats.brands.skipped++;
        continue;
      }

      const processedLogo = await processImage(logo, 'brands', 'logo');
      
      if (processedLogo) {
        // Use direct MongoDB update to bypass Mongoose validation during migration
        await Brand.updateOne(
          { _id: brand._id },
          { $set: { logo_url: processedLogo } }
        );
        console.log(`  ✅ Updated brand logo`);
        stats.brands.processed++;
        stats.brands.logosUploaded++;
      } else {
        console.log(`  ⚠️  Could not process logo`);
        stats.brands.errors++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing brand: ${error.message}`);
      stats.brands.errors++;
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Print migration statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION STATISTICS');
  console.log('='.repeat(60));
  
  console.log('\n📦 Products:');
  console.log(`  Total: ${stats.products.total}`);
  console.log(`  Processed: ${stats.products.processed}`);
  console.log(`  Skipped: ${stats.products.skipped}`);
  console.log(`  Errors: ${stats.products.errors}`);
  console.log(`  Images Uploaded: ${stats.products.imagesUploaded}`);
  
  console.log('\n🏢 Brands:');
  console.log(`  Total: ${stats.brands.total}`);
  console.log(`  Processed: ${stats.brands.processed}`);
  console.log(`  Skipped: ${stats.brands.skipped}`);
  console.log(`  Errors: ${stats.brands.errors}`);
  console.log(`  Logos Uploaded: ${stats.brands.logosUploaded}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration completed!');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('🚀 Starting Image Migration to Cloudinary\n');
    console.log('='.repeat(60));
    
    // Validate environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables are not set. Please check your .env file.');
    }
    
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Run migrations
    await migrateProducts();
    await migrateBrands();
    
    // Print statistics
    printStats();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate, processImage };