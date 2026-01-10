import { ReactNode } from "react";
import Navbar from "./Navbar";
import BrandOwnerWarningBanner from "./BrandOwnerWarningBanner";
import useMobileInputFocus from "@/hooks/useMobileInputFocus";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  useMobileInputFocus();
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* GLOBAL BACKGROUND */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 -z-10 grid-pattern opacity-20" />

      {/* DECORATIVE ORBS */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-secondary/8 rounded-full blur-[80px]" />

      <BrandOwnerWarningBanner />
      <Navbar />

      <main className="relative z-10 -mt-2 pb-16">
        {children}
      </main>
    </div>
  );
}
