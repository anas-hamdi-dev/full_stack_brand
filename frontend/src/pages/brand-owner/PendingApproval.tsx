import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PendingApproval() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-foreground">
            Compte en attente d'approbation
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Votre compte est en cours de révision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Merci pour votre inscription ! Votre compte de vendeur est actuellement en attente d'approbation par notre équipe administrative.
            </p>
            <p className="text-sm text-muted-foreground">
              Nous examinerons votre demande et vous informerons par email une fois que votre compte sera approuvé. Ce processus peut prendre quelques jours.
            </p>
          </div>

          {user?.email && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Email de notification</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
