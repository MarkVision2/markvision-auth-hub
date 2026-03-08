import { ReactNode } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import AppSidebar from "@/components/AppSidebar";
import DevRoleToggle from "@/components/DevRoleToggle";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-border">
          {breadcrumb ? (
            <span className="text-[13px] text-muted-foreground font-medium shrink-0">{breadcrumb}</span>
          ) : <span />}

          {/* AI Search — global */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative group">
              <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 transition-colors focus-within:border-primary/30 focus-within:bg-card">
                <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Спросите ИИ..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[9px] font-mono text-muted-foreground/60">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <DevRoleToggle />
    </div>
  );
}
