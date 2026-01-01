import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staticBrands, staticProducts } from "@/data/staticData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Store, Package, Eye, Settings, Plus, Edit, ArrowRight, Globe, MapPin, Mail, Phone, Instagram, Facebook } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";

export default function BrandOwnerDashboard() {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Bienvenue, {user?.full_name}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {ownedBrand ? `Gérez votre marque: ${ownedBrand.name}` : "Aucune marque assignée"}
            </p>
          </div>

          {!ownedBrand ? (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Marque non assignée</CardTitle>
                <CardDescription>Vous n'avez pas encore de marque assignée à votre compte.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Votre compte sera vérifié et une marque vous sera assignée sous peu.
                </p>
                <Link to="/submit">
                  <Button variant="hero">
                    Soumettre une marque
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Statut de la marque</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ownedBrand.is_featured ? "En vedette" : "Régulière"}
                    </div>
                    <p className="text-xs text-muted-foreground">Statut de la marque</p>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produits</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{brandProducts?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Produits totaux</p>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Catégorie</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ownedBrand.categories?.name || "N/A"}</div>
                    <p className="text-xs text-muted-foreground">Catégorie de la marque</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Voir la page publique</CardTitle>
                    <CardDescription>Consulter votre page de marque publique</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/brand/${ownedBrand.id}`}>
                      <Button variant="hero" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir la page
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Gérer les produits</CardTitle>
                    <CardDescription>Ajouter ou modifier vos produits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="hero" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un produit
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Paramètres</CardTitle>
                    <CardDescription>Modifier les informations de votre marque</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="hero" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Brand Info Card */}
              <Card className="glass mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{ownedBrand.name}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {ownedBrand.description || "Aucune description disponible"}
                      </CardDescription>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-foreground border border-foreground/30 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                      {ownedBrand.logo_url ? (
                        <img 
                          src={ownedBrand.logo_url} 
                          alt={`${ownedBrand.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-background font-display font-bold text-lg">
                          {ownedBrand.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ownedBrand.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Localisation</p>
                          <p className="font-medium">{ownedBrand.location}</p>
                        </div>
                      </div>
                    )}
                    {ownedBrand.categories?.name && (
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Catégorie</p>
                          <p className="font-medium">{ownedBrand.categories.name}</p>
                        </div>
                      </div>
                    )}
                    {ownedBrand.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Site web</p>
                          <a href={ownedBrand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            {ownedBrand.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {ownedBrand.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{ownedBrand.email}</p>
                        </div>
                      </div>
                    )}
                    {ownedBrand.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{ownedBrand.phone}</p>
                        </div>
                      </div>
                    )}
                    {ownedBrand.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Instagram</p>
                          <a href={ownedBrand.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            Voir le profil
                          </a>
                        </div>
                      </div>
                    )}
                    {ownedBrand.facebook && (
                      <div className="flex items-center gap-3">
                        <Facebook className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Facebook</p>
                          <a href={ownedBrand.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            Voir la page
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card className="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes Produits</CardTitle>
                      <CardDescription>
                        {brandProducts && brandProducts.length > 0 
                          ? `${brandProducts.length} produit${brandProducts.length > 1 ? 's' : ''} dans votre catalogue`
                          : "Aucun produit dans votre catalogue pour le moment"
                        }
                      </CardDescription>
                    </div>
                    <Button variant="hero" size="sm">
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
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">Aucun produit dans votre catalogue</p>
                      <Button variant="hero">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre premier produit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}



