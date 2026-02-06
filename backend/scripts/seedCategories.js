const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Category = require('../models/Category');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    await connectDB();

    // Read categories from JSON file
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

    // Clear existing categories (optional - comment out if you want to keep existing)
    // await Category.deleteMany({});
    // console.log('Cleared existing categories');

    // Insert categories
    let inserted = 0;
    let skipped = 0;

    for (const categoryData of categoriesData) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ name: categoryData.name });
        
        if (existingCategory) {
          console.log(`Category "${categoryData.name}" already exists, skipping...`);
          skipped++;
          continue;
        }

        // Create new category
        await Category.create(categoryData);
        console.log(`✓ Created category: ${categoryData.name}`);
        inserted++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Category "${categoryData.name}" already exists (duplicate key), skipping...`);
          skipped++;
        } else {
          console.error(`Error creating category "${categoryData.name}":`, error.message);
        }
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`✓ Inserted: ${inserted} categories`);
    console.log(`⊘ Skipped: ${skipped} categories (already exist)`);
    console.log(`Total: ${categoriesData.length} categories processed`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run seed function
seedCategories();



