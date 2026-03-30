import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  Settings, Users, Shield, Plug, UserPlus, Pencil, Copy, Eye, EyeOff,
  ChevronRight, HeartPulse, Bell, Loader2
} from "lucide-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createAdminClient } from "@/lib/supabase-admin";
import { useWorkspace } from "@/hooks/useWorkspace";

/* ── Tab components ── */
import TeamTab from "./settings/TeamTab";
import GeneralTab from "./settings/GeneralTab";
import NotificationsTab from "./settings/NotificationsTab";
import IntegrationsTab from "./settings/IntegrationsTab";
import SecurityTab from "./settings/SecurityTab";
import SystemHealthTab from "./settings/SystemHealthTab";

/* ── Shared types ── */
import {
  type RoleKey, type TeamMember,
  ROLE_LABELS, ROLE_PRESETS, PERM_GROUPS, ALL_KEYS,
  loadTeam, saveTeam, fetchTeamMembers,
} from "./settings/types";

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
  const { role, isClientManager } = useRole();
  const { active } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SubTab>(isClientManager ? "general" : "team");
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeamMembers().then(setTeam);
  }, []);

  /* Sheet state */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  /* Form state */
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<RoleKey>("client_admin");
  const [formPerms, setFormPerms] = useState<string[]>(ROLE_PRESETS.client_admin);
  const [showPassword, setShowPassword] = useState(false);

  /* Delete dialog */
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const openAdd = () => {
    setEditingMember(null);
    setFormName(""); setFormEmail(""); setFormPassword("");
    setFormRole("client_admin"); setFormPerms([...ROLE_PRESETS.client_admin]);
    setShowPassword(false); setSheetOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormName(m.name);
    // Strip the internal suffix if present for a cleaner UI
    setFormEmail(m.email.replace("@staff.mv", "")); 
    setFormPassword("");
    setFormRole(m.role); setFormPerms([...m.permissions]);
    setShowPassword(false); setSheetOpen(true);
  };

  const handleRoleChange = (role: RoleKey) => {
    setFormRole(role);
    setFormPerms([...ROLE_PRESETS[role]]);
  };

  const togglePerm = (key: string) => {
    setFormPerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Заполните имя и email", variant: "destructive" });
      return;
    }
    
    setLoading(true);

    // Internally map login to a fake email if it's not already an email
    const finalEmail = formEmail.includes("@") ? formEmail : `${formEmail}@staff.mv`;

    try {
      if (editingMember) {
        // Update existing profile (mock-like but real query)
        const { error } = await supabase
          .from("profiles")
          .update({
             full_name: formName,
             role: formRole,
             permissions: formPerms,
          } as any)
          .eq("email", finalEmail as any);

        if (error) throw error;

        setTeam(prev => prev.map(m => m.id === editingMember.id
          ? { ...m, name: formName, role: formRole, permissions: formPerms }
          : m
        ));
        toast({ title: "Сотрудник обновлён" });
      } else {
        if (!formPassword) {
          toast({ title: "Введите пароль для нового сотрудника", variant: "destructive" });
          setLoading(false);
          return;
        }

        // 1. Create user in Supabase Auth (without signing out current admin)
        const adminClient = createAdminClient();
        const { data: authRes, error: authError } = await adminClient.auth.signUp({
          email: finalEmail,
          password: formPassword,
          options: {
            data: { 
              full_name: formName,
              role: formRole,
              project_id: active.id,
            }
          }
        });

        if (authError) throw authError;
        if (!authRes.user) throw new Error("Не удалось создать пользователя");

        // 2. Profile should be created automatically by a trigger, but we update extra fields
        const { error: profError } = await supabase
          .from("profiles")
          .update({
            role: formRole,
            permissions: formPerms,
          } as any)
          .eq("id", authRes.user.id as any);

        if (profError) console.error("Profile update failed:", profError);

        // 3. Link user to project
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            user_id: authRes.user.id,
            project_id: active.id,
          } as any);

        if (memberError) console.error("Project membership failed:", memberError);

        const newMember: TeamMember = {
          id: authRes.user.id,
          name: formName, email: finalEmail, role: formRole,
          status: "active", lastLogin: null, permissions: formPerms,
        };
        setTeam(prev => [...prev, newMember]);
        
        // Final success
        toast({ 
          title: "Сотрудник добавлен", 
          description: `Аккаунт для ${formEmail} создан. Пришлите ему пароль: ${formPassword}` 
        });
      }
      setSheetOpen(false);
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTeam(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast({ title: "Сотрудник удалён" });
    setDeleteTarget(null);
  };

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().replace("@staff.mv", "").includes(search.toLowerCase())
  );

  return (
    <DashboardLayout breadcrumb="Настройки">
      <div className="flex gap-0 min-h-[calc(100vh-3.5rem)]">
        {/* Left sub-menu */}
        <div className="w-56 shrink-0 pr-1 py-1">
          <div className="space-y-0.5">
            {SUB_TABS.filter(tab => !isClientManager || tab.key === "general").map(tab => {
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

        {/* Divider */}
        <div className="w-px bg-border/30 mx-2 shrink-0" />

        {/* Right content */}
        <div className="flex-1 min-w-0 py-1 pl-4">
          {activeTab === "team" && (
            <TeamTab
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

      {/* Add / Edit Sheet */}
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
            {/* Credentials */}
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
                  <Label className="text-xs text-muted-foreground">Логин (без пробелов)</Label>
                  <Input value={formEmail} onChange={e => setFormEmail(e.target.value.toLowerCase().trim())} placeholder="ivan_doc" className="bg-accent/30 border-border/30" />
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

            {/* Permissions */}
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
                              disabled={formRole === "client_manager" && mod.key !== "crm"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full gap-2 mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield size={15} />}
              {editingMember ? "Сохранить изменения" : "Сохранить доступы"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
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
