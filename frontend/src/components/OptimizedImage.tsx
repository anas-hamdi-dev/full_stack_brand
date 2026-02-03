import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  loading?: "lazy" | "eager";
  fallback?: string;
  onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * A reusable image component with:
 * - Lazy loading support
 * - Error handling with fallback
 * - Aspect ratio preservation
 * - Mobile-friendly responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  aspectRatio,
  loading = "lazy",
  fallback = "/placeholder.svg",
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Build full URL if it's a relative path
  const getImageUrl = () => {
    if (!imageSrc) return fallback;
    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      return imageSrc;
    }
    if (imageSrc.startsWith("/uploads/")) {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const baseUrl = apiUrl.replace("/api", "") || "";
      return `${baseUrl}${imageSrc}`;
    }
    return imageSrc;
  };

  const imageUrl = getImageUrl();

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : width && height
    ? { aspectRatio: `${width} / ${height}` }
    : {};

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={aspectRatioStyle}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading={loading}
        width={width}
        height={height}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}

export default OptimizedImage;
