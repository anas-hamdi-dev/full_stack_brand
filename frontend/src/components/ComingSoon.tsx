import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  category: string;
}

export default function ComingSoon({ category }: ComingSoonProps) {
  return (
    <div className="col-span-full flex items-center justify-center py-20">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
          {category} Collection
        </h2>
        <p className="text-muted-foreground text-lg mb-2">
          Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          We're working on bringing you amazing {category.toLowerCase()} fashion. Stay tuned!
        </p>
      </div>
    </div>
  );
}

