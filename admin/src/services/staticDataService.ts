import {
  staticData,
  staticBrands,
  staticCategories,
  staticProducts,
  staticBrandSubmissions,
  staticContactMessages,
  type StaticBrand,
  type StaticCategory,
  type StaticProduct,
  type StaticBrandSubmission,
  type StaticContactMessage,
} from "@/data/staticData";

// In-memory data stores (clones of static data)
let brands: StaticBrand[] = JSON.parse(JSON.stringify(staticBrands));
let categories: StaticCategory[] = JSON.parse(JSON.stringify(staticCategories));
let products: StaticProduct[] = JSON.parse(JSON.stringify(staticProducts));
let submissions: StaticBrandSubmission[] = JSON.parse(JSON.stringify(staticBrandSubmissions));
let messages: StaticContactMessage[] = JSON.parse(JSON.stringify(staticContactMessages));

// Brands Service
export const brandsService = {
  getAll: (search?: string) => {
    let result = brands;
    if (search) {
      result = brands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return Promise.resolve(result);
  },

  getById: (id: string) => {
    const brand = brands.find((b) => b.id === id);
    return Promise.resolve(brand || null);
  },

  create: (data: Omit<StaticBrand, "id" | "created_at" | "updated_at">) => {
    const newBrand: StaticBrand = {
      ...data,
      id: `${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    brands.push(newBrand);
    return Promise.resolve(newBrand);
  },

  update: (id: string, data: Partial<StaticBrand>) => {
    const index = brands.findIndex((b) => b.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Brand not found"));
    }
    brands[index] = {
      ...brands[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(brands[index]);
  },

  delete: (id: string) => {
    const index = brands.findIndex((b) => b.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Brand not found"));
    }
    brands.splice(index, 1);
    return Promise.resolve();
  },
};

// Categories Service
export const categoriesService = {
  getAll: () => {
    return Promise.resolve(categories);
  },

  getById: (id: string) => {
    const category = categories.find((c) => c.id === id);
    return Promise.resolve(category || null);
  },

  create: (data: Omit<StaticCategory, "id" | "created_at">) => {
    const newCategory: StaticCategory = {
      ...data,
      id: `${Date.now()}`,
      created_at: new Date().toISOString(),
      brand_count: 0,
    };
    categories.push(newCategory);
    return Promise.resolve(newCategory);
  },

  update: (id: string, data: Partial<StaticCategory>) => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Category not found"));
    }
    categories[index] = { ...categories[index], ...data };
    return Promise.resolve(categories[index]);
  },

  delete: (id: string) => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Category not found"));
    }
    categories.splice(index, 1);
    return Promise.resolve();
  },
};

// Products Service
export const productsService = {
  getAll: (brandId?: string) => {
    let result = products;
    if (brandId) {
      result = products.filter((p) => p.brand_id === brandId);
    }
    return Promise.resolve(result);
  },

  getById: (id: string) => {
    const product = products.find((p) => p.id === id);
    return Promise.resolve(product || null);
  },

  create: (data: Omit<StaticProduct, "id" | "created_at" | "updated_at">) => {
    const newProduct: StaticProduct = {
      ...data,
      external_url: data.external_url || null,
      id: `${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.push(newProduct);
    return Promise.resolve(newProduct);
  },

  update: (id: string, data: Partial<StaticProduct>) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Product not found"));
    }
    products[index] = {
      ...products[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(products[index]);
  },

  delete: (id: string) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Product not found"));
    }
    products.splice(index, 1);
    return Promise.resolve();
  },
};

// Submissions Service
export const submissionsService = {
  getAll: (status?: string) => {
    let result = submissions;
    if (status) {
      result = submissions.filter((s) => s.status === status);
    }
    return Promise.resolve(result);
  },

  getById: (id: string) => {
    const submission = submissions.find((s) => s.id === id);
    return Promise.resolve(submission || null);
  },

  update: (id: string, data: Partial<StaticBrandSubmission>) => {
    const index = submissions.findIndex((s) => s.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Submission not found"));
    }
    submissions[index] = { ...submissions[index], ...data };
    return Promise.resolve(submissions[index]);
  },

  delete: (id: string) => {
    const index = submissions.findIndex((s) => s.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Submission not found"));
    }
    submissions.splice(index, 1);
    return Promise.resolve();
  },
};

// Messages Service
export const messagesService = {
  getAll: (status?: string) => {
    let result = messages;
    if (status) {
      result = messages.filter((m) => m.status === status);
    }
    return Promise.resolve(result);
  },

  getById: (id: string) => {
    const message = messages.find((m) => m.id === id);
    return Promise.resolve(message || null);
  },

  update: (id: string, data: Partial<StaticContactMessage>) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Message not found"));
    }
    messages[index] = {
      ...messages[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(messages[index]);
  },

  delete: (id: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) {
      return Promise.reject(new Error("Message not found"));
    }
    messages.splice(index, 1);
    return Promise.resolve();
  },
};

// Stats Service
export const statsService = {
  getStats: () => {
    return Promise.resolve({
      brands: brands.length,
      products: products.length,
      categories: categories.length,
      messages: messages.length,
    });
  },
};
