/**
 * MongoDB Shell Script: Image Migration Helper
 * 
 * This script provides MongoDB commands and queries to help with image migration.
 * Note: Cloudinary uploads still require Node.js, but these commands help identify
 * and prepare data for migration.
 * 
 * Usage:
 *   mongosh <connection_string> < migrateImagesToCloudinary.mongodb.js
 *   OR
 *   mongosh "mongodb://localhost:27017/your_database" --file migrateImagesToCloudinary.mongodb.js
 * 
 * Or run commands individually in mongosh:
 *   mongosh "mongodb://localhost:27017/your_database"
 *   > load('scripts/migrateImagesToCloudinary.mongodb.js')
 */

// Switch to your database (adjust as needed)
// use your_database_name;

print('\n🔍 IMAGE MIGRATION ANALYSIS\n');
print('='.repeat(60));

// ============================================
// 1. ANALYZE PRODUCTS THAT NEED MIGRATION
// ============================================
print('\n📦 Analyzing Products...\n');

const productsNeedingMigration = db.products.find({
  $or: [
    // Products with string images (old format)
    { "images": { $type: "array", $elemMatch: { $type: "string" } } },
    // Products with mixed formats
    { "images": { $exists: true, $ne: [] } }
  ]
}).toArray();

print(`Found ${productsNeedingMigration.length} products that may need migration`);

// Count by image format
const productsWithStringImages = db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $type: "string" } }
});

const productsWithObjectImages = db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $type: "object" } }
});

const productsWithBase64 = db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $regex: /^data:image\// } }
});

const productsWithCloudinary = db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $regex: /res\.cloudinary\.com/ } }
});

print(`  - Products with string images: ${productsWithStringImages}`);
print(`  - Products with object images: ${productsWithObjectImages}`);
print(`  - Products with base64 images: ${productsWithBase64}`);
print(`  - Products with Cloudinary URLs: ${productsWithCloudinary}`);

// ============================================
// 2. ANALYZE BRANDS THAT NEED MIGRATION
// ============================================
print('\n🏢 Analyzing Brands...\n');

const brandsNeedingMigration = db.brands.find({
  $or: [
    // Brands with string logo_url (old format)
    { "logo_url": { $type: "string" } },
    // Brands with invalid object structure
    { 
      "logo_url": { $type: "object" },
      $or: [
        { "logo_url.publicId": { $exists: false } },
        { "logo_url.imageUrl": { $exists: false } }
      ]
    }
  ]
}).toArray();

print(`Found ${brandsNeedingMigration.length} brands that may need migration`);

const brandsWithStringLogo = db.brands.countDocuments({
  "logo_url": { $type: "string" }
});

const brandsWithObjectLogo = db.brands.countDocuments({
  "logo_url": { $type: "object" }
});

const brandsWithBase64Logo = db.brands.countDocuments({
  "logo_url": { $regex: /^data:image\// }
});

const brandsWithCloudinaryLogo = db.brands.countDocuments({
  "logo_url": { $regex: /res\.cloudinary\.com/ }
});

print(`  - Brands with string logo: ${brandsWithStringLogo}`);
print(`  - Brands with object logo: ${brandsWithObjectLogo}`);
print(`  - Brands with base64 logo: ${brandsWithBase64Logo}`);
print(`  - Brands with Cloudinary logo: ${brandsWithCloudinaryLogo}`);

// ============================================
// 3. SAMPLE DATA TO MIGRATE
// ============================================
print('\n📋 Sample Products Needing Migration:\n');
db.products.find({
  "images": { $type: "array", $elemMatch: { $type: "string" } }
}).limit(3).forEach(product => {
  print(`  - ${product.name} (${product._id})`);
  print(`    Images: ${product.images.length} (format: ${typeof product.images[0]})`);
  if (product.images[0]) {
    const firstImage = product.images[0];
    if (typeof firstImage === 'string') {
      if (firstImage.startsWith('data:')) {
        print(`    Type: Base64 (${firstImage.substring(0, 30)}...)`);
      } else if (firstImage.includes('cloudinary.com')) {
        print(`    Type: Cloudinary URL`);
      } else {
        print(`    Type: External URL`);
      }
    }
  }
});

print('\n📋 Sample Brands Needing Migration:\n');
db.brands.find({
  "logo_url": { $type: "string" }
}).limit(3).forEach(brand => {
  print(`  - ${brand.name} (${brand._id})`);
  if (brand.logo_url) {
    if (brand.logo_url.startsWith('data:')) {
      print(`    Logo: Base64 (${brand.logo_url.substring(0, 30)}...)`);
    } else if (brand.logo_url.includes('cloudinary.com')) {
      print(`    Logo: Cloudinary URL`);
    } else {
      print(`    Logo: External URL`);
    }
  }
});

// ============================================
// 4. MIGRATION COMMANDS (Manual Execution)
// ============================================
print('\n' + '='.repeat(60));
print('📝 MIGRATION COMMANDS');
print('='.repeat(60));
print('\n⚠️  WARNING: These commands only update the structure.');
print('⚠️  Cloudinary uploads must be done via Node.js script.\n');

print('To migrate, use the Node.js script:');
print('  npm run migrate:images\n');

print('Or run individual MongoDB updates (after Cloudinary upload):');
print('\n// Example: Update a product with migrated images');
print('db.products.updateOne(');
print('  { _id: ObjectId("...") },');
print('  { $set: { images: [');
print('    { publicId: "products/image123", imageUrl: "https://res.cloudinary.com/..." },');
print('    { publicId: "products/image456", imageUrl: "https://res.cloudinary.com/..." }');
print('  ]} }');
print(');\n');

print('// Example: Update a brand with migrated logo');
print('db.brands.updateOne(');
print('  { _id: ObjectId("...") },');
print('  { $set: { logo_url: {');
print('    publicId: "brands/logo123",');
print('    imageUrl: "https://res.cloudinary.com/..."');
print('  }} }');
print(');\n');

// ============================================
// 5. HELPER QUERIES
// ============================================
print('='.repeat(60));
print('🔧 HELPER QUERIES');
print('='.repeat(60));

print('\n// Find all products with base64 images');
print('db.products.find({ "images": { $regex: /^data:image\\// } });\n');

print('// Find all brands with base64 logos');
print('db.brands.find({ "logo_url": { $regex: /^data:image\\// } });\n');

print('// Count products by image count');
print('db.products.aggregate([');
print('  { $project: { name: 1, imageCount: { $size: "$images" } } },');
print('  { $group: { _id: "$imageCount", count: { $sum: 1 } } },');
print('  { $sort: { _id: 1 } }');
print(']);\n');

print('// Find products with Cloudinary URLs (already migrated)');
print('db.products.find({ "images.imageUrl": { $regex: /res\\.cloudinary\\.com/ } });\n');

print('// Find brands with Cloudinary logos (already migrated)');
print('db.brands.find({ "logo_url.imageUrl": { $regex: /res\\.cloudinary\\.com/ } });\n');

print('='.repeat(60));
print('✅ Analysis complete!');
print('='.repeat(60) + '\n');


