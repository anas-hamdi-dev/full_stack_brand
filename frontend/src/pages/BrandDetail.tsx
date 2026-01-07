import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import { useBrand, useBrandProducts } from "@/hooks/useBrands";
import { MapPin, Globe, Mail, Phone, Instagram, Facebook, ArrowLeft, CheckCircle2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

const BrandDetail = () => {
  const { brandId } = useParams();

  const { data: brand, isLoading: brandLoading } = useBrand(brandId);
  const { data: products = [], isLoading: productsLoading } = useBrandProducts(brandId);

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout>
        <div className="pb-20 container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-3xl" />
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
        <Footer />
        </PageLayout>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout>
        <div className="pb-20 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Brand Not Found</h1>
          <Link to="/brands">
            <Button variant="hero">Back to Brands</Button>
          </Link>
        </div>
        <Footer />
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{brand.name} - el mall</title>
        <meta name="description" content={brand.description || `Discover ${brand.name} on el mall`} />
      </Helmet>
      
      <PageLayout>
      <main className="pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/brands" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Brands
          </Link>

          {/* Brand Header - Glass Morphism Theme */}
          <div className="glass rounded-3xl p-8 md:p-12 mb-12 hover-lift relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Circular Logo */}
              <div className="relative mb-6">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border-2 border-primary/30 flex flex-col items-center justify-center p-4 shadow-lg glow-primary">
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={`${brand.name} logo`}
                      className="w-full h-full object-contain rounded-full"
                    />
                  ) : (
                    <div className="text-center">
                      {/* Crown Icon Inside Logo */}
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <div className="w-4 h-px bg-primary/40"></div>
                        <Crown className="w-4 h-4 text-primary" />
                        <div className="w-4 h-px bg-primary/40"></div>
                      </div>
                      {/* Brand Name Inside Logo */}
                      <div className="text-foreground">
                        <div className="text-xs md:text-sm font-display font-bold leading-tight">
                          {brand.name.split(' ').slice(0, 2).join(' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Brand Name with Verification Badge */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {brand.name}
                </h1>
                {brand.is_verified && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Category Badge */}
              {brand?.category?.name && (
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                  {brand.category.name}
                </span>
              )}

              {/* Description */}
              {brand.description && (
                <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-4">
                  {brand.description}
                </p>
              )}

              {/* Rating */}
              {brand.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                  <span className="text-primary font-semibold">{brand.rating.toFixed(1)}</span>
                  <span>⭐</span>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="mt-8 pt-8 border-t border-border/50">
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
                {brand.location && (
                  <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <MapPin className="w-4 h-4" />
                    <span>{brand.location}</span>
                  </div>
                )}
                {brand.website && (
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                {brand.email && (
                  <a href={`mailto:${brand.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>{brand.email}</span>
                  </a>
                )}
                {brand.phone && (
                  <a href={`tel:${brand.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>{brand.phone}</span>
                  </a>
                )}
                {brand.instagram && (() => {
                  // Convert username to Instagram URL if it's not already a URL
                  let instagramUrl = brand.instagram.trim();
                  if (!instagramUrl.startsWith("http://") && !instagramUrl.startsWith("https://")) {
                    // Remove @ if present and create URL
                    const username = instagramUrl.replace(/^@/, "");
                    instagramUrl = `https://www.instagram.com/${username}`;
                  }
                  return (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Instagram className="w-4 h-4" />
                      <span>@{brand.instagram.replace(/^@/, "").replace(/^https?:\/\/.*instagram\.com\//, "")}</span>
                    </a>
                  );
                })()}
                {brand.facebook && (
                  <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Facebook className="w-4 h-4" />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Products Section */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-8">Shop Collection</h2>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-muted rounded-2xl" />
                    <div className="h-4 bg-muted rounded w-2/3 mt-4" />
                    <div className="h-4 bg-muted rounded w-1/3 mt-2" />
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id || product._id}
                    id={product.id || product._id}
                    name={product.name}
                    description={product.description || ""}
                    imageUrl={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                    price={product.price}
                    brandName={brand?.name}
                    brandLogo={brand?.logo_url}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-2xl">
                <p className="text-muted-foreground">No products available yet.</p>
                {brand.website && (
                  <a href={brand.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="hero" className="mt-4">
                      Visit Official Store
                    </Button>
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      </PageLayout>
    </div>
  );
};

export default BrandDetail;