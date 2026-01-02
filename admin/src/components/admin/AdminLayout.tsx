import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div 
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="p-4 sm:p-6">
          <div className="w-full max-w-full overflow-x-hidden">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
