import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  resetTrigger?: number | string; // Reset zoom when this changes (e.g., carousel index)
  minZoom?: number;
  maxZoom?: number;
}

function ZoomableImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  resetTrigger,
  minZoom = 1,
  maxZoom = 2.5,
}: ZoomableImageProps) {
  const [zoom, setZoom] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Use refs for touch state to avoid stale closures
  const touchStateRef = useRef({
    isDragging: false,
    isPinching: false,
    dragStart: { x: 0, y: 0 },
    lastTouchDistance: 0,
    lastZoom: 1,
    lastTranslateX: 0,
    lastTranslateY: 0,
  });

  // Reset zoom when resetTrigger changes (e.g., carousel image changes)
  useEffect(() => {
    setZoom(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsZoomed(false);
    setIsInteracting(false);
    touchStateRef.current = {
      isDragging: false,
      isPinching: false,
      dragStart: { x: 0, y: 0 },
      lastTouchDistance: 0,
      lastZoom: 1,
      lastTranslateX: 0,
      lastTranslateY: 0,
    };
  }, [resetTrigger]);

  // Constrain translation to prevent overflow
  const constrainTranslation = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (currentZoom <= 1) return { x: 0, y: 0 };

      if (!containerRef.current) return { x: 0, y: 0 };

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate max translation based on zoom level
      const scaledWidth = containerRect.width * currentZoom;
      const scaledHeight = containerRect.height * currentZoom;
      const maxX = (scaledWidth - containerRect.width) / 2;
      const maxY = (scaledHeight - containerRect.height) / 2;

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    []
  );

  // Desktop: Calculate zoom position based on mouse position
  const calculateZoomPosition = useCallback(
    (clientX: number, clientY: number, targetZoom: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Mouse position relative to container center
      const mouseX = clientX - rect.left - rect.width / 2;
      const mouseY = clientY - rect.top - rect.height / 2;
      
      // Calculate translation to keep mouse point under cursor
      const translateX = -mouseX * (targetZoom - 1);
      const translateY = -mouseY * (targetZoom - 1);
      
      return constrainTranslation(translateX, translateY, targetZoom);
    },
    [constrainTranslation]
  );

  // Desktop: Handle mouse move for hover zoom
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed) return;

      setIsInteracting(true);
      const newPosition = calculateZoomPosition(e.clientX, e.clientY, zoom);
      setTranslateX(newPosition.x);
      setTranslateY(newPosition.y);
    },
    [isZoomed, zoom, calculateZoomPosition]
  );

  // Desktop: Handle mouse enter (zoom in)
  const handleMouseEnter = useCallback(() => {
    setZoom(maxZoom);
    setIsZoomed(true);
  }, [maxZoom]);

  // Desktop: Handle mouse leave (zoom out)
  const handleMouseLeave = useCallback(() => {
    setIsInteracting(false);
    setZoom(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsZoomed(false);
  }, []);

  // Mobile: Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1) {
        // Single touch - prepare for tap or drag
        setIsInteracting(true);
        const touch = e.touches[0];
        touchStateRef.current.dragStart = { x: touch.clientX, y: touch.clientY };
        touchStateRef.current.isDragging = false;
        touchStateRef.current.lastZoom = zoom;
        touchStateRef.current.lastTranslateX = translateX;
        touchStateRef.current.lastTranslateY = translateY;
      } else if (e.touches.length === 2) {
        // Two touches - pinch to zoom
        e.preventDefault();
        setIsInteracting(true);
        touchStateRef.current.isPinching = true;
        touchStateRef.current.isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchStateRef.current.lastTouchDistance = distance;
        touchStateRef.current.lastZoom = zoom;
        touchStateRef.current.lastTranslateX = translateX;
        touchStateRef.current.lastTranslateY = translateY;
      }
    },
    [zoom, translateX, translateY]
  );

  // Mobile: Handle touch move (panning or pinching)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const state = touchStateRef.current;

      if (e.touches.length === 1 && isZoomed) {
        // Single touch - panning when zoomed
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - state.dragStart.x;
        const deltaY = touch.clientY - state.dragStart.y;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          state.isDragging = true;
        }

        if (state.isDragging || Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          const newX = state.lastTranslateX + deltaX;
          const newY = state.lastTranslateY + deltaY;
          const constrained = constrainTranslation(newX, newY, state.lastZoom);
          setTranslateX(constrained.x);
          setTranslateY(constrained.y);
        }
      } else if (e.touches.length === 2) {
        // Two touches - pinch to zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (state.lastTouchDistance > 0) {
          const scale = distance / state.lastTouchDistance;
          const newZoom = Math.max(
            minZoom,
            Math.min(maxZoom, state.lastZoom * scale)
          );
          setZoom(newZoom);
          setIsZoomed(newZoom > 1);

          if (newZoom <= 1) {
            setTranslateX(0);
            setTranslateY(0);
          } else {
            // Constrain position after zoom
            const constrained = constrainTranslation(
              state.lastTranslateX,
              state.lastTranslateY,
              newZoom
            );
            setTranslateX(constrained.x);
            setTranslateY(constrained.y);
          }
        }
        state.lastTouchDistance = distance;
      }
    },
    [isZoomed, minZoom, maxZoom, constrainTranslation]
  );

  // Mobile: Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const state = touchStateRef.current;

      if (e.touches.length === 0) {
        // All touches ended
        if (!state.isPinching && !state.isDragging && isZoomed) {
          // Single tap when zoomed - zoom out
          setZoom(1);
          setTranslateX(0);
          setTranslateY(0);
          setIsZoomed(false);
        } else if (!state.isPinching && !state.isDragging && !isZoomed) {
          // Single tap when not zoomed - zoom in
          setZoom(maxZoom);
          setIsZoomed(true);
        }

        state.isDragging = false;
        state.isPinching = false;
        state.lastTouchDistance = 0;
        setIsInteracting(false);
      } else if (e.touches.length === 1) {
        // One touch remaining - update drag start
        const touch = e.touches[0];
        state.dragStart = { x: touch.clientX, y: touch.clientY };
        state.lastTouchDistance = 0;
        state.lastZoom = zoom;
        state.lastTranslateX = translateX;
        state.lastTranslateY = translateY;
      }
    },
    [isZoomed, maxZoom, zoom, translateX, translateY]
  );

  // Prevent scrolling when zoomed and interacting
  useEffect(() => {
    if (isZoomed || touchStateRef.current.isDragging || touchStateRef.current.isPinching) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isZoomed]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden touch-none select-none", containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0"
        style={{
          width: `${100 * maxZoom}%`,
          height: `${100 * maxZoom}%`,
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${zoom / maxZoom}) translate3d(${translateX}px, ${translateY}px, 0)`,
          transformOrigin: "center center",
          willChange: isInteracting ? "transform" : "auto",
          transition: isInteracting ? "none" : "transform 200ms ease-out",
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover",
            className
          )}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default ZoomableImage;
