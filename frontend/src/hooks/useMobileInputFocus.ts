import { useEffect } from 'react';

const useMobileInputFocus = () => {
  useEffect(() => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      // Only run on mobile devices
      return;
    }

    const handleFocus = (e: Event) => {
      const element = e.target as HTMLElement;
      
      // Check if the focused element is an input or textarea
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // Small delay to ensure the keyboard has started opening
        setTimeout(() => {
          // Scroll the element into view
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100); // Small delay to ensure keyboard starts opening
      }
    };

    // Add event listeners for focus events
    document.addEventListener('focusin', handleFocus);

    // Clean up event listeners
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);
};

export default useMobileInputFocus;