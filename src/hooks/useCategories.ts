import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api";

export interface Category {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  icon: string;
  description?: string | null;
  brand_count?: number | null;
  createdAt?: string;
  created_at?: string; // For backward compatibility
}

// Normalize category data from backend
const normalizeCategory = (category: any): Category => {
  return {
    ...category,
    id: category._id || category.id,
    created_at: category.createdAt || category.created_at,
  };
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const categories = (response.data?.data || response.data || []) as any[];
      return categories.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name));
    },
  });
};

export const useCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await categoriesApi.getById(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return normalizeCategory(response.data);
    },
    enabled: !!id,
  });
};
