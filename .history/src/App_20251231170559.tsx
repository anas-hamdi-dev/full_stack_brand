import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import ScrollToTop from "./components/ScrollToTop";
import AuthModals from "./components/modals/AuthModals";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Brands from "./pages/Brands";
import BrandDetail from "./pages/BrandDetail";
import ProductDetail from "./pages/ProductDetail";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Submit from "./pages/Submit";
import Category from "./pages/Category";
import NotFound from "./pages/NotFound";
import ClientFavorites from "./pages/client/Favorites";
import BrandOwnerDashboard from "./pages/brand-owner/BrandOwnerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthModalProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AuthModals />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brand/:brandId" element={<BrandDetail />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/category/:categoryName" element={<Category />} />
            
            {/* Client Routes */}
            <Route path="/client/dashboard" element={<ProtectedRoute requireClient><ClientFavorites /></ProtectedRoute>} />
            <Route path="/client/favorites" element={<ProtectedRoute requireClient><ClientFavorites /></ProtectedRoute>} />
            
            {/* Brand Owner Routes */}
            <Route path="/brand-owner/dashboard" element={<ProtectedRoute requireBrandOwner><BrandOwnerDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthModalProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;


