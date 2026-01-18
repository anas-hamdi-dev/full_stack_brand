import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Save, Mail } from "lucide-react";
import BackButton from "@/components/BackButton";

interface ProfileFormData {
  full_name: string;
  phone: string;
  email: string; // Read-only, displayed but not editable
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [initialFormValues, setInitialFormValues] = useState<ProfileFormData | null>(null);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
    },
    mode: "onChange",
  });

  // Register phone field with validation
  form.register("phone", {
    required: "Phone number is required",
    minLength: {
      value: 8,
      message: "Phone number must be 8 digits"
    },
    maxLength: {
      value: 8,
      message: "Phone number must be 8 digits"
    },
    pattern: {
      value: /^[2-9]\d{7}$/,
      message: "Invalid Tunisian phone number. Must start with 2, 4, 5, or 9"
    }
  });

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      // Extract phone number - if it has +216 prefix, remove it to show only 8 digits
      let phoneSuffix = "";
      if (user.phone) {
        const phoneStr = user.phone.trim();
        if (phoneStr.startsWith("+216")) {
          phoneSuffix = phoneStr.replace("+216", "").trim();
        } else {
          phoneSuffix = phoneStr;
        }
        // Ensure we only keep the last 8 digits if there are more
        phoneSuffix = phoneSuffix.replace(/\D/g, '').slice(-8);
      }

      const formValues = {
        full_name: user.full_name || "",
        phone: phoneSuffix,
        email: user.email || "",
      };

      form.reset(formValues);
      
      // Store initial form values for comparison
      setInitialFormValues(formValues);
    }
  }, [user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Combine +216 prefix with phone suffix if phone is provided
      const phoneValue = data.phone?.trim() || "";
      const fullPhoneNumber = phoneValue ? `+216${phoneValue.replace(/\D/g, '')}` : "";

      const response = await usersApi.update({
        full_name: data.full_name.trim(),
        phone: fullPhoneNumber,
      });
      if (response.error) {
        throw new Error(response.error.message || "Failed to update profile");
      }
      // Backend returns { user: {...} }, API client wraps it as { data: { user: {...} } }
      return (response.data as { user?: unknown })?.user || response.data;
    },
    onSuccess: async () => {
      // Refresh user data to get updated information
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["user"] });
      
      // Update initial form values after successful save to reset change detection
      const currentValues = form.getValues();
      setInitialFormValues(currentValues);
      
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (!data.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    
    // Validate phone number
    const phoneValue = data.phone?.trim() || "";
    if (!phoneValue) {
      toast.error("Phone number is required");
      form.setError("phone", { 
        type: "manual", 
        message: "Phone number is required" 
      });
      return;
    }
    
    if (phoneValue.length !== 8) {
      toast.error("Phone number must be 8 digits");
      form.setError("phone", { 
        type: "manual", 
        message: "Phone number must be 8 digits" 
      });
      return;
    }
    
    // Validate Tunisian phone number format (must start with 2, 4, 5, or 9)
    if (!/^[2-9]\d{7}$/.test(phoneValue)) {
      toast.error("Invalid Tunisian phone number. Must start with 2, 4, 5, or 9");
      form.setError("phone", { 
        type: "manual", 
        message: "Invalid Tunisian phone number. Must start with 2, 4, 5, or 9" 
      });
      return;
    }
    
    updateProfile.mutate(data);
  };

  if (!user) {
      return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Watch all form values to detect changes
  const currentValues = form.watch();

  // Check if form has been modified
  const hasFormChanged = (): boolean => {
    if (!initialFormValues) return false;

    // Compare only editable fields (full_name and phone)
    const fieldsToCompare: (keyof ProfileFormData)[] = [
      'full_name',
      'phone',
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
  const isFormValid = form.formState.isValid;

  // Get role-specific label
  const roleLabel = user.role === 'brand_owner' ? 'Brand Owner' : user.role === 'client' ? 'Client' : 'User';

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6">
          <BackButton to="/" label="Back to home" />
        </div>
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your personal information
              {user.role && (
                <span className="ml-2 text-sm">
                  ({roleLabel})
                </span>
              )}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="pl-10 bg-muted/50 cursor-not-allowed"
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be modified
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-base">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="full_name"
                  {...form.register("full_name", { 
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must contain at least 2 characters"
                    }
                  })}
                  placeholder="Your full name"
                  className="pl-10"
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">
                Phone <span className="text-destructive">*</span>
              </Label>
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
                  onBlur={() => form.trigger("phone")}
                  className="bg-background flex-1"
                  required
                  maxLength={8}
                  pattern="[2-9]\d{7}"
                  title="Enter 8 digits starting with 2, 4, 5, or 9"
              />
              </div>
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={updateProfile.isPending || !isFormModified || !isFormValid}
              >
                {updateProfile.isPending ? (
                  "Saving..."
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

