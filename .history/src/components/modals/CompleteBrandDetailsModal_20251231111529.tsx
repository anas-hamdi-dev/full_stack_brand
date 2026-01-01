import { useState, useEffect, useRef } from "react";
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
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { staticBrands, updateBrand } from "@/data/staticData";
import { supabase } from "@/integrations/supabase/client";

type BrandDetailsFormData = {
  name: string;
  category_id: string;
  logoFile: File | null;
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BrandDetailsFormData>({
    name: "",
    category_id: "",
    logoFile: null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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
          logoFile: null,
        });
        setLogoPreview(existingBrand.logo_url || null);
      }
    }
    // Reset submission state when modal opens
    if (open) {
      setIsSubmitted(false);
    }
  }, [user?.brand_id, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        toast.error("Seuls les fichiers JPEG, PNG et WebP sont autorisés");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }
      setFormData({ ...formData, logoFile: file });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoFile: null });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadLogo = async (file: File, brandId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${brandId}/${Date.now()}.${fileExt}`;
    const filePath = `brand-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist or access denied, provide helpful error
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("new row violates")) {
        throw new Error(
          "Le bucket de stockage n'existe pas. Veuillez créer un bucket 'brand-assets' dans Supabase Storage."
        );
      }
      throw new Error(`Échec du téléchargement: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!formData.logoFile) {
      toast.error("Veuillez télécharger un logo");
      return;
    }

    if (!user?.brand_id) {
      toast.error("No brand found for this account");
      return;
    }

    setIsLoading(true);

    try {
      // Upload logo first
      const logoUrl = await uploadLogo(formData.logoFile, user.brand_id);

      // Update brand with logo URL
      updateBrand(user.brand_id, {
        name: formData.name,
        category_id: formData.category_id,
        logo_url: logoUrl,
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
      const errorMessage = error instanceof Error ? error.message : "Failed to update brand details";
      toast.error(errorMessage);
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
    if (!newOpen && !isSubmitted) {
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
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
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
              
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
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

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="brandLogo">
              Logo de la marque <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3">
              {logoPreview ? (
                <div className="relative w-full h-48 border-2 border-dashed border-input rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-4"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveLogo}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="brandLogo"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="brandLogo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium shadow-lg"
              disabled={
                isLoading ||
                !formData.name ||
                !formData.category_id ||
                !formData.logoFile
              }
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
            {(!formData.name || !formData.category_id || !formData.logoFile) && (
              <p className="text-xs text-muted-foreground text-center">
                Veuillez remplir tous les champs obligatoires pour continuer
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
