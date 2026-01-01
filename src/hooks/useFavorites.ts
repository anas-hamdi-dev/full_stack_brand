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
  return {
    ...product,
    id: product._id || product.id,
    created_at: product.createdAt || product.created_at,
  };
};

export function useFavorites() {
  const { user, isClient } = useAuth();
  const queryClient = useQueryClient();

  // Fetch favorites from backend
  const { data: favorites = [], isLoading } = useQuery({
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
      return products.map(normalizeProduct);
    },
    enabled: isClient && !!user,
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
