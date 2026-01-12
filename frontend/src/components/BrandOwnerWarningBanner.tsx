import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Route constant for brand details completion page
export const BRAND_DETAILS_ROUTE = "/brand-owner/complete-details";

export default function BrandOwnerWarningBanner() {
  const { user, isBrandOwner } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Strict check: Only show for brand owners
  if (!isBrandOwner || !user) {
    return null;
  }

  // Strict check based on backend data: Never show banner if user has a brand_id
  // This check is based solely on backend data (user.brand_id from the API)
  if (user.brand_id) {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  const message = "Your brand details are incomplete. Please complete your brand information to access all features.";
  const buttonText = "Complete Details";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-yellow-500/10 border-t border-yellow-500/20 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Incomplete Brand  Details</span>
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
              aria-label="Close"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

