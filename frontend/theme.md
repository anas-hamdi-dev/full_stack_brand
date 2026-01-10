  # App Theme Palette

  ## Overview

  The app uses a dark theme with a purple/violet color scheme. Colors are defined using HSL (Hue, Saturation, Lightness) values in CSS custom properties, allowing for easy theme customization and dark mode support.

  ---

  ## Color Palette

  ### Primary Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Primary** | `hsl(270, 70%, 55%)` | `#9D5AE8` | Main brand color, buttons, links, focus rings |
  | **Primary Foreground** | `hsl(270, 20%, 98%)` | `#F5F3F9` | Text on primary backgrounds |
  | **Primary Glow** | `hsl(270, 70%, 55%, 0.4)` | `#9D5AE8` (40% opacity) | Glow effects, shadows |

  ### Secondary Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Secondary** | `hsl(280, 60%, 65%)` | `#C88AE8` | Secondary actions, accents |
  | **Secondary Foreground** | `hsl(270, 50%, 3%)` | `#0A050F` | Text on secondary backgrounds |
  | **Secondary Glow** | `hsl(280, 60%, 65%, 0.3)` | `#C88AE8` (30% opacity) | Secondary glow effects |

  ### Background Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Background** | `hsl(270, 50%, 3%)` | `#0A050F` | Main app background |
  | **Foreground** | `hsl(270, 20%, 98%)` | `#F5F3F9` | Primary text color |
  | **Card** | `hsl(270, 40%, 7%)` | `#15101F` | Card backgrounds |
  | **Card Foreground** | `hsl(270, 20%, 98%)` | `#F5F3F9` | Text on cards |

  ### UI Element Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Muted** | `hsl(270, 30%, 12%)` | `#1F1826` | Muted backgrounds, disabled states |
  | **Muted Foreground** | `hsl(270, 20%, 65%)` | `#B8B0C4` | Muted text |
  | **Border** | `hsl(270, 30%, 15%)` | `#2A2233` | Borders, dividers |
  | **Input** | `hsl(270, 30%, 15%)` | `#2A2233` | Input field borders |
  | **Ring** | `hsl(270, 70%, 55%)` | `#9D5AE8` | Focus ring color |

  ### Semantic Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Destructive** | `hsl(0, 84%, 60%)` | `#F87171` | Error states, delete actions |
  | **Destructive Foreground** | `hsl(270, 20%, 98%)` | `#F5F3F9` | Text on destructive backgrounds |
  | **Accent** | `hsl(280, 60%, 65%)` | `#C88AE8` | Accent highlights |
  | **Accent Foreground** | `hsl(270, 50%, 3%)` | `#0A050F` | Text on accent backgrounds |

  ### Popover Colors

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Popover** | `hsl(270, 40%, 7%)` | `#15101F` | Popover backgrounds |
  | **Popover Foreground** | `hsl(270, 20%, 98%)` | `#F5F3F9` | Text in popovers |

  ### Glass Effects

  | Color | HSL | Hex | Usage |
  |-------|-----|-----|-------|
  | **Glass** | `hsl(270, 40%, 10%, 0.6)` | `#1A1526` (60% opacity) | Glass morphism backgrounds |
  | **Glass Border** | `hsl(270, 20%, 98%, 0.08)` | `#F5F3F9` (8% opacity) | Glass border effects |

  ---

  ## Gradients

  ### Primary Gradient
  ```css
  linear-gradient(135deg, hsl(270, 70%, 55%), hsl(280, 80%, 65%))
  ```
  - **From:** `hsl(270, 70%, 55%)` → `#9D5AE8`
  - **To:** `hsl(280, 80%, 65%)` → `#D99FF5`
  - **Usage:** Primary buttons, hero sections, highlights

  ### Secondary Gradient
  ```css
  linear-gradient(135deg, hsl(280, 60%, 65%), hsl(290, 70%, 70%))
  ```
  - **From:** `hsl(280, 60%, 65%)` → `#C88AE8`
  - **To:** `hsl(290, 70%, 70%)` → `#E0A5F5`
  - **Usage:** Secondary buttons, accents

  ### Dark Gradient
  ```css
  linear-gradient(180deg, hsl(270, 50%, 5%), hsl(270, 50%, 3%))
  ```
  - **From:** `hsl(270, 50%, 5%)` → `#0D0814`
  - **To:** `hsl(270, 50%, 3%)` → `#0A050F`
  - **Usage:** Main background

  ### Glass Gradient
  ```css
  linear-gradient(135deg, hsl(270, 40%, 12%, 0.5), hsl(270, 40%, 7%, 0.3))
  ```
  - **From:** `hsl(270, 40%, 12%, 0.5)` → `#221B2E` (50% opacity)
  - **To:** `hsl(270, 40%, 7%, 0.3)` → `#15101F` (30% opacity)
  - **Usage:** Glass morphism effects

  ### Hero Glow Gradient
  ```css
  radial-gradient(ellipse at 50% 0%, hsl(270, 70%, 55%, 0.2), transparent 60%)
  ```
  - **Center:** `hsl(270, 70%, 55%, 0.2)` → `#9D5AE8` (20% opacity)
  - **Usage:** Hero section background glow

  ---

  ## Typography

  ### Font Families

  | Font | Family | Usage |
  |------|--------|-------|
  | **Display** | `'Outfit', sans-serif` | Headings (h1, h2, h3, h4, h5, h6) |
  | **Body** | `'Space Grotesk', sans-serif` | Body text, paragraphs, UI elements |

  ### Font Weights

  - **Outfit:** 300, 400, 500, 600, 700, 800
  - **Space Grotesk:** 300, 400, 500, 600, 700

  ---

  ## Border Radius

  | Size | Value | Usage |
  |------|-------|-------|
  | **Base** | `1rem` (16px) | Default border radius |
  | **Small** | `calc(1rem - 4px)` = `12px` | Small elements |
  | **Medium** | `calc(1rem - 2px)` = `14px` | Medium elements |
  | **Large** | `1rem` = `16px` | Large elements |
  | **XL** | `calc(1rem + 4px)` = `20px` | Extra large elements |
  | **2XL** | `calc(1rem + 8px)` = `24px` | 2X large elements |
  | **3XL** | `calc(1rem + 16px)` = `32px` | 3X large elements |

  ---

  ## Shadows

  ### Glow Shadow
  ```css
  box-shadow: 0 0 60px hsl(270, 70%, 55%, 0.3);
  ```
  - **Color:** Primary with 30% opacity
  - **Usage:** Primary element glow effects

  ### Card Shadow
  ```css
  box-shadow: 0 4px 30px hsl(0, 0%, 0%, 0.4);
  ```
  - **Color:** Black with 40% opacity
  - **Usage:** Card elevation

  ### Elevated Shadow
  ```css
  box-shadow: 0 20px 60px hsl(0, 0%, 0%, 0.6);
  ```
  - **Color:** Black with 60% opacity
  - **Usage:** Elevated elements, hover states

  ---

  ## Utility Classes

  ### Glass Effects

  ```css
  .glass
  ```
  - Background: `bg-card/60` with `backdrop-blur-xl`
  - Border: `border-border/30`
  - Usage: Glass morphism cards

  ```css
  .glass-strong
  ```
  - Background: `bg-card/80` with `backdrop-blur-2xl`
  - Border: `border-border/40`
  - Usage: Stronger glass effects

  ### Gradient Text

  ```css
  .text-gradient-primary
  ```
  - Uses primary gradient as text color
  - Usage: Headings, highlights

  ```css
  .text-gradient-secondary
  ```
  - Uses secondary gradient as text color
  - Usage: Secondary highlights

  ### Gradient Backgrounds

  ```css
  .bg-gradient-primary
  ```
  - Primary gradient background
  - Usage: Buttons, hero sections

  ```css
  .bg-gradient-secondary
  ```
  - Secondary gradient background
  - Usage: Secondary buttons, accents

  ### Glow Effects

  ```css
  .glow-primary
  ```
  - Applies primary glow shadow
  - Usage: Glowing elements

  ### Hover Effects

  ```css
  .hover-lift
  ```
  - Transitions: `transition-all duration-300 ease-out`
  - Hover: `translateY(-4px)` with elevated shadow
  - Usage: Interactive cards, buttons

  ---

  ## Animations

  ### Float Animation
  ```css
  @keyframes float
  ```
  - Duration: `6s`
  - Easing: `ease-in-out`
  - Infinite loop
  - Movement: `translateY(0)` → `translateY(-20px)`

  ### Pulse Slow Animation
  ```css
  @keyframes pulse-slow
  ```
  - Duration: `4s`
  - Easing: `ease-in-out`
  - Infinite loop
  - Opacity: `0.6` → `1` → `0.6`

  ### Glow Animation
  ```css
  @keyframes glow
  ```
  - Duration: `3s`
  - Easing: `ease-in-out`
  - Infinite alternate
  - Shadow: `0 0 20px hsl(270 70% 55% / 0.3)` → `0 0 40px hsl(270 70% 55% / 0.5)`

  ### Slide Up Animation
  ```css
  @keyframes slide-up
  ```
  - Duration: `0.6s`
  - Easing: `ease-out`
  - Transform: `translateY(30px)` → `translateY(0)`
  - Opacity: `0` → `1`

  ---

  ## Color Usage Guidelines

  ### Primary Actions
  - Use **Primary** (`#9D5AE8`) for main CTAs, links, and important actions
  - Use **Primary Foreground** (`#F5F3F9`) for text on primary backgrounds

  ### Secondary Actions
  - Use **Secondary** (`#C88AE8`) for secondary buttons and accentsa
  - Use **Secondary Foreground** (`#0A050F`) for text on secondary backgrounds

  ### Backgrounds
  - Use **Background** (`#0A050F`) for main app background
  - Use **Card** (`#15101F`) for card and container backgrounds
  - Use **Muted** (`#1F1826`) for disabled or inactive states

  ### Text
  - Use **Foreground** (`#F5F3F9`) for primary text
  - Use **Muted Foreground** (`#B8B0C4`) for secondary text
  - Use **Card Foreground** (`#F5F3F9`) for text on cards

  ### Borders & Dividers
  - Use **Border** (`#2A2233`) for borders and dividers
  - Use **Input** (`#2A2233`) for input field borders

  ### Errors & Warnings
  - Use **Destructive** (`#F87171`) for error states and delete actions
  - Use **Destructive Foreground** (`#F5F3F9`) for text on destructive backgrounds

  ---

  ## Dark Mode

  The app uses a dark theme by default. The `.dark` class maintains the same color values:

  ```css
  .dark {
    --background: 270 50% 3%;
    --foreground: 270 20% 98%;
  }
  ```

  All other colors remain consistent in dark mode.

  ---

  ## Tailwind Integration

  Colors are accessed in Tailwind using the following pattern:

  ```tsx
  // Background colors
  bg-background
  bg-card
  bg-primary
  bg-secondary
  bg-muted
  bg-accent
  bg-destructive

  // Text colors
  text-foreground
  text-primary-foreground
  text-secondary-foreground
  text-muted-foreground
  text-card-foreground

  // Border colors
  border-border
  border-input
  border-primary

  // Ring colors (focus states)
  ring-ring
  ring-primary
  ```

  ---

  ## Custom Properties Reference

  All theme values are defined as CSS custom properties in `src/index.css`:

  ```css
  :root {
    /* Base colors */
    --background: 270 50% 3%;
    --foreground: 270 20% 98%;
    
    /* Component colors */
    --card: 270 40% 7%;
    --card-foreground: 270 20% 98%;
    --popover: 270 40% 7%;
    --popover-foreground: 270 20% 98%;
    --primary: 270 70% 55%;
    --primary-foreground: 270 20% 98%;
    --secondary: 280 60% 65%;
    --secondary-foreground: 270 50% 3%;
    --muted: 270 30% 12%;
    --muted-foreground: 270 20% 65%;
    --accent: 280 60% 65%;
    --accent-foreground: 270 50% 3%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 270 20% 98%;
    --border: 270 30% 15%;
    --input: 270 30% 15%;
    --ring: 270 70% 55%;
    
    /* Layout */
    --radius: 1rem;
    
    /* Custom effects */
    --glass: 270 40% 10% / 0.6;
    --glass-border: 270 20% 98% / 0.08;
    --glow-primary: 270 70% 55% / 0.4;
    --glow-secondary: 280 60% 65% / 0.3;
    
    /* Gradients */
    --gradient-primary: linear-gradient(135deg, hsl(270 70% 55%), hsl(280 80% 65%));
    --gradient-secondary: linear-gradient(135deg, hsl(280 60% 65%), hsl(290 70% 70%));
    --gradient-dark: linear-gradient(180deg, hsl(270 50% 5%), hsl(270 50% 3%));
    --gradient-glass: linear-gradient(135deg, hsl(270 40% 12% / 0.5), hsl(270 40% 7% / 0.3));
    --gradient-hero: radial-gradient(ellipse at 50% 0%, hsl(270 70% 55% / 0.2), transparent 60%);
    
    /* Typography */
    --font-display: 'Outfit', sans-serif;
    --font-body: 'Space Grotesk', sans-serif;
    
    /* Shadows */
    --shadow-glow: 0 0 60px hsl(270 70% 55% / 0.3);
    --shadow-card: 0 4px 30px hsl(0 0% 0% / 0.4);
    --shadow-elevated: 0 20px 60px hsl(0 0% 0% / 0.6);
  }
  ```

  ---

  ## Summary

  - **Color Scheme:** Dark purple/violet theme
  - **Primary Color:** `#9D5AE8` (Purple)
  - **Secondary Color:** `#C88AE8` (Light Purple)
  - **Background:** `#0A050F` (Very Dark Purple)
  - **Text:** `#F5F3F9` (Light Gray)
  - **Fonts:** Outfit (headings), Space Grotesk (body)
  - **Border Radius:** `1rem` (16px) base
  - **Effects:** Glass morphism, gradients, glow effects
