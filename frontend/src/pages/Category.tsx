import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";


const Category = () => {
  const { categoryName } = useParams();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: categories } = useCategories();

  const decodedName = decodeURIComponent(categoryName || "");
  const category = categories?.find(c => c.name.toLowerCase() === decodedName.toLowerCase());
  const categoryBrands = brands?.filter(b => b.category?.name === category?.name || b.category_id === category?._id || b.category_id === category?.id);

  return (
    <div className="min-h-screen bg-background">
      <PageLayout>
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <Link to="/brands" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              All Brands
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="text-gradient-primary">{category?.name || decodedName}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {category?.description || `Explore the best ${decodedName} brands in Tunisia.`}
            </p>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {categoryBrands?.length || 0} brands in this category
          </p>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))
            ) : categoryBrands?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No brands found in this category yet.</p>
                <Link to="/brands" className="text-primary hover:underline mt-2 inline-block">
                  View all brands
                </Link>
              </div>
            ) : (
              categoryBrands?.map((brand, index) => (
                <BrandCard
                  key={brand.id}
                  id={brand.id}
                  name={brand.name}
                  category={brand.category?.name || "Fashion"}
                  location={brand.location || "Tunisia"}
                  description={brand.description || "Tunisian fashion brand"}
                  logoUrl={brand.logo_url}
                  featured={brand.is_featured || false}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      </PageLayout>
    </div>
  );
};

export default Category;
