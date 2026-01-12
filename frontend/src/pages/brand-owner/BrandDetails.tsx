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
  import { brandsApi } from "@/lib/api";
  import { useAuth } from "@/contexts/AuthContext";
  import { useMyBrand } from "@/hooks/useBrands";
  import { toast } from "sonner";
  import { Store, Upload, X, MapPin, Save, Loader2 } from "lucide-react";
  import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
  import { Badge } from "@/components/ui/badge";
  import BackButton from "@/components/BackButton";

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
    const queryClient = useQueryClient();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [initialFormValues, setInitialFormValues] = useState<BrandFormData | null>(null);

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
      criteriaMode: "all",
    });

    // Pre-fill form with existing brand data
    useEffect(() => {
      if (brand) {
        // Extract phone number - if it has +216 prefix, remove it to show only 8 digits
        let phoneSuffix = "";
        if (brand.phone) {
          const phoneStr = brand.phone.trim();
          if (phoneStr.startsWith("+216")) {
            phoneSuffix = phoneStr.replace("+216", "").trim();
          } else {
            phoneSuffix = phoneStr;
          }
          // Ensure we only keep the last 8 digits if there are more
          phoneSuffix = phoneSuffix.replace(/\D/g, '').slice(-8);
        }

        // Extract Instagram username - convert URL to username if needed
        let instagramUsername = "";
        if (brand.instagram) {
          const instagramStr = brand.instagram.trim();
          // If it's a URL, extract the username
          if (instagramStr.startsWith("http://") || instagramStr.startsWith("https://")) {
            const urlMatch = instagramStr.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
            if (urlMatch && urlMatch[1]) {
              instagramUsername = urlMatch[1];
            } else {
              instagramUsername = instagramStr;
            }
          } else {
            // Already a username, remove @ if present at the start
            instagramUsername = instagramStr.replace(/^@/, "");
          }
        }

        const formValues = {
          name: brand.name || "",
          description: brand.description || "",
          logo_url: brand.logo_url || "",
          location: brand.location || "",
          website: brand.website || "",
          instagram: instagramUsername,
          facebook: brand.facebook || "",
          phone: phoneSuffix,
          email: brand.email || "",
        };

        // Use reset with options to keep defaultValues
        form.reset(formValues, {
          keepDefaultValues: false,
          keepValues: false,
        });
        
        // Store initial form values for comparison
        setInitialFormValues({ ...formValues });
        
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
        toast.error("Only JPEG, PNG and WebP files are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must not exceed 5MB");
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
          throw new Error("No brand found. Please sign in again.");
        }
        
        // Validate required fields
        if (!data.name || !data.name.trim()) {
          throw new Error("Brand name is required");
        }
        
        // Prepare update payload - don't change status, preserve existing status
        const updateData = {
          ...data,
        };

        try {
          const response = await brandsApi.update(brandId, updateData);
          if (response.error) {
            // Provide more specific error messages
            const errorMessage = response.error.message || response.error.code || "Update failed";
            throw new Error(errorMessage);
          }
          return response.data;
        } catch (error) {
          // Handle network errors or other exceptions
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Network error. Please check your connection.");
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["my-brand"] });
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
        queryClient.invalidateQueries({ queryKey: ["featured-brands"] });
        
        // Update initial form values after successful save to reset change detection
        const currentValues = form.getValues();
        setInitialFormValues(currentValues);
        
        toast.success("Brand information updated successfully!");
      },
      onError: (error: Error) => {
        console.error("Error updating brand:", error);
        toast.error(error.message || "An error occurred while updating");
      },
    });

    const onSubmit = (data: BrandFormData) => {
      // Validate brandId before submission
      if (!brandId || typeof brandId !== 'string') {
        toast.error("Error: No brand found. Please sign in again.");
        return;
      }

      // Ensure logo_url is preserved if user didn't change it
      const logoUrl = data.logo_url?.trim() || brand?.logo_url || "";
      
      if (!logoUrl) {
        toast.error("Avatar is required");
        form.setError("logo_url", { 
          type: "manual", 
          message: "Avatar is required" 
        });
        return;
      }

      // Validate required fields
      if (!data.name || !data.name.trim()) {
        toast.error("Brand name is required");
        form.setError("name", { 
          type: "manual", 
          message: "Name is required" 
        });
        return;
      }

      // Prepare data for API - combine +216 prefix with phone suffix if phone is provided
      const phoneValue = data.phone?.trim() || "";
      const fullPhoneNumber = phoneValue ? `+216${phoneValue.replace(/\D/g, '')}` : "";

      // Format Instagram username - ensure it doesn't have @ prefix (backend will handle it)
      const instagramUsername = data.instagram?.trim() || "";
      const formattedInstagram = instagramUsername ? instagramUsername.replace(/^@+/, "") : "";

      const submitData: BrandFormData = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        logo_url: logoUrl,
        location: data.location?.trim() || "",
        website: data.website?.trim() || "",
        instagram: formattedInstagram || "",
        facebook: data.facebook?.trim() || "",
        phone: fullPhoneNumber || "",
        email: data.email?.trim() || "",
      };

      updateBrand.mutate(submitData);
    };

    if (brandLoading) {
      return (
        <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!brandId || !brand) {
      return (
        <div className="min-h-screen bg-background pt-20 pb-20 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="glass rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                No Brand Found
              </h1>
              <p className="text-muted-foreground">
                You must create a brand before you can manage your information.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Brand owners can always edit their brand details - no approval required
    const isFormDisabled = false;

    // Watch all form values to detect changes
    const currentValues = form.watch();

    // Check if form has been modified
    const hasFormChanged = (): boolean => {
      if (!initialFormValues) return false;

      // Compare all form fields
      const fieldsToCompare: (keyof BrandFormData)[] = [
        'name',
        'description',
        'logo_url',
        'location',
        'website',
        'instagram',
        'facebook',
        'phone',
        'email',
      ];

      for (const field of fieldsToCompare) {
        const currentValue = (currentValues[field] || '').toString().trim();
        const initialValue = (initialFormValues[field] || '').toString().trim();
        
        if (currentValue !== initialValue) {
          return true;
        }
      }

      return false;
    };

    const isFormModified = hasFormChanged();

    return (
      <div className="min-h-screen bg-background pt-20 pb-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-6">
          <BackButton to="/" label="Back to home" />
          </div>
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Brand Information
                  </h1>
                  <p className="text-muted-foreground">
                    Edit your brand information
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
                      ? "Approved"
                      : brand.status === "pending"
                      ? "Pending"
                      : "Rejected"}
                  </Badge>
                )}
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        className={`flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md text-sm font-medium transition-colors ${
                          isFormDisabled 
                            ? "cursor-not-allowed opacity-50" 
                            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        }`}
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
                      Accepted formats: JPEG, PNG, WebP (max 5MB)
                    </p>
                    <input
                      type="hidden"
                      {...form.register("logo_url", { 
                        required: "Avatar is required",
                        validate: (value) => {
                          if (!value || value.trim() === "") {
                            return "Avatar is required";
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

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name", { 
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must contain at least 2 characters"
                    },
                    maxLength: {
                      value: 100,
                      message: "Name must not exceed 100 characters"
                    }
                  })}
                  placeholder="Ex: My Beautiful Boutique"
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
                  placeholder="Describe your brand in a few words..."
                  rows={4}
                  disabled={isFormDisabled}
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                      +216
                    </div>
                  <Input
                    id="phone"
                      type="tel"
                      placeholder="XX XXX XXX"
                      value={form.watch("phone") || ""}
                      onChange={(e) => {
                        // Only allow digits and limit to 8 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                        form.setValue("phone", value, { shouldValidate: true });
                      }}
                      className="bg-background flex-1"
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
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
                  <Label htmlFor="website">Website</Label>
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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                      @
                    </div>
                  <Input
                    id="instagram"
                    {...form.register("instagram")}
                      type="text"
                      placeholder="username"
                      value={form.watch("instagram") || ""}
                      onChange={(e) => {
                        // Remove @ if user types it, we add it automatically
                        const value = e.target.value.replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "");
                        form.setValue("instagram", value, { shouldValidate: true });
                      }}
                      className="bg-background flex-1"
                    disabled={isFormDisabled}
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
                  disabled={updateBrand.isPending || isFormDisabled || !isFormModified}
                >
                  {updateBrand.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
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

