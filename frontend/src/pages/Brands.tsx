import { useState } from "react";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import { useBrands } from "@/hooks/useBrands";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ComingSoon from "@/components/ComingSoon";


const Brands = () => {
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("men");

  const filteredBrands = brands?.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
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

          {/* Category Tabs */}
          <div className="mb-8">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="men">Men</TabsTrigger>
                <TabsTrigger value="women">Women</TabsTrigger>
                <TabsTrigger value="kids">Kids</TabsTrigger>
              </TabsList>
            </Tabs>
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
                disabled={selectedCategory !== "men"}
              />
            </div>
          </div>

          {/* Category Content */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            {/* Men Category - Show all brands */}
            <TabsContent value="men" className="mt-0">
              <div className="relative rounded-3xl overflow-hidden mb-8">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
                <div className="relative px-8 py-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Men's Collection
                  </h2>
                  
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
            </TabsContent>

            {/* Women Category - Coming Soon */}
            <TabsContent value="women" className="mt-0">
              <div className="relative rounded-3xl overflow-hidden mb-8">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url(https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
                <div className="relative px-8 py-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Women's Collection
                  </h2>
                  
                </div>
              </div>
              <ComingSoon category="Women" />
            </TabsContent>

            {/* Kids Category - Coming Soon */}
            <TabsContent value="kids" className="mt-0">
              <div className="relative rounded-3xl overflow-hidden mb-8">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url(https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1920&q=80)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
                <div className="relative px-8 py-12 text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Kids's Collection
                  </h2>
                  
                </div>
              </div>
              <ComingSoon category="Kids" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Brands;
