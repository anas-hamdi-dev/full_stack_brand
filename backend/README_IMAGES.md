# Image Handling Documentation

## Overview

The backend supports image uploads via base64-encoded data URLs. This document explains how images are handled, validated, and stored.

## Request Size Limits

The Express server is configured to handle large request bodies:
- **JSON body limit**: 50MB (for base64-encoded images)
- **URL-encoded body limit**: 50MB

This allows for uploading multiple images or large single images without hitting "Request Entity Too Large" errors.

## Image Format Support

### Supported Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### Supported Input Types
1. **Data URLs** (base64-encoded): `data:image/png;base64,iVBORw0KGgo...`
2. **HTTP/HTTPS URLs**: `https://example.com/image.jpg`
3. **Icon Identifiers**: Legacy support for icon name strings (categories only)

## Image Validation

### Automatic Validation

All image fields are automatically validated using middleware:

1. **Brand logo_url**: Validated on POST/PATCH `/api/admin/brands`
2. **Category icon**: Validated on POST/PATCH `/api/admin/categories`
3. **Product images**: Validated on POST/PATCH `/api/admin/products`

### Validation Rules

- **Maximum size per image**: 10MB (for data URLs)
- **Format validation**: Only supported image formats allowed
- **Data URL format**: Must match `data:image/<format>;base64,<data>` pattern
- **Array validation**: Product images array validates each image individually

### Validation Errors

If validation fails, the API returns a 400 error with details:

```json
{
  "error": "Image validation failed",
  "details": [
    "logo_url: Image size (12.5MB) exceeds maximum (10MB)",
    "images[2]: Invalid data URL format"
  ]
}
```

## Image Storage

Images are currently stored as base64 data URLs directly in the database:

- **Brands**: `logo_url` field stores the data URL
- **Categories**: `icon` field stores the data URL or icon identifier
- **Products**: `images` array stores multiple data URLs

### Storage Considerations

**Current Implementation**:
- Images are stored directly in MongoDB documents
- No file system or external storage (S3, Cloudinary, etc.)
- Suitable for development and small-scale production

**Production Recommendations**:
For production with high volume, consider:
1. **External Storage**: Use cloud storage (AWS S3, Cloudinary, etc.)
2. **Image Optimization**: Compress images before storage
3. **CDN**: Serve images via CDN for better performance
4. **Storage URLs**: Store only URLs in database, not base64 data

## API Endpoints

### Brands

- `POST /api/admin/brands` - Create brand with logo_url
- `PATCH /api/admin/brands/:id` - Update brand logo_url

**Example Request**:
```json
{
  "name": "My Brand",
  "logo_url": "data:image/png;base64,iVBORw0KGgo...",
  "category_id": "...",
  ...
}
```

### Categories

- `POST /api/admin/categories` - Create category with icon
- `PATCH /api/admin/categories/:id` - Update category icon

**Example Request**:
```json
{
  "name": "Fashion",
  "icon": "data:image/png;base64,iVBORw0KGgo...",
  "description": "..."
}
```

### Products

- `POST /api/admin/products` - Create product with images array
- `PATCH /api/admin/products/:id` - Update product images

**Example Request**:
```json
{
  "name": "Product Name",
  "brand_id": "...",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  ...
}
```

## Image Size Optimization Tips

### Frontend Recommendations

1. **Compress images before upload**:
   ```javascript
   // Example: Resize image before converting to base64
   function resizeImage(file, maxWidth = 800, maxHeight = 800) {
     return new Promise((resolve) => {
       const reader = new FileReader();
       reader.onload = (e) => {
         const img = new Image();
         img.onload = () => {
           const canvas = document.createElement('canvas');
           let width = img.width;
           let height = img.height;
           
           if (width > height) {
             if (width > maxWidth) {
               height *= maxWidth / width;
               width = maxWidth;
             }
           } else {
             if (height > maxHeight) {
               width *= maxHeight / height;
               height = maxHeight;
             }
           }
           
           canvas.width = width;
           canvas.height = height;
           const ctx = canvas.getContext('2d');
           ctx.drawImage(img, 0, 0, width, height);
           resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality
         };
         img.src = e.target.result;
       };
       reader.readAsDataURL(file);
     });
   }
   ```

2. **Limit image dimensions**:
   - Logos: 800x800px max
   - Product images: 1200x1200px max
   - Icons: 256x256px max

3. **Use appropriate format**:
   - Use JPEG for photos (smaller file size)
   - Use PNG for logos/icons with transparency
   - Use WebP when browser support is available

## Troubleshooting

### "Request Entity Too Large" Error

If you still encounter this error:

1. **Check image sizes**: Ensure individual images are under 10MB
2. **Check total request size**: Ensure entire request body is under 50MB
3. **Compress images**: Reduce image dimensions or quality before upload
4. **Use URLs instead**: If images are hosted elsewhere, use HTTP/HTTPS URLs instead of data URLs

### Image Validation Errors

Common validation errors:

- **"Invalid data URL format"**: Ensure data URL starts with `data:image/`
- **"Image format not supported"**: Use JPEG, PNG, GIF, or WebP
- **"Image size exceeds maximum"**: Compress image or reduce dimensions

### Performance Issues

If database queries are slow with images:

1. **Use projections**: Exclude image fields when not needed:
   ```javascript
   Brand.find().select('-logo_url') // Exclude logo_url
   ```

2. **Pagination**: Always use pagination for lists
3. **Consider external storage**: Move images to cloud storage for better performance

## Security Considerations

1. **Size limits prevent DoS**: 10MB per image and 50MB total prevent oversized requests
2. **Format validation**: Only image formats are accepted, preventing malicious file uploads
3. **No file execution**: Base64 data URLs cannot execute code
4. **Input sanitization**: All image data is validated before storage

## Future Enhancements

Potential improvements:

1. **Image compression service**: Automatically compress uploaded images
2. **Thumbnail generation**: Generate thumbnails for faster loading
3. **External storage integration**: Support for S3, Cloudinary, etc.
4. **Image CDN**: Serve images via CDN for global performance
5. **Progressive image loading**: Support for progressive JPEG/WebP
