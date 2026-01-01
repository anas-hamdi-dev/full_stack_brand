import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { staticBrands, staticProducts, staticCategories } from "@/data/staticData";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { Button } from "@/components/ui/button";
import { User, Package, LogOut, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ProfileSection from "./ProfileSection";
import ProductsSection from "./ProductsSection";

export default function BrandOwnerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"profile" | "products">("profile");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    toast.success("DÃ©connexion rÃ©ussie");
    navigate("/");
  };

  const brand = user?.brand_id ? staticBrands.find(b => b.id === user.brand_id) : null;
  const brandProducts = user?.brand_id ? staticProducts.filter(p => p.brand_id === user.brand_id) : [];

  // Refresh products when switching to products section
  useEffect(() => {
    if (activeSection === "products") {
      setRefreshKey(prev => prev + 1);
    }
  }, [activeSection]);

  return (
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-80px)] w-full pt-20">
          <Sidebar className="glass border-r border-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-foreground">Brand Owner</span>
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
                      isActive={activeSection === "profile"}
                      onClick={() => setActiveSection("profile")}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "products"}
                      onClick={() => setActiveSection("products")}
                    >
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center gap-4 px-6">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    {activeSection === "profile" ? "Profile" : "Products"}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {user?.full_name}
                  </div>
                  {brand && (
                    <div className="text-sm font-medium text-foreground">
                      {brand.name}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              {activeSection === "profile" ? (
                <ProfileSection brand={brand} user={user} />
              ) : (
                <ProductsSection 
                  key={refreshKey}
                  products={brandProducts} 
                  brandId={user?.brand_id || null}
                  categories={staticCategories}
                  onProductChange={() => setRefreshKey(prev => prev + 1)}
                />
              )}
            </main>
          </div>
        </SidebarInset>
        </div>
      </SidebarProvider>
  );
}
