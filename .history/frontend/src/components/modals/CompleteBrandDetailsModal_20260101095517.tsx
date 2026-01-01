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
  const { user, refreshUser } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const queryClient = useQueryClient();
  const brandId = user?.brand_id || user?.brand_id;
  const { data: existingBrand, isLoading: brandLoading } = useBrand(brandId);
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing brand data or initialize with defaults
  useEffect(() => {
    if (open && user && brandId) {
      // Wait for brand data to load, but don't block if it's taking too long
      if (existingBrand) {
        // Brand exists - load its data
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
          phone: existingBrand.phone || user.phone || "",
          email: existingBrand.email || user.email || "",
        });
        setLogoPreview(existingLogo);
        setIsInitialized(true);
      } else if (!brandLoading) {
        // Brand doesn't exist yet or just created - initialize with user data and defaults
        const defaultName = existingBrand?.name || `${user.first_name || ''} ${user.last_name || ''}'s Brand`.trim() || "Ma Marque";
        setFormData({
          name: defaultName,
          category_id: "",
          description: "",
          logoFile: null,
          existingLogoUrl: null,
          location: "",
          website: "",
          instagram: "",
          facebook: "",
          phone: user.phone || "",
          email: user.email || "",
        });
        setLogoPreview(null);
        setIsInitialized(true);
      }
    } else if (open && !user) {
      // No user - reset form
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
      setIsInitialized(true);
    }
    
    // Reset submission state when modal opens
    if (open) {
      setIsSubmitted(false);
    }
  }, [open, user, brandId, existingBrand, brandLoading]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

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

  // Convert file to base64 data URL for storage
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
      toast.error("Veuillez remplir tous les champs obligatoires (nom et catégorie)");
      return;
    }

    // Logo is required - either existing or new upload
    if (!formData.logoFile && !formData.existingLogoUrl) {
      toast.error("Veuillez télécharger un logo");
      return;
    }

    if (!brandId) {
      toast.error("Aucune marque trouvée pour ce compte");
      return;
    }

    setIsLoading(true);

    try {
      let logoUrl = formData.existingLogoUrl;

      // Convert new logo file to data URL if uploaded
      if (formData.logoFile) {
        logoUrl = await convertFileToDataUrl(formData.logoFile);
      }

      // Normalize phone: format if provided
      let normalizedPhone: string | null = null;
      if (formData.phone && formData.phone.trim()) {
        const cleaned = formData.phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+216')) {
          normalizedPhone = cleaned;
        } else if (cleaned.length >= 8) {
          // Format as +216 XX XXX XXX
          normalizedPhone = `+216 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}`;
        } else {
          normalizedPhone = formData.phone.trim();
        }
      }

      // Normalize URLs - ensure they start with http:// or https://
      const normalizeUrl = (url: string | null | undefined): string | null => {
        if (!url || !url.trim()) return null;
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        category_id: formData.category_id || null,
        description: formData.description?.trim() || null,
        logo_url: logoUrl,
        location: formData.location?.trim() || null,
        website: normalizeUrl(formData.website),
        instagram: formData.instagram?.trim() || null,
        facebook: normalizeUrl(formData.facebook),
        phone: normalizedPhone,
        email: formData.email?.trim() || null,
      };

      // Update brand with all data via backend API
      const response = await brandsApi.update(brandId, updateData);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["featured-brands"] });
      
      // Refresh user data to get updated brand info
      await refreshUser();

      toast.success("Informations de la marque mises à jour avec succès!");
      setIsLoading(false);
      setIsSubmitted(true);
      
      // Close modal and call onComplete after a short delay
      setTimeout(() => {
        onOpenChange(false);
        onComplete();
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Échec de la mise à jour des détails de la marque";
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
    // Only allow closing after successful submission or if user explicitly dismisses
    if (!newOpen && !isSubmitted) {
      // User is trying to close without submitting
      // Allow closing but show a warning
      const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir fermer ? Vous pourrez compléter ces informations plus tard depuis votre tableau de bord."
      );
      if (confirmed) {
        onOpenChange(newOpen);
      }
      return;
    }
    // Allow closing if submission was successful
    if (!newOpen && isSubmitted) {
      onOpenChange(newOpen);
    }
  };

  const isLoadingData = brandLoading || categoriesLoading || !isInitialized;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside
          if (!isSubmitted) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key unless submitted
          if (!isSubmitted) {
            e.preventDefault();
          }
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
              <p className="text-sm text-muted-foreground mt-1">
                Remplissez les informations essentielles pour présenter votre marque
              </p>
            </div>
          </div>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
