import { useAuth } from "@/contexts/AuthContext";
import { useMyBrand } from "@/hooks/useBrands";
import { Loader2, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { user, isBrandOwner } = useAuth();
  const { data: brand, isLoading } = useMyBrand();
  const navigate = useNavigate();

  if (!isBrandOwner) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Accès refusé
            </h1>
            <p className="text-muted-foreground">
              Cette page est réservée aux vendeurs.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </PageLayout>
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
    <PageLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            {isPending && (
              <>
                <Clock className="h-20 w-20 mx-auto text-yellow-500 mb-6 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  En attente d'approbation
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Votre demande de marque est en cours d'examen par notre équipe.
                </p>
                <p className="text-sm text-muted-foreground">
                  L'approbation administrative peut prendre jusqu'à 24 heures.
                </p>
              </>
            )}

            {isRejected && (
              <>
                <XCircle className="h-20 w-20 mx-auto text-destructive mb-6" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Demande rejetée
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Votre demande de marque a été rejetée.
                </p>
                <p className="text-sm text-muted-foreground">
                  Veuillez contacter le support pour plus d'informations.
                </p>
              </>
            )}

            {!status && (
              <>
                <AlertCircle className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Statut inconnu
                </h1>
                <p className="text-lg text-muted-foreground">
                  Impossible de déterminer le statut de votre marque.
                </p>
              </>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Informations de votre marque
            </h2>
            {brand && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nom de la marque:</span>
                  <span className="font-medium text-foreground">{brand.name}</span>
                </div>
                {brand.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Catégorie:</span>
                    <span className="font-medium text-foreground">{brand.category.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Statut:</span>
                  <span className="font-medium">
                    {isPending && (
                      <span className="text-yellow-500">En attente</span>
                    )}
                    {isRejected && (
                      <span className="text-destructive">Rejeté</span>
                    )}
                    {!status && (
                      <span className="text-muted-foreground">Non défini</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isPending && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Que se passe-t-il ensuite?</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Notre équipe examine votre demande de marque</li>
                  <li>Vous recevrez une notification une fois la décision prise</li>
                  <li>Une fois approuvé, vous pourrez accéder à toutes les fonctionnalités</li>
                </ul>
              </div>
            )}

            {isRejected && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Pourquoi ma demande a-t-elle été rejetée?</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les raisons courantes incluent des informations incomplètes, des violations des conditions d'utilisation, ou des problèmes avec les documents fournis. 
                  Veuillez contacter notre support pour obtenir des détails spécifiques.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/brand-owner/brand")}
                className="flex-1"
              >
                Voir les détails de la marque
              </Button>
              {isRejected && (
                <Button
                  onClick={() => navigate("/contact")}
                  className="flex-1"
                >
                  Contacter le support
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

