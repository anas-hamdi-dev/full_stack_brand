import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staticBrands, staticProducts, addProduct, updateProduct, deleteProduct, updateBrand } from "@/data/staticData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Store, 
  Eye,
  ArrowRight,
  BarChart3
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManagementModal from "@/components/modals/ProductManagementModal";
import ProfileManagementModal from "@/components/modals/ProfileManagementModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

export default function BrandOwnerManagementDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  // Get the brand owned by this user
  const ownedBrand = user?.brand_id ? staticBrands.find(b => b.id === user.brand_id) : null;
  
  // Get products for this brand
  const { data: brandProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["brand-products", user?.brand_id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return staticProducts.filter(p => p.brand_id === user?.brand_id);
    },
    enabled: !!user?.brand_id,
  });

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

  if (!ownedBrand) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Marque non assignée</CardTitle>
                <CardDescription>Vous n'avez pas encore de marque assignée à votre compte.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/submit">
                  <Button variant="hero">
                    Soumettre une marque
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Gestion de la marque
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos produits et votre profil pour {ownedBrand.name}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>Voir les statistiques</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/brand-owner/analytics">
                  <Button variant="hero" className="w-full">
                    Voir les analytics
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Page publique
                </CardTitle>
                <CardDescription>Voir votre page publique</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={`/brand/${ownedBrand.id}`}>
                  <Button variant="hero" className="w-full">
                    Voir la page
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Tableau de bord
                </CardTitle>
                <CardDescription>Retour au tableau principal</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/brand-owner/dashboard">
                  <Button variant="hero" className="w-full">
                    Tableau de bord
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Profil
                </CardTitle>
                <CardDescription>Gérer votre profil</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="hero" 
                  className="w-full"
                  onClick={() => setProfileModalOpen(true)}
                >
                  Modifier le profil
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="products" className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Gestion des produits</TabsTrigger>
              <TabsTrigger value="profile">Profil de la marque</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle>Mes Produits</CardTitle>
                      <CardDescription>
                        {brandProducts && brandProducts.length > 0 
                          ? `${brandProducts.length} produit${brandProducts.length > 1 ? 's' : ''} dans votre catalogue`
                          : "Aucun produit dans votre catalogue pour le moment"
                        }
                      </CardDescription>
                    </div>
                    <Button variant="hero" onClick={handleCreateProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un produit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[280px] rounded-2xl" />
                      ))}
                    </div>
                  ) : brandProducts && brandProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {brandProducts.map((product) => (
                        <div key={product.id} className="relative group">
                          <ProductCard
                            id={product.id}
                            name={product.name}
                            description={product.description || ""}
                            imageUrl={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                            price={product.price}
                            brandName={ownedBrand.name}
                            brandLogo={ownedBrand.logo_url}
                          />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditProduct(product.id)}
                              className="bg-background/90 backdrop-blur-sm"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-background/90 backdrop-blur-sm"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">Aucun produit dans votre catalogue</p>
                      <Button variant="hero" onClick={handleCreateProduct}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre premier produit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Informations de la marque</CardTitle>
                      <CardDescription>Gérez les informations de votre marque</CardDescription>
                    </div>
                    <Button variant="hero" onClick={() => setProfileModalOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      {ownedBrand.logo_url && (
                        <div className="w-24 h-24 rounded-full bg-foreground border border-foreground/30 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                          <img 
                            src={ownedBrand.logo_url} 
                            alt={`${ownedBrand.name} logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-display font-bold text-foreground">{ownedBrand.name}</h3>
                        {ownedBrand.categories?.name && (
                          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mt-2">
                            {ownedBrand.categories.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {ownedBrand.description && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                        <p className="text-foreground">{ownedBrand.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ownedBrand.location && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Localisation</h4>
                          <p className="text-foreground">{ownedBrand.location}</p>
                        </div>
                      )}
                      {ownedBrand.website && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Site web</h4>
                          <a href={ownedBrand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {ownedBrand.website}
                          </a>
                        </div>
                      )}
                      {ownedBrand.email && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                          <p className="text-foreground">{ownedBrand.email}</p>
                        </div>
                      )}
                      {ownedBrand.phone && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h4>
                          <p className="text-foreground">{ownedBrand.phone}</p>
                        </div>
                      )}
                      {ownedBrand.instagram && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Instagram</h4>
                          <a href={ownedBrand.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {ownedBrand.instagram}
                          </a>
                        </div>
                      )}
                      {ownedBrand.facebook && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Facebook</h4>
                          <a href={ownedBrand.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {ownedBrand.facebook}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

      {/* Profile Management Modal */}
      <ProfileManagementModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        brand={ownedBrand}
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
