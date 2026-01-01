import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import BrandSubmissionDialog from "./BrandSubmissionDialog";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-muted-foreground">Discover Tunisian Fashion Brands</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up-delay-1">
            <span className="text-foreground">Tunisian</span>
            <br />
            <span className="text-gradient-primary">Fashion</span>
            <span className="text-foreground">, One Place</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up-delay-2">
            Explore the best of Tunisia's fashion scene. From streetwear to traditional, 
            men's classics to women's trends — discover authentic fashion brands defining our style.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-3">
            <Link to="/brands">
              <Button variant="hero" size="xl" className="group">
                Explore Brands
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <BrandSubmissionDialog 
              trigger={
                <Button variant="hero-outline" size="xl">
                  Submit Your Brand
                </Button>
              }
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-slide-up-delay-4">
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient-primary">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Fashion Brands</div>
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

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
