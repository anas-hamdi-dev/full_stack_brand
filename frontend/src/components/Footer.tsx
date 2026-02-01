import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo2.png";

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/elmall_tn", label: "Visit our Instagram page" },
  { icon: Facebook, href: "https://facebook.com", label: "Visit our Facebook page" },
] as const;

const quickLinks = [
  { to: "/brands", label: "All Brands" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

const Footer = memo(() => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="border-t border-border pt-12 pb-8" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand & Contact Info */}
          <address className="flex flex-col items-center md:items-start not-italic">
            <Link to="/" className="flex items-center gap-3 mb-4" aria-label="el mall homepage">
              <img 
                src={logo} 
                alt="el mall logo" 
                className="h-10 w-auto object-contain"
                loading="lazy"
                width="120"
                height="40"
              />
            </Link>
            <p className="text-muted-foreground text-sm text-center md:text-left max-w-xs mb-4">
              Tunisian platform for discovering Tunisian brands.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <a href="mailto:contact@elmall.tn" className="hover:text-foreground transition-colors">
                  contact@elmall.tn
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <a href="tel:+21699797459" className="hover:text-foreground transition-colors">
                  +216 99 797 459
                </a>
              </p>
            </div>
          </address>

          {/* Quick Links */}
          <nav className="flex flex-col items-center" aria-label="Footer navigation">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-foreground transition-colors text-center md:text-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter & Social Links */}
          <div className="flex flex-col items-center md:items-center">
            <h3 className="font-semibold text-lg mb-4">Stay Connected</h3>
            <div className="mb-4 w-full max-w-xs">
              <p className="text-muted-foreground text-sm mb-2 text-center">Subscribe to our newsletter</p>
              <form className="flex gap-2 w-full" aria-label="Newsletter subscription">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address for newsletter
                </label>
                <input 
                  id="newsletter-email"
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                  aria-label="Enter your email address"
                />
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  aria-label="Subscribe to newsletter"
                >
                  Join
                </button>
              </form>
            </div>
            <nav className="flex items-center gap-3" aria-label="Social media links">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label} 
                    className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
                  >
                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-2">
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} el mall. Made with <span aria-label="love">❤️</span> in Tunisia.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
