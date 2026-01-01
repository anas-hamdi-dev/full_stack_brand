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
    category_id?: string | null;
    category?: {
      _id: string;
      name: string;
      icon: string;
    } | null;
  } | null;
  price?: number | null;
  images: string[];
  external_url?: string | null;
  createdAt?: string;
  created_at?: string; // For backward compatibility
}

// Normalize product data from backend
const normalizeProduct = (product: any): Product => {
  return {
    ...product,
    id: product._id || product.id,
    created_at: product.createdAt || product.created_at,
    brand: product.brand_id ? {
      ...product.brand_id,
      id: product.brand_id._id || product.brand_id.id,
    } : null,
  };
};

export const useProducts = (params?: {
  brand_id?: string;
  category_id?: string;
  search?: string;
  page?: number;
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
        pagination: response.data?.pagination,
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
