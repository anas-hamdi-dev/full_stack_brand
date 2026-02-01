import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, Check, TrendingUp } from "lucide-react";
import { useAuthModal } from "@/contexts/AuthModalContext";

const benefits = [
  "Free listing",
  "Simple brand submission",
] as const;

const CTASection = memo(() => {
  const { openSignUpAsBrandOwner } = useAuthModal();

  // Memoize background decoration styles
  const decorationStyles = useMemo(() => ({
    topRight: { position: 'absolute' as const, top: 0, right: 0, width: '20rem', height: '20rem' },
    bottomLeft: { position: 'absolute' as const, bottom: 0, left: 0, width: '15rem', height: '15rem' },
  }), []);

  return (
    <section 
      className="py-24 relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      <div className="container mx-auto px-4">
        <div className="relative glass-strong rounded-3xl p-12 md:p-16 overflow-hidden">
          {/* Background decorations */}
          <div 
            className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" 
            aria-hidden="true"
          />
          <div 
            className="absolute bottom-0 left-0 w-60 h-60 bg-secondary/15 rounded-full blur-[80px]" 
            aria-hidden="true"
          />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-8" aria-hidden="true">
              <Shirt className="w-8 h-8 text-primary-foreground" />
            </div>

            <h2 
              id="cta-heading"
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
            >
              Own a Fashion Brand?
              <br />
              <span className="text-gradient-secondary">Get Listed Today</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              List your brand and grow your audience nationwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-3">
              <Button 
                variant="glass" 
                className="bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90 group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" 
                size="xl" 
                onClick={openSignUpAsBrandOwner}
                aria-label="Sign up as brand owner to list your fashion brand"
              >
                Boost your brand's visibility now
                <TrendingUp 
                  className="w-5 h-5 ml-2 transition-transform group-hover:scale-110 group-hover:rotate-12" 
                  aria-hidden="true"
                />
              </Button>
            </div>

            <ul 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-sm text-muted-foreground"
              role="list"
            >
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2" role="listitem">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;
