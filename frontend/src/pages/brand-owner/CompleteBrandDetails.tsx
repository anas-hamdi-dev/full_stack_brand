import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
import { useBrand } from "@/hooks/useBrands";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft, Store, MapPin, Upload, X } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { authApi } from "@/lib/api";
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

const TOTAL_STEPS = 5;

export default function CompleteBrandDetails() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
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
  const { data: existingBrand } = useBrand(brandId || undefined);
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
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

  // Pre-fill form with existing brand data when it loads
  useEffect(() => {
    if (existingBrand) {
      form.reset({
        category_id: existingBrand.category_id || "",
        name: existingBrand.name || "",
        description: existingBrand.description || "",
        logo_url: existingBrand.logo_url || "",
        location: existingBrand.location || "",
        website: existingBrand.website || "",
        instagram: existingBrand.instagram || "",
        facebook: existingBrand.facebook || "",
        phone: existingBrand.phone || "",
        email: existingBrand.email || "",
      });
      // Sync avatar preview
      if (existingBrand.logo_url) {
        setAvatarPreview(existingBrand.logo_url);
      }
    }
  }, [existingBrand, form]);

  // Handle avatar file upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setAvatarFile(file);

    // Create preview
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

  const createOrUpdateBrand = useMutation({
    mutationFn: async (data: BrandFormData) => {
      // If brand exists, update it; otherwise create new one
      if (brandId && existingBrand) {
        // Ensure brandId is a valid string before making the API call
        if (typeof brandId !== 'string') {
          throw new Error("Erreur: ID de marque invalide. Veuillez vous reconnecter.");
        }
        // Update existing brand - preserve existing status, don't send status field
        const brandData = {
          ...data,
        };
        const response = await brandsApi.update(brandId, brandData);
        if (response.error) {
          throw new Error(response.error.message || "Échec de la mise à jour de la marque");
        }
        return response.data;
      } else {
        // Create new brand - set status to pending for new brands
        const brandData = {
          ...data,
          status: "pending" as const,
        };
        const response = await brandsApi.create(brandData);
        if (response.error) {
          throw new Error(response.error.message || "Échec de la création de la marque");
        }
        return response.data;
      }
    },
    onSuccess: async () => {
      // Invalidate queries to reflect updated state
      queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
      queryClient.invalidateQueries({ queryKey: ["my-brand"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["featured-brands"] });
      
      // Refresh user data to get updated brand_id if brand was just created
      // This will update the AuthContext and cause BrandOwnerWarningBanner in PageLayout to hide
      try {
        await refreshUser();
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
      
      toast.success(brandId ? "Les détails de votre marque ont été mis à jour avec succès!" : "Les détails de votre marque ont été soumis avec succès!");
      setCurrentStep(TOTAL_STEPS);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const onSubmit = (data: BrandFormData) => {
    createOrUpdateBrand.mutate(data);
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Validate current step before proceeding
      if (currentStep === 2) {
        form.trigger("category_id");
        if (!form.getValues("category_id")) {
          toast.error("Veuillez sélectionner une catégorie");
          return;
        }
      }
      if (currentStep === 3) {
        form.trigger(["name", "logo_url"]);
        if (!form.getValues("name")) {
          toast.error("Le nom de la marque est requis");
          return;
        }
        if (!form.getValues("logo_url")) {
          toast.error("L'avatar de la marque est requis");
          return;
        }
      }
      if (currentStep === 4) {
        // Submit form on step 4 before going to step 5
        const isValid = await form.trigger();
        if (!isValid) {
          toast.error("Veuillez corriger les erreurs dans le formulaire");
          return;
        }
        onSubmit(form.getValues());
        return; // onSubmit will move to step 5 on success
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToDashboard = () => {
    navigate("/");
  };

  // Strict check: Redirect immediately if user already has a brand_id from backend
  // This check is based solely on backend data (user.brand_id) and must come after all hooks
  if (user?.brand_id) {
    return <Navigate to="/" replace />;
  }

  // Step 1: Welcome
  if (currentStep === 1) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <Store className="h-16 w-16 mx-auto text-primary mb-4" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Bienvenue dans la configuration de votre marque
              </h1>
              <p className="text-muted-foreground text-lg">
                Pour offrir la meilleure expérience à vos clients et être visible sur notre plateforme,
                nous avons besoin de quelques informations sur votre marque.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ce processus ne prendra que quelques minutes. Vous pourrez modifier ces informations plus tard.
              </p>
              <Button onClick={nextStep} size="lg" className="w-full md:w-auto">
                Commencer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Step 2: Choose Category
  if (currentStep === 2) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Étape 2: Catégorie
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentStep} / {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-muted-foreground">
                Sélectionnez la catégorie qui correspond le mieux à votre marque.
              </p>
            </div>

            <form className="space-y-6">
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

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <Button type="button" onClick={nextStep} className="flex-1">
                  Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Step 3: Shop Details
  if (currentStep === 3) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Étape 3: Détails de la marque
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentStep} / {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-muted-foreground">
                Renseignez les informations principales de votre marque.
              </p>
            </div>

            <form className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Décrivez votre marque en quelques mots..."
                  rows={4}
                />
              </div>


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

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <Button type="button" onClick={nextStep} className="flex-1">
                  Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Step 4: Shop Location
  if (currentStep === 4) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Étape 4: Localisation et réseaux sociaux
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentStep} / {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-muted-foreground">
                Ajoutez votre localisation et vos liens sociaux (optionnel).
              </p>
            </div>

            <form className="space-y-6">
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

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex-1"
                  disabled={createOrUpdateBrand.isPending}
                >
                  {createOrUpdateBrand.isPending ? (
                    "Soumission en cours..."
                  ) : (
                    <>
                      Soumettre <ArrowRight className="ml-2 h-4 w-4" />
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

  // Step 5: Congratulations / Pending Approval
  if (currentStep === 5) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Félicitations!
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Les détails de votre marque ont été soumis avec succès.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-foreground">
                  <strong>Votre marque est en cours d'examen.</strong>
                  <br />
                  L'approbation peut prendre jusqu'à 24 heures. Certaines fonctionnalités seront disponibles après l'approbation.
                </p>
              </div>
            </div>
            <Button onClick={goToDashboard} size="lg" className="w-full md:w-auto">
              Aller au tableau de bord
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return null;
}

