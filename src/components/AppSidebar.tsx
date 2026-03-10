import { useLocation } from "react-router-dom";
import {
  Zap, LayoutDashboard, Briefcase, Target, Wand2, Radar,
  Users, ShieldCheck, Settings, Activity, Coins, FileText,
  ChevronsUpDown, Check, TableProperties, Receipt, CalendarClock, HeartHandshake, Repeat,
  Bot, Plus,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/hooks/useWorkspace";
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
      { title: "Рекламные кабинеты", path: "/accounts", icon: Briefcase, requiredPerm: "accounts" },
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
      <Popover open={wsOpen && isSuperadmin} onOpenChange={setWsOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={!isSuperadmin}
            className={cn(
              "h-14 flex items-center gap-3 px-4 shrink-0 w-full transition-colors group min-h-[56px]",
              isSuperadmin ? "hover:bg-accent/30 cursor-pointer" : "cursor-default opacity-80"
            )}
          >
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-foreground truncate">{active.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {active.id === "hq" ? "Главный проект · Все данные" : (isSuperadmin ? (isAgency ? "Все проекты" : "Клиентский проект") : "Ваш проект")}
              </p>
            </div>
            {isSuperadmin && <ChevronsUpDown size={14} className="text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-64 p-2 bg-popover/95 backdrop-blur-xl border-border shadow-2xl rounded-xl"
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
            <p className="text-[11px] text-muted-foreground capitalize">{role.replace("_", " ")}</p>
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
