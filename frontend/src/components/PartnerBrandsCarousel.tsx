import { Avatar, AvatarImage } from "@/components/ui/avatar";

// Import brand images
import alsaterLogo from "@/assets/alsater.tn.jpg";
import spidzGenzLogo from "@/assets/spidz_genz.jpg";
import tanitLogo from "@/assets/tanit.jpg";
import tunstreetLogo from "@/assets/tunstreet.jpg";
import aachekLogo from "@/assets/9achek.tn.jpg";
import casetteLogo from "@/assets/casette.jpg";
import qowaLogo from "@/assets/qowa.jpg";
import arabiLogo from "@/assets/arabi.jpg";

// Static partner brands data
const staticBrands = [
  { name: "Alsater", logo: alsaterLogo },
  { name: "Spidz Genz", logo: spidzGenzLogo },
  { name: "Tanit", logo: tanitLogo },
  { name: "Tunstreet", logo: tunstreetLogo },
  { name: "9achek", logo: aachekLogo },
  { name: "Casette", logo: casetteLogo },
  { name: "Qowa", logo: qowaLogo },
  { name: "Arabi", logo: arabiLogo },
];

const PartnerBrandsCarousel = () => {
  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...staticBrands, ...staticBrands];

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-secondary/8 rounded-full blur-[100px] animate-pulse-slow -translate-y-1/2" style={{ animationDelay: '2s' }} />

      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background via-background/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background via-background/90 to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-8 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3">
            Partners
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Our Partner Brands
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover trusted Tunisian brands
          </p>
        </div>

        {/* Auto-scrolling Carousel */}
        <div className="relative overflow-hidden py-4">
          <div className="flex animate-scroll">
            {duplicatedBrands.map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="flex-shrink-0 mx-4 md:mx-6"
              >
                <div className="flex flex-col items-center justify-center w-48 md:w-56 glass rounded-3xl p-6 md:p-8 border border-border/30">
                  <Avatar className="w-28 h-28 md:w-32 md:h-32 border-2 border-border/50 mb-4">
                    <AvatarImage
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className="object-cover"
                    />
                  </Avatar>
                  <h3 className="text-base md:text-lg font-display font-semibold text-center text-foreground leading-tight">
                    {brand.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
          display: flex;
          width: fit-content;
          will-change: transform;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-scroll {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default PartnerBrandsCarousel;

