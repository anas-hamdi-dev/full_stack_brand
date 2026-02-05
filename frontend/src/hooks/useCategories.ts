import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api";

export interface Category {
  _id: string;
  id?: string;
  name: string;
  image?: string | null;
}

const normalizeCategory = (category: Record<string, unknown>): Category => {
  return {
    _id: (category._id as string) || (category.id as string) || '',
    id: (category._id as string) || (category.id as string) || '',
    name: (category.name as string) || '',
    image: (category.image as string) || null,
  } as Category;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      if (response.error) {
        throw new Error(response.error.message);
      }
      const categories = (response.data?.data || response.data || []) as Record<string, unknown>[];
      return categories.map(normalizeCategory);
    },
  });
};

