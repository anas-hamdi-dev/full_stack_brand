import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  category: string;
}

export default function ComingSoon({ category }: ComingSoonProps) {
  return (
    <div className="col-span-full flex items-center justify-center py-20">
      <div className="text-center max-w-md px-4">
        
        
        <p className="text-muted-foreground text-lg mb-2">
          Coming Soon
        </p>

      </div>
    </div>
  );
}


