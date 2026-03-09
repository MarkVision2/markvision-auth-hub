import { useLocation } from "react-router-dom";
import {
  Zap, LayoutDashboard, Briefcase, Target, Wand2, Radar,
  Users, ShieldCheck, Settings, Activity, Coins, FileText,
  ChevronsUpDown, Check, TableProperties, Receipt, CalendarClock, HeartHandshake, Repeat,
  Bot,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  end?: boolean;
  superadminOnly?: boolean;
}

interface NavGroup {
  label: string;
  superadminOnly?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "ГЛАВНОЕ",
    items: [
      { title: "Штаб-квартира", path: "/dashboard", icon: LayoutDashboard, end: true },
      { title: "Рекламные кабинеты", path: "/accounts", icon: Briefcase },
    ],
  },
  {
    label: "МАРКЕТИНГ",
    items: [
      { title: "Контент-Завод", path: "/content", icon: Wand2 },
      { title: "Автопостинг", path: "/autoposting", icon: CalendarClock },
      { title: "Управление рекламой", path: "/dashboard/target", icon: Target },
      { title: "Мониторинг конкурентов", path: "/spy", icon: Radar },
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
      { title: "Таблица показателей", path: "/scoreboard", icon: TableProperties },
      { title: "Контроль качества", path: "/quality", icon: HeartHandshake },
      { title: "Генератор LTV", path: "/retention", icon: Repeat },
      { title: "Финансы", path: "/finance", icon: Coins },
      { title: "AI Отчётность", path: "/ai-reports", icon: FileText },
    ],
  },
];

interface SidebarContentInnerProps {
  onNavigate?: () => void;
}

function SidebarContentInner({ onNavigate }: SidebarContentInnerProps) {
  const location = useLocation();
  const { workspaces, active, setActiveId, isAgency } = useWorkspace();
  const { isSuperadmin } = useRole();
  const [wsOpen, setWsOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null });

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
        if (error) throw error;
        if (data) setProfile(data);
      } catch (err) {
        console.error("Sidebar profile load error:", err);
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => subscription.unsubscribe();
  }, []);

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "MV";

  const visibleGroups = navGroups
    .filter(g => !g.superadminOnly || isSuperadmin)
    .map(g => ({
      ...g,
      items: g.items.filter(item => !item.superadminOnly || isSuperadmin),
    }))
    .filter(g => g.items.length > 0);

  return (
    <>
      {/* ── Workspace Switcher ── */}
      <Popover open={wsOpen} onOpenChange={setWsOpen}>
        <PopoverTrigger asChild>
          <button className="h-14 flex items-center gap-3 px-4 shrink-0 w-full hover:bg-accent/30 transition-colors group min-h-[56px]">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-base",
              isAgency ? "bg-primary/10 border border-primary/20" : "bg-accent border border-border"
            )}>
              {active.emoji}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-foreground truncate">{active.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {isAgency ? "Все проекты" : "Клиентский проект"}
              </p>
            </div>
            <ChevronsUpDown size={14} className="text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-60 p-1.5 border-border/30 bg-popover"
          align="start"
          sideOffset={4}
        >
          <div className="px-2 py-1.5 mb-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Workspace</p>
          </div>
          {workspaces.map(ws => {
            const selected = ws.id === active.id;
            return (
              <button
                key={ws.id}
                onClick={() => { setActiveId(ws.id); setWsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors min-h-[44px]",
                  selected ? "bg-primary/10" : "hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center text-sm shrink-0",
                  ws.type === "agency" ? "bg-primary/10 border border-primary/20" : "bg-accent border border-border/50"
                )}>
                  {ws.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] truncate", selected ? "text-primary font-medium" : "text-foreground")}>{ws.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ws.type === "agency" ? "Агентство" : "Клиент"}</p>
                </div>
                {selected && <Check size={14} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Separator className="bg-border/50" />

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] tracking-wider text-muted-foreground font-semibold uppercase select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const currentPath = location.pathname;
                const isActive = item.end
                  ? currentPath === item.path
                  : currentPath === item.path || currentPath.startsWith(item.path + "/");

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 min-h-[44px]
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

      {/* ── Footer ── */}
      <div className="shrink-0 px-3 pb-4 space-y-1">
        <Separator className="mb-3" />
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 min-h-[44px]"
          activeClassName="bg-primary/10 text-primary"
        >
          <Settings size={18} strokeWidth={1.8} />
          <span>Настройки</span>
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <Avatar className="h-8 w-8">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || "Avatar"} />}
            <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{profile.full_name || "Admin"}</p>
            <p className="text-[11px] text-muted-foreground">{isSuperadmin ? "Superadmin" : "Client"}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 h-screen flex-col border-r border-border bg-sidebar">
      <SidebarContentInner />
    </aside>
  );
}

// Export for mobile drawer
export { SidebarContentInner, navGroups };
