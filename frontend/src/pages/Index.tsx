import { Helmet } from "react-helmet";
import HeroSection from "@/components/HeroSection";
import PartnerBrandsCarousel from "@/components/PartnerBrandsCarousel";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>el mall - Discover All Tunisian Brands in One Place</title>
        <meta 
          name="description" 
          content="Explore 500+ authentic Tunisian brands across fashion, food, tech, crafts and more. The ultimate directory for discovering and supporting local Tunisian businesses."
        />
        <meta name="keywords" content="Tunisian brands, Tunisia, local brands, Tunisian fashion, Tunisian food, Tunisian startups, Made in Tunisia" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </Helmet>

      <div className="min-h-screen noise pt-24 pb-20">
        <main className="relative">
          <HeroSection />
          <PartnerBrandsCarousel />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
