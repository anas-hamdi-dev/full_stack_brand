import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo2.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  ];

  return (
    <footer className="border-t border-border pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand & Contact Info */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="el mall logo" 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-sm text-center md:text-left max-w-xs mb-4">
              Tunisian platform for discovering Tunisian brands.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>contact@elmall.tn</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <span>+216 12 345 678</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/brands" className="text-muted-foreground hover:text-foreground transition-colors text-center md:text-left">
                All Brands
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors text-center md:text-left">
                About Us
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-center md:text-left">
                Contact
              </Link>
              <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors text-center md:text-left">
                Categories
              </Link>
            </div>
          </div>

          {/* Newsletter & Social Links */}
          <div className="flex flex-col items-center md:items-center">
            <h3 className="font-semibold text-lg mb-4">Stay Connected</h3>
            <div className="mb-4 w-full max-w-xs">
              <p className="text-muted-foreground text-sm mb-2 text-center">Subscribe to our newsletter</p>
              <div className="flex gap-2 w-full">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Join
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label} 
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-2">
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} el mall. Made with ❤️ in Tunisia.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
