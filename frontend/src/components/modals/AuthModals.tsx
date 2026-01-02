import { useEffect, useRef } from "react";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import CompleteBrandDetailsModal from "./CompleteBrandDetailsModal";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/hooks/useBrands";

export default function AuthModals() {
  const {
    loginOpen,
    signUpOpen,
    completeBrandDetailsOpen,
    setLoginOpen,
    setSignUpOpen,
    setCompleteBrandDetailsOpen,
    openSignUp,
    openLogin,
    openCompleteBrandDetails,
  } = useAuthModal();
  const { user, isBrandOwner } = useAuth();
  const brandId = user?.brand_id;
  const { data: brand } = useBrand(brandId || undefined);
  
  // Track if user has dismissed the modal to prevent auto-reopening
  const hasDismissedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Check if brand details are incomplete
  const isBrandDetailsIncomplete = () => {
    if (!user || !isBrandOwner) return false;
    
    // If user doesn't have a brand_id yet, brand details are incomplete
    if (!brandId) return true;
    
    // If brand is still loading, wait
    if (brand === undefined) return false;
    
    // If brand doesn't exist yet, it's incomplete
    if (!brand) return true;
    
    // Check if brand has minimal info (temporary name indicates incomplete)
    // Also check if essential fields are missing
    return (
      brand.name.includes("'s Brand") ||
      !brand.description ||
      !brand.location ||
      !brand.category_id ||
      !brand.logo_url
    );
  };

  // Reset dismissal flag when user changes
  useEffect(() => {
    if (user?.id !== lastUserIdRef.current) {
      hasDismissedRef.current = false;
      lastUserIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Show complete brand details modal after sign-up or login if brand is incomplete
  // Only auto-open once per user session, not when user dismisses it
  useEffect(() => {
    if (
      user && 
      isBrandOwner && 
      !completeBrandDetailsOpen && 
      !hasDismissedRef.current
    ) {
      // Check if brand details are incomplete
      const incomplete = isBrandDetailsIncomplete();
      
      if (incomplete) {
        // Small delay to let other modals close first and brand data to load
        const timer = setTimeout(() => {
          openCompleteBrandDetails();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isBrandOwner, brand, completeBrandDetailsOpen, openCompleteBrandDetails, brandId]);

  const handleBrandDetailsComplete = () => {
    setCompleteBrandDetailsOpen(false);
    // Mark as dismissed to prevent reopening after successful completion
    hasDismissedRef.current = true;
  };

  const handleBrandDetailsDismiss = () => {
    setCompleteBrandDetailsOpen(false);
    // Mark as dismissed to prevent auto-reopening
    hasDismissedRef.current = true;
  };

  return (
    <>
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignUp={openSignUp}
      />
      <SignUpModal
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToLogin={openLogin}
      />
      <CompleteBrandDetailsModal
        open={completeBrandDetailsOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleBrandDetailsDismiss();
          } else {
            setCompleteBrandDetailsOpen(open);
          }
        }}
        onComplete={handleBrandDetailsComplete}
      />
    </>
  );
}
