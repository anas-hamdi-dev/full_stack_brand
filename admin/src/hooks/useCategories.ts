import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/staticDataService";
import type { StaticCategory } from "@/data/staticData";

export interface Category extends StaticCategory {}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await categoriesService.getAll();
    },
  });
};
