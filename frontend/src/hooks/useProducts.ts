import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";

export interface Product {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  description?: string | null;
  brand_id?: string | null;
  brand?: {
    _id: string;
    id?: string;
    name: string;
    logo_url?: string | null;
    website?: string | null;
  } | null;
  price?: number | null;
  images: string[];
  purchaseLink?: string | null;
  createdAt?: string;
  created_at?: string; // For backward compatibility
}

// Normalize product data from backend
const normalizeProduct = (product: any): Product => {
  // Handle brand_id - if it's populated (object), map it to brand
  let brand = null;
  if (product.brand_id) {
    if (typeof product.brand_id === 'object' && product.brand_id !== null) {
      // brand_id is populated (brand object)
      brand = {
        _id: product.brand_id._id || product.brand_id.id,
        id: product.brand_id._id || product.brand_id.id,
        name: product.brand_id.name,
        logo_url: product.brand_id.logo_url || null,
        website: product.brand_id.website || null,
      };
    }
  }
  
  return {
    ...product,
    id: product._id || product.id,
    created_at: product.createdAt || product.created_at,
    brand,
  };
};

export const useProducts = (params?: {
  brand_id?: string;
  search?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await productsApi.getAll(params);
      if (response.error) {
        throw new Error(response.error.message);
      }
      const products = (response.data?.data || response.data || []) as any[];
      return {
        products: products.map(normalizeProduct),
      };
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await productsApi.getById(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return normalizeProduct(response.data);
    },
    enabled: !!id,
  });
};
