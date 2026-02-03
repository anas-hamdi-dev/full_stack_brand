import { useState, useEffect, useRef } from "react";
  import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Footer from "@/components/Footer";
import { useProduct, getAllImageUrls } from "@/hooks/useProducts";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import ZoomableImage from "@/components/ZoomableImage";

const ProductDetail = () => {
  const { productId } = useParams();
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

    // Auto-scroll thumbnails when current changes
    useEffect(() => {
      if (thumbnailRefs.current[current]) {
        thumbnailRefs.current[current]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, [current]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-background pt-24 pb-20">
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
        </div>
      );
    }

    if (!product) {
      return (
        <div className="min-h-screen bg-background pt-24 pb-20">
          <div className="pb-20 container mx-auto px-4 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              Product Not Found
            </h1>
            <BackButton to="/gallery" label="Back to Gallery" />
          </div>
          <Footer />
        </div>
      );
    }

    const images = getAllImageUrls(product).length > 0
      ? getAllImageUrls(product)
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];
    const hasMultipleImages = images.length > 1;

    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <Helmet>
          <title>{product.name} - el mall</title>
          <meta
            name="description"
            content={product.description || `Shop ${product.name} on el mall`}
          />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        </Helmet>

        <main className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-6">
              <BackButton to="/gallery" label="Back to Gallery" />
            </div>
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
                              <ZoomableImage
                                src={image}
                                alt={`${product.name} - Image ${index + 1}`}
                                resetTrigger={current}
                                minZoom={1}
                                maxZoom={2.5}
                                loading="lazy"
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
                          ref={(el) => {
                            thumbnailRefs.current[index] = el;
                          }}
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
                        src={typeof product.brand.logo_url === 'string' ? product.brand.logo_url : product.brand.logo_url.imageUrl}
                        alt={cleanBrandName(product.brand.name)}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover"
                        loading="lazy"
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

                {product.description ? (
                  <ul className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed w-full list-disc list-inside space-y-1 md:text-left">
                    {product.description
                      .split('\n')
                      .filter(line => line.trim())
                      .map((line, index) => (
                        <li key={index}>
                          {line.trim()}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed text-center md:text-left w-full">
                    No description available.
                  </p>
                )}

                {/* Buy Now Button */}
                {product.purchaseLink && (
                  <div className="w-full md:w-auto">
                    <Button
                      asChild
                      size="lg"
                      className="w-full md:w-auto"
                    >
                      <a
                        href={product.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buy Now
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </main>
        <Footer />
      </div>
    );
  };

  export default ProductDetail;
