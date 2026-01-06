import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { toast } from "sonner";

interface ProductData {
  name: string;
  description?: string | null;
  price?: number | null;
  images: string[]; 
  external_url?: string | null;
  brand_id?: string | null;
  id?: string;
  created_at?: string;
}

interface ProductManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (productData: Omit<ProductData, "id" | "created_at" | "brand_id">) => void;
  editingProduct?: ProductData | null;
  isLoading?: boolean;
}

export default function ProductManagementModal({
  open,
  onOpenChange,
  onSubmit,
  editingProduct,
  isLoading = false,
}: ProductManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    external_url: "",
    images: [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on("select", () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name || "",
          description: editingProduct.description || "",
          price: editingProduct.price?.toString() || "",
          external_url: editingProduct.external_url || "",
          images: editingProduct.images || [],
        });
        setImagePreviews(editingProduct.images || []);
        setImageFiles([]);
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          external_url: "",
          images: [],
        });
        setImagePreviews([]);
        setImageFiles([]);
      }
    }
  }, [open, editingProduct]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        toast.error("Only JPEG, PNG and WebP files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must not exceed 5MB");
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    if (index < imagePreviews.length - imageFiles.length) {
      // Removing existing image
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      // Removing new file
      const fileIndex = index - (imagePreviews.length - imageFiles.length);
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreviews];
      newFiles.splice(fileIndex, 1);
      newPreviews.splice(index, 1);
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
    }
  };

  const convertFilesToDataUrls = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const newImageUrls = await convertFilesToDataUrls(imageFiles);
    const allImages = [...formData.images, ...newImageUrls];

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: formData.price ? parseFloat(formData.price) : null,
      external_url: formData.external_url.trim() || null,
      images: allImages,
      brand_id: null, // Will be set by parent
    });
  };

  const hasMultipleImages = imagePreviews.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="productName"
              placeholder="e.g., Elegant Summer Dress"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="productDescription">Description</Label>
            <Textarea
              id="productDescription"
              placeholder="Describe your product..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="productPrice">Price ($)</Label>
            <Input
              id="productPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="productUrl">External URL (Purchase Link)</Label>
            <Input
              id="productUrl"
              type="url"
              placeholder="https://example.com/product"
              value={formData.external_url}
              onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {/* Images with Carousel */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            {imagePreviews.length > 0 && (
              <div className="space-y-4">
                <Carousel
                  setApi={setCarouselApi}
                  opts={{
                    align: "start",
                    loop: hasMultipleImages,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {imagePreviews.map((preview, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm"
                            onClick={() => removeImage(index)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {hasMultipleImages && (
                    <>
                      <CarouselPrevious className="left-2 bg-background/90 hover:bg-background border-border/50" />
                      <CarouselNext className="right-2 bg-background/90 hover:bg-background border-border/50" />
                    </>
                  )}
                </Carousel>

                {/* Thumbnail Navigation */}
                {hasMultipleImages && (
                  <div className="flex gap-2 justify-center overflow-x-auto pb-1">
                    {imagePreviews.map((preview, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => carouselApi?.scrollTo(index)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          currentImageIndex === index
                            ? "border-primary"
                            : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={preview}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload Area */}
            <label
              htmlFor="productImages"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP (MAX. 5MB per image)
                </p>
              </div>
              <input
                ref={fileInputRef}
                id="productImages"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingProduct ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingProduct ? "Update Product" : "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
