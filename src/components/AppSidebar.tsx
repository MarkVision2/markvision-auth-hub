import { useLocation } from "react-router-dom";
import {
  Zap,
  LayoutDashboard,
  Briefcase,
  Target,
  Wand2,
  Radar,
  Users,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  Activity,
  Coins,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navGroups = [
  {
    label: "ГЛАВНОЕ",
    items: [
      { title: "Штаб-квартира", path: "/dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "ТРАФИК И КОНТЕНТ",
    items: [
      { title: "Агентские кабинеты", path: "/accounts", icon: Briefcase },
      { title: "Управление рекламой", path: "/dashboard/target", icon: Target },
      { title: "Контент-Завод", path: "/content", icon: Wand2 },
      { title: "Радар конкурентов", path: "/spy", icon: Radar },
    ],
  },
  {
    label: "ПРОДАЖИ",
    items: [
      { title: "CRM Система", path: "/crm", icon: Users },
      { title: "AI-РОП", path: "/ai-rop", icon: ShieldCheck },
    ],
  },
  {
    label: "АНАЛИТИКА",
    items: [
      { title: "Сквозная аналитика", path: "/analytics", icon: Activity },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[15px] font-bold text-foreground tracking-tight">MarkVision</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] tracking-wider text-muted-foreground font-semibold uppercase select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150
                      ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    activeClassName=""
                  >
                    <item.icon size={18} strokeWidth={1.8} />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 pb-4 space-y-1">
        <Separator className="mb-3" />
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
          activeClassName="bg-primary/10 text-primary"
        >
          <Settings size={18} strokeWidth={1.8} />
          <span>Настройки</span>
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">
              MV
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">Admin</p>
            <p className="text-[11px] text-muted-foreground">CEO</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
