import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thanks for subscribing to our newsletter.",
      });
      setEmail("");
    }
  };

  const footerLinks = {
    discover: [
      { name: "All Brands", href: "/brands" },
      { name: "Categories", href: "/#categories", isHash: true },
      { name: "Men's Fashion", href: "/category/Men's%20Fashion" },
      { name: "Women's Fashion", href: "/category/Women's%20Fashion" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Our Story", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Careers", href: "/contact" },
    ],
    resources: [
      { name: "Brand Guidelines", href: "/about" },
      { name: "Partnerships", href: "/contact" },
      { name: "Help Center", href: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  ];

  return (
    <footer className="border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="font-display font-bold text-xl text-primary-foreground">M</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">el mall</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              The ultimate directory for discovering and supporting authentic Tunisian brands.
            </p>
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

          {/* Discover */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Discover</h4>
            <ul className="space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="font-display font-semibold text-foreground mb-4">Stay Updated</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Get the latest Tunisian fashion news and trends.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-primary text-primary-foreground px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} el mall. Made with ❤️ in Tunisia.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
