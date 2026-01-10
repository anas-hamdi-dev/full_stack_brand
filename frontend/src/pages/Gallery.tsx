import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_LOAD = 12;

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_LOAD);

  const { data, isLoading } = useProducts({
    search: searchQuery.trim() || undefined,
  });
  const { data: categories } = useCategories();

  const products = data?.products || [];

  // Filter products based on search query and category (client-side filtering for better UX)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    
    // Apply search filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query);
      const brandMatch = product.brand?.name.toLowerCase().includes(query);
      return nameMatch || descriptionMatch || brandMatch;
    });
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => {
        return product.brand?.category?.name === selectedCategory;
      });
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  // Get products to display
  const displayedProducts = filteredProducts.slice(0, itemsToShow);
  const hasMore = filteredProducts.length > itemsToShow;

  // Reset items to show when search or category changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setItemsToShow(ITEMS_PER_LOAD);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setItemsToShow(ITEMS_PER_LOAD);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setItemsToShow(ITEMS_PER_LOAD);
  };

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_LOAD);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gallery - el mall | Fashion Collection</title>
        <meta name="description" content="Browse our gallery of fashion items from various Tunisian brands. Discover unique clothing and accessories." />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo2.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo2.png" />
      </Helmet>
      
      <PageLayout>
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
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat._id || cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-6">
              {filteredProducts?.length || 0} products found
            </p>

          {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-2xl" />
                ))
          ) : displayedProducts.length > 0 ? (
                displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id || product._id}
                    name={product.name}
                    description={product.description || ""}
                    imageUrl={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                    price={product.price}
                    brandName={product.brand?.name}
                    brandLogo={product.brand?.logo_url}
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

              {/* Load More Button */}
            {!isLoading && displayedProducts.length > 0 && hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    className="min-w-[200px]"
                  >
                  Load More
                  </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      </PageLayout>
    </div>
  );
};

export default Gallery;