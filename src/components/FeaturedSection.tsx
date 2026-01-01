import { Link } from "react-router-dom";
import BrandCard from "./BrandCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useFeaturedBrands } from "@/hooks/useBrands";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedSection = () => {
  const { data: brands, isLoading } = useFeaturedBrands();

  return (
    <section id="featured" className="py-24 relative">
      {/* Background accent */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-[120px] -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
              Featured Brands
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Trending Fashion
            </h2>
          </div>
          <Link to="/brands">
            <Button variant="hero-outline" className="group self-start md:self-auto">
              View All Brands
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))
          ) : (
            brands?.map((brand, index) => (
              <div 
                key={brand.id || brand._id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BrandCard 
                  id={brand.id || brand._id}
                  name={brand.name}
                  category={brand.category?.name || "Fashion"}
                  location={brand.location || "Tunisia"}
                  description={brand.description || "Tunisian fashion brand"}
                  logoUrl={brand.logo_url}
                  featured={brand.is_featured || false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
