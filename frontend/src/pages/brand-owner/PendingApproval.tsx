import { useAuth } from "@/contexts/AuthContext";
import { useMyBrand } from "@/hooks/useBrands";
import { Loader2, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { user, isBrandOwner } = useAuth();
  const { data: brand, isLoading } = useMyBrand();
  const navigate = useNavigate();

  if (!isBrandOwner) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground">
              This page is reserved for brand owners.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const status = brand?.status;
  const isApproved = status === "approved";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  // If approved, redirect to brand details
  if (isApproved) {
    navigate("/brand-owner/brand", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            {isPending && (
              <>
                <Clock className="h-20 w-20 mx-auto text-yellow-500 mb-6 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Pending Approval
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Your brand request is being reviewed by our team.
                </p>
                <p className="text-sm text-muted-foreground">
                  Administrative approval may take up to 24 hours.
                </p>
              </>
            )}

            {isRejected && (
              <>
                <XCircle className="h-20 w-20 mx-auto text-destructive mb-6" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Request Rejected
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Your brand request has been rejected.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact support for more information.
                </p>
              </>
            )}

            {!status && (
              <>
                <AlertCircle className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Unknown Status
                </h1>
                <p className="text-lg text-muted-foreground">
                  Unable to determine your brand status.
                </p>
              </> 
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}







