import { useState, useMemo } from "react";
import Footer from "@/components/Footer";
import BrandCard from "@/components/BrandCard";
import { usePaginatedBrands, Brand } from "@/hooks/useBrands";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ComingSoon from "@/components/ComingSoon";


const ITEMS_PER_LOAD = 12;

const Brands = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("men");

  // Use paginated brands hook
  // Query key includes search, so it automatically resets when search changes
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePaginatedBrands({
    search: searchQuery.trim() || undefined,
    limit: ITEMS_PER_LOAD,
  });

  // Accumulate all brands from all pages, preventing duplicates
  const allBrands = useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
      return [];
    }
    
    const brandMap = new Map<string, Brand>();
    
    // Collect all brands from all pages, using _id as unique key
    data.pages.forEach((page) => {
      if (page && page.brands && Array.isArray(page.brands)) {
        page.brands.forEach((brand) => {
          if (brand && typeof brand === 'object') {
            const brandId = brand._id || brand.id;
            if (brandId && typeof brandId === 'string' && !brandMap.has(brandId)) {
              brandMap.set(brandId, brand);
            }
          }
        });
      }
    });

    return Array.from(brandMap.values());
  }, [data?.pages]);

  // Filter brands based on category (only "men" shows brands currently)
  const filteredBrands = useMemo(() => {
    if (selectedCategory !== "men") return [];
    return allBrands;
  }, [allBrands, selectedCategory]);

  // Get pagination metadata from the last page
  const pagination = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) {
      return { total: 0, hasMore: false };
    }
    const lastPage = data.pages[data.pages.length - 1];
    return lastPage.pagination;
  }, [data?.pages]);

  const hasMore = hasNextPage || false;
  const isLoadingMore = isFetchingNextPage;

  // Reset pagination when search or category changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSearchQuery(""); // Clear search when switching categories
  };

  const clearFilters = () => {
    setSearchQuery("");
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
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
              {!error && (
                <p className="text-sm text-muted-foreground mb-6">
                  {pagination.total > 0 ? pagination.total : filteredBrands.length} brands found
                </p>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <div className="col-span-full text-center py-12">
                  <p className="text-destructive mb-4">
                    Error loading brands: {error instanceof Error ? error.message : 'Unknown error'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Brands Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass rounded-3xl border border-border/30 w-full max-w-[14rem] md:max-w-[16rem] mx-auto">
                      <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                        {/* Avatar Skeleton */}
                        <Skeleton className="w-28 h-28 md:w-32 md:h-32 rounded-full mb-4" />
                        {/* Brand Name Skeleton */}
                        <Skeleton className="h-5 w-24 md:w-32 rounded-md" />
                      </div>
                    </div>
                  ))
                ) : error ? null : filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
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
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No brands found matching your criteria.</p>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Load More Button with Skeleton */}
              {!isLoading && filteredBrands.length > 0 && hasMore && (
                <div className="mt-8">
                  <div className="flex justify-center mb-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      className="min-w-[200px]"
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                  {/* Show skeleton loaders while loading more items */}
                  {isLoadingMore && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      {Array.from({ length: ITEMS_PER_LOAD }).map((_, i) => (
                        <div key={`loading-more-${i}`} className="glass rounded-3xl border border-border/30 w-full max-w-[14rem] md:max-w-[16rem] mx-auto">
                          <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                            {/* Avatar Skeleton */}
                            <Skeleton className="w-28 h-28 md:w-32 md:h-32 rounded-full mb-4" />
                            {/* Brand Name Skeleton */}
                            <Skeleton className="h-5 w-24 md:w-32 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
