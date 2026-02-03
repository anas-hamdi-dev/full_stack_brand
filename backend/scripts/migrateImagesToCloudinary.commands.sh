#!/bin/bash
# MongoDB Migration Commands
# 
# This script provides MongoDB shell commands for image migration analysis
# Note: Actual Cloudinary uploads require the Node.js script
#
# Usage:
#   chmod +x migrateImagesToCloudinary.commands.sh
#   ./migrateImagesToCloudinary.commands.sh

# Set your MongoDB connection string
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/brands_app}"
DB_NAME=$(echo $MONGO_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔍 MongoDB Image Migration Analysis"
echo "=================================="
echo "Database: $DB_NAME"
echo ""

# Connect and run analysis
mongosh "$MONGO_URI" --quiet <<EOF

print('\n📊 MIGRATION STATUS OVERVIEW\n');
print('='.repeat(60));

// Products Analysis
print('\n📦 PRODUCTS:');
print('  Total: ' + db.products.countDocuments({}));
print('  With string images (needs migration): ' + db.products.countDocuments({ "images": { \$type: "array", \$elemMatch: { \$type: "string" } } }));
print('  With object images (already migrated): ' + db.products.countDocuments({ "images": { \$type: "array", \$elemMatch: { \$type: "object", publicId: { \$exists: true } } } }));
print('  With base64 images: ' + db.products.countDocuments({ "images": { \$type: "array", \$elemMatch: { \$regex: /^data:image\\// } } }));
print('  With Cloudinary URLs: ' + db.products.countDocuments({ "images": { \$type: "array", \$elemMatch: { \$regex: /res\\.cloudinary\\.com/ } } }));

// Brands Analysis
print('\n🏢 BRANDS:');
print('  Total: ' + db.brands.countDocuments({}));
print('  With string logo (needs migration): ' + db.brands.countDocuments({ "logo_url": { \$type: "string" } }));
print('  With object logo (already migrated): ' + db.brands.countDocuments({ "logo_url": { \$type: "object", publicId: { \$exists: true } } }));
print('  With base64 logo: ' + db.brands.countDocuments({ "logo_url": { \$regex: /^data:image\\// } }));
print('  With Cloudinary logo: ' + db.brands.countDocuments({ "logo_url": { \$regex: /res\\.cloudinary\\.com/ } }));

print('\n' + '='.repeat(60));
print('✅ Analysis complete!');
print('='.repeat(60));
print('\n💡 To migrate images, run: npm run migrate:images\n');

EOF

