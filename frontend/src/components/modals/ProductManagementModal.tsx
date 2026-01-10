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
import { toast } from "sonner";

interface ProductData {
  name: string;
  description?: string | null;
  price: number; // Required field
  images: string[]; 
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
    images: [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageError, setImageError] = useState<string>("");
    const [priceError, setPriceError] = useState<string>("");

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name || "",
          description: editingProduct.description || "",
          price: editingProduct.price?.toString() || "",
          images: editingProduct.images || [],
        });
        setImagePreviews(editingProduct.images || []);
        setImageFiles([]);
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          images: [],
        });
        setImagePreviews([]);
        setImageFiles([]);
      }
      setImageError("");
      setPriceError("");
    }
  }, [open, editingProduct]);

    const validateImageFile = (file: File): string | null => {
      // Validate image format
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG, and WebP formats are supported";
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return "File size must not exceed 5MB";
      }
      
      return null;
    };

    const handleFiles = (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const errors: string[] = [];
      const validFiles: File[] = [];
      
      fileArray.forEach(file => {
        const error = validateImageFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      // Show errors if any
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        if (validFiles.length === 0) return;
      }

      // Clear previous error if we have valid files
      if (validFiles.length > 0) {
        setImageError("");
      }

    setImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
          // Clear error when image is successfully added
          setImageError("");
      };
      reader.readAsDataURL(file);
    });

      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
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
      
      // Clear error if images remain
      if (imagePreviews.length > 1) {
        setImageError("");
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

      // Validate product name
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

      // Validate price - price is required (for both create and update)
      const priceValue = formData.price?.trim() || '';
      if (!priceValue) {
        toast.error("Price is required");
        setPriceError("Price is required");
        return;
      }

      const priceNum = parseFloat(priceValue);
      if (isNaN(priceNum)) {
        toast.error("Price must be a valid number");
        setPriceError("Price must be a valid number");
        return;
      }

      if (priceNum < 0) {
        toast.error("Price must be greater than or equal to 0");
        setPriceError("Price must be greater than or equal to 0");
        return;
      }

      // Validate images - at least one image is required
    const newImageUrls = await convertFilesToDataUrls(imageFiles);
    const allImages = [...formData.images, ...newImageUrls];

      if (allImages.length === 0) {
        setImageError("At least one image is required");
        toast.error("Please upload at least one product image");
        return;
      }

      // Clear any previous errors
      setImageError("");
      setPriceError("");

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
        price: priceNum,
      images: allImages,
    });
  };

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
          <div className="space-y-2">
            <Label htmlFor="productPrice">
              Price (TND) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, price: value });
                  // Clear error on input if value is valid
                  if (value.trim() && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                    setPriceError("");
                  }
                }}
                onBlur={() => {
                  // Validate on blur
                  const priceValue = formData.price?.trim() || '';
                  if (!priceValue) {
                    setPriceError("Price is required");
                  } else {
                    const priceNum = parseFloat(priceValue);
                    if (isNaN(priceNum)) {
                      setPriceError("Price must be a valid number");
                    } else if (priceNum < 0) {
                      setPriceError("Price must be greater than or equal to 0");
                    } else {
                      setPriceError("");
                    }
                  }
                }}
                disabled={isLoading}
                className={`flex-1 ${priceError ? "border-destructive" : ""}`}
                required
              />
              <div className="flex items-center px-3 h-10 rounded-md border border-input bg-muted text-sm text-muted-foreground whitespace-nowrap">
                TND
              </div>
            </div>
            {priceError && (
              <p className="text-sm text-destructive mt-1">
                {priceError}
              </p>
            )}
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
            

            {/* Images */}
          <div className="space-y-2">
              <Label htmlFor="productImages">
                Product Images <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
            {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="h-24 w-full rounded-lg border border-border overflow-hidden bg-muted">
                          <img
                            src={preview}
                            alt={`Product image ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                          <Button
                            type="button"
                          size="sm"
                            variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            disabled={isLoading}
                          >
                          <X className="h-3 w-3" />
                          </Button>
                        </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="productImages"
                type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imagePreviews.length > 0 ? "Add More Images" : "Upload Images"}
                  </Button>
                </div>
                {imageError && (
                  <p className="text-sm text-destructive">
                    {imageError}
                  </p>
                )}
                {!imageError && imagePreviews.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, WebP. Max size: 5MB per image. At least one image is required.
                  </p>
                )}
              </div>
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
                disabled={
                  isLoading || 
                  !formData.name.trim() || 
                  !formData.price || 
                  formData.price.trim() === '' ||
                  isNaN(parseFloat(formData.price)) ||
                  parseFloat(formData.price) < 0 ||
                  imagePreviews.length === 0 ||
                  !!priceError
                }
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
