import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Sun, Moon, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import AppSidebar, { SidebarContentInner } from "@/components/AppSidebar";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useRole } from "@/hooks/useRole";
import { useWorkspace } from "@/hooks/useWorkspace";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
  noPadding?: boolean;
}

export default function DashboardLayout({ children, breadcrumb, noPadding }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDoctor } = useRole();
  const { active } = useWorkspace();
  useRealtimeNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isDoctor && <AppSidebar />}

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-border flex flex-col">
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <SidebarContentInner onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-border/60 bg-card">
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
              <div className="flex items-center gap-2 bg-accent/50 border border-border/60 rounded-lg px-3 py-1.5 transition-colors focus-within:border-primary/30 focus-within:bg-card">
                <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Спросите ИИ..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 text-[9px] font-mono text-muted-foreground/50">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <NotificationBell />


        </header>

        <main key={active?.id || "loading"} className={cn("flex-1 overflow-y-auto", !noPadding && "p-4 md:p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
