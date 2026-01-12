import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Footer from "@/components/Footer";
import { useBrand, useBrandProducts } from "@/hooks/useBrands";
import { MapPin, Globe, Mail, Phone, Instagram, Facebook, CheckCircle2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BackButton from "@/components/BackButton";
import ProductCard from "@/components/ProductCard";

const BrandDetail = () => {
  const { brandId } = useParams();

  const { data: brand, isLoading: brandLoading } = useBrand(brandId);
  const { data: products = [], isLoading: productsLoading } = useBrandProducts(brandId);

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="pb-20 container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-3xl" />
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="pb-20 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Brand Not Found</h1>
          <BackButton to="/brands" label="Back to Brands" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <Helmet>
        <title>{brand.name} - el mall</title>
        <meta name="description" content={brand.description || `Discover ${brand.name} on el mall`} />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </Helmet>
      
      <main className="pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-8">
            <BackButton to="/brands" label="Back to Brands" />
          </div>

          {/* Brand Header - Glass Morphism Theme */}
          <div className="glass rounded-3xl p-8 md:p-12 mb-12 hover-lift relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Circular Logo */}
              <div className="relative mb-6">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-2 border-primary/30 shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
                  {brand.logo_url ? (
                    <AvatarImage
                      src={brand.logo_url}
                      alt={`${brand.name} logo`}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground">
                    <div className="flex flex-col items-center justify-center">
                      {/* Crown Icon Inside Logo */}
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <div className="w-4 h-px bg-primary/40"></div>
                        <Crown className="w-4 h-4 text-primary" />
                        <div className="w-4 h-px bg-primary/40"></div>
                      </div>
                      {/* Brand Name Initials */}
                      <div className="text-xs md:text-sm font-display font-bold leading-tight">
                        {brand.name
                          .split(' ')
                          .map(word => word.charAt(0))
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    </div>
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Brand Name */}
              <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-foreground mb-3">
                {brand.name}
              </h1>

              


              {/* Description */}
              {brand.description && (
                <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-4">
                  {brand.description}
                </p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-muted rounded-2xl" />
                    <div className="h-4 bg-muted rounded w-2/3 mt-4" />
                    <div className="h-4 bg-muted rounded w-1/3 mt-2" />
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.map((product) => (
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
    </div>
  );
};

export default BrandDetail;