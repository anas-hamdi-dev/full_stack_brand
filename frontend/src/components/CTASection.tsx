import { Button } from "@/components/ui/button";
import { Shirt, Check, TrendingUp } from "lucide-react";
import { useAuthModal } from "@/contexts/AuthModalContext";

const CTASection = () => {
  const { openSignUpAsBrandOwner } = useAuthModal();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative glass-strong rounded-3xl p-12 md:p-16 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-secondary/15 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-8">
              <Shirt className="w-8 h-8 text-primary-foreground" />
            </div>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Own a Fashion Brand?
              <br />
              <span className="text-gradient-secondary">Get Listed Today</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            List your brand and grow your audience nationwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-3">
              <Button variant="glass" className="bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90 group" size="xl" onClick={openSignUpAsBrandOwner}>
              Boost your brand's visibility now
              <TrendingUp className="w-5 h-5 ml-2 transition-transform group-hover:scale-110" />
              </Button>
            </div>

            {/* <Link to="/brands"> */}
              {/* <Button variant="hero" size="xl" className="group">
                Explore Brands
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button> */}
            {/* </Link> */}
          {/* </div> */}

            <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Free listing</span>
              </li>
              
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>simple brand submission </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
