import { ReactNode } from "react";
import { Zap, LayoutDashboard, Briefcase, Factory, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Дашборд", path: "/dashboard", icon: LayoutDashboard },
  { title: "Агентские кабинеты", path: "/accounts", icon: Briefcase },
  { title: "Контент-Завод", path: "/content", icon: Factory },
  { title: "CRM", path: "/crm", icon: Users },
];

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-background border-r border-border flex flex-col">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-border">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground tracking-tight">MarkVision</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeClassName="bg-accent text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-border">
          <div className="text-sm text-muted-foreground">
            Главная {breadcrumb && <span>/ <span className="text-foreground">{breadcrumb}</span></span>}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">MV</AvatarFallback>
          </Avatar>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
