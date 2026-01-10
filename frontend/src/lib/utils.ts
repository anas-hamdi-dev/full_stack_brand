import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smooth scroll to element with custom animation
 * @param element Element to scroll to
 * @param offset Optional offset from top
 */
export function smoothScrollTo(element: HTMLElement | null, offset: number = 0) {
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

/**
 * Smooth scroll to top of page
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
