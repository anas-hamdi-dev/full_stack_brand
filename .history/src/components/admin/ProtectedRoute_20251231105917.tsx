import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireClient?: boolean;
  requireBrandOwner?: boolean;
  requireAuth?: boolean;
}


export default function ProtectedRoute({ 
  children, 
  requireClient = false,
  requireBrandOwner = false,
  requireAuth = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isClient, isBrandOwner } = useAuth();
  const location = useLocation();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    if (!isLoading && !user && (requireAuth || requireClient || requireBrandOwner)) {
      toast.info("Veuillez vous connecter pour accéder à cette page");
      openLogin();
    }
  }, [isLoading, user, requireAuth, requireClient, requireBrandOwner, openLogin]);

  if (isLoading) {
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
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Cette zone est réservée aux clients uniquement.</p>
        </div>
      </div>
    );
  }

  if (requireBrandOwner && !isBrandOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass rounded-3xl p-8 max-w-md">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Cette zone est réservée aux vendeurs uniquement.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

