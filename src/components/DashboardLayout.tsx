import { ReactNode } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import AppSidebar from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(0 0% 2%)" }}>
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05]">
          {breadcrumb && (
            <span className="text-[13px] text-zinc-500 font-medium">{breadcrumb}</span>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
