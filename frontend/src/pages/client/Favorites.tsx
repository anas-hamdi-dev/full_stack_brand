import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, isLoading, removeFavorite, error } = useFavorites();

  // Group favorites by brand
  const productsByBrand = favorites.reduce((acc, product) => {
    // Brand should already be normalized by useFavorites hook
    const brand = product.brand;
    // Handle both _id and id properties for brand
    const brandId = (brand as any)?._id || (brand as any)?.id || product.brand_id || "unknown";
    
    if (!brand && !product.brand_id) {
      // Create a fallback entry for products without brand
      const unknownId = "unknown";
      if (!acc[unknownId]) {
        acc[unknownId] = {
          brand: {
            _id: "unknown",
            id: "unknown",
            name: "Unknown Brand",
            logo_url: null,
            website: null,
            description: null,
          },
          products: [],
        };
      }
      acc[unknownId].products.push(product);
      return acc;
    }

    if (!acc[brandId]) {
      acc[brandId] = {
        brand: brand ? {
          ...brand,
          _id: (brand as any)._id || (brand as any).id || brandId,
          id: (brand as any)._id || (brand as any).id || brandId,
        } : {
          _id: brandId,
          id: brandId,
          name: "Unknown Brand",
          logo_url: null,
          website: null,
          description: null,
        },
        products: [],
      };
    }
    acc[brandId].products.push(product);
    return acc;
  }, {} as Record<string, { brand: { _id: string; id: string; name: string; logo_url?: string | null; website?: string | null; description?: string | null; [key: string]: unknown }; products: typeof favorites }>);

  const handleRemoveFavorite = (productId: string) => {
    removeFavorite(productId);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <BackButton to="/" label="Back to Home" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Favorites
            </h1>
          </div>

          {/* Favorites by Brand */}
          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="glass">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 mb-4 rounded-xl" />
                    <div className="flex gap-4">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <Skeleton key={j} className="h-48 w-48 rounded-xl" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="glass">
              <CardContent className="py-16 text-center">
                <Heart className="h-20 w-20 text-destructive mx-auto mb-6 opacity-50" />
                <CardTitle className="text-2xl font-display font-bold text-foreground mb-2">
                  Error Loading
                </CardTitle>
                <CardDescription className="text-base mb-6">
                  {error instanceof Error ? error.message : "An error occurred while loading your favorites."}
                </CardDescription>
                <Button variant="hero" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : favorites.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(productsByBrand).map(([brandId, { brand, products }]) => {
                if (!brand) return null;

                return (
                  <div key={brandId} className="glass rounded-3xl overflow-hidden">
                    {/* Brand Header */}
                    <div className="p-6 border-b border-border/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Brand Logo */}
                          <div className="w-16 h-16 rounded-full bg-foreground border border-foreground/30 flex items-center justify-center p-2 flex-shrink-0">
                            {brand.logo_url ? (
                              <img 
                                src={brand.logo_url} 
                                alt={`${brand.name} logo`}
                                className="w-full h-full object-contain rounded-full"
                              />
                            ) : (
                              <div className="text-background font-display font-bold text-sm">
                                {brand.name?.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) || 'BR'}
                              </div>
                            )}
                          </div>

                          {/* Brand Info */}
                          <div className="flex-1 min-w-0">
                            <h2 className="font-display font-bold text-xl text-foreground mb-1">
                              {brand.name}
                            </h2>
                            {brand.description && (
                              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 line-clamp-2">
                                {brand.description
                                  .split('\n')
                                  .filter(line => line.trim())
                                  .map((line, index) => (
                                    <li key={index} className="text-left">
                                      {line.trim()}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Visit Button */}
                        {brand.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-shrink-0"
                          >
                            <a href={brand.website} target="_blank" rel="noopener noreferrer">
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {products.map((product) => {
                          const productId = product.id || product._id;
                          return (
                            <div
                              key={productId}
                              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-background/50 transition-colors"
                            >
                              {/* Product Image */}
                              <Link
                                to={`/product/${productId}`}
                                className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
                              >
                                <img
                                  src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </Link>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <Link to={`/product/${productId}`}>
                                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                                    {product.name}
                                  </h3>
                                </Link>
                                {product.price && (
                                  <p className="text-primary font-bold">
                                    {product.price.toFixed(2)} TND
                                  </p>
                                )}
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 h-8 w-8"
                                onClick={() => handleRemoveFavorite(productId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="glass">
              <CardContent className="py-16 text-center">
                <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <CardTitle className="text-2xl font-display font-bold text-foreground mb-2">
                  No Favorite Products
                </CardTitle>
                <CardDescription className="text-base mb-6">
                  Start exploring products and add the ones you like to your favorites.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/gallery">
                    <Button variant="hero" size="lg">
                      Explore Gallery
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/brands">
                    <Button variant="outline" size="lg">
                      Explore Brands
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
