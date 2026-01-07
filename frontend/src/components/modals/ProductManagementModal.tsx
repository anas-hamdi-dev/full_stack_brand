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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [priceError, setPriceError] = useState<string>("");

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

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
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

      // Validate price - price is required
      if (!formData.price || formData.price.trim() === '') {
        toast.error("Price is required");
        setPriceError("Price is required");
        return;
      }

      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Price must be a valid number greater than or equal to 0");
        setPriceError("Price must be a valid number greater than or equal to 0");
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
                  setFormData({ ...formData, price: e.target.value });
                  setPriceError(""); // Clear error on input
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
            

            {/* Images with Carousel */}
            <div className="space-y-4">
              <Label htmlFor="productImages">
                Product Images <span className="text-destructive">*</span>
              </Label>
              
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
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-destructive"
                              onClick={() => removeImage(index)}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm text-xs font-medium">
                              {index + 1} / {imagePreviews.length}
                            </div>
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
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border opacity-60 hover:opacity-100 hover:border-primary/50"
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

              {/* Upload Area - Small Square (1:1 aspect ratio) */}
              <div className="flex justify-start">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative w-48 h-48 border-2 border-dashed rounded-lg transition-all ${
                    imageError
                      ? "border-destructive bg-destructive/5"
                      : isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-input bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <label
                    htmlFor="productImages"
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className={`p-2 rounded-full transition-colors ${
                        isDragging 
                          ? "bg-primary/10" 
                          : imageError
                          ? "bg-destructive/10"
                          : "bg-muted"
                      }`}>
                        <Upload className={`w-5 h-5 transition-colors ${
                          isDragging 
                            ? "text-primary" 
                            : imageError
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="text-center space-y-0.5">
                        <p className={`text-xs font-medium ${
                          imageError ? "text-destructive" : "text-foreground"
                        }`}>
                          {isDragging 
                            ? "Drop here" 
                            : imagePreviews.length > 0
                            ? "Add more"
                            : "Upload"
                          }
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </label>
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
                </div>
              </div>
              
              {/* Error Message */}
              {imageError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                  <span className="font-medium">Error:</span>
                  <span>{imageError}</span>
                </p>
              )}
              
              {!imageError && imagePreviews.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  At least one image is required
                </p>
              )}
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
                  imagePreviews.length === 0
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
