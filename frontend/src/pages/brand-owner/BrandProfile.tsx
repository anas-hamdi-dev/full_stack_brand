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
import { Store, Upload, X, MapPin, Save } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

export default function BrandProfile() {
  const { user } = useAuth();
  const brandId = user?.brand_id;
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
  });

  // Pre-fill form with existing brand data
  useEffect(() => {
    if (brand) {
      form.reset({
        category_id: brand.category_id || "",
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
      if (!brandId) {
        throw new Error("Aucune marque trouvée");
      }
      const response = await brandsApi.update(brandId, data);
      if (response.error) {
        throw new Error(response.error.message || "Échec de la mise à jour");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Profil de la marque mis à jour avec succès!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const onSubmit = (data: BrandFormData) => {
    updateBrand.mutate(data);
  };

  if (brandLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
{  console.log( "brand id", brandId, brand);}
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
              Vous devez créer une marque avant de pouvoir gérer votre profil.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Gérer mon profil
            </h1>
            <p className="text-muted-foreground">
              Modifiez les informations de votre marque
            </p>
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
                      className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm font-medium transition-colors"
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
                    />
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-destructive hover:text-destructive"
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
                    {...form.register("logo_url", { required: "L'avatar est requis" })}
                  />
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
                onValueChange={(value) => form.setValue("category_id", value)}
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
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de la marque <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register("name", { required: "Le nom est requis" })}
                placeholder="Ex: Ma Belle Boutique"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Décrivez votre marque en quelques mots..."
                rows={4}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de contact</Label>
                <Input
                  id="email"
                  {...form.register("email")}
                  type="email"
                  placeholder="contact@example.com"
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  {...form.register("instagram")}
                  type="url"
                  placeholder="https://www.instagram.com/votrecompte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  {...form.register("facebook")}
                  type="url"
                  placeholder="https://www.facebook.com/votrepage"
                />
              </div>
            </div>

            {/* Status Info */}
            {brand.status && (
              <div className={`p-4 rounded-lg ${
                brand.status === "approved" 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : brand.status === "pending"
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}>
                <p className="text-sm text-foreground">
                  <strong>Statut:</strong> {
                    brand.status === "approved" ? "Approuvé" :
                    brand.status === "pending" ? "En attente d'approbation" :
                    "Rejeté"
                  }
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={updateBrand.isPending}
              >
                {updateBrand.isPending ? (
                  "Enregistrement..."
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

