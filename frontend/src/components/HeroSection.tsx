import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";

const stats = [
  { value: "50+", label: "Brands", className: "text-gradient-primary" },
  { value: "8", label: "Categories", className: "text-gradient-secondary" },
  { value: "24", label: "Governorates", className: "text-foreground" },
] as const;

const HeroSection = memo(() => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 -mt-4"
      aria-label="Hero section"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up-delay-1">
            <span className="text-foreground">all tunisian</span>
            <span 
              className="inline-block text-5xl md:text-7xl lg:text-8xl animate-pepper-float transition-transform duration-800 hover:scale-110 cursor-default select-none"
              aria-label="Tunisian pepper emoji"
              role="img"
            >
              🌶️
            </span>
            <br />
            <span className="text-gradient-primary">brands</span>
            <span className="text-foreground">, in One Place</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up-delay-2">
            Explore all Tunisian clothing brands & products in one place
          </p>

          {/* CTA Buttons */}
          <nav className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-3" aria-label="Main navigation">
            <Link to="/brands" aria-label="Explore all Tunisian brands">
              <Button variant="hero" size="xl" className="group">
                Explore Brands
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/gallery" aria-label="View brand gallery">
              <Button variant="hero-outline" size="xl" className="group">
                <ShoppingBag className="w-5 h-5 mr-2" aria-hidden="true" />
                View Gallery
              </Button>
            </Link>
          </nav>

          {/* Stats */}
          <div 
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-slide-up-delay-4"
            role="region"
            aria-label="Platform statistics"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`font-display text-3xl md:text-4xl font-bold ${stat.className}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
