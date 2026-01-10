import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  LogOut,
  Heart,
  Package,
  UserCircle,
  Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo2.png";
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
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, isClient, isBrandOwner, signOut } = useAuth();
  const { openLogin, openSignUp } = useAuthModal();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const navLinks = [
    { name: "Brands", href: "/brands" },
    { name: "Gallery", href: "/gallery" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && mobileMenuRef.current && !(mobileMenuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="relative z-20 w-full px-4 py-4">
      <div className="container mx-auto">
        <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between relative border border-primary/30">


          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="el mall logo"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:brightness-125"
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACTIONS */}
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
              <>
                <Button variant="outline" size="sm" onClick={openLogin}>
                  Login
                </Button>
                <Button variant="hero" size="sm" onClick={openSignUp}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU OVERLAY */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-16 w-full h-screen" onClick={() => setIsOpen(false)}>
            <div ref={mobileMenuRef} className="glass rounded-2xl p-6 w-full max-w-md mx-4 mt-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground font-medium py-2 border-b border-border/30 last:border-b-0"
                  >
                    {link.name}
                  </Link>
                ))}
                {!user && (
                  <div className="flex flex-col gap-3 pt-4">
                    <Button variant="outline" className="w-full" onClick={() => { openLogin(); setIsOpen(false); }}>
                      Login
                    </Button>
                    <Button variant="hero" className="w-full" onClick={() => { openSignUp(); setIsOpen(false); }}>
                      Sign Up
                    </Button>
                  </div>
                )}
                {user && (
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setIsOpen(false); }}>
                      Sign Out
                    </Button>
                  </div>
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
