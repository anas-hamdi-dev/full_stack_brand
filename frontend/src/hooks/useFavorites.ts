import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { favoritesApi } from "@/lib/api";
import { toast } from "sonner";

export interface FavoriteProduct {
  _id: string;
  id?: string;
  name: string;
  description?: string | null;
  brand_id?: string | null;
  brand?: {
    _id: string;
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
  created_at?: string;
}

// Normalize product data from backend
const normalizeProduct = (product: any): FavoriteProduct => {
  if (!product) {
    throw new Error('Product is null or undefined');
  }

  // Handle brand_id being populated as an object (from backend)
  let brand = null;
  let brandId: string | null = null;

  if (product.brand_id) {
    if (typeof product.brand_id === 'object' && product.brand_id !== null) {
      // Brand is populated
      brand = {
        _id: product.brand_id._id?.toString() || product.brand_id.id?.toString() || product.brand_id.toString(),
        id: product.brand_id._id?.toString() || product.brand_id.id?.toString() || product.brand_id.toString(),
        name: product.brand_id.name || '',
        logo_url: product.brand_id.logo_url || null,
        website: product.brand_id.website || null,
        description: product.brand_id.description || null,
        category_id: product.brand_id.category_id?._id?.toString() || product.brand_id.category_id?.id?.toString() || product.brand_id.category_id || null,
        category: product.brand_id.category_id && typeof product.brand_id.category_id === 'object'
          ? {
              _id: product.brand_id.category_id._id?.toString() || product.brand_id.category_id.id?.toString(),
              name: product.brand_id.category_id.name || '',
              icon: product.brand_id.category_id.icon || '',
            }
          : null,
      };
      brandId = brand._id;
    } else {
      // Brand is just an ID string
      brandId = product.brand_id.toString();
    }
  }

  // If brand is not set but product.brand exists, use that
  if (!brand && product.brand) {
    brand = {
      _id: product.brand._id?.toString() || product.brand.id?.toString() || '',
      id: product.brand._id?.toString() || product.brand.id?.toString() || '',
      name: product.brand.name || '',
      logo_url: product.brand.logo_url || null,
      website: product.brand.website || null,
      description: product.brand.description || null,
      category_id: product.brand.category_id?.toString() || null,
      category: product.brand.category || null,
    };
    brandId = brand._id;
  }

  return {
    ...product,
    id: product._id?.toString() || product.id?.toString() || '',
    _id: product._id?.toString() || product.id?.toString() || '',
    created_at: product.createdAt || product.created_at,
    brand,
    brand_id: brandId,
    images: Array.isArray(product.images) ? product.images : [],
    name: product.name || '',
    description: product.description || null,
    price: product.price || null,
    external_url: product.external_url || null,
  };
};

export function useFavorites() {
  const { user, isClient } = useAuth();
  const queryClient = useQueryClient();

  // Fetch favorites from backend
  const { data: favorites = [], isLoading, error } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!isClient || !user) {
        return [];
      }
      const response = await favoritesApi.getAll();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const products = (response.data?.data || response.data || []) as any[];
      // Filter out null/undefined products and normalize
      return products
        .filter((product: any) => product !== null && product !== undefined)
        .map((product: any) => {
          try {
            return normalizeProduct(product);
          } catch (error) {
            console.error('Error normalizing product:', error, product);
            return null;
          }
        })
        .filter((product: FavoriteProduct | null) => product !== null) as FavoriteProduct[];
    },
    enabled: isClient && !!user,
    retry: 1,
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await favoritesApi.add(productId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favorites", "check"] });
      toast.success("Produit ajouté aux favoris");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout aux favoris");
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await favoritesApi.remove(productId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favorites", "check"] });
      toast.success("Produit retiré des favoris");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression des favoris");
    },
  });

  // Check if product is favorite
  const { data: favoriteChecks = {} } = useQuery({
    queryKey: ["favorites", "check"],
    queryFn: async () => {
      // This will be handled per-product with individual queries
      return {};
    },
    enabled: false, // We'll use individual queries per product
  });

  const addFavorite = (productId: string) => {
    if (!isClient) {
      toast.error("Vous devez être connecté en tant que client pour ajouter aux favoris");
      return;
    }
    addFavoriteMutation.mutate(productId);
  };

  const removeFavorite = (productId: string) => {
    if (!isClient) {
      return;
    }
    removeFavoriteMutation.mutate(productId);
  };

  const toggleFavorite = (productId: string) => {
    if (!isClient) {
      toast.error("Vous devez être connecté en tant que client pour ajouter aux favoris");
      return;
    }
    const isFavorite = favorites.some((fav) => (fav.id || fav._id) === productId);
    if (isFavorite) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => (fav.id || fav._id) === productId);
  };

  return {
    favorites,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}

// Hook to check if a specific product is favorite
export function useIsFavorite(productId: string | undefined) {
  const { isClient, user } = useAuth();
  
  return useQuery({
    queryKey: ["favorites", "check", productId],
    queryFn: async () => {
      if (!productId || !isClient || !user) {
        return false;
      }
      const response = await favoritesApi.check(productId);
      if (response.error) {
        return false;
      }
      return response.data?.isFavorite || false;
    },
    enabled: !!productId && isClient && !!user,
  });
}
