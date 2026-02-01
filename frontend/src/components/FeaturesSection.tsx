import { memo, useMemo } from "react";
import { Heart, Globe, Shirt } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Discover Local Fashion",
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
] as const;

const FeaturesSection = memo(() => {
  // Memoize animated orb styles to prevent recalculation
  const orbStyles = useMemo(() => ({
    top: { animationDelay: '0s' },
    bottom: { animationDelay: '2s' },
  }), []);

  return (
    <section 
      id="features" 
      className="py-24 relative overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" aria-hidden="true" />
      
      {/* Animated Orbs */}
      <div 
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" 
        aria-hidden="true"
        style={orbStyles.top}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/8 rounded-full blur-[100px] animate-pulse-slow" 
        aria-hidden="true"
        style={orbStyles.bottom}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <header className="text-center mb-16">
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 
            id="features-heading"
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Why Choose <span className="text-gradient-primary">el mall</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover what makes us the premier destination for Tunisian fashion brands
          </p>
        </header>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <article 
                key={feature.title}
                className="glass rounded-3xl p-8 flex flex-col items-start hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
                role="listitem"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6" aria-hidden="true">
                  <IconComponent className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-2xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;






