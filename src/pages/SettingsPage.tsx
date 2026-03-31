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
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formOffice, setFormOffice] = useState("");
  const [formWorkingDays, setFormWorkingDays] = useState<string[]>(["Пн", "Вт", "Ср", "Чт", "Пт"]);
  const [formWorkingHours, setFormWorkingHours] = useState("09:00 - 18:00");
  const [showPassword, setShowPassword] = useState(false);

  /* Delete dialog */
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const openAdd = () => {
    setEditingMember(null);
    setFormName(""); setFormEmail(""); setFormPassword("");
    setFormRole("client_admin"); setFormPerms([...ROLE_PRESETS.client_admin]);
    setFormSpecialty(""); setFormOffice(""); setFormWorkingDays(["Пн", "Вт", "Ср", "Чт", "Пт"]);
    setFormWorkingHours("09:00 - 18:00");
    setShowPassword(false); setSheetOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormName(m.name);
    // Strip the internal suffix if present for a cleaner UI
    setFormEmail(m.email.replace("@markvision-staff.io", "")); 
    setFormPassword("");
    setFormRole(m.role); setFormPerms([...m.permissions]);
    setFormSpecialty(m.specialty || "");
    setFormOffice(m.office || "");
    setFormWorkingDays(m.workingDays || ["Пн", "Вт", "Ср", "Чт", "Пт"]);
    setFormWorkingHours(m.workingHours || "09:00 - 18:00");
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
    if (loading) return; // Prevent double submission
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Заполните имя и логин", variant: "destructive" });
      return;
    }
    
    setLoading(true);

    const cleanLogin = formEmail.trim().toLowerCase();
    // Internally map login to a fake email if it's not already an email
    const finalEmail = cleanLogin.includes("@") ? cleanLogin : `${cleanLogin}@markvision-staff.io`;

    console.log("Creating/Updating user with mapped email:", finalEmail);

    try {
      if (editingMember) {
        // Update existing profile (mock-like but real query)
        const { error } = await supabase
          .from("profiles")
          .update({
             full_name: formName,
             role: formRole,
             permissions: formPerms,
             specialty: formSpecialty,
             office: formOffice,
             working_days: formWorkingDays,
             working_hours: formWorkingHours,
          } as any)
          .eq("email", finalEmail as any);

        if (error) throw error;

        setTeam(prev => prev.map(m => m.id === editingMember.id
          ? { 
              ...m, 
              name: formName, 
              role: formRole, 
              permissions: formPerms,
              specialty: formSpecialty,
              office: formOffice,
              workingDays: formWorkingDays,
              workingHours: formWorkingHours,
            }
          : m
        ));
        toast({ title: "Сотрудник обновлён" });
      } else {
        // 1. Create user in Supabase Auth (with all metadata)
        const { data: authRes, error: authError } = await supabase.auth.signUp({
          email: finalEmail,
          password: formPassword,
          options: {
            data: { 
              full_name: formName,
              role: formRole,
              project_id: active.id,
              permissions: formPerms,
              specialty: formSpecialty,
              office: formOffice,
              working_days: formWorkingDays,
              working_hours: formWorkingHours,
            }
          }
        });

        if (authError) throw authError;
        if (!authRes.user) throw new Error("Не удалось создать пользователя");

        // 2. Profile should be created automatically by a trigger. 
        // We no longer attempt to update non-existent profile columns (office, specialty, etc.)
        // metadata in Auth table is the source of truth for these.
        toast({ 
          title: "Сотрудник создан", 
          description: "Для активации сессии администратора может потребоваться обновление страницы." 
        });

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
          specialty: formSpecialty, office: formOffice, 
          workingDays: formWorkingDays, workingHours: formWorkingHours,
        };
        setTeam(prev => [...prev, newMember]);
        
        // Final success
        toast({ 
          title: "Сотрудник добавлен", 
          description: `Аккаунт для ${cleanLogin} создан. Пришлите ему пароль: ${formPassword}` 
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
    m.email.toLowerCase().replace("@markvision-staff.io", "").includes(search.toLowerCase())
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
                
                {/* Doctor Specific Fields */}
                {formRole === 'doctor' && (
                  <div className="pt-2 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Специализация</Label>
                      <Input value={formSpecialty} onChange={e => setFormSpecialty(e.target.value)} placeholder="Хирург" className="bg-accent/30 border-border/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Кабинет №</Label>
                      <Input value={formOffice} onChange={e => setFormOffice(e.target.value)} placeholder="101" className="bg-accent/30 border-border/30" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                       <Label className="text-xs text-muted-foreground">График работы (Дни)</Label>
                       <div className="flex flex-wrap gap-1.5 mt-1">
                         {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
                           <button
                             key={day}
                             onClick={() => setFormWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                             className={cn(
                               "px-2 py-1 rounded text-[10px] font-bold border transition-all",
                               formWorkingDays.includes(day) 
                                 ? "bg-primary text-primary-foreground border-primary" 
                                 : "bg-accent/30 border-border/30 text-muted-foreground hover:border-primary/40"
                             )}
                           >
                             {day}
                           </button>
                         ))}
                       </div>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs text-muted-foreground">Часы работы</Label>
                      <Input value={formWorkingHours} onChange={e => setFormWorkingHours(e.target.value)} placeholder="09:00 - 18:00" className="bg-accent/30 border-border/30" />
                    </div>
                  </div>
                )}
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

              <div className="space-y-8">
                {PERM_GROUPS.map(group => {
                  const groupKeys = group.modules.map(m => m.key);
                  const allSelected = groupKeys.every(k => formPerms.includes(k));
                  const someSelected = groupKeys.some(k => formPerms.includes(k)) && !allSelected;

                  const toggleGroup = () => {
                    if (allSelected) {
                      setFormPerms(prev => prev.filter(k => !groupKeys.includes(k)));
                    } else {
                      setFormPerms(prev => [...new Set([...prev, ...groupKeys])]);
                    }
                  };

                  return (
                    <div key={group.label} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                          {group.emoji} {group.label}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={toggleGroup}
                          className="h-6 px-2 text-[10px] font-bold uppercase hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {allSelected ? "Снять все" : "Выбрать все"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {group.modules.map(mod => {
                          const enabled = formPerms.includes(mod.key);
                          return (
                            <div
                              key={mod.key}
                              className={cn(
                                "flex items-center justify-between px-3 py-3 rounded-xl border transition-all duration-200",
                                enabled 
                                  ? "bg-primary/5 border-primary/20 shadow-sm" 
                                  : "bg-card/30 border-border/20 hover:border-border/40"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                  enabled ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground/40"
                                )}>
                                  <mod.icon size={16} />
                                </div>
                                <div className="space-y-0.5">
                                  <span className={cn("text-sm font-bold block", enabled ? "text-foreground" : "text-muted-foreground/60")}>
                                    {mod.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/40 block">Раздел {group.label.toLowerCase()}</span>
                                </div>
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
                  );
                })}
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
