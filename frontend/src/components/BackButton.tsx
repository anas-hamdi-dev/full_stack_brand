import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to: string;
  label?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero" | "hero-outline" | "glass" | "accent";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
}

const BackButton = ({ 
  to, 
  label = "Back", 
  className,
  variant = "ghost",
  size = "default"
}: BackButtonProps) => {
  return (
    <Button 
      asChild
      variant={variant}
      size={size}
      className={className}
    >
      <Link to={to}>
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Link>
    </Button>
  );
};

export default BackButton;

