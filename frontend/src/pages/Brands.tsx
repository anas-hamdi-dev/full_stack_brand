import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import { useBrands } from "@/hooks/useBrands";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import BackButton from "@/components/BackButton";


const Brands = () => {
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = brands?.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <PageLayout>
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <div className="mb-6">
              <BackButton to="/" label="Back to Home" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              All <span className="text-gradient-primary">Brands</span>
            </h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filteredBrands?.length || 0} brands found
          </p>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {brandsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))
            ) : filteredBrands?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No brands found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setSearchQuery(""); }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredBrands?.map((brand, index) => (
                <BrandCard
                  key={brand.id}
                  id={brand.id}
                  name={brand.name}
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

export default Brands;
