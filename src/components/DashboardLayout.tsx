import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(0 0% 2%)" }}>
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center px-6 border-b border-white/[0.05]">
          {breadcrumb && (
            <span className="text-[13px] text-zinc-500 font-medium">{breadcrumb}</span>
          )}
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
