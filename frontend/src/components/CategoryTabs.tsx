import { memo, useCallback } from "react";
import { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
}

const CategoryTabs = memo(({ categories, selectedCategory, onCategorySelect, className }: CategoryTabsProps) => {
  const handleCategoryClick = useCallback((categoryId: string) => {
    onCategorySelect(categoryId);
  }, [onCategorySelect]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4", className)}>
      {/* All Categories Option */}
      <button
        onClick={() => handleCategoryClick("all")}
        className={cn(
          "group relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-20 sm:h-24 md:h-28 flex-[0_0_calc(50%-0.25rem)] sm:flex-[0_0_calc(33.333%-0.5rem)] md:flex-[0_0_calc(25%-0.75rem)] lg:flex-[0_0_calc(20%-0.8rem)] xl:flex-[0_0_calc(16.666%-0.83rem)]",
          selectedCategory === "all" && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
        )}
      >
        {/* Background Gradient for "All" */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-primary/80" />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 group-hover:from-black/40 group-hover:via-black/30 group-hover:to-black/50 transition-all duration-300" />
        
        {/* Category Name */}
        <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-2">
          <h3 className="text-white font-display font-bold text-xs sm:text-sm md:text-base text-center leading-tight z-10 transition-transform duration-300 group-hover:scale-105">
            All
          </h3>
        </div>
      </button>

      {/* Category Items */}
      {categories.map((category) => {
        const categoryId = category._id || category.id || '';
        const categoryName = category.name;
        const isSelected = selectedCategory === categoryId;
        
        return (
          <button
            key={categoryId}
            onClick={() => handleCategoryClick(categoryId)}
            className={cn(
              "group relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-20 sm:h-24 md:h-28 flex-[0_0_calc(50%-0.25rem)] sm:flex-[0_0_calc(33.333%-0.5rem)] md:flex-[0_0_calc(25%-0.75rem)] lg:flex-[0_0_calc(20%-0.8rem)] xl:flex-[0_0_calc(16.666%-0.83rem)]",
              isSelected && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
            )}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundImage: category.image 
                  ? `url(${category.image})` 
                  : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
              }}
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 group-hover:from-black/50 group-hover:via-black/40 group-hover:to-black/60 transition-all duration-300" />
            
            {/* Category Name */}
            <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-2">
              <h3 className="text-white font-display font-bold text-xs sm:text-sm md:text-base text-center leading-tight z-10 transition-transform duration-300 group-hover:scale-105 line-clamp-2 px-1">
                {categoryName}
              </h3>
            </div>
          </button>
        );
      })}
    </div>
  );
});

CategoryTabs.displayName = "CategoryTabs";

export default CategoryTabs;






