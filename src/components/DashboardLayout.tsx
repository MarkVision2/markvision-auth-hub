import { ReactNode } from "react";
import { Zap, LayoutDashboard, Briefcase, Factory, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Дашборд", path: "/dashboard", icon: LayoutDashboard },
  { title: "Кабинеты", path: "/accounts", icon: Briefcase },
  { title: "Контент-Завод", path: "/content", icon: Factory },
  { title: "CRM", path: "/crm", icon: Users },
];

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col bg-[hsl(var(--sidebar-background))]">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground tracking-tight">MarkVision</span>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeClassName="bg-accent text-primary font-medium"
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-border">
          <div className="text-[11px] text-muted-foreground font-mono tracking-wide">
            {breadcrumb && <span className="text-foreground/70">{breadcrumb}</span>}
          </div>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-mono">MV</AvatarFallback>
          </Avatar>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
