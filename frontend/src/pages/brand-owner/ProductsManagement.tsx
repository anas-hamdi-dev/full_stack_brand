import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePaginatedMyProducts } from "@/hooks/useBrands";
import { getFirstImageUrl, getAllImageUrls, ProductImage } from "@/hooks/useProducts";
import { productsApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
import ProductManagementModal from "@/components/modals/ProductManagementModal";
import BackButton from "@/components/BackButton";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_LOAD = 12;

interface Product {
  _id: string;
  id?: string;
  name: string;
  description?: string | null;
  price?: number | null;
  images: ProductImage[] | string[]; // Support both old (string[]) and new (ProductImage[]) formats
  purchaseLink?: string | null;
  brand_id?: string | null;
  createdAt?: string;
}

export default function ProductsManagement() {
  const { user } = useAuth();
  const brandId = user?.brand_id;
  
  // Use paginated products hook
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePaginatedMyProducts({
    limit: ITEMS_PER_LOAD,
  });

  // Accumulate all products from all pages, preventing duplicates
  const allProducts = useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
      return [];
    }
    
    const productMap = new Map<string, Product>();
    
    // Collect all products from all pages, using _id as unique key
    data.pages.forEach((page) => {
      if (page && page.products && Array.isArray(page.products)) {
        page.products.forEach((product) => {
          if (product && typeof product === 'object') {
            const productId = product._id || product.id;
            if (productId && typeof productId === 'string' && !productMap.has(productId)) {
              productMap.set(productId, product as Product);
            }
          }
        });
      }
    });

    return Array.from(productMap.values());
  }, [data?.pages]);

  // Get pagination metadata from the last page
  const pagination = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) {
      return { total: 0, hasMore: false };
    }
    const lastPage = data.pages[data.pages.length - 1];
    return lastPage.pagination;
  }, [data?.pages]);

  const hasMore = hasNextPage || false;
  const isLoadingMore = isFetchingNextPage;

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  };

  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const createProduct = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await productsApi.create(data);
      if (response.error) {
        throw new Error(response.error.message || "Failed to create product");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", brandId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products", "paginated"] });
      toast.success("Product created successfully!");
      setIsModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await productsApi.update(id, data);
      if (response.error) {
        throw new Error(response.error.message || "Failed to update product");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", brandId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products", "paginated"] });
      toast.success("Product updated successfully!");
      setIsModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const response = await productsApi.delete(id);
      if (response.error) {
        throw new Error(response.error.message || "Failed to delete product");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", brandId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products", "paginated"] });
      toast.success("Product deleted successfully!");
      setDeletingProductId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const handleSubmit = (formData: FormData) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct._id, data: formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    setDeletingProductId(productId);
  };

  const confirmDelete = () => {
    if (deletingProductId) {
      deleteProduct.mutate(deletingProductId);
    }
  };

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              No Brand Found
            </h1>
            <p className="text-muted-foreground">
              You must create a brand before you can manage your products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-6">
          <BackButton to="/" label="Back to home" />
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Manage My Products
            </h1>
            <p className="text-muted-foreground">
              Create, edit, and delete your products
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Results count */}
        {!error && (
          <p className="text-sm text-muted-foreground mb-6">
            {pagination.total > 0 ? pagination.total : allProducts.length} products
          </p>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">
              Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : error ? null : allProducts.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              No Products
            </h2>
            <p className="text-muted-foreground mb-6">
              Start by adding your first product
            </p>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map((product) => (
                <Card key={product._id || product.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {getAllImageUrls(product).length > 0 ? (
                      <img
                        src={getFirstImageUrl(product)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '16 / 9' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    {product.description && (
                      <ul className="text-sm text-muted-foreground mb-3 list-disc list-inside space-y-0.5 line-clamp-2">
                        {product.description
                          .split('\n')
                          .filter(line => line.trim())
                          .map((line, index) => (
                            <li key={index} className="text-left">
                              {line.trim()}
                            </li>
                          ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      {product.price !== null && product.price !== undefined ? (
                        <Badge variant="secondary" className="text-sm">
                          {product.price.toFixed(2)} TND
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-sm">
                          Price on request
                        </Badge>
                      )}
                      {getAllImageUrls(product).length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {getAllImageUrls(product).length} images
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(product._id || product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button with Skeleton */}
            {!isLoading && allProducts.length > 0 && hasMore && (
              <div className="mt-8">
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    className="min-w-[200px]"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
                {/* Show skeleton loaders while loading more items */}
                {isLoadingMore && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: ITEMS_PER_LOAD }).map((_, i) => (
                      <Card key={`loading-more-${i}`} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          <Skeleton className="w-full h-full" />
                        </div>
                        <CardContent className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Product Management Modal */}
        <ProductManagementModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          editingProduct={editingProduct ? {
            id: editingProduct._id || editingProduct.id || "",
            name: editingProduct.name,
            description: editingProduct.description || "",
            price: editingProduct.price ?? 0,
            images: editingProduct.images || [],
            purchaseLink: editingProduct.purchaseLink || "",
            brand_id: editingProduct.brand_id || null,
            created_at: editingProduct.createdAt || "",
          } : null}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

