import { useQuery } from "@tanstack/react-query";
import { brandsApi } from "@/lib/api";

export interface Brand {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  description?: string | null;
  logo_url?: string | null;
  location?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  phone?: string | null;
  email?: string | null;
  is_featured?: boolean | null;
  status?: "pending" | "approved" | "rejected" | null;
  createdAt?: string;
  created_at?: string; // For backward compatibility
  updatedAt?: string;
  updated_at?: string; // For backward compatibility
}

// Normalize brand data from backend
const normalizeBrand = (brand: any): Brand => {
  return {
    ...brand,
    id: brand._id || brand.id,
    created_at: brand.createdAt || brand.created_at,
    updated_at: brand.updatedAt || brand.updated_at,
  };
};

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await brandsApi.getAll();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const brands = (response.data?.data || response.data || []) as any[];
      return brands.map(normalizeBrand);
    },
  });
};

export const useFeaturedBrands = () => {
  return useQuery({
    queryKey: ["featured-brands"],
    queryFn: async () => {
      const response = await brandsApi.getFeatured();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const brands = (response.data?.data || response.data || []) as any[];
      return brands.map(normalizeBrand);
    },
  });
};

export const useBrand = (id: string | undefined) => {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await brandsApi.getById(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return normalizeBrand(response.data);
    },
    enabled: !!id,
  });
};

export const useBrandProducts = (brandId: string | undefined) => {
  return useQuery({
    queryKey: ["brand-products", brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const response = await brandsApi.getProducts(brandId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      const products = (response.data?.data || response.data || []) as any[];
      return products.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        created_at: p.createdAt || p.created_at,
      }));
    },
    enabled: !!brandId,
  });
};

// Hook for brand owners to get their own brand
export const useMyBrand = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["my-brand"],
    queryFn: async () => {
      const response = await brandsApi.getMyBrand();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return normalizeBrand(response.data);
    },
    enabled: options?.enabled !== false, // Default to true, but allow disabling
  });
};

// Hook for brand owners to get their own products
export const useMyProducts = () => {
  return useQuery({
    queryKey: ["my-products"],
    queryFn: async () => {
      const response = await brandsApi.getMyProducts();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const products = (response.data?.data || response.data || []) as any[];
      return products.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        created_at: p.createdAt || p.created_at,
      }));
    },
  });
};
