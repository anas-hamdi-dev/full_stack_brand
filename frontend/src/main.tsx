import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";  

// Ensure root element has dark background for overscroll
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.style.backgroundColor = "hsl(270 50% 3%)";
  // Use CSS custom property for iOS support
  rootElement.style.setProperty("min-height", "100vh");
  rootElement.style.setProperty("min-height", "100dvh", "important");
}

createRoot(rootElement!).render(<App />);
