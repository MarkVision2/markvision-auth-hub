import { useLocation } from "react-router-dom";
import {
  Zap, LayoutDashboard, Briefcase, Target, Wand2, Radar,
  Users, ShieldCheck, Settings, Activity, Coins, FileText,
  ChevronsUpDown, Check, TableProperties, Receipt, CalendarClock, HeartHandshake, Repeat,
  Bot, Plus, Stethoscope, ChevronDown, ChevronRight
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useWorkspace, HQ_ID } from "@/hooks/useWorkspace";
import { useRole, AppRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  end?: boolean;
  superadminOnly?: boolean;
  requiredPerm?: string;
}

interface NavGroup {
  label: string;
  roles?: AppRole[];
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "ГЛАВНОЕ",
    roles: ["superadmin", "client_admin"],
    items: [
      { title: "Штаб-квартира", path: "/dashboard", icon: LayoutDashboard, end: true, requiredPerm: "hq" },
    ],
  },
  {
    label: "МАРКЕТИНГ",
    roles: ["superadmin", "client_admin"],
    items: [
      { title: "Управление рекламой", path: "/dashboard/target", icon: Target, requiredPerm: "ads" },
      { title: "Контент-Завод", path: "/content", icon: Wand2, requiredPerm: "content" },
      { title: "Автопостинг", path: "/autoposting", icon: CalendarClock, requiredPerm: "autoposting" },
      { title: "Мониторинг конкурентов", path: "/spy", icon: Radar, requiredPerm: "spy" },
    ],
  },
  {
    label: "ПРОДАЖИ И СЕРВИС",
    roles: ["superadmin", "client_admin", "client_manager"],
    items: [
      { title: "CRM Система", path: "/crm", icon: Users, requiredPerm: "crm" },
      { title: "Сетка Расписания", path: "/schedule", icon: CalendarClock, requiredPerm: "schedule" },
      { title: "AI-РОП", path: "/ai-rop", icon: ShieldCheck, requiredPerm: "ai_rop" },
      { title: "Контроль качества", path: "/quality", icon: HeartHandshake, requiredPerm: "quality" },
      { title: "Генератор LTV", path: "/retention", icon: Repeat, requiredPerm: "retention" },
    ],
  },
  {
    label: "АНАЛИТИКА",
    roles: ["superadmin", "client_admin"],
    items: [
      { title: "Сквозная аналитика", path: "/analytics", icon: Activity, requiredPerm: "analytics" },
      { title: "Таблица показателей", path: "/scoreboard", icon: TableProperties, requiredPerm: "scoreboard" },
      { title: "Финансы", path: "/finance", icon: Coins, requiredPerm: "finance" },
      { title: "AI Отчётность", path: "/ai-reports", icon: FileText, requiredPerm: "ai_reports" },
    ],
  },
  {
    label: "СПЕЦ. ИНТЕРФЕЙСЫ",
    roles: ["superadmin", "doctor"],
    items: [
      { title: "Терминал Врача", path: "/doctor/terminal", icon: Activity },
      { title: "Дашборд Диагностики", path: "/diagnostics", icon: Stethoscope },
    ],
  },
  {
    label: "СИСТЕМА",
    roles: ["superadmin"],
    items: [
      { title: "AI Управляющий", path: "/admin/ai-manager", icon: Bot, superadminOnly: true, requiredPerm: "ai_manager" },
    ],
  },
];

interface SidebarContentInnerProps {
  onNavigate?: () => void;
}

function SidebarContentInner({ onNavigate }: SidebarContentInnerProps) {
  const location = useLocation();
  const { workspaces, active, setActiveId, createProject, isAgency } = useWorkspace();
  const { role, setRole, isSuperadmin, permissions } = useRole();
  const [wsOpen, setWsOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // By default, expand first 3 groups
    return {
      "ГЛАВНОЕ": true,
      "МАРКЕТИНГ": true,
      "ПРОДАЖИ И СЕРВИС": true,
      "АНАЛИТИКА": true
    };
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await (supabase as any).from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
      if (cancelled) return;
      if (error) {
        console.warn("Sidebar profile load skipped:", error.message);
        return;
      }
      if (data) setProfile(data as any);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "MV";

  const visibleGroups = navGroups
    .filter(g => !g.roles || g.roles.includes(role))
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (item.superadminOnly && !isSuperadmin) return false;
        if (item.requiredPerm && !isSuperadmin && !permissions.includes(item.requiredPerm)) return false;
        return true;
      }),
    }))
    .filter(g => g.items.length > 0);

  return (
    <>
      {/* ── Workspace Switcher ── */}
      <div className="p-4 shrink-0">
        <Popover open={wsOpen && isSuperadmin} onOpenChange={setWsOpen}>
          <PopoverTrigger asChild>
            <button
              disabled={!isSuperadmin}
              className={cn(
                "h-14 flex items-center gap-3 px-3 w-full rounded-[22px] transition-all duration-300 group min-h-[56px] border",
                isSuperadmin ? "hover:bg-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 cursor-pointer border-transparent bg-card/40 backdrop-blur-md shadow-sm" : "cursor-default opacity-80 border-transparent bg-transparent"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-white/30 w-1/3 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                <span className="text-primary-foreground font-black text-[13px] uppercase tracking-wider relative z-10">{active.name.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-black text-foreground truncate tracking-tight">{active.name}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 truncate">
                  {active.id === HQ_ID ? "Центральный узел" : (isSuperadmin ? (isAgency ? "Все проекты" : "Клиентский проект") : "Ваш проект")}
                </p>
              </div>
              {isSuperadmin && <ChevronsUpDown size={14} className="text-muted-foreground/30 shrink-0 group-hover:text-primary transition-colors" />}
            </button>
          </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-64 p-2 bg-popover backdrop-blur-xl border-border shadow-2xl rounded-xl"
        >
          <div className="space-y-1 mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-2 py-1.5">Проекты</p>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setActiveId(w.id);
                  setWsOpen(false);
                  onNavigate?.();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 group/item",
                  active.id === w.id ? "bg-primary/10" : "hover:bg-accent/50"
                )}
              >
                <span className={cn(
                  "flex-1 text-left text-[13px] truncate transition-colors",
                  active.id === w.id ? "font-semibold text-primary" : "text-foreground group-hover:text-foreground"
                )}>{w.name}</span>
                {active.id === w.id && <Check size={14} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>

          {isSuperadmin && (
            <>
              <Separator className="my-1 bg-border/50" />
              <button
                onClick={() => {
                  setWsOpen(false);
                  setCreateProjectOpen(true);
                }}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-primary/10 text-primary transition-all duration-200 group/add"
              >
                <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Plus size={16} />
                </div>
                <span className="text-[13px] font-semibold">Создать проект</span>
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
      </div>

      {/* ── Create Project Dialog ── */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
            <DialogDescription>
              Введите название нового проекта. После создания вы будете автоматически переключены на этот проект.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название проекта</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Например: Новая Клиника"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateProjectOpen(false)}>Отмена</Button>
            <Button
              disabled={!newProjectName.trim() || isCreating}
              onClick={async () => {
                setIsCreating(true);
                const id = await createProject(newProjectName);
                setIsCreating(false);
                if (id) {
                  setCreateProjectOpen(false);
                  setNewProjectName("");
                  toast({ title: "Проект создан", description: newProjectName });
                } else {
                  toast({ title: "Ошибка", description: "Не удалось создать проект", variant: "destructive" });
                }
              }}
            >
              {isCreating ? "Создание..." : "Создать проект"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Separator className="bg-border/50" />

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar">
        {visibleGroups.map((group) => {
          const isExpanded = expandedGroups[group.label] !== false;
          
          return (
            <div key={group.label} className="space-y-1.5">
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black tracking-[0.2em] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors uppercase select-none group/header"
              >
                <span>{group.label}</span>
                <div className="opacity-0 group-hover/header:opacity-100 transition-opacity">
                  {isExpanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
                </div>
              </button>
              
              <div className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}>
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
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-black transition-all duration-300 group/link relative overflow-hidden border",
                        isActive
                          ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.05)] border-primary/20"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-card hover:border-border/60 border-transparent"
                      )}
                      activeClassName=""
                    >
                      <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.8)]", isActive ? "h-6 bg-primary" : "h-0 bg-transparent")} />
                      <item.icon
                        size={17}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn("transition-all duration-300 shrink-0 relative z-10", isActive ? "text-primary scale-110 drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]" : "group-hover/link:text-primary group-hover/link:scale-110")}
                      />
                      <span className="tracking-tight truncate relative z-10 uppercase text-[11px] font-black">{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 p-4 space-y-2 mt-auto">
        <div className="bg-card/40 backdrop-blur-md rounded-[20px] border border-border/40 p-1.5 shadow-sm transition-all duration-300 hover:border-border/80">
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200 min-h-[44px] group"
            activeClassName="bg-primary/10 text-primary shadow-sm"
          >
            <Settings size={18} strokeWidth={2} className="group-hover:rotate-45 transition-transform duration-300" />
            <span>Настройки</span>
          </NavLink>
  
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer group">
            <Avatar className="h-9 w-9 border border-border/50 shadow-sm group-hover:border-primary/30 transition-colors bg-background">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || "Avatar"} />}
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground truncate tracking-tight">{profile.full_name || "Admin"}</p>
              <p className="text-[9px] text-muted-foreground/70 uppercase tracking-widest font-black truncate mt-0.5">{role.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 h-screen flex-col border-r border-border/60 bg-sidebar">
      <SidebarContentInner />
    </aside>
  );
}

// Export for mobile drawer
export { SidebarContentInner, navGroups };
