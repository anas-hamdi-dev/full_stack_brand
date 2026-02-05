# MongoDB Migration Queries

This document contains MongoDB queries to help with image migration analysis and manual updates.

## Prerequisites

Connect to your MongoDB database:
```bash
mongosh "mongodb://localhost:27017/your_database"
# OR
mongosh "mongodb+srv://username:password@cluster.mongodb.net/your_database"
```

## Analysis Queries

### 1. Count Products by Image Format

```javascript
// Products with string images (old format)
db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $type: "string" } }
});

// Products with object images (new format)
db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $type: "object" } }
});

// Products with base64 images
db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $regex: /^data:image\// } }
});

// Products with Cloudinary URLs
db.products.countDocuments({
  "images": { $type: "array", $elemMatch: { $regex: /res\.cloudinary\.com/ } }
});
```

### 2. Count Brands by Logo Format

```javascript
// Brands with string logo (old format)
db.brands.countDocuments({
  "logo_url": { $type: "string" }
});

// Brands with object logo (new format)
db.brands.countDocuments({
  "logo_url": { $type: "object" }
});

// Brands with base64 logo
db.brands.countDocuments({
  "logo_url": { $regex: /^data:image\// }
});

// Brands with Cloudinary logo
db.brands.countDocuments({
  "logo_url": { $regex: /res\.cloudinary\.com/ }
});
```

### 3. Find Products Needing Migration

```javascript
// All products with string images
db.products.find({
  "images": { $type: "array", $elemMatch: { $type: "string" } }
}).pretty();

// Products with base64 images (highest priority)
db.products.find({
  "images": { $type: "array", $elemMatch: { $regex: /^data:image\// } }
}).limit(10).pretty();
```

### 4. Find Brands Needing Migration

```javascript
// All brands with string logos
db.brands.find({
  "logo_url": { $type: "string" }
}).pretty();

// Brands with base64 logos (highest priority)
db.brands.find({
  "logo_url": { $regex: /^data:image\// }
}).limit(10).pretty();
```

## Update Commands

### ⚠️ Important Notes

- **DO NOT** run these update commands directly without uploading to Cloudinary first
- These commands assume you've already uploaded images to Cloudinary and have the `publicId` and `imageUrl`
- Use the Node.js migration script (`npm run migrate:images`) for automatic migration

### Manual Update Examples

#### Update a Single Product

```javascript
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { 
    images: [
      { 
        publicId: "products/product123_image1", 
        imageUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123/products/product123_image1.jpg" 
      },
      { 
        publicId: "products/product123_image2", 
        imageUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123/products/product123_image2.jpg" 
      }
    ]
  }}
);
```

#### Update a Single Brand

```javascript
db.brands.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { 
    logo_url: {
      publicId: "brands/brand123_logo",
      imageUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123/brands/brand123_logo.jpg"
    }
  }}
);
```

#### Bulk Update Products (After Migration)

```javascript
// Update all products that have been migrated
// This assumes you have a migration status field or can identify migrated products
db.products.updateMany(
  { 
    "images": { $type: "array", $elemMatch: { $type: "string" } },
    // Add your migration criteria here
  },
  { 
    // This would need to be done per product with actual Cloudinary URLs
    // Use the Node.js script instead
  }
);
```

## Verification Queries

### Check Migration Status

```javascript
// Products successfully migrated (have object structure)
db.products.countDocuments({
  "images": { 
    $type: "array", 
    $elemMatch: { 
      $type: "object",
      publicId: { $exists: true },
      imageUrl: { $exists: true }
    } 
  }
});

// Brands successfully migrated
db.brands.countDocuments({
  "logo_url": { 
    $type: "object",
    publicId: { $exists: true },
    imageUrl: { $exists: true }
  }
});
```

### Find Migration Issues

```javascript
// Products with invalid image structure
db.products.find({
  "images": { 
    $type: "array", 
    $elemMatch: { 
      $type: "object",
      $or: [
        { publicId: { $exists: false } },
        { imageUrl: { $exists: false } }
      ]
    } 
  }
}).pretty();

// Brands with invalid logo structure
db.brands.find({
  "logo_url": { 
    $type: "object",
    $or: [
      { publicId: { $exists: false } },
      { imageUrl: { $exists: false } }
    ]
  }
}).pretty();
```

## Statistics Aggregation

### Product Image Statistics

```javascript
db.products.aggregate([
  {
    $project: {
      name: 1,
      imageCount: { $size: { $ifNull: ["$images", []] } },
      hasStringImages: {
        $gt: [
          { $size: { 
            $filter: { 
              input: { $ifNull: ["$images", []] }, 
              as: "img", 
              cond: { $eq: [{ $type: "$$img" }, "string"] } 
            } 
          }},
          0
        ]
      },
      hasObjectImages: {
        $gt: [
          { $size: { 
            $filter: { 
              input: { $ifNull: ["$images", []] }, 
              as: "img", 
              cond: { $eq: [{ $type: "$$img" }, "object"] } 
            } 
          }},
          0
        ]
      }
    }
  },
  {
    $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      avgImagesPerProduct: { $avg: "$imageCount" },
      productsWithStringImages: { $sum: { $cond: ["$hasStringImages", 1, 0] } },
      productsWithObjectImages: { $sum: { $cond: ["$hasObjectImages", 1, 0] } }
    }
  }
]);
```

## Recommended Workflow

1. **Analyze** - Run analysis queries to see what needs migration
2. **Backup** - Create a database backup before migration
3. **Migrate** - Run the Node.js script: `npm run migrate:images`
4. **Verify** - Use verification queries to check migration status
5. **Cleanup** - (Optional) Remove old base64 data if needed

## Quick Check Script

Run this in mongosh to get a quick overview:

```javascript
print('\n📊 Migration Status Overview\n');
print('Products:');
print('  Total: ' + db.products.countDocuments({}));
print('  With string images: ' + db.products.countDocuments({ "images": { $type: "array", $elemMatch: { $type: "string" } } }));
print('  With object images: ' + db.products.countDocuments({ "images": { $type: "array", $elemMatch: { $type: "object", publicId: { $exists: true } } } }));

print('\nBrands:');
print('  Total: ' + db.brands.countDocuments({}));
print('  With string logo: ' + db.brands.countDocuments({ "logo_url": { $type: "string" } }));
print('  With object logo: ' + db.brands.countDocuments({ "logo_url": { $type: "object", publicId: { $exists: true } } }));
```











