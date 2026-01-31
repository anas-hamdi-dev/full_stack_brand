import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price?: number | null;
  brandName?: string;
  brandLogo?: string | null;
}

const ProductCard = ({ id, name, description, imageUrl, price, brandName, brandLogo }: ProductCardProps) => {
  const { isClient } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <div className="group relative">
      <div className="group glass rounded-3xl overflow-hidden hover-lift block ">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden relative">
          <Link to={`/product/${id}`} className="block w-full h-full">
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </Link>
          
          {/* Top Right Corner Elements */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            {/* Brand Avatar */}
            {brandLogo && (
              <Avatar className="h-10 w-10 border-2 border-primary shadow-sm bg-background/90 backdrop-blur-sm">
                <AvatarImage src={brandLogo} alt={brandName || "Brand"} />
                <AvatarFallback className="text-xs">
                  {brandName ? brandName.charAt(0).toUpperCase() : "B"}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Favorite Button */}
            {isClient && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
                onClick={handleFavoriteClick}
              >
                <Heart 
                  className={`w-4 h-4 transition-colors ${
                    favorite ? "fill-primary text-primary" : "text-foreground"
                  }`} 
                />
              </Button>
            )}
          </div>
        </div>
      
        {/* Product Info */}
        <div className="p-4">
          <Link to={`/product/${id}`}>
            <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-1">
              {name}
            </h3>
          </Link>
          {price && (
            <p className="text-primary font-semibold text-sm">
              {price.toFixed(0)} TND
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;