import { useQuery } from "@tanstack/react-query";
import { brandsService } from "@/services/staticDataService";
import type { StaticBrand } from "@/data/staticData";

export interface Brand extends StaticBrand {}

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const brandsData = await brandsService.getAll();
      return brandsData as Brand[];
    },
  });
};

export const useFeaturedBrands = () => {
  return useQuery({
    queryKey: ["featured-brands"],
    queryFn: async () => {
      const brandsData = await brandsService.getAll();
      
      const featured = brandsData
        .filter((b) => b.is_featured)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      return featured as Brand[];
    },
  });
};
