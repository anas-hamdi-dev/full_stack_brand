import { Button } from "@/components/ui/button";
import { Shirt } from "lucide-react";
import BrandSubmissionDialog from "./BrandSubmissionDialog";

const CTASection = () => {
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
              Join Tunisia's premier fashion directory and showcase your brand to thousands 
              of fashion enthusiasts and potential customers every month.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <BrandSubmissionDialog />
              <Button variant="glass" size="xl">
                Learn More
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Free listing • No hidden fees • Verified fashion brands only
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
