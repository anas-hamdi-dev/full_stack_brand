// API Service - Replaces staticDataService with real backend API calls
import {
  adminDashboardApi,
  adminBrandsApi,
  adminProductsApi,
  adminMessagesApi,
  adminBrandSubmissionsApi,
} from "@/lib/api";

// Helper function to convert backend data to frontend format
function convertBrand(brand: any): any {
  return {
    id: brand._id || brand.id,
    name: brand.name,
    description: brand.description || null,
    logo_url: brand.logo_url || null,
    location: brand.location || null,
    website: brand.website || null,
    instagram: brand.instagram || null,
    facebook: brand.facebook || null,
    phone: brand.phone || null,
    email: brand.email || null,
    is_featured: brand.is_featured || false,
    status: brand.status || "approved",
    created_at: brand.createdAt || brand.created_at,
    updated_at: brand.updatedAt || brand.updated_at,
  };
}

function convertProduct(product: any): any {
  return {
    id: product._id || product.id,
    brand_id: product.brand_id?._id || product.brand_id || null,
    name: product.name,
    description: product.description || null,
    price: product.price || null,
    images: product.images || [],
    created_at: product.createdAt || product.created_at,
    updated_at: product.updatedAt || product.updated_at,
    brands: product.brand_id && typeof product.brand_id === 'object'
      ? {
          id: product.brand_id._id || product.brand_id.id,
          name: product.brand_id.name,
          logo_url: product.brand_id.logo_url || null,
        }
      : null,
  };
}


function convertMessage(message: any): any {
  return {
    id: message._id || message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    created_at: message.createdAt || message.created_at,
    updated_at: message.updatedAt || message.updated_at,
  };
}

function convertSubmission(submission: any): any {
  return {
    id: submission._id || submission.id,
    brand_name: submission.brand_name,
    category: submission.category,
    description: submission.description || null,
    contact_email: submission.contact_email,
    contact_phone: submission.contact_phone || null,
    website: submission.website || null,
    instagram: submission.instagram || null,
    status: submission.status || "pending",
    created_at: submission.createdAt || submission.created_at,
  };
}

// Brands Service (using API)
export const brandsService = {
  getAll: async (search?: string) => {
    const response = await adminBrandsApi.getAll({ search });
    return (response.data || []).map(convertBrand);
  },

  getById: async (id: string) => {
    const brand = await adminBrandsApi.getById(id);
    return convertBrand(brand);
  },

  create: async (data: any) => {
    const brand = await adminBrandsApi.create(data);
    return convertBrand(brand);
  },

  update: async (id: string, data: any) => {
    const brand = await adminBrandsApi.update(id, data);
    return convertBrand(brand);
  },

  delete: async (id: string) => {
    await adminBrandsApi.delete(id);
  },
};


// Products Service (using API)
export const productsService = {
  getAll: async (brandId?: string, search?: string) => {
    const response = await adminProductsApi.getAll({ brand_id: brandId, search });
    return (response.data || []).map(convertProduct);
  },

  getById: async (id: string) => {
    const product = await adminProductsApi.getById(id);
    return convertProduct(product);
  },

  create: async (data: any) => {
    const product = await adminProductsApi.create(data);
    return convertProduct(product);
  },

  update: async (id: string, data: any) => {
    const product = await adminProductsApi.update(id, data);
    return convertProduct(product);
  },

  delete: async (id: string) => {
    await adminProductsApi.delete(id);
  },
};

// Submissions Service (using API)
export const submissionsService = {
  getAll: async (status?: string) => {
    const response = await adminBrandSubmissionsApi.getAll({ status: status || "all" });
    return (response.data || []).map(convertSubmission);
  },

  getById: async (id: string) => {
    const submission = await adminBrandSubmissionsApi.getById(id);
    return convertSubmission(submission);
  },

  approve: async (id: string) => {
    const result = await adminBrandSubmissionsApi.approve(id);
    return convertSubmission(result.data);
  },

  reject: async (id: string) => {
    const result = await adminBrandSubmissionsApi.reject(id);
    return convertSubmission(result.data);
  },

  delete: async (id: string) => {
    await adminBrandSubmissionsApi.delete(id);
  },
};

// Messages Service (using API)
export const messagesService = {
  getAll: async (search?: string) => {
    const response = await adminMessagesApi.getAll({ search });
    return (response.data || []).map(convertMessage);
  },

  getById: async (id: string) => {
    const message = await adminMessagesApi.getById(id);
    return convertMessage(message);
  },

  delete: async (id: string) => {
    await adminMessagesApi.delete(id);
  },
};

// Stats Service (using API)
export const statsService = {
  getStats: async () => {
    return await adminDashboardApi.getStats();
  },
};
