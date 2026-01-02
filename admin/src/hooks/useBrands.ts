import { useQuery } from "@tanstack/react-query";
import { brandsService } from "@/services/staticDataService";
import { categoriesService } from "@/services/staticDataService";
import type { StaticBrand } from "@/data/staticData";

export interface Brand extends StaticBrand {
  categories?: {
    name: string;
  } | null;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const brandsData = await brandsService.getAll();
      const categoriesData = await categoriesService.getAll();
      
      // Map brands with category names
      return brandsData.map((brand) => ({
        ...brand,
        categories: brand.category_id
          ? { name: categoriesData.find((c) => c.id === brand.category_id)?.name || "Uncategorized" }
          : null,
      })) as Brand[];
    },
  });
};

export const useFeaturedBrands = () => {
  return useQuery({
    queryKey: ["featured-brands"],
    queryFn: async () => {
      const brandsData = await brandsService.getAll();
      const categoriesData = await categoriesService.getAll();
      
      const featured = brandsData
        .filter((b) => b.is_featured)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      return featured.map((brand) => ({
        ...brand,
        categories: brand.category_id
          ? { name: categoriesData.find((c) => c.id === brand.category_id)?.name || "Uncategorized" }
          : null,
      })) as Brand[];
    },
  });
};
