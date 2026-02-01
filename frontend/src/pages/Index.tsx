import { Helmet } from "react-helmet";
import { lazy, Suspense } from "react";
// Critical above-the-fold component - load immediately for LCP
import HeroSection from "@/components/HeroSection";

// Lazy load below-the-fold components to improve FCP and LCP
const PartnerBrandsCarousel = lazy(() => import("@/components/PartnerBrandsCarousel"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

// Constants moved outside component to prevent recreation
const SITE_URL = "https://el-mall.tn";
const SITE_NAME = "el mall";
const SITE_DESCRIPTION = "Explore only the verified Tunisian clothing brands in one place.";

// Pre-create structured data outside component to avoid recreation
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": SITE_DESCRIPTION,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/brands?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/favicon.png`
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.png`,
    "description": SITE_DESCRIPTION,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+216-99-797-459",
      "contactType": "customer service",
      "email": "contact@elmall.tn"
    },
    "sameAs": ["https://www.instagram.com/elmall_tn"]
  }
] as const;

// Pre-stringify JSON to avoid re-stringification on every render
const structuredDataJson = JSON.stringify(structuredData);

const Index = () => {

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{SITE_NAME} | Best Tunisian Brands & Local Designers</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content="Tunisian brands, Tunisia, local brands, Tunisian fashion, Tunisian clothing, Made in Tunisia, Tunisian style, fashion brands Tunisia" />
        <link rel="canonical" href={SITE_URL} />
        
        {/* Performance: Resource Hints */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* SEO: Language alternates */}
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={SITE_URL} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={`${SITE_NAME} | Best Tunisian Brands & Local Designers`} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/favicon.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_URL} />
        <meta name="twitter:title" content={`${SITE_NAME} | Best Tunisian Brands`} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/favicon.png`} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="TN" />
        <meta name="geo.placename" content="Tunisia" />
      </Helmet>

      {/* Structured Data - using dangerouslySetInnerHTML for better performance */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson }} />

      <div className="min-h-screen noise pt-24 pb-20">
        <main className="relative" id="main-content" role="main">
          {/* Critical above-the-fold content - loads immediately */}
          <HeroSection />
          
          {/* Below-the-fold content - lazy loaded with Suspense */}
          <Suspense fallback={null}>
            <PartnerBrandsCarousel />
          </Suspense>
          
          <Suspense fallback={null}>
            <FeaturesSection />
          </Suspense>
          
          <Suspense fallback={null}>
            <CTASection />
          </Suspense>
        </main>
        
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Index;