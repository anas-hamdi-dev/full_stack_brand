import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

export default function EmailVerification() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or user
  const email = (location.state?.email as string) || user?.email || "";

  // Redirect if already verified
  useEffect(() => {
    if (user?.isEmailVerified) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Redirect if no email available
  useEffect(() => {
    if (!email && !user) {
      navigate("/", { replace: true });
    }
  }, [email, user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email address is required");
      return;
    }

    const validation = verificationSchema.safeParse({ code });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.verifyEmail(email, code);

      if (response.error) {
        // Handle rate limiting
        if (response.error.code === "HTTP_429") {
          const retryAfter = (response.error.details as { retryAfter?: number })?.retryAfter;
          if (retryAfter) {
            toast.error(`${response.error.message} (${retryAfter} minutes)`);
          } else {
            toast.error(response.error.message);
          }
        } else if (response.error.details && typeof response.error.details === "object" && "remainingAttempts" in response.error.details) {
          const remainingAttempts = (response.error.details as { remainingAttempts?: number }).remainingAttempts;
          toast.error(`${response.error.message}${remainingAttempts ? ` (${remainingAttempts} attempts remaining)` : ""}`);
        } else {
          toast.error(response.error.message || "Invalid verification code");
        }
        setIsLoading(false);
        return;
      }

      if (response.data?.success) {
        toast.success("Email verified successfully!");
        // Refresh user data to get updated verification status
        await refreshUser();
        // Navigate to home or intended destination
        const from = (location.state as { from?: Location })?.from;
        if (from) {
          navigate(from.pathname || "/", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);

    try {
      const response = await authApi.resendVerificationCode(email);

      if (response.error) {
        if (response.error.code === "HTTP_429") {
          const retryAfter = (response.error.details as { retryAfter?: number })?.retryAfter;
          if (retryAfter) {
            setResendCooldown(retryAfter);
            toast.error(`Please wait ${retryAfter} seconds before requesting a new code`);
          } else {
            toast.error(response.error.message);
          }
        } else {
          toast.error(response.error.message || "Failed to resend verification code");
        }
        setIsResending(false);
        return;
      }

      if (response.data?.success) {
        toast.success("Verification code sent successfully!");
        setResendCooldown(60); // 1 minute cooldown
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 pt-24 pb-24">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground text-sm">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-foreground font-medium">{email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                required
                className="bg-background text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-primary hover:text-primary/80"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              The code will expire in 10 minutes. Check your spam folder if you don't see it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




