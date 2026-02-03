import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BrandLogo {
  publicId: string;
  imageUrl: string;
}

interface BrandCardProps {
  id: string;
  name: string;
  location: string;
  description: string;
  logoUrl?: string | BrandLogo | null; // Support both old (string) and new (BrandLogo) formats
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
  const initials = cleanedName
    .split(" ")
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Extract image URL from logoUrl (handles both string and object formats)
  const getLogoUrl = (): string | null => {
    if (!logoUrl) return null;
    if (typeof logoUrl === 'string') return logoUrl;
    if (typeof logoUrl === 'object' && logoUrl.imageUrl) return logoUrl.imageUrl;
    return null;
  };

  const logoImageUrl = getLogoUrl();

  return (
    <Link
      to={`/brand/${id}`}
      className="group glass rounded-3xl hover-lift block border border-border/30 w-full max-w-[14rem] md:max-w-[16rem] mx-auto"
    >
      {/* Content */}
      <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
        {/* Avatar */}
        <Avatar className="w-28 h-28 md:w-32 md:h-32 border-2 border-border/50 mb-4">
          {logoImageUrl ? (
            <AvatarImage
              src={logoImageUrl}
              alt={`${cleanedName} logo`}
              className="object-cover"
              loading="lazy"
            />
          ) : null}
          <AvatarFallback className="bg-primary/20 text-foreground font-display font-bold text-lg md:text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Brand Name */}
        <h3 className="text-base md:text-lg font-display font-semibold text-center text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {cleanedName}
        </h3>
      </div>
    </Link>
  );
};

export default BrandCard;
