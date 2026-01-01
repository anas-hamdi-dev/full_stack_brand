import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrands } from "@/hooks/useBrands";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { Store, Heart, ShoppingBag, Settings, LogOut, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const { data: brands } = useBrands();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  // Get actual favorite brands
  const favoriteBrands = brands?.filter(brand => favorites.includes(brand.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.full_name}!</h1>
              <p className="text-muted-foreground mt-1">Manage your account and explore brands</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Brands</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoriteBrands.length}</div>
              <p className="text-xs text-muted-foreground">Brands you follow</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brands?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available brands</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Client account</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Explorer les marques</CardTitle>
              <CardDescription>Découvrir de nouvelles marques de mode</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/brands">
                <Button variant="hero" className="w-full">
                  Voir toutes les marques
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Mes Favoris</CardTitle>
              <CardDescription>Voir toutes vos marques favorites</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/client/favorites">
                <Button variant="hero" className="w-full">
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                  Voir mes favoris
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Galerie</CardTitle>
              <CardDescription>Voir les produits de mode</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/gallery">
                <Button variant="hero" className="w-full">
                  Voir la galerie
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Brands */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Mes Marques Favorites</CardTitle>
            <CardDescription>
              {favoriteBrands.length > 0 
                ? `${favoriteBrands.length} marque${favoriteBrands.length > 1 ? 's' : ''} dans vos favoris`
                : "Vous n'avez pas encore de marques favorites. Explorez les marques et ajoutez-les à vos favoris !"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoriteBrands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {favoriteBrands.map((brand) => (
                  <Link key={brand.id} to={`/brand/${brand.id}`}>
                    <Card className="hover-lift cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">{brand.name}</h3>
                        <p className="text-sm text-muted-foreground">{brand.categories?.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucune marque favorite pour le moment</p>
                <Link to="/brands">
                  <Button variant="hero">
                    Explorer les marques
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrands } from "@/hooks/useBrands";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { Store, Heart, ShoppingBag, Settings, LogOut, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const { data: brands } = useBrands();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  // Get actual favorite brands
  const favoriteBrands = brands?.filter(brand => favorites.includes(brand.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.full_name}!</h1>
              <p className="text-muted-foreground mt-1">Manage your account and explore brands</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Brands</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoriteBrands.length}</div>
              <p className="text-xs text-muted-foreground">Brands you follow</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brands?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available brands</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Client account</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Explorer les marques</CardTitle>
              <CardDescription>Découvrir de nouvelles marques de mode</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/brands">
                <Button variant="hero" className="w-full">
                  Voir toutes les marques
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Mes Favoris</CardTitle>
              <CardDescription>Voir toutes vos marques favorites</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/client/favorites">
                <Button variant="hero" className="w-full">
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                  Voir mes favoris
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Galerie</CardTitle>
              <CardDescription>Voir les produits de mode</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/gallery">
                <Button variant="hero" className="w-full">
                  Voir la galerie
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Brands */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Mes Marques Favorites</CardTitle>
            <CardDescription>
              {favoriteBrands.length > 0 
                ? `${favoriteBrands.length} marque${favoriteBrands.length > 1 ? 's' : ''} dans vos favoris`
                : "Vous n'avez pas encore de marques favorites. Explorez les marques et ajoutez-les à vos favoris !"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoriteBrands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {favoriteBrands.map((brand) => (
                  <Link key={brand.id} to={`/brand/${brand.id}`}>
                    <Card className="hover-lift cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">{brand.name}</h3>
                        <p className="text-sm text-muted-foreground">{brand.categories?.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucune marque favorite pour le moment</p>
                <Link to="/brands">
                  <Button variant="hero">
                    Explorer les marques
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
