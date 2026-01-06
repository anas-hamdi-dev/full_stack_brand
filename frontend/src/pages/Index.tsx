import { Helmet } from "react-helmet";
import PageLayout from "@/components/PageLayout";
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
      </Helmet>

      <div className="min-h-screen bg-background noise">
        <PageLayout>
        <main>
          <HeroSection />
          <PartnerBrandsCarousel />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
        </PageLayout>
      </div>
    </>
  );
};

export default Index;
