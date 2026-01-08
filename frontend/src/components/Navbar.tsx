import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Heart, Package, UserCircle, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.svg";
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

const   Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isClient, isBrandOwner, signOut } = useAuth();
  const { openLogin, openSignUp, loginOpen, signUpOpen, setLoginOpen, setSignUpOpen } = useAuthModal();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
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
    <nav className="w-full px-4 py-4 relative mb-8">
      {/* Background Effects - matching HeroSection */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Subtle Animated Orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-secondary/8 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto relative z-10">
        <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="el mall logo" 
              className="h-10 w-auto object-contain"
            />
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
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isBrandOwner && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/brand-owner/profile")}>
                        <UserCircle className="h-4 w-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/brand-owner/brand")}>
                        <Store className="h-4 w-4 mr-2" />
                        My Brand
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/brand-owner/products")}>
                        <Package className="h-4 w-4 mr-2" />
                        My Products
                      </DropdownMenuItem>
                    </>
                  )}
                  {isClient && (
                    <DropdownMenuItem onClick={() => navigate("/client/favorites")}>
                      <Heart className="h-4 w-4 mr-2" />
                      My Favorites
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
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
                  <DropdownMenuLabel>Sign In</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openLogin}>
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openSignUp}>
                    <User className="h-4 w-4 mr-2" />
                    Sign Up
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
                      <>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-center"
                          onClick={() => {
                            setIsOpen(false);
                            navigate("/brand-owner/profile");
                          }}
                        >
                          <UserCircle className="h-4 w-4 mr-2" />
                          My Profile
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-center"
                          onClick={() => {
                            setIsOpen(false);
                            navigate("/brand-owner/brand");
                          }}
                        >
                          <Store className="h-4 w-4 mr-2" />
                          My Brand
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-center"
                          onClick={() => {
                            setIsOpen(false);
                            navigate("/brand-owner/products");
                          }}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          My Products
                        </Button>
                      </>
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
                        My Favorites
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
                      Sign Out
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
                      Login
                    </Button>
                    <Button 
                      variant="hero" 
                      className="w-full justify-center"
                      onClick={() => {
                        setIsOpen(false);
                        openSignUp();
                      }}
                    >
                      Sign Up
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
