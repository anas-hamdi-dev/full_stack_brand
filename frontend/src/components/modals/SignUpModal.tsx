import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, User, Store, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo2.png";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string()
    .min(8, "Phone number must be 8 digits")
    .max(8, "Phone number must be 8 digits")
    .regex(/^[2-9]\d{7}$/, "Invalid Tunisian phone number. Must start with 2, 4, 5, or 9 and be 8 digits"),
  role: z.enum(["client", "brand_owner"]),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function SignUpModal({ open, onOpenChange, onSwitchToLogin }: SignUpModalProps) {
  const { defaultSignUpRole } = useAuthModal();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: defaultSignUpRole || "client",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Update role when modal opens and defaultSignUpRole changes
  useEffect(() => {
    if (open && defaultSignUpRole) {
      setFormData(prev => ({ ...prev, role: defaultSignUpRole }));
    } else if (open && !defaultSignUpRole) {
      setFormData(prev => ({ ...prev, role: "client" }));
    }
  }, [open, defaultSignUpRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsLoading(true);
    
    // Combine country code with phone number
    const fullPhoneNumber = `+216${formData.phone}`;
    
    const { error, user: newUser } = await signUp({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      phone: fullPhoneNumber,
      role: formData.role,
    });
    
    if (error) {
      toast.error(error.message || "Failed to create account");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    
    // Close signup modal
    onOpenChange(false);
    
    // Redirect to email verification page
    toast.success("Account created successfully! Please verify your email.");
    navigate("/verify-email", { 
      state: { 
        email: formData.email,
        from: location 
      } 
    });
    
    // Reset form
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "client",
      acceptTerms: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="el mall logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <DialogTitle className="text-3xl font-display font-bold text-foreground text-center">
            Create New Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground text-center text-sm">
            Join our Tunisian fashion community
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>I am a: <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "client" })}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    formData.role === "client"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <User className="h-8 w-8 text-foreground" />
                    <span className="font-medium text-foreground">Client</span>
                  </div>
                  {formData.role === "client" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "brand_owner" })}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    formData.role === "brand_owner"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Store className="h-8 w-8 text-foreground" />
                    <span className="font-medium text-foreground">Brand Owner</span>
                  </div>
                  {formData.role === "brand_owner" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                  +216
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow digits and limit to 8 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, phone: value });
                  }}
                  className="bg-background flex-1"
                  required
                  maxLength={8}
                  pattern="[2-9]\d{7}"
                  title="Enter 8 digits starting with 2, 4, 5, or 9"
                />
              </div>
              
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password (minimum 8 characters) <span className="text-destructive">*</span></Label>
              <div className="relative">
              <Input
                id="password"
                  type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                  className="bg-background pr-10"
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked === true })}
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                By clicking Sign Up, you agree to our{" "}
                <a href="#" className="underline hover:text-primary">Terms and Conditions</a> and{" "}
                <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                You may receive SMS and email notifications from us. <span className="text-destructive">*</span>
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToLogin();
                }}
                className="text-primary hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

