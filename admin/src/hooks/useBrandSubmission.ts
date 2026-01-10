import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: BrandSubmission) => {
      const { data, error } = await supabase
        .from("brand_submissions")
        .insert([submission])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Brand Submitted!",
        description: "Your brand has been submitted for review. We'll get back to you soon!",
      });
      queryClient.invalidateQueries({ queryKey: ["brand-submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
};
