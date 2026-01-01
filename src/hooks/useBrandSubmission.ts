import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { brandSubmissionsApi } from "@/lib/api";

export interface BrandSubmission {
  brand_name: string;
  category: string;
  description?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  instagram?: string;
}

export const useBrandSubmission = () => {
  return useMutation({
    mutationFn: async (submission: BrandSubmission) => {
      const response = await brandSubmissionsApi.create(submission);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Brand Submitted!",
        description: "Your brand has been submitted for review. We'll get back to you soon!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
};
