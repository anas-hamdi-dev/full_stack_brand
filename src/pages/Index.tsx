import { Helmet } from "react-helmet";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedSection from "@/components/FeaturedSection";
import AboutSection from "@/components/AboutSection";
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
        <Navbar />
        <main>
          <HeroSection />
          <CategoriesSection />
          <FeaturedSection />
          <AboutSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
