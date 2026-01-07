import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Save, Mail } from "lucide-react";
import PageLayout from "@/components/PageLayout";

interface ProfileFormData {
  full_name: string;
  phone?: string;
  email: string; // Read-only, displayed but not editable
}

export default function BrandOwnerProfile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
    },
    mode: "onChange",
  });

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await usersApi.update({
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() || undefined,
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
    updateProfile.mutate(data);
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
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
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your personal information
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
                Phone
              </Label>
              <Input
                id="phone"
                {...form.register("phone")}
                type="tel"
                placeholder="+216 12 345 678"
              />
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
                disabled={updateProfile.isPending}
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
    </PageLayout>
  );
}

