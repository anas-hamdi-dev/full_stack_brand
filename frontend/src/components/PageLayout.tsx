import { ReactNode } from "react";
import Navbar from "./Navbar";
import BrandOwnerWarningBanner from "./BrandOwnerWarningBanner";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <BrandOwnerWarningBanner />
      <Navbar />
      <div className="min-h-screen pb-16">
        {children}
      </div>
    </>
  );
}
