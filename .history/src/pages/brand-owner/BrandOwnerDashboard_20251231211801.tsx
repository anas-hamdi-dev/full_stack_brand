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
import { User, Package, LogOut, Store, LayoutDashboard, Settings, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ProfileSection from "./ProfileSection";
import ProductsSection from "./ProductsSection";
import { Card, CardContent } from "@/components/ui/card";

export default function BrandOwnerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"profile" | "products">("profile");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const brand = user?.brand_id ? staticBrands.find(b => b.id === user.brand_id) : null;
  const brandProducts = user?.brand_id ? staticProducts.filter(p => p.brand_id === user.brand_id) : [];

  useEffect(() => {
    if (activeSection === "products") {
      setRefreshKey(prev => prev + 1);
    }
  }, [activeSection]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                  {brand?.name || "Brand Console"}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  Management
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Workspace
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "profile"}
                      onClick={() => setActiveSection("profile")}
                      className={`h-11 rounded-lg px-4 transition-all duration-200 ${
                        activeSection === "profile" 
                          ? "bg-primary/10 text-primary hover:bg-primary/15" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span className="font-medium">Brand Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "products"}
                      onClick={() => setActiveSection("products")}
                      className={`h-11 rounded-lg px-4 transition-all duration-200 ${
                        activeSection === "products" 
                          ? "bg-primary/10 text-primary hover:bg-primary/15" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span className="font-medium">Inventory</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-6">
            <Button
              variant="outline"
              className="w-full justify-start border-border/50 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-transparent">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-border/40 bg-background/80 px-8 backdrop-blur-md">
            <SidebarTrigger className="-ml-2 mr-4" />
            <div className="flex flex-1 items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">Dashboard</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-foreground capitalize">{activeSection}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-foreground">{user?.full_name}</span>
                <span className="text-[11px] text-muted-foreground leading-none">Account Owner</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/20 to-primary flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold text-primary-foreground">
                  {user?.full_name?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground leading-none mb-1">Total Products</p>
                    <p className="text-2xl font-bold">{brandProducts.length}</p>
                  </div>
                </CardContent>
              </Card>
              {/* Add more stats cards as needed */}
            </div>

            <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500">
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
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}