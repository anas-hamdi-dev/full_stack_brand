// Static data for the admin panel
export interface StaticCategory {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  brand_count: number | null;
  created_at: string;
}

export interface StaticBrand {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  phone: string | null;
  email: string | null;
  is_featured: boolean;
  status: "pending" | "approved" | "banned";
  created_at: string;
  updated_at: string;
}

export interface StaticProduct {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string[];
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaticBrandSubmission {
  id: string;
  brand_name: string;
  category: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  instagram: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface StaticContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
}

// Static Categories
export const staticCategories: StaticCategory[] = [
  {
    id: "1",
    name: "Fashion",
    icon: "Shirt",
    description: "Clothing and fashion accessories",
    brand_count: 25,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Footwear",
    icon: "Footprints",
    description: "Shoes and footwear",
    brand_count: 12,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Accessories",
    icon: "Watch",
    description: "Jewelry, watches, and accessories",
    brand_count: 18,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Luxury",
    icon: "Gem",
    description: "High-end luxury brands",
    brand_count: 8,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Beauty",
    icon: "Scissors",
    description: "Beauty and cosmetics",
    brand_count: 15,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Kids",
    icon: "Baby",
    description: "Children's fashion",
    brand_count: 10,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Trending",
    icon: "Flame",
    description: "Trending fashion brands",
    brand_count: 20,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Premium",
    icon: "Star",
    description: "Premium fashion brands",
    brand_count: 14,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// Static Brands
export const staticBrands: StaticBrand[] = [
  {
    id: "1",
    name: "Tunisian Fashion House",
    category_id: "1",
    description: "Premium Tunisian fashion brand offering elegant and modern designs",
    logo_url: "https://images.unsplash.com/photo-1594938291221-94f18e0e0133?w=200",
    location: "Tunis, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/tunisianfashion",
    facebook: "https://facebook.com/tunisianfashion",
    phone: "+216 12 345 678",
    email: "contact@tunisianfashion.tn",
    is_featured: true,
    status: "approved",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Mediterranean Style",
    category_id: "1",
    description: "Contemporary fashion inspired by Mediterranean culture",
    logo_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
    location: "Sfax, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/mediterraneanstyle",
    facebook: null,
    phone: "+216 23 456 789",
    email: "info@mediterraneanstyle.tn",
    is_featured: true,
    status: "approved",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "3",
    name: "Desert Elegance",
    category_id: "4",
    description: "Luxury fashion brand with elegant designs",
    logo_url: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=200",
    location: "Djerba, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/desertelegance",
    facebook: null,
    phone: null,
    email: null,
    is_featured: true,
    status: "approved",
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "4",
    name: "Coastal Wear",
    category_id: "2",
    description: "Comfortable and stylish footwear for everyday wear",
    logo_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200",
    location: "Hammamet, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/coastalwear",
    facebook: null,
    phone: "+216 34 567 890",
    email: "hello@coastalwear.tn",
    is_featured: false,
    status: "pending",
    created_at: "2024-02-10T10:00:00Z",
    updated_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "5",
    name: "Artisan Accessories",
    category_id: "3",
    description: "Handcrafted jewelry and accessories",
    logo_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200",
    location: "Kairouan, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/artisanaccessories",
    facebook: null,
    phone: null,
    email: null,
    is_featured: true,
    status: "approved",
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-02-15T10:00:00Z",
  },
  {
    id: "6",
    name: "Urban Street",
    category_id: "7",
    description: "Streetwear and urban fashion",
    logo_url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200",
    location: "Ariana, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/urbanstreet",
    facebook: null,
    phone: null,
    email: null,
    is_featured: true,
    status: "banned",
    created_at: "2024-02-20T10:00:00Z",
    updated_at: "2024-02-20T10:00:00Z",
  },
  {
    id: "7",
    name: "Heritage Collection",
    category_id: "1",
    description: "Traditional Tunisian designs with modern twist",
    logo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    location: "Sousse, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/heritagecollection",
    facebook: null,
    phone: "+216 45 678 901",
    email: "info@heritagecollection.tn",
    is_featured: false,
    status: "pending",
    created_at: "2024-03-01T10:00:00Z",
    updated_at: "2024-03-01T10:00:00Z",
  },
  {
    id: "8",
    name: "Beauty Essentials",
    category_id: "5",
    description: "Natural beauty and skincare products",
    logo_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
    location: "Bizerte, Tunisia",
    website: "https://example.com",
    instagram: "https://instagram.com/beautyessentials",
    facebook: null,
    phone: null,
    email: null,
    is_featured: false,
    status: "approved",
    created_at: "2024-03-05T10:00:00Z",
    updated_at: "2024-03-05T10:00:00Z",
  },
];

// Static Products (cleaned up duplicates)
export const staticProducts: StaticProduct[] = [
  {
    id: "1",
    brand_id: "1",
    name: "Elegant Summer Dress",
    description: "Beautiful summer dress perfect for any occasion",
    price: 299.99,
    images: ["https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600"],
    external_url: "https://example.com/product/1",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "2",
    brand_id: "4",
    name: "Classic Leather Shoes",
    description: "Premium quality leather shoes",
    price: 450.00,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600"],
    external_url: "https://example.com/product/2",
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-02-15T10:00:00Z",
  },
  {
    id: "3",
    brand_id: "5",
    name: "Silver Pendant Necklace",
    description: "Handcrafted silver pendant necklace",
    price: 150.00,
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"],
    external_url: "https://example.com/product/3",
    created_at: "2024-02-20T10:00:00Z",
    updated_at: "2024-02-20T10:00:00Z",
  },
  {
    id: "4",
    brand_id: "6",
    name: "Street Style Jacket",
    description: "Trendy street style jacket",
    price: 320.00,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"],
    external_url: "https://example.com/product/4",
    created_at: "2024-02-25T10:00:00Z",
    updated_at: "2024-02-25T10:00:00Z",
  },
  {
    id: "5",
    brand_id: "7",
    name: "Traditional Embroidered Top",
    description: "Beautiful traditional embroidery with modern design",
    price: 180.00,
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600"],
    external_url: "https://example.com/product/5",
    created_at: "2024-03-05T10:00:00Z",
    updated_at: "2024-03-05T10:00:00Z",
  },
  {
    id: "6",
    brand_id: "3",
    name: "Luxury Evening Gown",
    description: "Elegant evening gown for special occasions",
    price: 850.00,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"],
    external_url: "https://example.com/product/6",
    created_at: "2024-03-10T10:00:00Z",
    updated_at: "2024-03-10T10:00:00Z",
  },
];

// Static Brand Submissions
export const staticBrandSubmissions: StaticBrandSubmission[] = [
  {
    id: "1",
    brand_name: "New Fashion Brand",
    category: "Fashion",
    description: "A new fashion brand looking to join the directory",
    contact_email: "contact@newfashion.tn",
    contact_phone: "+216 12 345 678",
    website: "https://example.com",
    instagram: "@newfashion",
    status: "pending",
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    brand_name: "Eco Fashion",
    category: "Fashion",
    description: "Sustainable fashion brand",
    contact_email: "info@ecofashion.tn",
    contact_phone: null,
    website: null,
    instagram: null,
    status: "approved",
    created_at: "2024-03-10T10:00:00Z",
  },
];

// Static Contact Messages
export const staticContactMessages: StaticContactMessage[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    subject: "Question about brands",
    message: "I have a question about listing my brand",
    created_at: "2024-03-20T10:00:00Z",
    updated_at: "2024-03-20T10:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    subject: "Partnership inquiry",
    message: "Interested in partnership opportunities",
    created_at: "2024-03-18T10:00:00Z",
    updated_at: "2024-03-18T10:00:00Z",
  },
];

// Static Admin Credentials
export interface StaticAdmin {
  email: string;
  password: string;
  name: string;
}

export const staticAdmins: StaticAdmin[] = [
  {
    email: "admin@tunisfashion.com",
    password: "admin123",
    name: "Admin User",
  },
];

// Export all static data
export const staticData = {
  categories: staticCategories,
  brands: staticBrands,
  products: staticProducts,
  brandSubmissions: staticBrandSubmissions,
  contactMessages: staticContactMessages,
  admins: staticAdmins,
};
