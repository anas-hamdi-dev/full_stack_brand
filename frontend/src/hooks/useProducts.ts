import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Normalize product data from backend
const normalizeProduct = (product: Record<string, unknown>): Product => {
  // Handle brand_id - if it's populated (object), map it to brand
  let brand = null;
  const brandId = product.brand_id;
  if (brandId) {
    if (typeof brandId === 'object' && brandId !== null && !Array.isArray(brandId)) {
      // brand_id is populated (brand object)
      const brandObj = brandId as Record<string, unknown>;
      brand = {
        _id: (brandObj._id as string) || (brandObj.id as string) || '',
        id: (brandObj._id as string) || (brandObj.id as string) || '',
        name: (brandObj.name as string) || '',
        logo_url: (brandObj.logo_url as string) || null,
        website: (brandObj.website as string) || null,
      };
    }
  }
  
  return {
    ...product,
    _id: (product._id as string) || (product.id as string) || '',
    id: (product._id as string) || (product.id as string) || '',
    name: (product.name as string) || '',
    description: (product.description as string) || null,
    brand_id: (product.brand_id as string) || null,
    brand,
    price: (product.price as number) || null,
    images: (product.images as string[]) || [],
    purchaseLink: (product.purchaseLink as string) || null,
    createdAt: (product.createdAt as string) || undefined,
    created_at: (product.createdAt as string) || (product.created_at as string) || undefined,
  } as Product;
};

// Backward compatible hook - fetches all products (for non-paginated use cases)
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
      const products = (response.data?.data || response.data || []) as Record<string, unknown>[];
      return {
        products: products.map(normalizeProduct),
      };
    },
  });
};

// Paginated products hook - fetches products page by page
export const usePaginatedProducts = (params?: {
  brand_id?: string;
  search?: string;
  limit?: number;
}) => {
  const limit = params?.limit || 12;
  
  // Normalize params for consistent query key (remove undefined values)
  const normalizedParams = {
    ...(params?.brand_id && { brand_id: params.brand_id }),
    ...(params?.search && params.search.trim() && { search: params.search.trim() }),
    limit,
  };
  
  return useInfiniteQuery({
    queryKey: ["products", "paginated", normalizedParams],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productsApi.getAll({
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
      
      const products = (responseData?.data || []) as Record<string, unknown>[];
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
        products: products.map(normalizeProduct),
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
