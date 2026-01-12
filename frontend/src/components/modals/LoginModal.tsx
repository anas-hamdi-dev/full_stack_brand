import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
}

export default function LoginModal({ open, onOpenChange, onSwitchToSignUp }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Handle redirect after login based on user status
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
      
      // Redirect based on role
      if (user.role === "client") {
        navigate("/client/dashboard");
      } else if (user.role === "brand_owner") {
        // Brand owners stay on current page or go to home
        navigate("/");
      } else {
        navigate("/");
      }
    }
  }, [user, open, onOpenChange, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      // Check if error is about admin access
      if (error.message?.includes('Admin access denied') || error.message?.includes('admin panel')) {
        const adminPanelUrl = import.meta.env.VITE_ADMIN_PANEL_URL || "http://localhost:5174";
        toast.error(
          error.message || "Admin users must use the admin panel to sign in. Redirecting...",
          { duration: 5000 }
        );
        // Redirect to admin panel after a short delay
        setTimeout(() => {
          window.location.href = adminPanelUrl;
        }, 2000);
      } else {
        toast.error(error.message || "Failed to sign in");
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    
    // The redirect will be handled by the useEffect hook when user state updates
    toast.success("Signed in successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground text-center">
            Sign In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground text-center text-sm">
            Sign in to your account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSignUp();
                }}
                className="text-primary hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

