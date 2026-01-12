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
import { brandsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/hooks/useBrands";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft, Store, MapPin, Upload, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BrandFormData {
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

const TOTAL_STEPS = 4;

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
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<BrandFormData>({
    defaultValues: {
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
      // Extract phone number digits (remove +216 prefix if present)
      const phoneNumber = existingBrand.phone 
        ? existingBrand.phone.replace(/^\+216/, "").replace(/\D/g, "").slice(0, 8)
        : "";
      
      form.reset({
        name: existingBrand.name || "",
        description: existingBrand.description || "",
        logo_url: existingBrand.logo_url || "",
        location: existingBrand.location || "",
        website: existingBrand.website || "",
        instagram: existingBrand.instagram 
          ? existingBrand.instagram.replace(/^https?:\/\/.*instagram\.com\//, "").replace(/^@/, "") 
          : "",
        facebook: existingBrand.facebook || "",
        phone: phoneNumber,
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
      toast.error("Only JPEG, PNG and WebP files are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB");
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
          throw new Error("Error: Invalid brand ID. Please sign in again.");
        }
        // Format Instagram username - remove @ prefix if present
        // Format phone number - add +216 prefix if phone is provided
        const formattedData = {
          ...data,
          instagram: data.instagram?.trim() ? data.instagram.trim().replace(/^@+/, "") : "",
          phone: data.phone?.trim() ? `+216${data.phone.trim()}` : "",
        };
        // Update existing brand - preserve existing status, don't send status field
        const brandData = {
          ...formattedData,
        };
        const response = await brandsApi.update(brandId, brandData);
        if (response.error) {
          throw new Error(response.error.message || "Failed to update brand");
        }
        return response.data;
      } else {
        // Format Instagram username - remove @ prefix if present
        // Format phone number - add +216 prefix if phone is provided
        const formattedData = {
          ...data,
          instagram: data.instagram?.trim() ? data.instagram.trim().replace(/^@+/, "") : "",
          phone: data.phone?.trim() ? `+216${data.phone.trim()}` : "",
        };
        // Create new brand - set status to pending for new brands
        const brandData = {
          ...formattedData,
          status: "pending" as const,
        };
        const response = await brandsApi.create(brandData);
        if (response.error) {
          throw new Error(response.error.message || "Failed to create brand");
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
      // This will update the AuthContext and cause BrandOwnerWarningBanner to hide
      try {
        await refreshUser();
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
      
      toast.success(brandId ? "Your brand details have been updated successfully!" : "Your brand details have been submitted successfully!");
      setCurrentStep(TOTAL_STEPS);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const onSubmit = (data: BrandFormData) => {
    createOrUpdateBrand.mutate(data);
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Validate current step before proceeding
      if (currentStep === 2) {
        form.trigger(["name", "logo_url"]);
        if (!form.getValues("name")) {
          toast.error("Brand name is required");
          return;
        }
        if (!form.getValues("logo_url")) {
          toast.error("Brand avatar is required");
          return;
        }
      }
      if (currentStep === 3) {
        // Submit form on step 3 before going to step 4
        const isValid = await form.trigger();
        if (!isValid) {
          toast.error("Please correct the errors in the form");
          return;
        }
        onSubmit(form.getValues());
        return; // onSubmit will move to step 4 on success
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
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <Store className="h-16 w-16 mx-auto text-primary mb-4" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Welcome to Brand Setup
              </h1>
              <p className="text-muted-foreground text-lg">
                To provide the best experience for your clients and be visible on our platform,
                we need some information about your brand.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This process will only take a few minutes. You can modify this information later.
              </p>
              <Button onClick={nextStep} size="lg" className="w-full md:w-auto">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Brand Details
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Step 2: Brand Details
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentStep} / {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-muted-foreground">
                Fill in the main information about your brand.
              </p>
            </div>

            <form className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar">
                  Brand Avatar <span className="text-destructive">*</span>
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
                        {avatarPreview ? "Change Avatar" : "Upload Avatar"}
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
                      Accepted formats: JPEG, PNG, WebP (max 5MB)
                    </p>
                    <input
                      type="hidden"
                      {...form.register("logo_url", { required: "Avatar is required" })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name", { required: "Name is required" })}
                  placeholder="Ex: My Beautiful Boutique"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe your brand in a few words..."
                  rows={4}
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                    +216
                  </div>
                <Input
                  id="phone"
                  {...form.register("phone")}
                    type="tel"
                    placeholder="XX XXX XXX"
                    onChange={(e) => {
                      // Only allow digits and limit to 8 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      form.setValue("phone", value, { shouldValidate: true });
                    }}
                    className="bg-background flex-1"
                    maxLength={8}
                    pattern="[2-9]\d{7}"
                    title="Enter 8 digits starting with 2, 4, 5, or 9"
                />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  {...form.register("email")}
                  type="email"
                  placeholder="contact@example.com"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep} className="flex-1">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Location and Social Media
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Step 3: Location and Social Media
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentStep} / {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-muted-foreground">
                Add your location and social links (optional).
              </p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
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
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register("website")}
                  type="url"
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                    @
                  </div>
                <Input
                  id="instagram"
                  {...form.register("instagram")}
                    type="text"
                    placeholder="username"
                    onChange={(e) => {
                      // Remove @ if user types it, we add it automatically
                      const value = e.target.value.replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "");
                      form.setValue("instagram", value, { shouldValidate: true });
                    }}
                    className="bg-background flex-1"
                />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  {...form.register("facebook")}
                  type="url"
                  placeholder="https://www.facebook.com/yourpage"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex-1"
                  disabled={createOrUpdateBrand.isPending}
                >
                  {createOrUpdateBrand.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Congratulations / Pending Approval
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Congratulations!
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Your brand details have been submitted successfully.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-foreground">
                  <strong>Your brand is under review.</strong>
                  <br />
                  Approval may take up to 24 hours. Some features will be available after approval.
                </p>
              </div>
            </div>
            <Button onClick={goToDashboard} size="lg" className="w-full md:w-auto">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

