import { ReactNode } from "react";
import { Zap, LayoutDashboard, Briefcase, Factory, Users, Target, Handshake, Activity, Sun, Moon, ShieldCheck, Radio } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const mainNav = [
  { title: "Штаб-квартира", path: "/dashboard", icon: LayoutDashboard },
];

const roleNav = [
  { title: "Таргетолог", path: "/dashboard/target", icon: Target },
  { title: "Продажи", path: "/dashboard/sales", icon: Handshake },
  { title: "Управляющий", path: "/dashboard/pm", icon: Activity },
];

const moduleNav = [
  { title: "Кабинеты", path: "/accounts", icon: Briefcase },
  { title: "Контент-Завод", path: "/content", icon: Factory },
  { title: "CRM", path: "/crm", icon: Users },
  { title: "AI-РОП", path: "/ai-rop", icon: ShieldCheck },
  { title: "Радар", path: "/spy", icon: Radio },
];

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: string;
}

const NavSection = ({ items }: { items: typeof mainNav }) => (
  <>
    {items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end
        className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        activeClassName="bg-accent text-primary font-medium"
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavLink>
    ))}
  </>
);

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-52 shrink-0 border-r border-border flex flex-col bg-sidebar-background">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground tracking-tight">MarkVision</span>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-0.5">
          <NavSection items={mainNav} />
          
          <div className="py-2">
            <Separator />
          </div>
          <p className="px-2.5 text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium mb-1">Панели</p>
          <NavSection items={roleNav} />

          <div className="py-2">
            <Separator />
          </div>
          <p className="px-2.5 text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium mb-1">Модули</p>
          <NavSection items={moduleNav} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-border">
          <div className="text-sm text-muted-foreground font-mono tracking-wide">
            {breadcrumb && <span className="text-foreground/70">{breadcrumb}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-mono">MV</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
