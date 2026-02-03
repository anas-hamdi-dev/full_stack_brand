# Image Migration Script

This script migrates all existing images from MongoDB to Cloudinary.

## Prerequisites

1. **Cloudinary Account**: Make sure you have a Cloudinary account set up
2. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## What It Does

The migration script:
- ✅ Processes all **Product images** (converts base64 data URLs or external URLs to Cloudinary)
- ✅ Processes all **Brand logos** (converts base64 data URLs or external URLs to Cloudinary)
- ✅ Skips images that are already in Cloudinary format
- ✅ Handles errors gracefully (continues processing even if some images fail)
- ✅ Provides detailed progress reporting
- ✅ Shows statistics at the end

## Supported Image Formats

The script can migrate:
- **Base64 data URLs** (`data:image/jpeg;base64,...`)
- **External HTTP/HTTPS URLs** (downloads and uploads to Cloudinary)
- **Already Cloudinary URLs** (extracts publicId or re-uploads if needed)

## Usage

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate:images
```

### Option 2: Direct execution
```bash
cd backend
node scripts/migrateImagesToCloudinary.js
```

## What to Expect

The script will:
1. Connect to your MongoDB database
2. Find all products and brands
3. Process each image:
   - Download/convert to buffer if needed
   - Upload to Cloudinary with optimizations
   - Update the database with new structure `{ publicId, imageUrl }`
4. Show progress for each item
5. Display final statistics

### Example Output

```
🚀 Starting Image Migration to Cloudinary

============================================================
📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔄 Starting Product Images Migration...

Found 25 products to process

[1/25] Processing product: Summer Dress (507f1f77bcf86cd799439011)
  📤 Uploading base64 image 1...
  ✅ Uploaded: https://res.cloudinary.com/your-cloud/image/upload...
  ✅ Updated product with 3 images

[2/25] Processing product: Winter Jacket (507f1f77bcf86cd799439012)
  ⏭️  Already migrated, skipping...

...

📊 MIGRATION STATISTICS
============================================================

📦 Products:
  Total: 25
  Processed: 20
  Skipped: 5
  Errors: 0
  Images Uploaded: 45

🏢 Brands:
  Total: 10
  Processed: 8
  Skipped: 2
  Errors: 0
  Logos Uploaded: 8

============================================================
✅ Migration completed!
============================================================
```

## Important Notes

⚠️ **Backup First**: Always backup your database before running migrations!

⚠️ **Rate Limiting**: The script includes delays between uploads to avoid Cloudinary rate limits. Large migrations may take time.

⚠️ **Network Required**: The script needs internet access to:
- Download images from external URLs
- Upload images to Cloudinary

⚠️ **Error Handling**: If an image fails to process, the script will:
- Log the error
- Continue with the next image
- Include it in the error statistics

## Troubleshooting

### "Cloudinary environment variables are not set"
- Check your `.env` file
- Ensure variables are named correctly
- Restart your terminal/IDE after adding variables

### "Failed to download image"
- Check your internet connection
- Verify the URL is accessible
- Some URLs may require authentication (not supported)

### "MongoDB connection error"
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running
- Check network/firewall settings

### Migration is slow
- This is normal for large datasets
- The script includes delays to avoid rate limiting
- Each image upload takes 1-3 seconds

## After Migration

1. **Verify Results**: Check a few products/brands in your database to ensure images are properly migrated
2. **Test Frontend**: Make sure images display correctly in your application
3. **Monitor Cloudinary**: Check your Cloudinary dashboard for uploaded images
4. **Clean Up**: Consider removing old base64 data from your database if needed (optional)

## Rollback

If you need to rollback:
1. Restore from your database backup
2. The old image URLs should still work if they were external URLs
3. Base64 images will need to be re-uploaded if you want to use Cloudinary

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify all environment variables are set
3. Ensure Cloudinary account has sufficient quota
4. Check MongoDB connection and permissions


