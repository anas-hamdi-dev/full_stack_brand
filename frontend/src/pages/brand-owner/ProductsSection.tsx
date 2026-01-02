import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import type { Product } from "@/hooks/useProducts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Package, Plus, Edit, Trash2, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a valid number"),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductsSectionProps {
  products: Product[];
  brandId: string | null;
  onProductChange?: () => void;
}

export default function ProductsSection({ products, brandId, onProductChange }: ProductsSectionProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      images: [],
    },
  });

  const handleFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload an image file'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File size must be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      price: "",
      images: [],
    });
    setImagePreviews([]);
    setEditingProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    const imageUrls = product.images || [];
    setImagePreviews(imageUrls);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      images: imageUrls,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => handleFileUpload(file));
      const dataUrls = await Promise.all(uploadPromises);
      
      const currentImages = form.getValues("images") || [];
      const newImages = [...currentImages, ...dataUrls];
      form.setValue("images", newImages);
      setImagePreviews(newImages);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload images";
      toast.error(errorMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", newImages);
    setImagePreviews(newImages);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!brandId) {
      toast.error("Brand ID not found");
      return;
    }

    // Validate that at least one image is provided
    if (data.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      const productData = {
        name: data.name,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
        images: data.images,
      };

      if (editingProduct) {
        const productId = editingProduct.id || editingProduct._id;
        const response = await productsApi.update(productId, productData);
        if (response.error) {
          throw new Error(response.error.message);
        }
        toast.success("Product updated successfully");
      } else {
        const response = await productsApi.create(productData);
        if (response.error) {
          throw new Error(response.error.message);
        }
        toast.success("Product created successfully");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brand-products", brandId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      setIsDialogOpen(false);
      resetForm();
      onProductChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (editingProduct ? "Failed to update product" : "Failed to create product"));
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      const productId = deletingProduct.id || deletingProduct._id;
      const response = await productsApi.delete(productId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      toast.success("Product deleted successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brand-products", brandId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      setDeletingProduct(null);
      onProductChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground mt-1">
            Manage your products ({products.length} total)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-strong">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product information" : "Add a new product to your catalog"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Product description..." 
                          className="resize-none min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (TND)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Product Images *</FormLabel>
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
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                        <Button
                          type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <Upload className="h-4 w-4 mr-2" />
                        {imagePreviews.length > 0 ? "Add More Images" : "Upload Images"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB per image. At least one image is required.
                    </p>
                  </div>
                  {form.formState.errors.images && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.images.message}
                    </p>
                  )}
                </div>


                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Get started by adding your first product to your catalog
            </p>
            <Button variant="hero" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="glass hover-lift">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  {product.images && product.images.length > 0 ? (
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {product.images.map((image, index) => (
                          <CarouselItem key={index}>
                            <img
                              src={image}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {product.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {product.price && (
                    <p className="text-primary font-semibold mb-4">
                      {product.price.toFixed(0)} TND
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
