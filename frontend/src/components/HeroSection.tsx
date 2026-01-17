import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 -mt-4">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up-delay-1">
            <span className="text-foreground">all tunisian</span>
            <span className="pepper-3d text-5xl md:text-7xl lg:text-8xl inline-block" style={{ animation: 'pepperFloat 2s ease-in-out infinite' }}>🌶️</span>
            <br />
            <span className="text-gradient-primary">brands</span>
            <span className="text-foreground">, in  One Place</span>
          </h1>


          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up-delay-2">
          explore all tunisian  clothing  brands & products  in one place
           
            </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-3">
            <Link to="/brands">
              <Button variant="hero" size="xl" className="group">
                Explore Brands
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" size="xl" className="group bg-transparent hover:bg-transparent hover:border-primary/30 hover:text-primary">
                <ShoppingBag className="w-5 h-5 mr-2" />
                View Gallery
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-slide-up-delay-4">
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient-primary">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Brands</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient-secondary">8</div>
              <div className="text-sm text-muted-foreground mt-1">Categories</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-foreground">24</div>
              <div className="text-sm text-muted-foreground mt-1">Governorates</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
