import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import Footer from "@/components/Footer";
import { usePaginatedProducts, Product, getFirstImageUrl } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ComingSoon from "@/components/ComingSoon";


const ITEMS_PER_LOAD = 12;

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("men");

  // Use paginated products hook
  // Query key includes search, so it automatically resets when search changes
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePaginatedProducts({
    search: searchQuery.trim() || undefined,
    limit: ITEMS_PER_LOAD,
  });

  // Accumulate all products from all pages, preventing duplicates
  const allProducts = useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
      return [];
    }
    
    const productMap = new Map<string, Product>();
    
    // Collect all products from all pages, using _id as unique key
    data.pages.forEach((page) => {
      if (page && page.products && Array.isArray(page.products)) {
        page.products.forEach((product) => {
          if (product && typeof product === 'object') {
            const productId = product._id || product.id;
            if (productId && typeof productId === 'string' && !productMap.has(productId)) {
              productMap.set(productId, product);
            }
          }
        });
    }
    });

    return Array.from(productMap.values());
  }, [data?.pages]);

  // Filter products based on category (only "men" shows products currently)
  const filteredProducts = useMemo(() => {
    if (selectedCategory !== "men") return [];
    return allProducts;
  }, [allProducts, selectedCategory]);

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
      <Helmet>
        <title>Gallery - el mall | Fashion Collection</title>
        <meta name="description" content="Browse our gallery of fashion items from various Tunisian brands. Discover unique clothing and accessories." />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </Helmet>
        
        <main className="pb-16">
          <div className="container mx-auto px-4">
              {/* Header */}
            <div className="mb-12">
              <div className="mb-6">
                <BackButton to="/" label="Back to Home" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
               <span className="text-gradient-primary">Gallery</span>
            </h1>
          </div>

          {/* Category Tabs */}
          <div className="mb-8">
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="men">Men</TabsTrigger>
                <TabsTrigger value="women">Women</TabsTrigger>
                <TabsTrigger value="kids">Kids</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Content */}
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
            {/* Men Category - Show all products */}
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

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                />
                </div>
              </div>

              {/* Results count */}
              {!error && (
              <p className="text-sm text-muted-foreground mb-6">
                  {pagination.total > 0 ? pagination.total : filteredProducts.length} products found
                </p>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <div className="col-span-full text-center py-12">
                  <p className="text-destructive mb-4">
                    Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="group glass rounded-3xl overflow-hidden">
                      {/* Image Skeleton */}
                      <div className="aspect-square overflow-hidden relative">
                        <Skeleton className="w-full h-full" />
                        {/* Favorite Button Skeleton */}
                        <div className="absolute top-3 right-3 z-10">
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                      {/* Product Info Skeleton */}
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                      </div>
                    </div>
                  ))
            ) : error ? null : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id || product._id}
                      id={product.id || product._id}
                      name={product.name}
                      description={product.description || ""}
                      imageUrl={getFirstImageUrl(product)}
                      price={product.price}
                      brandName={product.brand?.name}
                      brandLogo={typeof product.brand?.logo_url === 'string' ? product.brand.logo_url : product.brand?.logo_url?.imageUrl}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No products found matching your criteria.</p>
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
              {!isLoading && filteredProducts.length > 0 && hasMore && (
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {Array.from({ length: ITEMS_PER_LOAD }).map((_, i) => (
                        <div key={`loading-more-${i}`} className="group glass rounded-3xl overflow-hidden">
                          {/* Image Skeleton */}
                          <div className="aspect-square overflow-hidden relative">
                            <Skeleton className="w-full h-full" />
                            {/* Favorite Button Skeleton */}
                            <div className="absolute top-3 right-3 z-10">
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                          </div>
                          {/* Product Info Skeleton */}
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded-md" />
                            <Skeleton className="h-4 w-1/2 rounded-md" />
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
                    Kids' Collection
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

export default Gallery;