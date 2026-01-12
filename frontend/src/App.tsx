import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import AuthModals from "./components/modals/AuthModals";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import BrandOwnerWarningBanner from "./components/BrandOwnerWarningBanner";
import useMobileInputFocus from "./hooks/useMobileInputFocus";
import Index from "./pages/Index";
import Brands from "./pages/Brands";
import BrandDetail from "./pages/BrandDetail";
import ProductDetail from "./pages/ProductDetail";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ClientFavorites from "./pages/client/Favorites";
import CompleteBrandDetails from "./pages/brand-owner/CompleteBrandDetails";
import BrandOwnerProfile from "./pages/brand-owner/BrandOwnerProfile";
import BrandDetails from "./pages/brand-owner/BrandDetails";
import ProductsManagement from "./pages/brand-owner/ProductsManagement";
import PendingApproval from "./pages/brand-owner/PendingApproval";
import EmailVerification from "./pages/EmailVerification";
import { BRAND_DETAILS_ROUTE } from "./components/BrandOwnerWarningBanner";

const queryClient = new QueryClient();

const App = () => {
  useMobileInputFocus();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
              <ScrollToTopButton />
              <Navbar />
              <BrandOwnerWarningBanner />
              <AuthModals />
              {/* Global Background */}
              <div className="fixed inset-0 -z-10 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{ background: "var(--gradient-hero)" }}
                />
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute top-0 right-1/4 w-48 h-48 bg-secondary/8 rounded-full blur-[80px]" />
              </div>
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brand/:brandId" element={<BrandDetail />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            {/* Email Verification */}
            <Route path="/verify-email" element={<EmailVerification />} />
            {/* Client Routes */}
            <Route path="/client/dashboard" element={<ProtectedRoute requireClient><ClientFavorites /></ProtectedRoute>} />
            <Route path="/client/favorites" element={<ProtectedRoute requireClient><ClientFavorites /></ProtectedRoute>} />
            
            {/* Brand Owner Routes */}
            <Route path={BRAND_DETAILS_ROUTE} element={<ProtectedRoute requireBrandOwner><CompleteBrandDetails /></ProtectedRoute>} />
            <Route path="/brand-owner/pending-approval" element={<ProtectedRoute requireBrandOwner><PendingApproval /></ProtectedRoute>} />
            <Route path="/brand-owner/profile" element={<ProtectedRoute requireBrandOwner ><BrandOwnerProfile /></ProtectedRoute>} />
            <Route path="/brand-owner/brand" element={<ProtectedRoute requireBrandOwner requireBrandApproved><BrandDetails /></ProtectedRoute>} />
            <Route path="/brand-owner/products" element={<ProtectedRoute requireBrandOwner requireBrandApproved><ProductsManagement /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;


