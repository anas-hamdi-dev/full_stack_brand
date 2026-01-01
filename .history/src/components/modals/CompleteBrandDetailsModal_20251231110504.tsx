import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Store, Sparkles } from "lucide-react";
import { z } from "zod";
import { useCategories } from "@/hooks/useCategories";
import { staticBrands, updateBrand } from "@/data/staticData";

const brandDetailsSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  facebook: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type BrandDetailsFormData = z.infer<typeof brandDetailsSchema>;

interface CompleteBrandDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function CompleteBrandDetailsModal({
  open,
  onOpenChange,
  onComplete,
}: CompleteBrandDetailsModalProps) {
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const [formData, setFormData] = useState<BrandDetailsFormData>({
    name: "",
    category_id: "",
    description: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load existing brand data if available
  useEffect(() => {
    if (user?.brand_id && open) {
      const existingBrand = staticBrands.find((b) => b.id === user.brand_id);
      if (existingBrand) {
        setFormData({
          name: existingBrand.name || "",
          category_id: existingBrand.category_id || "",
          description: existingBrand.description || "",
          location: existingBrand.location || "",
          website: existingBrand.website || "",
          instagram: existingBrand.instagram || "",
          facebook: existingBrand.facebook || "",
        });
      }
    }
    // Reset submission state when modal opens
    if (open) {
      setIsSubmitted(false);
    }
  }, [user?.brand_id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = brandDetailsSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (!user?.brand_id) {
      toast.error("No brand found for this account");
      return;
    }

    setIsLoading(true);

    try {
      updateBrand(user.brand_id, {
        name: formData.name,
        category_id: formData.category_id,
        description: formData.description || null,
        location: formData.location || null,
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
      });

      toast.success("Informations de la marque mises à jour avec succès!");
      setIsLoading(false);
      setIsSubmitted(true);
      // Allow closing only after successful submission
      setTimeout(() => {
        onOpenChange(false);
        onComplete();
      }, 500);
    } catch (error) {
      toast.error("Failed to update brand details");
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Allow opening the modal
    if (newOpen) {
      onOpenChange(newOpen);
      return;
    }
    // Only allow closing after successful submission
    // Completely prevent closing by any user interaction until form is submitted
    if (!newOpen && !isSubmitted) {
      // Prevent closing - modal must remain open until submission
      return;
    }
    // Only allow closing if submission was successful
    if (!newOpen && isSubmitted) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-display font-bold text-foreground">
                Complétez les détails de votre marque
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Ajoutez les informations importantes pour que les clients puissent découvrir votre marque.
                <span className="block mt-1 text-destructive font-medium">
                  ⚠️ Veuillez compléter ce formulaire pour continuer.
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brandName">
                Nom de la marque <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brandName"
                placeholder="Ex: Ma Marque de Mode"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Brand Category */}
            <div className="space-y-2">
              <Label htmlFor="brandCategory">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
                required
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Description */}
            <div className="space-y-2">
              <Label htmlFor="brandDescription">Description</Label>
              <textarea
                id="brandDescription"
                placeholder="Décrivez votre marque, son histoire, ses valeurs..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Brand Location */}
            <div className="space-y-2">
              <Label htmlFor="brandLocation">Localisation</Label>
              <Input
                id="brandLocation"
                placeholder="Ex: Tunis, Tunisia"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="bg-background"
              />
            </div>

            {/* Brand Website */}
            <div className="space-y-2">
              <Label htmlFor="brandWebsite">Site web</Label>
              <Input
                id="brandWebsite"
                type="url"
                placeholder="https://www.example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="bg-background"
              />
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandInstagram">Instagram</Label>
                <Input
                  id="brandInstagram"
                  placeholder="@username ou URL"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandFacebook">Facebook</Label>
                <Input
                  id="brandFacebook"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={formData.facebook}
                  onChange={(e) =>
                    setFormData({ ...formData, facebook: e.target.value })
                  }
                  className="bg-background"
                />  
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Store className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Pourquoi compléter ces informations?
                </p>
                <p className="mb-2">
                  Les clients pourront mieux découvrir votre marque et vous contacter facilement.
                  Vous pourrez toujours modifier ces informations plus tard depuis votre tableau de bord.
                </p>
                <p className="text-destructive font-medium text-xs mt-2 pt-2 border-t border-primary/20">
                  ⚠️ Cette étape est obligatoire. Veuillez remplir au moins les champs marqués d'un astérisque (*) pour continuer.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium shadow-lg"
                disabled={isLoading || !formData.name || !formData.category_id}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les détails"
                )}
              </Button>
              {(!formData.name || !formData.category_id) && (
                <p className="text-xs text-muted-foreground text-center">
                  Veuillez remplir les champs obligatoires (nom et catégorie) pour continuer
                </p>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

