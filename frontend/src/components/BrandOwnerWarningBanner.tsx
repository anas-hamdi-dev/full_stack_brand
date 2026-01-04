import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Route constant for brand details completion page
export const BRAND_DETAILS_ROUTE = "/brand-owner/complete-details";

export default function BrandOwnerWarningBanner() {
  const { user, isBrandOwner } = useAuth();
  const brandId = user?.brand_id;
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for brand owners
  if (!isBrandOwner || !user) {
    return null;
  }

  // Don't show banner if user already has a brand
  if (brandId) {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  const message = "Les détails de votre marque sont incomplets. Veuillez compléter les informations de votre marque pour accéder à toutes les fonctionnalités.";
  const buttonText = "Compléter les détails";

  return (
    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Détails incomplets</span>
              {" "}
              {message}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate(BRAND_DETAILS_ROUTE)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {buttonText}
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-yellow-500/20 rounded transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

