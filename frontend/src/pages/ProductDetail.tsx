import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import { useProduct } from "@/hooks/useProducts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const ProductDetail = () => {
  const { productId } = useParams();
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  const { data: product, isLoading } = useProduct(productId);

  // Helper function to remove "'s Brand" suffix from brand name
  const cleanBrandName = (name: string | undefined): string => {
    if (!name) return "";
    return name.replace(/'s\s+Brand$/i, "").trim();
  };

  // Update current index when carousel changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect(); // Set initial value

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout>
        <div className="pb-16 md:pb-20 container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div className="w-full max-w-full md:max-w-[50%] mx-auto md:mx-0">
              <div className="aspect-square md:aspect-[4/5] bg-muted rounded-2xl md:rounded-3xl" />
            </div>
            <div className="space-y-4 pt-6 md:pt-0 px-2 md:px-0">
              <div className="h-4 bg-muted rounded w-1/4 mx-auto md:mx-0" />
              <div className="h-8 md:h-10 bg-muted rounded w-3/4 mx-auto md:mx-0" />
              <div className="h-6 bg-muted rounded w-1/3 mx-auto md:mx-0" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6 mx-auto md:mx-0" />
              <div className="h-12 bg-muted rounded w-full md:w-auto" />
            </div>
          </div>
        </div>
        <Footer />
        </PageLayout>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout>
        <div className="pb-20 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Product Not Found
          </h1>
          <Link to="/gallery">
            <Button variant="hero">Back to Gallery</Button>
          </Link>
        </div>
        <Footer />
        </PageLayout>
      </div>
    );
  }

  const officialUrl = product.external_url || product.brand?.website;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name} - el mall</title>
        <meta
          name="description"
          content={product.description || `Shop ${product.name} on el mall`}
        />
      </Helmet>

      <PageLayout>
      <main className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Product Image Carousel - Centered, Max 50% width on desktop */}
            <div className="w-full max-w-full md:max-w-[60%] mx-auto">
              <div className="space-y-3">
                {/* Main Carousel */}
                <div className="glass rounded-2xl md:rounded-3xl overflow-hidden relative">
                  <Carousel
                    setApi={setApi}
                    opts={{
                      align: "start",
                      loop: hasMultipleImages,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="relative w-full aspect-square md:aspect-[4/5]">
                            <img
                              src={image}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {hasMultipleImages && (
                      <>
                        <CarouselPrevious className="left-2 md:left-4 bg-background/90 hover:bg-background border-border/50" />
                        <CarouselNext className="right-2 md:right-4 bg-background/90 hover:bg-background border-border/50" />
                      </>
                    )}
                  </Carousel>
                </div>

                {/* Thumbnail Images */}
                {hasMultipleImages && (
                  <div className="flex gap-2.5 justify-center md:justify-start overflow-x-auto pb-1 scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          current === index
                            ? "border-primary ring-2 ring-primary/30 scale-105"
                            : "border-border/50 hover:border-primary/60 opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info - Aligned top, consistent spacing */}
            <div className="flex flex-col items-center md:items-start pt-6 md:pt-0 px-2 md:px-0">
              {/* Brand Info */}
              {product.brand && (
                <Link
                  to={`/brand/${product.brand._id || product.brand.id || product.brand_id}`}
                  className="flex items-center gap-2.5 mb-4 group w-full md:w-auto"
                >
                  {product.brand.logo_url && (
                    <img
                      src={product.brand.logo_url}
                      alt={cleanBrandName(product.brand.name)}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover"
                    />
                  )}
                  <span className="text-sm md:text-base text-muted-foreground group-hover:text-primary transition-colors font-medium">
                    {cleanBrandName(product.brand.name)}
                  </span>
                </Link>
              )}

              <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-foreground mb-3 md:mb-4 text-center md:text-left w-full">
                {product.name}
              </h1>

              {product.price && (
                <p className="text-xl md:text-2xl font-bold text-primary mb-5 md:mb-6 w-full text-center md:text-left">
                  {product.price.toFixed(2)} TND
                </p>
              )}

              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed text-center md:text-left w-full">
                {product.description || "No description available."}
              </p>

              {/* CTA Button */}
              <div className="w-full md:w-auto mb-6 md:mb-8">
                {officialUrl ? (
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto inline-block"
                  >
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full md:w-auto gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Take Me to the Official Site
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled
                    className="w-full md:w-auto"
                  >
                    Official Site Not Available
                  </Button>
                )}
              </div>

              
            </div>
          </div>
        </div>
        </main>
      <Footer />
      </PageLayout>
    </div>
  );
};

export default ProductDetail;
