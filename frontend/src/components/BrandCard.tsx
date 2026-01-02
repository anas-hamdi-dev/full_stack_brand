import { Link } from "react-router-dom";

interface BrandCardProps {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  logoUrl?: string | null;
  featured?: boolean;
  website?: string;
}

// Helper function to remove "'s Brand" suffix from brand name
const cleanBrandName = (name: string | undefined): string => {
  if (!name) return "";
  return name.replace(/'s\s+Brand$/i, "").trim();
};

const BrandCard = ({
  id,
  name,
  logoUrl,
  featured = false,
}: BrandCardProps) => {
  const cleanedName = cleanBrandName(name);
  return (
    <Link
      to={`/brand/${id}`}
      className="group glass rounded-3xl overflow-hidden hover-lift block"
    >
      {/* Content */}
      <div className="p-4 md:p-6 flex flex-col items-center text-center">
        
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${cleanedName} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-background font-display font-bold text-sm md:text-base">
                {cleanedName
                  .split(" ")
                  .map(word => word.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Brand Name */}
        <h3 className="font-display font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {cleanedName}
        </h3>
      </div>
    </Link>
  );
};

export default BrandCard;
