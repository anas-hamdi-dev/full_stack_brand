import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, User, Store } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["client", "brand_owner"]),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function SignUpModal({ open, onOpenChange, onSwitchToLogin }: SignUpModalProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "client",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsLoading(true);
    
    const { error, user: newUser } = await signUp({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      role: formData.role,
    });
    
    if (error) {
      toast.error(error.message || "Failed to create account");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    
    // Close signup modal
    onOpenChange(false);
    
    // Handle post-signup flow based on role
    if (formData.role === "brand_owner") {
      toast.success("Compte créé avec succès! Vous pouvez maintenant créer votre marque depuis votre profil.");
      // Brand owners can create their brand later from their profile
      navigate("/");
    } else {
      // For clients, redirect to dashboard
      toast.success("Compte créé avec succès!");
      navigate("/client/dashboard");
    }
    
    // Reset form
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "client",
      acceptTerms: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-display font-bold text-foreground text-center">
            Créer un nouveau compte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground text-center text-sm">
            Rejoignez notre communauté de mode tunisienne
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Je suis un(e) :</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "client" })}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    formData.role === "client"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <User className="h-8 w-8 text-foreground" />
                    <span className="font-medium text-foreground">Client</span>
                  </div>
                  {formData.role === "client" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "brand_owner" })}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    formData.role === "brand_owner"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Store className="h-8 w-8 text-foreground" />
                    <span className="font-medium text-foreground">Vendeur</span>
                  </div>
                  {formData.role === "brand_owner" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Votre nom complet"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+216 12 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe (minimum 8 caractères)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked === true })}
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                En cliquant sur Inscription, vous acceptez nos{" "}
                <a href="#" className="underline hover:text-primary">Termes et conditions</a> et{" "}
                <a href="#" className="underline hover:text-primary">Politique de confidentialité</a>.
                Vous pouvez recevoir des notifications par SMS et par e-mail de notre part.
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToLogin();
                }}
                className="text-primary hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

