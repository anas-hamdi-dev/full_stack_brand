import type { Config } from "tailwindcss";

// @ts-expect-error - CommonJS require in TypeScript config file
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindcssAnimate = require("tailwindcss-animate");

// Custom plugin to inject theme CSS variables and utilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const themePlugin = ({ addBase, addComponents, addUtilities }: any) => {
  // Inject CSS variables
  addBase({
    ':root': {
      '--background': '270 50% 3%',
      '--foreground': '270 20% 98%',
      '--card': '270 40% 7%',
      '--card-foreground': '270 20% 98%',
      '--popover': '270 40% 7%',
      '--popover-foreground': '270 20% 98%',
      '--primary': '270 70% 55%',
      '--primary-foreground': '270 20% 98%',
      '--secondary': '280 60% 65%',
      '--secondary-foreground': '270 50% 3%',
      '--muted': '270 30% 12%',
      '--muted-foreground': '270 20% 65%',
      '--accent': '280 60% 65%',
      '--accent-foreground': '270 50% 3%',
      '--destructive': '0 84% 60%',
      '--destructive-foreground': '270 20% 98%',
      '--border': '270 30% 15%',
      '--input': '270 30% 15%',
      '--ring': '270 70% 55%',
      '--radius': '1rem',
      '--glass': '270 40% 10% / 0.6',
      '--glass-border': '270 20% 98% / 0.08',
      '--glow-primary': '270 70% 55% / 0.4',
      '--glow-secondary': '280 60% 65% / 0.3',
      '--gradient-primary': 'linear-gradient(135deg, hsl(270 70% 55%), hsl(280 80% 65%))',
      '--gradient-secondary': 'linear-gradient(135deg, hsl(280 60% 65%), hsl(290 70% 70%))',
      '--gradient-dark': 'linear-gradient(180deg, hsl(270 50% 5%), hsl(270 50% 3%))',
      '--gradient-glass': 'linear-gradient(135deg, hsl(270 40% 12% / 0.5), hsl(270 40% 7% / 0.3))',
      '--gradient-hero': 'radial-gradient(ellipse at 50% 0%, hsl(270 70% 55% / 0.2), transparent 60%)',
      '--font-display': "'Outfit', sans-serif",
      '--font-body': "'Space Grotesk', sans-serif",
      '--shadow-glow': '0 0 60px hsl(270 70% 55% / 0.3)',
      '--shadow-card': '0 4px 30px hsl(0 0% 0% / 0.4)',
      '--shadow-elevated': '0 20px 60px hsl(0 0% 0% / 0.6)',
    },
    '.dark': {
      '--background': '270 50% 3%',
      '--foreground': '270 20% 98%',
    },
    '*': {
      'border-color': 'hsl(var(--border))',
      'scroll-behavior': 'smooth !important',
    },
    'p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label, a, button': {
      'color': 'inherit',
    },
    'html': {
      'scroll-behavior': 'smooth',
      'overflow-x': 'hidden',
      'background-color': 'hsl(var(--background))',
      'background': 'var(--gradient-dark)',
      'overscroll-behavior-y': 'none',
      'overscroll-behavior-x': 'none',
      'padding-top': 'env(safe-area-inset-top)',
      'padding-bottom': 'env(safe-area-inset-bottom)',
      'padding-left': 'env(safe-area-inset-left)',
      'padding-right': 'env(safe-area-inset-right)',
      'min-height': '100dvh',
      'height': '100%',
      'width': '100%',
    },
    'html, body': {
      '-webkit-overflow-scrolling': 'touch',
      'background-color': 'hsl(var(--background))',
      'background': 'var(--gradient-dark)',
      'overscroll-behavior': 'none',
      'min-height': '100dvh',
      'height': '100%',
      'width': '100%',
    },
    '#root': {
      'min-height': '100dvh',
      'background-color': 'hsl(var(--background))',
      'background': 'var(--gradient-dark)',
      'overscroll-behavior': 'none',
      'padding-top': 'env(safe-area-inset-top)',
      'padding-bottom': 'env(safe-area-inset-bottom)',
      'padding-left': 'env(safe-area-inset-left)',
      'padding-right': 'env(safe-area-inset-right)',
    },
    'body': {
      'font-family': 'var(--font-body)',
      'background': 'var(--gradient-dark)',
      'background-color': 'hsl(var(--background))',
      'color': 'hsl(var(--foreground))',
      'min-height': '100dvh',
      'height': '100%',
      'width': '100%',
      'margin': '0',
      'padding': '0',
      'padding-top': 'env(safe-area-inset-top)',
      'padding-bottom': 'env(safe-area-inset-bottom)',
      'padding-left': 'env(safe-area-inset-left)',
      'padding-right': 'env(safe-area-inset-right)',
      'overscroll-behavior-y': 'none',
      'overscroll-behavior-x': 'none',
      '-webkit-tap-highlight-color': 'transparent',
    },
    'h1, h2, h3, h4, h5, h6': {
      'font-family': 'var(--font-display)',
    },
  });

  // Add component classes
  addComponents({
    '.glass': {
      'background-color': 'hsl(var(--card) / 0.6)',
      'backdrop-filter': 'blur(24px)',
      'border': '1px solid hsl(var(--border) / 0.3)',
    },
    '.glass-strong': {
      'background-color': 'hsl(var(--card) / 0.8)',
      'backdrop-filter': 'blur(40px)',
      'border': '1px solid hsl(var(--border) / 0.4)',
    },
    '.text-gradient-primary': {
      'background': 'var(--gradient-primary)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      'background-clip': 'text',
    },
    '.text-gradient-secondary': {
      'background': 'var(--gradient-secondary)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      'background-clip': 'text',
    },
    '.bg-gradient-primary': {
      'background': 'var(--gradient-primary)',
    },
    '.bg-gradient-secondary': {
      'background': 'var(--gradient-secondary)',
    },
    '.hover-lift': {
      'transition': 'all 300ms ease-out',
    },
    '.hover-lift:hover': {
      'transform': 'translateY(-4px)',
      'box-shadow': 'var(--shadow-elevated)',
    },
  });

  // Add utility classes
  addUtilities({
    '.grid-pattern': {
      'background-image': 'linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)',
      'background-size': '60px 60px',
    },
    '.scrollbar-hide': {
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
    },
    '.scrollbar-hide::-webkit-scrollbar': {
      'display': 'none',
    },
    '.no-scrollbar': {
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
    },
    '.no-scrollbar::-webkit-scrollbar': {
      'display': 'none',
    },
    '.noise': {
      'position': 'relative',
    },
    '.noise::before': {
      'content': '""',
      'position': 'absolute',
      'inset': '0',
      'background-image': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
      'opacity': '0.03',
      'pointer-events': 'none',
    },
    '[role="dialog"], [data-radix-portal], [data-radix-dialog-content]': {
      'overscroll-behavior': 'none',
      'background-color': 'hsl(var(--background))',
    },
  });
};

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "slide-up": {
          "from": { opacity: "0", transform: "translateY(30px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "pepperFloat": {
          "0%, 100%": {
            transform: "translateY(0) rotate(0deg)",
            textShadow: "2px 4px 6px rgba(0,0,0,0.3), 0 0 20px rgba(255, 100, 0, 0.4), 0 0 30px rgba(255, 50, 0, 0.3)",
          },
          "50%": {
            transform: "translateY(-15px) rotate(5deg)",
            textShadow: "4px 8px 12px rgba(0,0,0,0.4), 0 0 30px rgba(255, 100, 0, 0.6), 0 0 40px rgba(255, 50, 0, 0.5)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "slide-up-delay-1": "slide-up 0.6s ease-out 0.1s forwards",
        "slide-up-delay-2": "slide-up 0.6s ease-out 0.2s forwards",
        "slide-up-delay-3": "slide-up 0.6s ease-out 0.3s forwards",
        "slide-up-delay-4": "slide-up 0.6s ease-out 0.4s forwards",
        "pepper-float": "pepperFloat 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-secondary": "var(--gradient-secondary)",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    themePlugin,
  ],
} satisfies Config;
