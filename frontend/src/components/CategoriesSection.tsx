import CategoryCard from "./CategoryCard";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shirt, 
  Crown, 
  Footprints, 
  Watch, 
  Gem, 
  Scissors,
  Baby,
  Flame,
  Star,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Shirt,
  Crown,
  Footprints,
  Watch,
  Gem,
  Scissors,
  Baby,
  Flame,
  Star,
  Zap: Flame,
};

const CategoriesSection = () => {
  const { data: categories, isLoading } = useCategories();

  return (
    <section id="categories" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-secondary font-medium text-sm uppercase tracking-wider mb-4">
            Browse Categories
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Fashion Styles
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find fashion brands that match your style across Tunisia's vibrant fashion scene.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))
          ) : (
            categories?.map((category, index) => (
              <div 
                key={category.id || category._id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CategoryCard 
                  icon={iconMap[category.icon] || Star}
                  name={category.name}
                  count={category.brand_count || 0}
                  gradient={index % 2 === 0 ? "primary" : "secondary"}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
