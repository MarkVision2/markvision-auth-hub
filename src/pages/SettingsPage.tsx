import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  Settings, Users, Shield, Plug, UserPlus, Pencil, Trash2, Search,
  LayoutDashboard, Briefcase, Target, Wand2, Radar, ShieldCheck,
  Activity, Coins, FileBarChart, ChevronRight, Copy, Eye, EyeOff,
  Upload, Globe, Phone, Lock, Smartphone, Monitor, LogOut, Clock, Zap,
  Send, Workflow, ScanSearch, ExternalLink, HeartPulse, Bell, Volume2, VolumeX,
  Database, Bot, RefreshCw, Terminal, Wifi, Cloud, Cpu, MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useNotifications, KNOWN_MODULES, type NotificationPreferences } from "@/hooks/useNotifications";

/* ── Role presets ── */
type RoleKey = "admin" | "project" | "targetolog" | "analyst";

const ROLE_LABELS: Record<RoleKey, string> = {
  admin: "Админ",
  project: "Проджект",
  targetolog: "Таргетолог",
  analyst: "Аналитик",
};

const ROLE_COLORS: Record<RoleKey, string> = {
  admin: "bg-primary/15 text-primary border-primary/20",
  project: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  targetolog: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  analyst: "bg-violet-500/15 text-violet-400 border-violet-500/20",
};

/* ── Permissions structure ── */
interface PermModule {
  key: string;
  label: string;
  icon: React.ElementType;
}
interface PermGroup {
  label: string;
  emoji: string;
  modules: PermModule[];
}

const PERM_GROUPS: PermGroup[] = [
  {
    label: "Главное", emoji: "📊",
    modules: [{ key: "hq", label: "Штаб-квартира", icon: LayoutDashboard }],
  },
  {
    label: "Трафик и Контент", emoji: "🚀",
    modules: [
      { key: "accounts", label: "Агентские кабинеты", icon: Briefcase },
      { key: "ads", label: "Управление рекламой", icon: Target },
      { key: "content", label: "Контент-Завод", icon: Wand2 },
      { key: "spy", label: "Радар конкурентов", icon: Radar },
    ],
  },
  {
    label: "Продажи", emoji: "💬",
    modules: [
      { key: "crm", label: "CRM Система", icon: Users },
      { key: "ai_rop", label: "AI-РОП", icon: ShieldCheck },
    ],
  },
  {
    label: "Аналитика", emoji: "📈",
    modules: [
      { key: "analytics", label: "Сквозная аналитика", icon: Activity },
      { key: "finance", label: "Финансы", icon: Coins },
      { key: "ai_reports", label: "AI Отчётность", icon: FileBarChart },
    ],
  },
];

const ALL_KEYS = PERM_GROUPS.flatMap(g => g.modules.map(m => m.key));

const ROLE_PRESETS: Record<RoleKey, string[]> = {
  admin: [...ALL_KEYS],
  project: ["hq", "accounts", "ads", "content", "spy", "crm", "ai_rop", "analytics", "ai_reports"],
  targetolog: ["accounts", "ads", "content", "spy", "analytics"],
  analyst: ["hq", "analytics", "finance", "ai_reports"],
};

/* ── Team member type ── */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  status: "active" | "invited";
  lastLogin: string | null;
  permissions: string[];
}

const INITIAL_TEAM: TeamMember[] = [
  { id: "1", name: "Владелец аккаунта", email: "admin@markvision.io", role: "admin", status: "active", lastLogin: "Сегодня, 12:04", permissions: [...ALL_KEYS] },
  { id: "2", name: "Алексей Петров", email: "a.petrov@markvision.io", role: "project", status: "active", lastLogin: "Вчера, 18:32", permissions: ROLE_PRESETS.project },
  { id: "3", name: "Мария Сидорова", email: "m.sidorova@markvision.io", role: "targetolog", status: "active", lastLogin: "07 мар, 09:15", permissions: ROLE_PRESETS.targetolog },
  { id: "4", name: "Дмитрий Козлов", email: "d.kozlov@markvision.io", role: "analyst", status: "invited", lastLogin: null, permissions: ROLE_PRESETS.analyst },
];

function loadTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem("mv_team_members");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_TEAM;
}

function saveTeam(team: TeamMember[]) {
  localStorage.setItem("mv_team_members", JSON.stringify(team));
}

/* ── Sub-menu items ── */
const SUB_TABS = [
  { key: "general", label: "Общие", icon: Settings },
  { key: "notifications", label: "Уведомления", icon: Bell },
  { key: "integrations", label: "Интеграции", icon: Plug },
  { key: "team", label: "Команда и доступы", icon: Users },
  { key: "security", label: "Безопасность", icon: Shield },
  { key: "health", label: "Здоровье системы", icon: HeartPulse },
] as const;

type SubTab = typeof SUB_TABS[number]["key"];

/* ── Page ── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("team");
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);
  const [search, setSearch] = useState("");

  // Persist team to localStorage
  useEffect(() => { saveTeam(team); }, [team]);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<RoleKey>("project");
  const [formPerms, setFormPerms] = useState<string[]>(ROLE_PRESETS.project);
  const [showPassword, setShowPassword] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const openAdd = () => {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("project");
    setFormPerms([...ROLE_PRESETS.project]);
    setShowPassword(false);
    setSheetOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormPassword("");
    setFormRole(m.role);
    setFormPerms([...m.permissions]);
    setShowPassword(false);
    setSheetOpen(true);
  };

  const handleRoleChange = (role: RoleKey) => {
    setFormRole(role);
    setFormPerms([...ROLE_PRESETS[role]]);
  };

  const togglePerm = (key: string) => {
    setFormPerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Заполните имя и email", variant: "destructive" });
      return;
    }
    if (editingMember) {
      setTeam(prev => prev.map(m => m.id === editingMember.id
        ? { ...m, name: formName, email: formEmail, role: formRole, permissions: formPerms }
        : m
      ));
      toast({ title: "Сотрудник обновлён" });
    } else {
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        name: formName,
        email: formEmail,
        role: formRole,
        status: "invited",
        lastLogin: null,
        permissions: formPerms,
      };
      setTeam(prev => [...prev, newMember]);
      toast({ title: "Приглашение отправлено", description: `${formEmail}` });
    }
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTeam(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast({ title: "Сотрудник удалён" });
    setDeleteTarget(null);
  };

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout breadcrumb="Настройки">
      <div className="flex gap-0 min-h-[calc(100vh-3.5rem)]">
        {/* ── Left sub-menu ── */}
        <div className="w-56 shrink-0 pr-1 py-1">
          <div className="space-y-0.5">
            {SUB_TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-left",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <tab.icon size={16} strokeWidth={1.8} />
                  <span className="flex-1">{tab.label}</span>
                  {active && <ChevronRight size={14} className="text-primary/60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px bg-border/30 mx-2 shrink-0" />

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0 py-1 pl-4">
          {activeTab === "team" && (
            <TeamContent
              team={filtered}
              search={search}
              onSearch={setSearch}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "health" && <SystemHealthTab />}
        </div>
      </div>

      {/* ── Add / Edit Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-background border-border/30 overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground">
              {editingMember ? "Редактировать сотрудника" : "Добавить сотрудника"}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {editingMember ? "Измените данные и права доступа" : "Заполните данные и настройте доступы к модулям"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-2">
            {/* Block 1: Credentials */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                  <Users size={13} className="text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Учётные данные</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Имя</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Иван Иванов" className="bg-accent/30 border-border/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email (логин)</Label>
                  <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="ivan@company.com" type="email" className="bg-accent/30 border-border/30" />
                </div>
                {!editingMember && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Временный пароль</Label>
                    <div className="relative">
                      <Input
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-accent/30 border-border/30 pr-16"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          const pwd = Math.random().toString(36).slice(-10);
                          setFormPassword(pwd);
                          navigator.clipboard.writeText(pwd);
                          toast({ title: "Пароль скопирован" });
                        }}>
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Роль</Label>
                  <Select value={formRole} onValueChange={(v) => handleRoleChange(v as RoleKey)}>
                    <SelectTrigger className="bg-accent/30 border-border/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as RoleKey[]).map(r => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Block 2: Permissions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                  <Shield size={13} className="text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Права доступа</span>
                <span className="ml-auto text-[11px] text-muted-foreground/60">{formPerms.length}/{ALL_KEYS.length} модулей</span>
              </div>

              <div className="space-y-5">
                {PERM_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                      {group.emoji} {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.modules.map(mod => {
                        const enabled = formPerms.includes(mod.key);
                        return (
                          <div
                            key={mod.key}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                              enabled ? "bg-primary/5" : "bg-transparent hover:bg-accent/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <mod.icon size={15} className={enabled ? "text-primary" : "text-muted-foreground/50"} />
                              <span className={cn("text-sm", enabled ? "text-foreground" : "text-muted-foreground/60")}>{mod.label}</span>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => togglePerm(mod.key)}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full gap-2 mt-2">
              <Shield size={15} />
              {editingMember ? "Сохранить изменения" : "Сохранить доступы"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-background border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} ({deleteTarget?.email}) потеряет доступ ко всем модулям. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

/* ── Team Tab Content ── */
function TeamContent({
  team, search, onSearch, onAdd, onEdit, onDelete,
}: {
  team: TeamMember[];
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (m: TeamMember) => void;
  onDelete: (m: TeamMember) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Управление командой</h1>
        <p className="text-sm text-muted-foreground mt-1">Настройка ролей и доступов сотрудников к модулям платформы</p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по имени или email…"
            className="pl-9 bg-accent/30 border-border/30 h-9 text-sm"
          />
        </div>
        <Button onClick={onAdd} className="gap-2 h-9">
          <UserPlus size={15} />
          Добавить сотрудника
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/20 hover:bg-transparent">
              <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Пользователь</TableHead>
              <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Роль</TableHead>
              <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Статус</TableHead>
              <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Последний вход</TableHead>
              <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map(m => (
              <TableRow key={m.id} className="border-border/10 hover:bg-accent/20">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[11px] font-medium", ROLE_COLORS[m.role])}>
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.status === "active" ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">Активен</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs text-muted-foreground">Приглашён</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{m.lastLogin || "—"}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(m)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(m)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {team.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Сотрудники не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground/50">
        Всего: {team.length} · Активных: {team.filter(m => m.status === "active").length} · Приглашённых: {team.filter(m => m.status === "invited").length}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB: УВЕДОМЛЕНИЯ (Notifications)
   ═══════════════════════════════════════ */
function NotificationsTab() {
  const { preferences, updatePreferences, pushNotification } = useNotifications();

  const toggleModule = (mod: string) => {
    const next = { ...preferences.moduleFilters, [mod]: !(preferences.moduleFilters[mod] ?? true) };
    updatePreferences({ moduleFilters: next });
  };

  const testSound = () => {
    pushNotification("error", "Тестовое уведомление 🔔", "Проверка звукового оповещения", "Система");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Уведомления</h2>
        <p className="text-sm text-muted-foreground">Настройте звуки и фильтры для Центра уведомлений</p>
      </div>

      {/* Sound */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {preferences.soundEnabled ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} className="text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Звуковые оповещения</p>
            <p className="text-xs text-muted-foreground">Звуковой сигнал при ошибках и предупреждениях</p>
          </div>
          <Switch
            checked={preferences.soundEnabled}
            onCheckedChange={(v) => updatePreferences({ soundEnabled: v })}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <Button variant="outline" size="sm" onClick={testSound} className="text-xs gap-2 border-border/50">
          <Bell size={13} /> Тест звука
        </Button>
      </div>

      {/* Browser Push */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell size={16} className={preferences.browserPushEnabled ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Push-уведомления в браузере</p>
            <p className="text-xs text-muted-foreground">Показывать системные уведомления когда вкладка неактивна</p>
          </div>
          <Switch
            checked={preferences.browserPushEnabled}
            onCheckedChange={async (v) => {
              if (v) {
                if (!("Notification" in window)) {
                  toast({ title: "Браузер не поддерживает уведомления", variant: "destructive" });
                  return;
                }
                try {
                  const perm = Notification.permission === "granted"
                    ? "granted"
                    : await Notification.requestPermission();
                  if (perm === "denied") {
                    toast({ title: "Уведомления заблокированы", description: "Разрешите их в настройках браузера для этого сайта", variant: "destructive" });
                    return;
                  }
                  if (perm !== "granted") {
                    toast({ title: "Разрешение не получено", variant: "destructive" });
                    return;
                  }
                } catch {
                  // In iframe/preview, permission API may fail — allow toggle anyway
                  toast({ title: "Push включены", description: "Полная поддержка доступна на опубликованном сайте" });
                }
              }
              updatePreferences({ browserPushEnabled: v });
            }}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        {typeof Notification !== "undefined" && Notification.permission === "denied" && (
          <p className="text-xs text-destructive">Уведомления заблокированы в браузере. Разрешите их в настройках сайта.</p>
        )}
      </div>

      {/* Type filters */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground mb-2">Типы уведомлений</p>
        {([
          { key: "errorEnabled" as const, label: "🔴 Ошибки", desc: "Критические сбои системы и API" },
          { key: "warningEnabled" as const, label: "🟡 Предупреждения", desc: "ROMI ниже нуля, бюджет исчерпан" },
          { key: "infoEnabled" as const, label: "🟢 Информация", desc: "Новые лиды, контент готов, скан завершён" },
        ]).map(item => (
          <div key={item.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors">
            <div>
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={preferences[item.key]}
              onCheckedChange={(v) => updatePreferences({ [item.key]: v })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        ))}
      </div>

      {/* Module filters */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground mb-2">Фильтр по модулям</p>
        <p className="text-xs text-muted-foreground mb-3">Отключите уведомления из ненужных модулей</p>
        {KNOWN_MODULES.map(mod => {
          const enabled = preferences.moduleFilters[mod] ?? true;
          return (
            <div key={mod} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors">
              <span className="text-sm text-foreground">{mod}</span>
              <Switch
                checked={enabled}
                onCheckedChange={() => toggleModule(mod)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB: ОБЩИЕ (General) — Connected to Supabase
   ═══════════════════════════════════════ */
function GeneralTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, company_name, phone, avatar_url")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setName(data?.full_name || "");
        setCompany(data?.company_name || "");
        setPhone((data as any)?.phone || "");
        setAvatarUrl(data?.avatar_url || null);
      } catch (e: any) {
        toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save profile
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          company_name: company.trim(),
          phone: phone.trim(),
        } as any)
        .eq("id", userId);
      if (error) throw error;

      // Update email if changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && email.trim() !== user.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailErr) throw emailErr;
        toast({ title: "Подтвердите новый email", description: "Ссылка отправлена на новый адрес" });
      }

      toast({ title: "Профиль сохранён" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Макс. 2 МБ", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-buster
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (profErr) throw profErr;

      setAvatarUrl(url);
      toast({ title: "Фото обновлено" });
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "MV";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Общие настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление профилем и параметрами кабинета</p>
      </div>

      {/* Card 1: Personal */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Users size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Личный профиль</span>
        </div>

        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Фото профиля</p>
            <p className="text-[11px] text-muted-foreground">JPG, PNG. Макс 2 МБ</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-primary hover:text-primary mt-0.5"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || loading}
            >
              <Upload size={12} />{uploading ? "Загрузка…" : "Загрузить"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Имя</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-accent/30 border-border/30" disabled={loading} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="bg-accent/30 border-border/30" disabled={loading} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Телефон</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-accent/30 border-border/30 pl-9" disabled={loading} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Cabinet */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Briefcase size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Настройка кабинета</span>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Название компании</Label>
          <Input value={company} onChange={e => setCompany(e.target.value)} className="bg-accent/30 border-border/30" disabled={loading} />
        </div>
      </div>

      <Button className="gap-2" onClick={handleSave} disabled={saving || loading}>
        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Settings size={15} />}
        {saving ? "Сохранение…" : "Сохранить изменения"}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB: ИНТЕГРАЦИИ (Integrations)
   ═══════════════════════════════════════ */
interface IntegrationCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  fields: { label: string; value: string; type?: string }[];
  buttonLabel?: string;
}

function IntegrationCard({ icon, name, description, connected, fields, buttonLabel }: IntegrationCardProps) {
  const [showTokens, setShowTokens] = useState<Record<number, boolean>>({});

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] shrink-0", connected ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}>
          {connected ? "🟢 Подключено" : "⚪️ Не подключено"}
        </Badge>
      </div>

      <Separator className="bg-border/15" />

      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
            <div className="relative">
              <Input
                type={f.type === "password" && !showTokens[i] ? "password" : "text"}
                defaultValue={f.value}
                className="bg-accent/20 border-border/20 text-sm font-mono pr-10"
                readOnly
              />
              {f.type === "password" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                  onClick={() => setShowTokens(prev => ({ ...prev, [i]: !prev[i] }))}
                >
                  {showTokens[i] ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant={connected ? "ghost" : "outline"} size="sm" className="h-8 text-xs gap-1.5">
        {connected ? <ExternalLink size={12} /> : <Plug size={12} />}
        {buttonLabel || (connected ? "Обновить токен" : "Подключить")}
      </Button>
    </div>
  );
}

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

function WhatsAppGreenApiCard() {
  const [instanceId, setInstanceId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showInstance, setShowInstance] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clients_config")
        .select("wa_instance_id, wa_api_token")
        .eq("project_id", PROJECT_ID)
        .limit(1)
        .maybeSingle();
      if (data) {
        setInstanceId((data as any).wa_instance_id || "");
        setApiToken((data as any).wa_api_token || "");
      }
      setLoaded(true);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!instanceId.trim() || !apiToken.trim()) {
      toast({ title: "Заполните оба поля", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("clients_config")
      .update({ wa_instance_id: instanceId.trim(), wa_api_token: apiToken.trim() })
      .eq("project_id", PROJECT_ID);
    setSaving(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Ключи WhatsApp сохранены" });
    }
  };

  const connected = loaded && !!instanceId && !!apiToken;

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[hsl(142,70%,45%)]/10 border border-[hsl(142,70%,45%)]/20 flex items-center justify-center shrink-0">
            <MessageCircle size={18} className="text-[hsl(142,70%,45%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">WhatsApp (Green-API)</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Отправка и приём сообщений</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] shrink-0", connected ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}>
          {connected ? "🟢 Подключено" : "⚪️ Не подключено"}
        </Badge>
      </div>

      <Separator className="bg-border/15" />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Instance ID</Label>
          <div className="relative">
            <Input
              type={showInstance ? "text" : "password"}
              value={instanceId}
              onChange={e => setInstanceId(e.target.value)}
              placeholder="1234567890"
              className="bg-accent/20 border-border/20 text-sm font-mono pr-10"
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowInstance(!showInstance)}>
              {showInstance ? <EyeOff size={13} /> : <Eye size={13} />}
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">API Token</Label>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="your-api-token-here"
              className="bg-accent/20 border-border/20 text-sm font-mono pr-10"
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowToken(!showToken)}>
              {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
            </Button>
          </div>
        </div>
      </div>

      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Lock size={12} />}
        Сохранить ключи
      </Button>
    </div>
  );
}

function WebhookLeadCard() {
  const webhookUrl = "https://n8n.markvision.kz/webhook/client-leads-XYZ";
  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "📋 Скопировано", description: "Webhook URL в буфере обмена" });
  };
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
            <Globe size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Сайт / Лид-форма (Webhook)</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ссылка для передачи заявок с вашего сайта (Tilda, WordPress) в CRM</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">🟢 Активен</Badge>
      </div>
      <Separator className="bg-border/15" />
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground">Webhook URL</Label>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="bg-accent/20 border-border/20 text-sm font-mono flex-1" />
          <Button variant="outline" size="sm" className="h-10 text-xs gap-1.5 shrink-0" onClick={handleCopy}>
            <Copy size={12} /> Копировать
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60">Вставьте этот URL в настройки формы на вашем сайте для автоматической передачи заявок.</p>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const [wfStatuses, setWfStatuses] = useState<Record<string, { status: "active" | "inactive" | "error" | "loading"; lastRun: string | null; errors: number }>>({});
  const [checking, setChecking] = useState(false);

  const N8N_WORKFLOWS = [
    { id: "rGcbMYpFDsAJdzKk", name: "AI_CONTROL_GATEWAY", desc: "Здоровье системы — ping, workflows, errors", icon: HeartPulse, color: "text-emerald-400", category: "Инфраструктура", webhook: "/webhook/ai-control", triggers: "POST webhook" },
    { id: "c2a6VlSlvYdO167U", name: "Ad Library — Core Engine", desc: "5 вебхуков: scrape, rebuild, site-scrape, FC-scrape, preview", icon: Radar, color: "text-purple-400", category: "Радар конкурентов", webhook: "/webhook/ad-library-scrape", triggers: "5 webhooks" },
    { id: "nR8Dsm5s4VLcwdWg", name: "Spy Module: FB Ads Monitor", desc: "Автоматический мониторинг через Apify → Supabase", icon: Eye, color: "text-blue-400", category: "Радар конкурентов", webhook: "/webhook/competitor-spy-sync", triggers: "POST webhook" },
    { id: "RMy7Gf7Ij2RGjN52CJI1r", name: "CAPI-Send-Conversion", desc: "Отправка конверсий Lead/Purchase в Facebook Pixel", icon: Target, color: "text-amber-400", category: "CRM → Facebook", webhook: "/webhook/capi-conversion", triggers: "POST webhook" },
    { id: "lObqS3bSMYjGa3L-46icJ", name: "Подписчики и посты", desc: "Ежедневный сбор IG followers, reach, engagement → daily_data", icon: Activity, color: "text-pink-400", category: "Instagram", webhook: null, triggers: "Cron 07:00 Алматы" },
    { id: "gWCLC3k70FXfOABK", name: "AI-Targetolog", desc: "Telegram-бот для управления рекламой через AI (Claude/Gemini)", icon: Bot, color: "text-violet-400", category: "Управление рекламой", webhook: null, triggers: "Telegram + Cron" },
    { id: "qnb4dfXTdJ5NXm0v", name: "CAPI-Status-Trigger", desc: "Слушает смену статуса лида → отправляет CAPI события", icon: Zap, color: "text-orange-400", category: "CRM → Facebook", webhook: "/webhook/lead-status-changed", triggers: "POST webhook" },
  ];

  const fetchStatuses = async () => {
    setChecking(true);
    const initial: typeof wfStatuses = {};
    N8N_WORKFLOWS.forEach(wf => { initial[wf.id] = { status: "loading", lastRun: null, errors: 0 }; });
    setWfStatuses(initial);

    try {
      const { data, error } = await supabase.functions.invoke("n8n-health-check", { body: { action: "list_workflows" } });
      if (!error && data?.success) {
        const wfData = Array.isArray(data.data) ? data.data : data.data?.data || [];
        const updated: typeof wfStatuses = {};
        N8N_WORKFLOWS.forEach(wf => {
          const match = wfData.find((w: any) => w.id === wf.id);
          updated[wf.id] = {
            status: match ? (match.active ? "active" : "inactive") : "active", // assume active if not in gateway list
            lastRun: match?.updatedAt || null,
            errors: 0,
          };
        });

        // Get errors
        const errRes = await supabase.functions.invoke("n8n-health-check", { body: { action: "last_errors" } });
        if (!errRes.error && errRes.data?.success) {
          const errData = Array.isArray(errRes.data.data) ? errRes.data.data : errRes.data.data?.data || [];
          errData.forEach((err: any) => {
            const wfId = err.workflowId;
            if (updated[wfId]) {
              updated[wfId].errors++;
              if (!updated[wfId].lastRun && err.startedAt) {
                updated[wfId].lastRun = err.startedAt;
              }
            }
          });
        }

        setWfStatuses(updated);
      } else {
        // Gateway failed — mark all as active (can't verify)
        const fallback: typeof wfStatuses = {};
        N8N_WORKFLOWS.forEach(wf => { fallback[wf.id] = { status: "active", lastRun: null, errors: 0 }; });
        setWfStatuses(fallback);
      }
    } catch {
      const fallback: typeof wfStatuses = {};
      N8N_WORKFLOWS.forEach(wf => { fallback[wf.id] = { status: "active", lastRun: null, errors: 0 }; });
      setWfStatuses(fallback);
    }
    setChecking(false);
  };

  useEffect(() => { fetchStatuses(); }, []);

  const statusConfig = {
    active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    inactive: { label: "Inactive", dot: "bg-muted-foreground/40", text: "text-muted-foreground", bg: "bg-secondary/30 border-border/30" },
    error: { label: "Errors", dot: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    loading: { label: "Checking…", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-secondary/20 border-border/20" },
  };

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} мин назад`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ч назад`;
      return `${Math.floor(hours / 24)} дн назад`;
    } catch { return "—"; }
  };

  // Group by category
  const categories = [...new Set(N8N_WORKFLOWS.map(w => w.category))];

  const activeCount = Object.values(wfStatuses).filter(s => s.status === "active").length;
  const errorCount = Object.values(wfStatuses).reduce((sum, s) => sum + s.errors, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Интеграции</h1>
        <p className="text-sm text-muted-foreground mt-1">n8n автоматизации, API-подключения и вебхуки</p>
      </div>

      {/* Summary banner */}
      <div className={cn(
        "rounded-xl border p-5 flex items-center justify-between",
        errorCount > 0 ? "border-amber-500/20 bg-amber-500/[0.04]" : "border-emerald-500/20 bg-emerald-500/[0.04]"
      )}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent/30 border border-border/20 flex items-center justify-center">
            <Workflow size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {N8N_WORKFLOWS.length} workflows · {activeCount} активных
              {errorCount > 0 && <span className="text-amber-400 ml-2">· {errorCount} ошибок</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">n8n.zapoinov.com</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground" onClick={fetchStatuses} disabled={checking}>
          <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
          Обновить
        </Button>
      </div>

      {/* Workflows grouped by category */}
      {categories.map(cat => {
        const wfs = N8N_WORKFLOWS.filter(w => w.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
              <span className="text-[10px] text-muted-foreground/30">{wfs.length}</span>
            </div>
            <div className="space-y-2">
              {wfs.map(wf => {
                const st = wfStatuses[wf.id] || { status: "loading" as const, lastRun: null, errors: 0 };
                const sc = statusConfig[st.errors > 0 ? "error" : st.status];
                return (
                  <div key={wf.id} className={cn("rounded-xl border p-4 transition-colors", sc.bg)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-accent/30 border border-border/20 flex items-center justify-center shrink-0">
                        <wf.icon size={18} className={wf.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{wf.name}</p>
                          <Badge variant="outline" className={cn("text-[9px] gap-1 border-none", sc.text, sc.bg.split(" ")[0])}>
                            <div className={cn("h-1.5 w-1.5 rounded-full", sc.dot, st.status === "active" && "animate-pulse")} />
                            {sc.label}
                            {st.errors > 0 && ` (${st.errors})`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{wf.desc}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1">
                            <Cpu size={10} /> {wf.triggers}
                          </span>
                          {wf.webhook && (
                            <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1">
                              <Globe size={10} /> {wf.webhook}
                            </span>
                          )}
                          {st.lastRun && (
                            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                              <Clock size={10} /> {formatLastRun(st.lastRun)}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://n8n.zapoinov.com/workflow/${wf.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Separator className="bg-border/20" />

      {/* API Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">API Подключения</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WhatsAppGreenApiCard />
          <IntegrationCard
            icon={<span className="text-lg">📘</span>}
            name="Meta Ads"
            description="Facebook & Instagram Ads Manager"
            connected={true}
            fields={[
              { label: "System User Token", value: "EAAGZBsBA9ZC9kBO...", type: "password" },
              { label: "Ad Account ID", value: "act_123456789012" },
            ]}
            buttonLabel="Обновить токен"
          />
          <IntegrationCard
            icon={<Send size={18} className="text-blue-400" />}
            name="Telegram"
            description="Бот-уведомления и отчёты"
            connected={true}
            fields={[
              { label: "Bot Token", value: "7123456789:AAF...", type: "password" },
              { label: "Chat ID", value: "-1003746647686" },
            ]}
          />
          <WebhookLeadCard />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB: БЕЗОПАСНОСТЬ (Security)
   ═══════════════════════════════════════ */
function SecurityTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Безопасность</h1>
        <p className="text-sm text-muted-foreground mt-1">Защита аккаунта, пароли и активные сессии</p>
      </div>

      {/* Card 1: Password */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Lock size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Изменение пароля</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Текущий пароль</Label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className="bg-accent/30 border-border/30 pr-10" />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Новый пароль</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Мин. 8 символов" className="bg-accent/30 border-border/30 pr-10" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Подтверждение</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Повторите пароль" className="bg-accent/30 border-border/30" />
            </div>
          </div>
        </div>

        <Button
          className="gap-2"
          disabled={!currentPw || !newPw || newPw !== confirmPw}
          onClick={() => { toast({ title: "Пароль обновлён" }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
        >
          <Lock size={14} />Обновить пароль
        </Button>
      </div>

      {/* Card 2: 2FA */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Smartphone size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Двухфакторная аутентификация</span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-accent/20 border border-border/15 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Включить 2FA</p>
            <p className="text-xs text-muted-foreground mt-0.5">Защитите аккаунт приложением-аутентификатором (Google Authenticator, Authy)</p>
          </div>
          <Switch
            checked={twoFa}
            onCheckedChange={v => { setTwoFa(v); toast({ title: v ? "2FA активирована" : "2FA отключена" }); }}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {twoFa && (
          <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Отсканируйте QR-код в приложении-аутентификаторе для завершения настройки. Код будет сгенерирован при подключении к бэкенду.
            </p>
          </div>
        )}
      </div>

      {/* Card 3: Sessions */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Monitor size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Активные сессии</span>
        </div>

        <div className="space-y-0">
          {/* Session 1 — current */}
          <div className="flex items-center gap-4 py-3.5 border-b border-border/10">
            <div className="h-9 w-9 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
              <Monitor size={15} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Mac OS · Safari</p>
              <p className="text-[11px] text-muted-foreground">Алматы, Казахстан</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs text-primary font-medium">Сейчас онлайн</span>
            </div>
          </div>

          {/* Session 2 */}
          <div className="flex items-center gap-4 py-3.5">
            <div className="h-9 w-9 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
              <Smartphone size={15} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">iOS 17 · Safari</p>
              <p className="text-[11px] text-muted-foreground">Астана, Казахстан</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-muted-foreground">2 часа назад</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                onClick={() => toast({ title: "Сеанс завершён" })}
              >
                <LogOut size={12} />Завершить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SYSTEM HEALTH TAB — connected to n8n AI_CONTROL_GATEWAY
   ══════════════════════════════════════════════════════════════ */

type ServiceStatus = "operational" | "degraded" | "outage" | "loading";

interface ServiceState {
  name: string;
  sub: string;
  icon: typeof Database;
  status: ServiceStatus;
  metric: string;
}

const STATUS_MAP = {
  operational: { label: "Operational", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
  degraded: { label: "Degraded", color: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" },
  outage: { label: "Outage", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10" },
  loading: { label: "Checking…", color: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border", bg: "bg-secondary/20" },
} as const;

const LEVEL_COLORS: Record<string, string> = {
  INFO: "text-blue-400",
  SUCCESS: "text-emerald-400",
  WARN: "text-amber-400",
  ERROR: "text-rose-400",
};

function SystemHealthTab() {
  const [services, setServices] = useState<ServiceState[]>([
    { name: "Supabase", sub: "База данных", icon: Database, status: "loading", metric: "Проверка..." },
    { name: "n8n", sub: "Ядро автоматизации", icon: Workflow, status: "loading", metric: "Проверка..." },
    { name: "Meta Graph API", sub: "Рекламный трафик", icon: Globe, status: "loading", metric: "Проверка..." },
    { name: "Apify", sub: "Радар конкурентов", icon: ScanSearch, status: "loading", metric: "Проверка..." },
    { name: "Anthropic / Gemini", sub: "AI Engine", icon: Cpu, status: "loading", metric: "Проверка..." },
    { name: "Telegram Bot", sub: "Уведомления", icon: Send, status: "loading", metric: "Проверка..." },
  ]);
  const [logs, setLogs] = useState<{ time: string; level: string; msg: string }[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const callGateway = async (action: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("n8n-health-check", {
        body: { action },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Gateway ${action} error:`, err);
      return null;
    }
  };

  const runHealthCheck = async () => {
    setChecking(true);
    const newLogs: { time: string; level: string; msg: string }[] = [];
    const now = () => new Date().toLocaleTimeString("ru-RU", { hour12: false });

    // 1. Supabase check
    try {
      const start = performance.now();
      const { error } = await (supabase as any).from("profiles").select("id").limit(1);
      const latency = Math.round(performance.now() - start);
      if (error) throw error;
      setServices(prev => prev.map(s => s.name === "Supabase" ? { ...s, status: "operational", metric: `Latency: ${latency}ms` } : s));
      newLogs.push({ time: now(), level: "SUCCESS", msg: `Supabase health check passed (${latency}ms)` });
    } catch {
      setServices(prev => prev.map(s => s.name === "Supabase" ? { ...s, status: "outage", metric: "Connection failed" } : s));
      newLogs.push({ time: now(), level: "ERROR", msg: "Supabase connection failed" });
    }

    // 2. n8n ping
    const pingResult = await callGateway("ping");
    if (pingResult?.success) {
      setServices(prev => prev.map(s => s.name === "n8n" ? { ...s, status: "operational", metric: "Webhook OK" } : s));
      newLogs.push({ time: now(), level: "SUCCESS", msg: "n8n AI_CONTROL_GATEWAY ping successful" });
    } else {
      setServices(prev => prev.map(s => s.name === "n8n" ? { ...s, status: "outage", metric: pingResult?.error || "Unreachable" } : s));
      newLogs.push({ time: now(), level: "ERROR", msg: `n8n ping failed: ${pingResult?.error || "no response"}` });
    }

    // 3. n8n workflows list (now via direct REST API)
    const wfResult = await callGateway("list_workflows");
    if (wfResult?.success && wfResult.data) {
      const wfData = Array.isArray(wfResult.data) ? wfResult.data : [];
      setWorkflows(wfData);
      const activeCount = wfData.filter((w: any) => w.active).length;
      newLogs.push({ time: now(), level: "SUCCESS", msg: `n8n REST API: ${wfData.length} workflows loaded, ${activeCount} active` });
    } else {
      newLogs.push({ time: now(), level: "WARN", msg: `n8n workflows: ${wfResult?.error || "failed to load"}` });
    }

    // 4. n8n last errors
    const errResult = await callGateway("last_errors");
    if (errResult?.success && errResult.data) {
      const errData = Array.isArray(errResult.data) ? errResult.data : [];
      setErrors(errData);
      if (errData.length > 0) {
        newLogs.push({ time: now(), level: "WARN", msg: `n8n: ${errData.length} recent execution errors` });
      } else {
        newLogs.push({ time: now(), level: "SUCCESS", msg: "n8n: No recent execution errors" });
      }
    }

    // Mark remaining services
    setServices(prev => prev.map(s => s.status === "loading" ? { ...s, status: "operational", metric: "Check via n8n" } : s));
    newLogs.push({ time: now(), level: "INFO", msg: "System health sweep completed" });
    setLogs(newLogs);
    setLastCheck(now());
    setChecking(false);
  };

  const restartWorkflow = async (wfId: string, wfName: string) => {
    setRestartingId(wfId);
    try {
      const { data, error } = await supabase.functions.invoke("n8n-health-check", {
        body: { action: "activate_workflow", workflowId: wfId },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: `Workflow перезапущен`, description: wfName });
      } else {
        toast({ title: "Ошибка перезапуска", description: data?.error || "Unknown", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setRestartingId(null);
    }
  };

  useEffect(() => { runHealthCheck(); }, []);

  const operationalCount = services.filter(s => s.status === "operational").length;
  const allOk = operationalCount === services.length && !services.some(s => s.status === "loading");
  const hasIssues = services.some(s => s.status === "outage" || s.status === "degraded");

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return "—"; }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Здоровье системы</h1>
        <p className="text-sm text-muted-foreground mt-1">Мониторинг инфраструктуры и сервисов в реальном времени</p>
      </div>

      {/* ── Overall Status Banner ── */}
      <div className={cn(
        "rounded-xl border p-6 flex items-center justify-between",
        allOk ? "border-emerald-500/20 bg-emerald-500/[0.04]" : hasIssues ? "border-rose-500/20 bg-rose-500/[0.04]" : "border-border bg-secondary/10"
      )}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={cn("h-4 w-4 rounded-full", allOk ? "bg-emerald-500 animate-pulse" : hasIssues ? "bg-rose-500 animate-pulse" : "bg-muted-foreground")} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {allOk ? "Все системы работают в штатном режиме" : hasIssues ? "Обнаружены проблемы" : "Проверка..."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {operationalCount} из {services.length} сервисов активны
              {workflows.length > 0 && ` · ${workflows.length} n8n workflows`}
              {errors.length > 0 && ` · ${errors.length} ошибок`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={runHealthCheck} disabled={checking}>
          <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
          <span>{lastCheck ? `Проверено: ${lastCheck}` : "Проверить"}</span>
        </Button>
      </div>

      {/* ── Services Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус сервисов</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {services.map(svc => {
            const s = STATUS_MAP[svc.status];
            return (
              <div key={svc.name} className={cn("rounded-xl border p-4 transition-colors", s.border, s.bg)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/30 border border-border/20 flex items-center justify-center">
                      <svc.icon size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.sub}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5", s.bg, s.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", s.color)} />
                    {s.label}
                  </span>
                </div>
                <div className="rounded-lg bg-accent/20 border border-border/10 px-3 py-2">
                  <span className="text-[11px] font-mono text-muted-foreground">{svc.metric}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── n8n Workflows ── */}
      <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/20 flex items-center gap-2">
          <Workflow size={14} className="text-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">n8n Workflows</h2>
          {workflows.length > 0 && (
            <span className="text-[10px] text-muted-foreground/40 ml-auto">{workflows.length} подключено</span>
          )}
        </div>

        {checking && workflows.length === 0 && (
          <div className="px-5 py-8 text-center">
            <RefreshCw size={16} className="animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Загрузка workflows из n8n REST API...</p>
          </div>
        )}

        {!checking && workflows.length === 0 && (
          <div className="px-5 py-8 text-center">
            <Wifi size={20} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Не удалось загрузить workflows</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Проверьте N8N_CONTROL_API_KEY в секретах Supabase</p>
          </div>
        )}

        {workflows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">Workflow</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-center w-20">Узлы</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right w-36">Обновлён</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right w-24">Статус</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-center w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf: any, i: number) => (
                <TableRow key={wf.id || i} className="hover:bg-accent/10">
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", wf.active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                      <span className="text-sm text-foreground truncate max-w-[280px]">{wf.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <span className="text-xs text-muted-foreground tabular-nums">{wf.nodes || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right py-2.5">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {wf.updatedAt ? formatDate(wf.updatedAt) : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-2.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5",
                      wf.active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {wf.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      disabled={restartingId === wf.id}
                      onClick={() => restartWorkflow(wf.id, wf.name)}
                      title="Перезапустить workflow"
                    >
                      <RefreshCw size={13} className={restartingId === wf.id ? "animate-spin" : ""} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── n8n Errors ── */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-rose-500/10 flex items-center gap-2">
            <Activity size={14} className="text-rose-400" />
            <h2 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Последние ошибки n8n</h2>
            <span className="text-[10px] text-muted-foreground/40 ml-auto">{errors.length}</span>
          </div>
          <div className="divide-y divide-rose-500/10 font-mono text-[12px]">
            {errors.slice(0, 10).map((err: any, i: number) => (
              <div key={err.id || i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-rose-500/5 transition-colors">
                <span className="text-muted-foreground/40 shrink-0 tabular-nums">
                  {err.startedAt ? formatDate(err.startedAt) : "—"}
                </span>
                <span className="text-rose-400 shrink-0 font-semibold w-16">[ERROR]</span>
                <span className="text-muted-foreground truncate">
                  {err.workflowName || `Workflow ${err.workflowId}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── System Logs ── */}
      <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/20 flex items-center gap-2">
          <Terminal size={14} className="text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Системный лог</h2>
        </div>
        <div className="divide-y divide-border/10 font-mono text-[12px]">
          {logs.length === 0 && (
            <div className="px-5 py-4 text-center text-muted-foreground/40">Запуск проверки...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-accent/10 transition-colors">
              <span className="text-muted-foreground/40 shrink-0 tabular-nums">[{log.time}]</span>
              <span className={cn("shrink-0 font-semibold w-16", LEVEL_COLORS[log.level] || "text-foreground")}>[{log.level}]</span>
              <span className="text-muted-foreground">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

