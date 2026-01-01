import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { staticProducts } from "@/data/staticData";
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

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return staticProducts.find(p => p.id === productId) || null;
    },
    enabled: !!productId,
  });

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
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4">  
          <div className="animate-pulse grid md:grid-cols-2 gap-12">
            <div className="h-[500px] bg-muted rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-12 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/gallery">
            <Button variant="hero">Back to Gallery</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const officialUrl = product.external_url || product.brands?.website;
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name} - el mall</title>
        <meta name="description" content={product.description || `Shop ${product.name} on el mall`} />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/gallery" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image Carousel */}
            <div className="glass rounded-3xl overflow-hidden relative">
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
                      <div className="relative w-full h-[400px] md:h-[500px]">
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
                    <CarouselPrevious className="left-4 bg-background/80 hover:bg-background" />
                    <CarouselNext className="right-4 bg-background/80 hover:bg-background" />
                  </>
                )}
              </Carousel>
              
              {/* Image Indicators/Dots */}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => api?.scrollTo(index)}
                      className={`h-2 rounded-full transition-all ${
                        current === index
                          ? "w-8 bg-primary"
                          : "w-2 bg-background/60 hover:bg-background/80"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Brand Info */}
              {product.brands && (
                <Link 
                  to={`/brand/${product.brands.id}`}
                  className="flex items-center gap-3 mb-6 group"
                >
                  {product.brands.logo_url && (
                    <img 
                      src={product.brands.logo_url} 
                      alt={product.brands.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {product.brands.name}
                  </span>
                </Link>
              )}

              <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                {product.name}
              </h1>

              {product.price && (
                <p className="text-2xl font-bold text-primary mb-6">
                  {product.price.toFixed(2)} TND
                </p>
              )}

              <p className="text-muted-foreground text-lg mb-8 flex-grow">
                {product.description || "No description available."}
              </p>

              {/* CTA Button */}
              {officialUrl ? (
                <a 
                  href={officialUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto"
                >
                  <Button variant="hero" size="lg" className="w-full md:w-auto gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Take Me to the Official Site
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" size="lg" disabled className="w-full md:w-auto">
                  Official Site Not Available
                </Button>
              )}

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">About this product</h3>
                <p className="text-sm text-muted-foreground">
                  This product is sold by {product.brands?.name || "the brand"}. Click the button above to visit their official website and complete your purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
