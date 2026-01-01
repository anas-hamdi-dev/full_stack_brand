import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  id?: string;
  icon: LucideIcon;
  name: string;
  count: number;
  gradient?: "primary" | "secondary";
}

const CategoryCard = ({ icon: Icon, name, count, gradient = "primary" }: CategoryCardProps) => {
  return (
    <Link to={`/category/${encodeURIComponent(name)}`}>
      <div className="group glass rounded-2xl p-6 hover-lift cursor-pointer">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
          gradient === "primary" 
            ? "bg-gradient-primary" 
            : "bg-gradient-secondary"
        }`}>
          <Icon className={`w-7 h-7 ${gradient === "primary" ? "text-primary-foreground" : "text-secondary-foreground"}`} />
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">{count} brands</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
