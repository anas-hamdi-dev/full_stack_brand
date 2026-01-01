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
import { useBrand } from "@/hooks/useBrands";
import { brandsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

type BrandDetailsFormData = {
  name: string;
  category_id: string;
  description: string;
  logoFile: File | null;
  existingLogoUrl: string | null;
  location: string;
  website: string;
  instagram: string;
  facebook: string;
  phone: string;
  email: string;
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
  const queryClient = useQueryClient();
  const brandId = user?.brand_id || user?.brand_id;
  const { data: existingBrand } = useBrand(brandId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BrandDetailsFormData>({
    name: "",
    category_id: "",
    description: "",
    logoFile: null,
    existingLogoUrl: null,
    location: "",
    website: "",
    instagram: "",
    facebook: "",
    phone: "",
    email: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load existing brand data if available
  useEffect(() => {
    if (existingBrand && open) {
      const existingLogo = existingBrand.logo_url || null;
      setFormData({
        name: existingBrand.name || "",
        category_id: existingBrand.category_id || existingBrand.category?._id || "",
        description: existingBrand.description || "",
        logoFile: null,
        existingLogoUrl: existingLogo,
        location: existingBrand.location || "",
        website: existingBrand.website || "",
        instagram: existingBrand.instagram || "",
        facebook: existingBrand.facebook || "",
        phone: existingBrand.phone || "",
        email: existingBrand.email || "",
      });
      setLogoPreview(existingLogo);
    } else if (open) {
      // Reset form when opening without existing brand
      setFormData({
        name: "",
        category_id: "",
        description: "",
        logoFile: null,
        existingLogoUrl: null,
        location: "",
        website: "",
        instagram: "",
        facebook: "",
        phone: "",
        email: "",
      });
      setLogoPreview(null);
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
      // Clear existing logo URL when new file is selected
      setFormData({ ...formData, logoFile: file, existingLogoUrl: null });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoFile: null, existingLogoUrl: null });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert file to base64 data URL for static data storage
  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Logo is required - either existing or new upload
    if (!formData.logoFile && !formData.existingLogoUrl) {
      toast.error("Veuillez télécharger un logo");
      return;
    }

    const brandId = user?.brand_id || user?.brand_id;
    if (!brandId) {
      toast.error("No brand found for this account");
      return;
    }

    setIsLoading(true);

    try {
      let logoUrl = formData.existingLogoUrl;

      // Convert new logo file to data URL if uploaded
      if (formData.logoFile) {
        logoUrl = await convertFileToDataUrl(formData.logoFile);
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        category_id: formData.category_id || null,
        description: formData.description || null,
        logo_url: logoUrl,
        location: formData.location || null,
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        phone: formData.phone || null,
        email: formData.email || null,
      };

      // Update brand with all data via backend API
      const response = await brandsApi.update(brandId, updateData);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });

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
                  <SelectItem key={category.id || category._id} value={category.id || category._id}>
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
              disabled={isLoading}
            />
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
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      title="Remplacer le logo"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                      onClick={handleRemoveLogo}
                      disabled={isLoading}
                      title="Supprimer le logo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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

          {/* Location */}
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
              disabled={isLoading}
            />
          </div>

          {/* Website */}
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
              disabled={isLoading}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandPhone">Téléphone</Label>
              <Input
                id="brandPhone"
                type="tel"
                placeholder="+216 12 345 678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="bg-background"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandEmail">Email</Label>
              <Input
                id="brandEmail"
                type="email"
                placeholder="contact@marque.tn"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-background"
                disabled={isLoading}
              />
            </div>
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
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
                (!formData.logoFile && !formData.existingLogoUrl)
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
            {(!formData.name || !formData.category_id || (!formData.logoFile && !formData.existingLogoUrl)) && (
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
