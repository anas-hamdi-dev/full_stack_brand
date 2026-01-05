import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { brandsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBrand } from "@/hooks/useBrands";
import { toast } from "sonner";
import { Store, Upload, X, MapPin, Save, Loader2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface BrandFormData {
  category_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  location?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  phone?: string;
  email?: string;
}

export default function BrandDetails() {
  const { user } = useAuth();
  // Ensure brandId is always a string - handle both string and object (MongoDB ObjectId) cases
  const getBrandId = (): string | null => {
    if (!user?.brand_id) return null;
    if (typeof user.brand_id === 'string') return user.brand_id;
    // Handle MongoDB ObjectId or populated object
    const brandIdObj = user.brand_id as { _id?: string; toString?: () => string };
    if (brandIdObj._id) return brandIdObj._id;
    if (brandIdObj.toString) return brandIdObj.toString();
    return String(user.brand_id);
  };
  const brandId = getBrandId();
  const { data: brand, isLoading: brandLoading } = useMyBrand();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<BrandFormData>({
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      logo_url: "",
      location: "",
      website: "",
      instagram: "",
      facebook: "",
      phone: "",
      email: "",
    },
    mode: "onChange",
    criteriaMode: "all",
  });

  // Pre-fill form with existing brand data
  useEffect(() => {
    if (brand) {
      // Handle category_id - check populated category first, then category_id
      let categoryId = "";
      if (brand.category && brand.category._id) {
        categoryId = brand.category._id;
      } else if (brand.category_id) {
        if (typeof brand.category_id === 'string') {
          categoryId = brand.category_id;
        } else if (typeof brand.category_id === 'object' && brand.category_id !== null && '_id' in brand.category_id) {
          categoryId = (brand.category_id as { _id: string })._id;
        }
      }

      form.reset({
        category_id: categoryId,
        name: brand.name || "",
        description: brand.description || "",
        logo_url: brand.logo_url || "",
        location: brand.location || "",
        website: brand.website || "",
        instagram: brand.instagram || "",
        facebook: brand.facebook || "",
        phone: brand.phone || "",
        email: brand.email || "",
      });
      if (brand.logo_url) {
        setAvatarPreview(brand.logo_url);
      }
    }
  }, [brand, form]);

  // Handle avatar file upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Seuls les fichiers JPEG, PNG et WebP sont autorisés");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 5MB");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      form.setValue("logo_url", dataUrl, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    form.setValue("logo_url", "", { shouldValidate: true });
  };

  const updateBrand = useMutation({
    mutationFn: async (data: BrandFormData) => {
      // Ensure brandId is a valid string
      if (!brandId || typeof brandId !== 'string') {
        throw new Error("Aucune marque trouvée. Veuillez vous reconnecter.");
      }
      
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        throw new Error("Le nom de la marque est requis");
      }
      if (!data.category_id || !data.category_id.trim()) {
        throw new Error("La catégorie est requise");
      }
      
      // Prepare update payload - don't change status, preserve existing status
      const updateData = {
        ...data,
      };

      try {
        const response = await brandsApi.update(brandId, updateData);
        if (response.error) {
          // Provide more specific error messages
          const errorMessage = response.error.message || response.error.code || "Échec de la mise à jour";
          throw new Error(errorMessage);
        }
        return response.data;
      } catch (error) {
        // Handle network errors or other exceptions
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erreur réseau. Veuillez vérifier votre connexion.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-brand"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["featured-brands"] });
      toast.success("Informations de la marque mises à jour avec succès!");
    },
    onError: (error: Error) => {
      console.error("Error updating brand:", error);
      toast.error(error.message || "Une erreur est survenue lors de la mise à jour");
    },
  });

  const onSubmit = (data: BrandFormData) => {
    // Validate brandId before submission
    if (!brandId || typeof brandId !== 'string') {
      toast.error("Erreur: Aucune marque trouvée. Veuillez vous reconnecter.");
      return;
    }

    // Ensure logo_url is preserved if user didn't change it
    const logoUrl = data.logo_url?.trim() || brand?.logo_url || "";
    
    if (!logoUrl) {
      toast.error("L'avatar est requis");
      form.setError("logo_url", { 
        type: "manual", 
        message: "L'avatar est requis" 
      });
      return;
    }

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      toast.error("Le nom de la marque est requis");
      form.setError("name", { 
        type: "manual", 
        message: "Le nom est requis" 
      });
      return;
    }

    if (!data.category_id || !data.category_id.trim()) {
      toast.error("La catégorie est requise");
      form.setError("category_id", { 
        type: "manual", 
        message: "La catégorie est requise" 
      });
      return;
    }

    // Prepare data for API - backend will handle empty string to null conversion
    const submitData: BrandFormData = {
      category_id: data.category_id.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || "",
      logo_url: logoUrl,
      location: data.location?.trim() || "",
      website: data.website?.trim() || "",
      instagram: data.instagram?.trim() || "",
      facebook: data.facebook?.trim() || "",
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
    };

    updateBrand.mutate(submitData);
  };

  if (brandLoading) {
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

  if (!brandId || !brand) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Aucune marque trouvée
            </h1>
            <p className="text-muted-foreground">
              Vous devez créer une marque avant de pouvoir gérer vos informations.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Brand owners can always edit their brand details - no approval required
  const isFormDisabled = false;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                  Informations de la marque
                </h1>
                <p className="text-muted-foreground">
                  Modifiez les informations de votre marque
                </p>
              </div>
              {brand.status && (
                <Badge
                  variant={
                    brand.status === "approved"
                      ? "default"
                      : brand.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {brand.status === "approved"
                    ? "Approuvé"
                    : brand.status === "pending"
                    ? "En attente"
                    : "Rejeté"}
                </Badge>
              )}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label htmlFor="avatar">
                Avatar de la marque <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Avatar preview" />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="avatar"
                      className={`flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md text-sm font-medium transition-colors ${
                        isFormDisabled 
                          ? "cursor-not-allowed opacity-50" 
                          : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {avatarPreview ? "Changer l'avatar" : "Télécharger un avatar"}
                    </label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isFormDisabled}
                    />
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-destructive hover:text-destructive"
                        disabled={isFormDisabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPEG, PNG, WebP (max 5MB)
                  </p>
                  <input
                    type="hidden"
                    {...form.register("logo_url", { 
                      required: "L'avatar est requis",
                      validate: (value) => {
                        if (!value || value.trim() === "") {
                          return "L'avatar est requis";
                        }
                        return true;
                      }
                    })}
                  />
                  {form.formState.errors.logo_url && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.logo_url.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-base">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("category_id")}
                onValueChange={(value) => {
                  form.setValue("category_id", value, { shouldValidate: true });
                  form.clearErrors("category_id");
                }}
                disabled={isFormDisabled}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category_id && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.category_id.message}
                </p>
              )}
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de la marque <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register("name", { 
                  required: "Le nom est requis",
                  minLength: {
                    value: 2,
                    message: "Le nom doit contenir au moins 2 caractères"
                  },
                  maxLength: {
                    value: 100,
                    message: "Le nom ne doit pas dépasser 100 caractères"
                  }
                })}
                placeholder="Ex: Ma Belle Boutique"
                disabled={isFormDisabled}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Décrivez votre marque en quelques mots..."
                rows={4}
                disabled={isFormDisabled}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+33 6 12 34 56 78"
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de contact</Label>
                <Input
                  id="email"
                  {...form.register("email")}
                  type="email"
                  placeholder="contact@example.com"
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <div className="flex gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-2.5" />
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="Ex: Paris, France"
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  {...form.register("website")}
                  type="url"
                  placeholder="https://www.example.com"
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  {...form.register("instagram")}
                  type="url"
                  placeholder="https://www.instagram.com/votrecompte"
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  {...form.register("facebook")}
                  type="url"
                  placeholder="https://www.facebook.com/votrepage"
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={updateBrand.isPending || isFormDisabled}
              >
                {updateBrand.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

