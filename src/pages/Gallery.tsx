import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_LOAD = 12;

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_LOAD);

  const { data, isLoading } = useProducts({
    search: searchQuery.trim() || undefined,
  });

  const products = data?.products || [];

  // Filter products based on search query (client-side filtering for better UX)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query);
      const brandMatch = product.brand?.name.toLowerCase().includes(query);
      return nameMatch || descriptionMatch || brandMatch;
    });
  }, [products, searchQuery]);

  // Get products to display
  const displayedProducts = filteredProducts.slice(0, itemsToShow);
  const hasMore = filteredProducts.length > itemsToShow;

  // Reset items to show when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setItemsToShow(ITEMS_PER_LOAD);
  };

  const clearSearch = () => {
    setSearchQuery("");
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
      </Helmet>
      
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-background"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-2xl" />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {displayedProducts.map((product) => (
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
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    className="min-w-[200px]"
                  >
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 glass rounded-3xl">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground text-lg mb-4">
                    Aucun produit trouvé pour "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    Effacer la recherche
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-lg mb-4">Aucun produit dans la galerie pour le moment.</p>
                  <p className="text-sm text-muted-foreground">Revenez bientôt pour de nouvelles arrivées !</p>
                </>
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