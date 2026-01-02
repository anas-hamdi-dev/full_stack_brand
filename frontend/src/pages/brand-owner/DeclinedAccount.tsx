import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Mail, LogOut, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DeclinedAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const handleContact = () => {
    navigate("/contact");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-foreground">
            Compte banni
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Votre compte a été banni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Votre compte vendeur a été banni par notre équipe administrative. Vous n'avez plus accès à votre tableau de bord.
            </p>
            {user?.banReason && (
              <div className="p-4 bg-muted/50 rounded-lg text-left">
                <p className="text-sm font-medium text-foreground mb-1">Raison du bannissement:</p>
                <p className="text-sm text-muted-foreground">{user.banReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter.
            </p>
          </div>

          {user?.email && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Email de contact</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-border">
            <Button
              className="w-full"
              onClick={handleContact}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Nous contacter
            </Button>
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
