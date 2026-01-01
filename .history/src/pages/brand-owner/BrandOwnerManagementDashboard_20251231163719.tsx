import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staticBrands, addProduct, updateProduct, deleteProduct, getStaticProducts } from "@/data/staticData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Package
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductManagementModal from "@/components/modals/ProductManagementModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function BrandOwnerManagementDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get the brand owned by this user
  const ownedBrand = user?.brand_id ? staticBrands.find(b => b.id === user.brand_id) : null;
  
  // Get products for this brand
  const { data: brandProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["brand-products", user?.brand_id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const products = getStaticProducts();
      return products.filter(p => p.brand_id === user?.brand_id);
    },
    enabled: !!user?.brand_id,
  });

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!brandProducts) return [];
    if (!searchQuery.trim()) return brandProducts;
    
    const query = searchQuery.toLowerCase();
    return brandProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  }, [brandProducts, searchQuery]);

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (productData: Omit<import("@/data/staticData").Product, "id" | "created_at" | "brands">) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return addProduct(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", user?.brand_id] });
      toast.success("Produit créé avec succès");
      setProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du produit");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<import("@/data/staticData").Product, "id" | "created_at" | "brands">> }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", user?.brand_id] });
      toast.success("Produit mis à jour avec succès");
      setProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du produit");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", user?.brand_id] });
      toast.success("Produit supprimé avec succès");
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression du produit");
    },
  });

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleEditProduct = (productId: string) => {
    setEditingProduct(productId);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setDeletingProduct(productId);
  };

  const handleProductSubmit = (productData: Omit<import("@/data/staticData").Product, "id" | "created_at" | "brands">) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct, data: productData });
    } else {
      createProductMutation.mutate({ ...productData, brand_id: user?.brand_id || null });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!ownedBrand) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucune marque assignée à votre compte.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header with Search and Add Button */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="hero" onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Products Table */}
          {productsLoading ? (
            <div className="border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{ownedBrand.name}</TableCell>
                      <TableCell>
                        {product.price ? `$${product.price.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(product.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? "No products found" : "No products found"}
                </p>
                {!searchQuery && (
                  <Button variant="hero" onClick={handleCreateProduct} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Product Management Modal */}
      <ProductManagementModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct ? brandProducts?.find(p => p.id === editingProduct) : null}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
