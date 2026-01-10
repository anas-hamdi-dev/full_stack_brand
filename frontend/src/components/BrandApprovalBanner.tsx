import { useMyBrand } from "@/hooks/useBrands";
import { Clock, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BrandApprovalBanner() {
  const { data: brand, isLoading } = useMyBrand();

  if (isLoading || !brand) {
    return null;
  }

  const status = brand.status;
  const isApproved = status === "approved";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  // Don't show banner if approved
  if (isApproved) {
    return null;
  }

  return (
    <Alert
      variant={isRejected ? "destructive" : "default"}
      className="mb-6 border-2"
    >
      {isPending && (
        <>
          <Clock className="h-4 w-4" />
          <AlertTitle>En attente d'approbation</AlertTitle>
          <AlertDescription>
            Votre demande de marque est en cours d'examen. L'approbation administrative peut prendre jusqu'à 24 heures. 
            Vous pourrez modifier les détails de votre marque une fois approuvée.
          </AlertDescription>
        </>
      )}
      {isRejected && (
        <>
          <XCircle className="h-4 w-4" />
          <AlertTitle>Demande rejetée</AlertTitle>
          <AlertDescription>
            Votre demande de marque a été rejetée. Veuillez contacter le support pour plus d'informations.
          </AlertDescription>
        </>
      )}
      {!status && (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Statut inconnu</AlertTitle>
          <AlertDescription>
            Impossible de déterminer le statut de votre marque. Veuillez contacter le support.
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}

