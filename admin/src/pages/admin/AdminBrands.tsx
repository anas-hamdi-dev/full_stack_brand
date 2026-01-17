import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandsService } from "@/services/apiService";
import type { StaticBrand } from "@/data/staticData";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Search, Store, ExternalLink, Upload, X, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminBrands() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<StaticBrand & { owner?: { id: string; full_name: string; email: string } | null } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ownerId: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
    phone: "",
    email: "",
    logo_url: "",
    is_featured: false,
    status: "pending" as "pending" | "approved" | "rejected",
  });

  const { data: brands, isLoading } = useQuery({
    queryKey: ["admin-brands", search, statusFilter],
    queryFn: async () => {
      const brandsData = await brandsService.getAll(search);
      // Filter by status on the frontend since backend doesn't support status filter yet
      if (statusFilter !== "all") {
        return brandsData.filter((brand: any) => brand.status === statusFilter);
      }
      return brandsData;
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


  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData & { status?: string } }) => {
      // Don't allow changing ownerId - admin can only edit brand details, not ownership
      return await brandsService.update(id, {
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        website: data.website || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        phone: data.phone || null,
        email: data.email || null,
        logo_url: data.logo_url || null,
        is_featured: data.is_featured,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["recent-brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Brand updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update brand");
    },
  });

  // Mutation for status updates (approve/reject)
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      return await brandsService.update(id, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["recent-brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Brand ${variables.status === "approved" ? "approved" : "rejected"} successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update brand status");
    },
  });

  const handleApprove = (brandId: string) => {
    statusUpdateMutation.mutate({ id: brandId, status: "approved" });
  };

  const handleReject = (brandId: string) => {
    statusUpdateMutation.mutate({ id: brandId, status: "rejected" });
  };



  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      ownerId: "",
      location: "",
      website: "",
      instagram: "",
      facebook: "",
      phone: "",
      email: "",
      logo_url: "",
      is_featured: false,
      status: "pending" as "pending" | "approved" | "rejected",
    });
    setEditingBrand(null);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (brand: StaticBrand & { categories?: { id: string; name: string } | null; owner?: { id: string; full_name: string; email: string } | null; status?: "pending" | "approved" | "rejected" }) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || "",
      description: brand.description || "",
      ownerId: (brand as any).ownerId || "",
      location: brand.location || "",
      website: brand.website || "",
      instagram: brand.instagram || "",
      facebook: brand.facebook || "",
      phone: brand.phone || "",
      email: brand.email || "",
      logo_url: brand.logo_url || "",
      is_featured: brand.is_featured || false,
      status: (brand.status as "pending" | "approved" | "rejected") || "pending",
    });
    setLogoFile(null);
    setLogoPreview(brand.logo_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileUpload(file);
      setLogoFile(file);
      setLogoPreview(dataUrl);
      setFormData({ ...formData, logo_url: dataUrl });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload logo";
      toast.error(errorMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logo_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBrand) {
      toast.error("Cannot create brands. Only editing is allowed.");
      return;
    }
    
    // If a new file was uploaded, use the preview URL
    const finalLogoUrl = logoPreview || formData.logo_url;
    const submitData = { ...formData, logo_url: finalLogoUrl || null };
    
    updateMutation.mutate({ id: editingBrand.id, data: submitData });
  };

  return (
    <AdminLayout title="Brands" subtitle="Manage all brands">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {editingBrand && (editingBrand as any).owner && (
                <div className="space-y-2">
                  <Label>Brand Owner (Read-only)</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">{(editingBrand as any).owner.full_name}</p>
                    <p className="text-xs text-muted-foreground">{(editingBrand as any).owner.email}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

                <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="space-y-3">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <div className="h-24 w-24 rounded-lg border border-border overflow-hidden bg-muted">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="h-full w-full object-cover"
                  />
                </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                  <Input
                      ref={fileInputRef}
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as "pending" | "approved" | "rejected" })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || !editingBrand}>
                  Update
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brands Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : brands?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No brands found
                </TableCell>
              </TableRow>
            ) : (
              brands?.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{brand.name}</p>
                        {brand.website && (
                          <a 
                            href={brand.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(brand as any).owner ? (
                      <div>
                        <p className="font-medium text-foreground">{(brand as any).owner.full_name}</p>
                        <p className="text-xs text-muted-foreground">{(brand as any).owner.email}</p>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {brand.status && (
                      <Badge
                        variant={
                          brand.status === "approved"
                            ? "default"
                            : brand.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          brand.status === "approved"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : brand.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }
                      >
                        {brand.status === "approved"
                          ? "Approved"
                          : brand.status === "pending"
                          ? "Pending"
                          : "Rejected"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{brand.location || "-"}</TableCell>
                  <TableCell>
                      {brand.is_featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Featured
                        </span>
                      )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(brand.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {brand.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(brand.id)}
                            disabled={statusUpdateMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(brand.id)}
                            disabled={statusUpdateMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(brand)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </AdminLayout>
  );
}
