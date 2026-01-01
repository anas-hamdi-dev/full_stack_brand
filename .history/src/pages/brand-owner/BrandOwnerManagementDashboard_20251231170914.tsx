import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staticBrands, addProduct, updateProduct, deleteProduct, updateBrand, getStaticProducts } from "@/data/staticData";
import { 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Package,
  User,
  Save,
  Upload,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import ProductManagementModal from "@/components/modals/ProductManagementModal";

type DashboardView = "profile" | "products";

export default function BrandOwnerManagementDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [currentView, setCurrentView] = useState<DashboardView>("products");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile form state
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
    phone: "",
    email: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // Initialize profile form when brand is loaded or view changes
  useEffect(() => {
    if (ownedBrand && currentView === "profile") {
      setProfileFormData({
        name: ownedBrand.name || "",
        category_id: ownedBrand.category_id || "",
        description: ownedBrand.description || "",
        location: ownedBrand.location || "",
        website: ownedBrand.website || "",
        instagram: ownedBrand.instagram || "",
        facebook: ownedBrand.facebook || "",
        phone: ownedBrand.phone || "",
        email: ownedBrand.email || "",
      });
      setLogoPreview(ownedBrand.logo_url);
      setLogoFile(null);
    }
  }, [ownedBrand, currentView]);

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
      toast.success("Product created successfully");
      setProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error creating product");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<import("@/data/staticData").Product, "id" | "created_at" | "brands">> }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", user?.brand_id] });
      toast.success("Product updated successfully");
      setProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error updating product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-products", user?.brand_id] });
      toast.success("Product deleted successfully");
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error deleting product");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.brand_id) throw new Error("No brand found");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let logoUrl = ownedBrand?.logo_url;
      if (logoFile) {
        logoUrl = await convertFileToDataUrl(logoFile);
      } else if (!logoPreview) {
        logoUrl = null;
      }

      return updateBrand(user.brand_id, {
        name: profileFormData.name,
        category_id: profileFormData.category_id || null,
        description: profileFormData.description || null,
        logo_url: logoUrl,
        location: profileFormData.location || null,
        website: profileFormData.website || null,
        instagram: profileFormData.instagram || null,
        facebook: profileFormData.facebook || null,
        phone: profileFormData.phone || null,
        email: profileFormData.email || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", user?.brand_id] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error updating profile");
    },
  });

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        toast.error("Only JPEG, PNG and WebP files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must not exceed 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleSaveProfile = () => {
    if (!profileFormData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    if (!profileFormData.category_id) {
      toast.error("Category is required");
      return;
    }
    updateProfileMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!ownedBrand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No brand assigned to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Brand Owner</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "profile"}
                      onClick={() => setCurrentView("profile")}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === "products"}
                      onClick={() => setCurrentView("products")}
                    >
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
          </header>

          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {currentView === "profile" ? (
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Profile</h1>
                    <p className="text-sm text-muted-foreground">Manage your brand information</p>
                  </div>
                  {!isEditingProfile ? (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? (
                          <>
                            <Save className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Brand Information</CardTitle>
                    <CardDescription>Update your brand details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo */}
                    <div className="space-y-2">
                      <Label>Brand Logo</Label>
                      <div className="flex items-center gap-4">
                        {logoPreview && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {isEditingProfile && (
                          <div className="flex flex-col gap-2">
                            <Input
                              ref={logoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={handleLogoChange}
                              className="hidden"
                              id="logo-upload"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => logoInputRef.current?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {logoPreview ? "Change" : "Upload"}
                              </Button>
                              {logoPreview && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleRemoveLogo}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Brand Name */}
                    <div className="space-y-2">
                      <Label htmlFor="brandName">
                        Brand Name <span className="text-destructive">*</span>
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          id="brandName"
                          value={profileFormData.name}
                          onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                          required
                        />
                      ) : (
                        <p className="text-sm">{ownedBrand.name}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      {isEditingProfile ? (
                        <Select
                          value={profileFormData.category_id}
                          onValueChange={(value) => setProfileFormData({ ...profileFormData, category_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{ownedBrand.categories?.name || "-"}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      {isEditingProfile ? (
                        <Textarea
                          id="description"
                          value={profileFormData.description}
                          onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm">{ownedBrand.description || "-"}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      {isEditingProfile ? (
                        <Input
                          id="location"
                          value={profileFormData.location}
                          onChange={(e) => setProfileFormData({ ...profileFormData, location: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{ownedBrand.location || "-"}</p>
                      )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      {isEditingProfile ? (
                        <Input
                          id="website"
                          type="url"
                          value={profileFormData.website}
                          onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">
                          {ownedBrand.website ? (
                            <a href={ownedBrand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {ownedBrand.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        {isEditingProfile ? (
                          <Input
                            id="email"
                            type="email"
                            value={profileFormData.email}
                            onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{ownedBrand.email || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        {isEditingProfile ? (
                          <Input
                            id="phone"
                            type="tel"
                            value={profileFormData.phone}
                            onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{ownedBrand.phone || "-"}</p>
                        )}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        {isEditingProfile ? (
                          <Input
                            id="instagram"
                            value={profileFormData.instagram}
                            onChange={(e) => setProfileFormData({ ...profileFormData, instagram: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{ownedBrand.instagram || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        {isEditingProfile ? (
                          <Input
                            id="facebook"
                            type="url"
                            value={profileFormData.facebook}
                            onChange={(e) => setProfileFormData({ ...profileFormData, facebook: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{ownedBrand.facebook || "-"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-sm text-muted-foreground">Manage your product catalog</p>
                  </div>
                  <Button onClick={handleCreateProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Products Table */}
                {productsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
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
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {product.images && product.images.length > 0 && (
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                                      <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    {product.description && (
                                      <div className="text-sm text-muted-foreground line-clamp-1">
                                        {product.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
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
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12">
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
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
