import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Store, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuthModal } from "@/contexts/AuthModalContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isClient, isBrandOwner, signOut } = useAuth();
  const { openLogin, openSignUp, loginOpen, signUpOpen, setLoginOpen, setSignUpOpen } = useAuthModal();

  const handleSignOut = async () => {
    await signOut();
<<<<<<< HEAD
    toast.success("Déconnexion réussie");
=======
    toast.success("Successfully logged out");
>>>>>>> 4cdba68 (Add brand client side static project)
    navigate("/");
  };

  const getDashboardPath = () => {
    if (isBrandOwner) return "/brand-owner/dashboard";
    if (isClient) return "/client/favorites";
    return "/";
  };

  const navLinks = [
    { name: "Brands", href: "/brands" },
    { name: "Gallery", href: "/gallery" },
    { name: "Categories", href: "/#categories" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(href.replace("/", ""));
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="container mx-auto">
        <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="font-display font-bold text-xl text-primary-foreground">M</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">el mall</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith("/#") ? (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user.full_name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
<<<<<<< HEAD
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
=======
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
>>>>>>> 4cdba68 (Add brand client side static project)
                  <DropdownMenuSeparator />
                  {isBrandOwner && (
                    <DropdownMenuItem onClick={() => navigate("/brand-owner/dashboard")}>
                      <Store className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                      Tableau de bord
=======
                      Dashboard
>>>>>>> 4cdba68 (Add brand client side static project)
                    </DropdownMenuItem>
                  )}
                  {isClient && (
                    <DropdownMenuItem onClick={() => navigate("/client/favorites")}>
                      <Heart className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                      Mes Favoris
=======
                      My Favorites
>>>>>>> 4cdba68 (Add brand client side static project)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                    Se déconnecter
=======
                    Sign out
>>>>>>> 4cdba68 (Add brand client side static project)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
<<<<<<< HEAD
                  <DropdownMenuLabel>Se connecter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openLogin}>
                    <User className="h-4 w-4 mr-2" />
                    Connexion
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openSignUp}>
                    <User className="h-4 w-4 mr-2" />
                    S'inscrire
=======
                  <DropdownMenuLabel>Sign in</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openLogin}>
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openSignUp}>
                    <User className="h-4 w-4 mr-2" />
                    Sign up
>>>>>>> 4cdba68 (Add brand client side static project)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-2 glass rounded-2xl p-6 animate-scale-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.href.startsWith("/#") ? (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium py-2 text-left"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {user ? (
                  <>
                    {isBrandOwner && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/brand-owner/dashboard");
                        }}
                      >
                        <Store className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                        Tableau de bord
=======
                        Dashboard
>>>>>>> 4cdba68 (Add brand client side static project)
                      </Button>
                    )}
                    {isClient && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/client/favorites");
                        }}
                      >
                        <Heart className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                        Mes Favoris
=======
                        My Favorites
>>>>>>> 4cdba68 (Add brand client side static project)
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-center"
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                      Se déconnecter
=======
                      Sign out
>>>>>>> 4cdba68 (Add brand client side static project)
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-center"
                      onClick={() => {
                        setIsOpen(false);
                        openLogin();
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                      Connexion
=======
                      Login
>>>>>>> 4cdba68 (Add brand client side static project)
                    </Button>
                    <Button 
                      variant="hero" 
                      className="w-full justify-center"
                      onClick={() => {
                        setIsOpen(false);
                        openSignUp();
                      }}
                    >
<<<<<<< HEAD
                      S'inscrire
=======
                      Sign up
>>>>>>> 4cdba68 (Add brand client side static project)
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;