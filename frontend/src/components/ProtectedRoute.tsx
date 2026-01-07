import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useMyBrand } from "@/hooks/useBrands";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireClient?: boolean;
  requireBrandOwner?: boolean;
  requireAuth?: boolean;
  requireBrandApproved?: boolean; // New prop: requires brand.status === "approved"
}


export default function ProtectedRoute({ 
  children, 
  requireClient = false,
  requireBrandOwner = false,
  requireAuth = false,
  requireBrandApproved = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isClient, isBrandOwner, isBrandOwnerApproved } = useAuth();
  const location = useLocation();
  const { openLogin } = useAuthModal();
  
  // Only fetch brand if we need to check approval status and user is a brand owner
  const needsBrandCheck = requireBrandApproved && isBrandOwner && !isLoading && user;
  const { data: brand, isLoading: brandLoading } = useMyBrand({
    enabled: needsBrandCheck, // Only fetch if we need to check
  });

  useEffect(() => {
    if (!isLoading && !user && (requireAuth || requireClient || requireBrandOwner)) {
      toast.info("Please sign in to access this page");
      openLogin();
    }
  }, [isLoading, user, requireAuth, requireClient, requireBrandOwner, openLogin]);

  // Check if brand is approved
  const isBrandApproved = brand?.status === "approved";

  // Show loading if we're checking brand status
  if (isLoading || (needsBrandCheck && brandLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && (requireAuth || requireClient || requireBrandOwner)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireClient && !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass rounded-3xl p-8 max-w-md">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">This area is reserved for clients only.</p>
        </div>
      </div>
    );
  }

  if (requireBrandOwner && !isBrandOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass rounded-3xl p-8 max-w-md">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">This area is reserved for brand owners only.</p>
        </div>
      </div>
    );
  }

  // Check if brand approval is required
  if (requireBrandApproved) {
    if (!isBrandOwner) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center glass rounded-3xl p-8 max-w-md">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">This area is reserved for brand owners only.</p>
          </div>
        </div>
      );
    }

    if (!brand) {
      return (
        <Navigate to="/brand-owner/complete-details" state={{ from: location }} replace />
      );
    }

    if (!isBrandApproved) {
      // Redirect to pending approval page
      return (
        <Navigate to="/brand-owner/pending-approval" state={{ from: location }} replace />
      );
    }
  }

  // Note: CompleteBrandDetails page blocks access if user already has a brand
  // This check is handled in the CompleteBrandDetails component itself

  return <>{children}</>;
}
