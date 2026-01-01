import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addProduct, updateProduct, deleteProduct, type Product, type Category } from "@/data/staticData";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Package, Plus, Edit, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a valid number"),
  category_id: z.string().min(1, "Please select a category"),
  images: z.array(z.string().url("Please enter a valid URL")).min(1, "At least one image is required"),
  external_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductsSectionProps {
  products: Product[];
  brandId: string | null;
  categories: Category[];
}

export default function ProductsSection({ products, brandId, categories }: ProductsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [imageInputs, setImageInputs] = useState<string[]>([""]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category_id: "",
      images: [],
      external_url: "",
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      price: "",
      category_id: "",
      images: [],
      external_url: "",
    });
    setImageInputs([""]);
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    const imageUrls = product.images || [];
    setImageInputs(imageUrls.length > 0 ? imageUrls : [""]);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      category_id: categories.find(c => c.name === product.brands?.name)?.id || "",
      images: imageUrls,
      external_url: product.external_url || "",
    });
    setIsDialogOpen(true);
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, ""]);
  };

  const removeImageInput = (index: number) => {
    const newInputs = imageInputs.filter((_, i) => i !== index);
    setImageInputs(newInputs.length > 0 ? newInputs : [""]);
  };

  const updateImageInput = (index: number, value: string) => {
    const newInputs = [...imageInputs];
    newInputs[index] = value;
    setImageInputs(newInputs);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!brandId) {
      toast.error("Brand ID not found");
      return;
    }

    const validImages = imageInputs.filter(url => url.trim() !== "");
    if (validImages.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    // Update form with valid images before validation
    form.setValue("images", validImages);

    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, {
          name: data.name,
          description: data.description || null,
          price: data.price ? parseFloat(data.price) : null,
          brand_id: brandId,
          images: validImages,
          external_url: data.external_url || null,
        });
        toast.success("Product updated successfully");
      } else {
        addProduct({
          name: data.name,
          description: data.description || null,
          price: data.price ? parseFloat(data.price) : null,
          brand_id: brandId,
          images: validImages,
          external_url: data.external_url || null,
        });
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      // Force a page reload to show updated products
      window.location.reload();
    } catch (error) {
      toast.error(editingProduct ? "Failed to update product" : "Failed to create product");
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    try {
      deleteProduct(deletingProduct.id);
      toast.success("Product deleted successfully");
      setDeletingProduct(null);
    } catch (error) {
      toast.error("Failed to delete product");
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Product Images *</FormLabel>
                  {imageInputs.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => updateImageInput(index, e.target.value)}
                      />
                      {imageInputs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImageInput(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImageInput}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Image
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="external_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/product" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              alt={${product.name} - Image }
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
