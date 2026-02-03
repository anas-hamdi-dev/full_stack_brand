import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { brandsApi } from "@/lib/api";

export interface BrandLogo {
  publicId: string;
  imageUrl: string;
}

export interface Brand {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  description?: string | null;
  logo_url?: BrandLogo | string | null; // Support both old (string) and new (BrandLogo) formats
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

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
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

// Paginated brands hook - fetches brands page by page
export const usePaginatedBrands = (params?: {
  featured?: boolean;
  search?: string;
  limit?: number;
}) => {
  const limit = params?.limit || 12;
  
  // Normalize params for consistent query key (remove undefined values)
  const normalizedParams = {
    ...(params?.featured !== undefined && { featured: params.featured }),
    ...(params?.search && params.search.trim() && { search: params.search.trim() }),
    limit,
  };
  
  return useInfiniteQuery({
    queryKey: ["brands", "paginated", normalizedParams],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await brandsApi.getAll({
        ...normalizedParams,
        page: pageParam,
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // The API client now preserves pagination in the response
      // Response structure: { data: { data: brands[], pagination: {...} } }
      const responseData = response.data as {
        data?: unknown[];
        pagination?: PaginationMetadata;
      };
      
      const brands = (responseData?.data || []) as any[];
      const pagination = responseData?.pagination;
      
      if (!Array.isArray(brands)) {
        console.error('Invalid brands data structure:', response.data);
        return {
          brands: [],
          pagination: {
            page: pageParam,
            limit,
            total: 0,
            hasMore: false,
          },
        };
      }
      
      return {
        brands: brands.map(normalizeBrand),
        pagination: pagination || {
          page: pageParam,
          limit,
          total: brands.length,
          hasMore: false,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1,
  });
};

// Paginated my products hook - fetches brand owner's products page by page
export const usePaginatedMyProducts = (params?: {
  limit?: number;
}) => {
  const limit = params?.limit || 12;
  
  // Normalize params for consistent query key
  const normalizedParams = {
    limit,
  };
  
  return useInfiniteQuery({
    queryKey: ["my-products", "paginated", normalizedParams],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await brandsApi.getMyProducts({
        ...normalizedParams,
        page: pageParam,
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // The API client now preserves pagination in the response
      // Response structure: { data: { data: products[], pagination: {...} } }
      const responseData = response.data as {
        data?: unknown[];
        pagination?: PaginationMetadata;
      };
      
      const products = (responseData?.data || []) as any[];
      const pagination = responseData?.pagination;
      
      if (!Array.isArray(products)) {
        console.error('Invalid products data structure:', response.data);
        return {
          products: [],
          pagination: {
            page: pageParam,
            limit,
            total: 0,
            hasMore: false,
          },
        };
      }
      
      return {
        products: products.map((p: any) => ({
          ...p,
          id: p._id || p.id,
          created_at: p.createdAt || p.created_at,
        })),
        pagination: pagination || {
          page: pageParam,
          limit,
          total: products.length,
          hasMore: false,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1,
  });
};
