import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Globe, Shirt } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Support Local Fashion",
    description: "Every brand listed is 100% Tunisian-owned, helping you invest in our local fashion industry.",
  },
  {
    icon: Globe,
    title: "Tunisian Style Worldwide",
    description: "Connecting Tunisian fashion excellence with style enthusiasts globally.",
  },
  {
    icon: Shirt,
    title: "Curated Collections",
    description: "From streetwear to traditional, we showcase the best of Tunisian fashion diversity.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block text-secondary font-medium text-sm uppercase tracking-wider mb-4">
              About el mall
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Celebrating Tunisia's <span className="text-gradient-primary">Fashion Scene</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              el mall is the ultimate directory for discovering and supporting authentic Tunisian fashion brands. 
              From traditional tailors in the Medina to modern streetwear labels, we showcase the 
              diversity and creativity of our nation's fashion landscape.
            </p>
            <Button variant="hero" size="lg" className="group">
              Join Our Community
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Right - Feature Cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="glass rounded-2xl p-6 flex items-start gap-5 hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
