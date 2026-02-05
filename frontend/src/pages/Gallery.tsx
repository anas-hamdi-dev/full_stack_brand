import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import Footer from "@/components/Footer";
import { usePaginatedProducts, Product, getFirstImageUrl } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import CategoryTabs from "@/components/CategoryTabs";
const ITEMS_PER_LOAD = 12;

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: categories } = useCategories();

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

  // Filter products based on category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return allProducts;
    }
    return allProducts.filter((product) => {
      const categoryId = product.category?._id || product.category?.id;
      return categoryId === selectedCategory;
    });
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

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(""); // Clear search when switching categories
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
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
          {categories && categories.length > 0 && (
            <div className="mb-12">
              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategoryChange}
              />
            </div>
          )}

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
              {filteredProducts.length} products found
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
                  <div className="aspect-square overflow-hidden relative">
                    <Skeleton className="w-full h-full" />
                    <div className="absolute top-3 right-3 z-10">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
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
                {(searchQuery || selectedCategory !== "all") && (
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
          {!isLoading && filteredProducts.length > 0 && hasMore && selectedCategory === "all" && (
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
              {isLoadingMore && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: ITEMS_PER_LOAD }).map((_, i) => (
                    <div key={`loading-more-${i}`} className="group glass rounded-3xl overflow-hidden">
                      <div className="aspect-square overflow-hidden relative">
                        <Skeleton className="w-full h-full" />
                        <div className="absolute top-3 right-3 z-10">
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;