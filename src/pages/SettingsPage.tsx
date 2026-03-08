import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  Settings, Users, Shield, Plug, UserPlus, Pencil, Trash2, Search,
  LayoutDashboard, Briefcase, Target, Wand2, Radar, ShieldCheck,
  Activity, Coins, FileBarChart, ChevronRight, Copy, Eye, EyeOff,
  Upload, Globe, Phone, Lock, Smartphone, Monitor, LogOut,
  Send, Workflow, ScanSearch, ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

/* ── Sub-menu items ── */
const SUB_TABS = [
  { key: "general", label: "Общие", icon: Settings },
  { key: "integrations", label: "Интеграции", icon: Plug },
  { key: "team", label: "Команда и доступы", icon: Users },
  { key: "security", label: "Безопасность", icon: Shield },
] as const;

type SubTab = typeof SUB_TABS[number]["key"];

/* ── Page ── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("team");
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [search, setSearch] = useState("");

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
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "security" && <SecurityTab />}
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
   TAB: ОБЩИЕ (General)
   ═══════════════════════════════════════ */
function GeneralTab() {
  const [name, setName] = useState("Admin");
  const [email, setEmail] = useState("admin@markvision.io");
  const [phone, setPhone] = useState("+7 777 123 45 67");
  const [company, setCompany] = useState("MarkVision Agency");
  const [tz, setTz] = useState("asia-almaty");
  const [currency, setCurrency] = useState("kzt");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Общие настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление профилем и параметрами агентства</p>
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
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">MV</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Фото профиля</p>
            <p className="text-[11px] text-muted-foreground">JPG, PNG. Макс 2 МБ</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:text-primary mt-0.5">
              <Upload size={12} />Загрузить
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Имя</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-accent/30 border-border/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="bg-accent/30 border-border/30" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Телефон</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-accent/30 border-border/30 pl-9" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Agency */}
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <Briefcase size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Настройки агентства</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Название компании</Label>
            <Input value={company} onChange={e => setCompany(e.target.value)} className="bg-accent/30 border-border/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Часовой пояс</Label>
              <Select value={tz} onValueChange={setTz}>
                <SelectTrigger className="bg-accent/30 border-border/30">
                  <div className="flex items-center gap-2"><Globe size={13} className="text-muted-foreground/50" /><SelectValue /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-almaty">Asia/Almaty (UTC+6)</SelectItem>
                  <SelectItem value="europe-moscow">Europe/Moscow (UTC+3)</SelectItem>
                  <SelectItem value="asia-dubai">Asia/Dubai (UTC+4)</SelectItem>
                  <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Валюта по умолчанию</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-accent/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kzt">KZT (₸)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="rub">RUB (₽)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Button className="gap-2" onClick={() => toast({ title: "Изменения сохранены" })}>
        <Settings size={15} />Сохранить изменения
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

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Интеграции</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление подключениями и API-ключами</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        <IntegrationCard
          icon={<Workflow size={18} className="text-orange-400" />}
          name="n8n Автоматизация"
          description="Webhook-интеграция с n8n workflows"
          connected={true}
          fields={[
            { label: "Webhook Base URL", value: "https://n8n.markvision.io/webhook" },
          ]}
        />
        <IntegrationCard
          icon={<ScanSearch size={18} className="text-muted-foreground" />}
          name="Apify"
          description="Парсинг рекламы конкурентов"
          connected={false}
          fields={[
            { label: "API Token", value: "" },
          ]}
          buttonLabel="Подключить"
        />
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
