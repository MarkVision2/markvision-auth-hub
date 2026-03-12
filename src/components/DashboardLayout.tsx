import { ReactNode, useState } from "react";
import { Sun, Moon, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import AppSidebar, { SidebarContentInner } from "@/components/AppSidebar";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useRole } from "@/hooks/useRole";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDoctor } = useRole();
  useRealtimeNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isDoctor && <AppSidebar />}

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-border flex flex-col">
          <SidebarContentInner onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-border">
          {/* Mobile hamburger */}
          {!isDoctor && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 shrink-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {breadcrumb ? (
            <span className="text-[13px] text-muted-foreground font-medium shrink-0 hidden sm:block">{breadcrumb}</span>
          ) : <span />}

          {/* AI Search — global */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative group">
              <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 transition-colors focus-within:border-primary/30 focus-within:bg-card">
                <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Спросите ИИ..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[9px] font-mono text-muted-foreground/60">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <NotificationBell />


        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
