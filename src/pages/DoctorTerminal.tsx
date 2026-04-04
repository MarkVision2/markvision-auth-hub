import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Activity, Users, UserPlus, Phone, Building, Briefcase, 
  Calendar, Clock, Trash2, Check, X, Search, Mail, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  loadTeam, saveTeam, type TeamMember, ROLE_PRESETS, fetchTeamMembers
} from "@/pages/settings/types";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { DoctorWorkspace } from "@/components/doctor/DoctorWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format, addDays } from "date-fns";

const DoctorTerminal = () => {
  const { user } = useAuth();
  const { isDoctor, isSuperadmin } = useRole();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<TeamMember | null>(null);
  
  // Form state
  const { active } = useWorkspace() as any;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    office: "",
    specialty: "",
    workingDays: ["Пн", "Вт", "Ср", "Чт", "Пт"] as string[],
    workingHours: "09:00 - 18:00",
  });

  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  useEffect(() => {
    async function init() {
        const data = await fetchTeamMembers();
        setTeam(data);
    }
    init();
  }, []);

  // Weekly appointment counts per doctor
  const [weekCounts, setWeekCounts] = useState<Record<string, Record<string, number>>>({});
  const allWeekDays = ["Пн", "Вт", "Ср", "Чт", "Пт"];

  useEffect(() => {
    const fetchWeekCounts = async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      try {
        const { data, error } = await (supabase as any)
          .from("leads_crm")
          .select("doctor_name, scheduled_at")
          .gte("scheduled_at", weekStart.toISOString())
          .lte("scheduled_at", weekEnd.toISOString());

        if (error) throw error;

        const counts: Record<string, Record<string, number>> = {};
        (data || []).forEach((item: any) => {
          if (!item.scheduled_at || !item.doctor_name) return;
          const d = new Date(item.scheduled_at);
          const dayIdx = d.getDay(); // 0=Sun, 1=Mon...
          const dayNames = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
          const dayName = dayNames[dayIdx];
          if (!dayName) return;
          if (!counts[item.doctor_name]) counts[item.doctor_name] = {};
          counts[item.doctor_name][dayName] = (counts[item.doctor_name][dayName] || 0) + 1;
        });
        setWeekCounts(counts);
      } catch (e) {
        console.error("Error fetching week counts:", e);
        toast({ title: "Ошибка", description: "Не удалось загрузить расписание", variant: "destructive" });
      }
    };
    fetchWeekCounts();
  }, [team]);

  const handleToggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    
    if (!formData.name || !formData.specialty || !formData.email || !formData.password) {
      toast({ title: "Ошибка", description: "Пожалуйста, заполните основные поля", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const finalEmail = formData.email.includes("@") ? formData.email : `${formData.email}@markvision-staff.io`;

      // 1. Create In Supabase Auth (without signing out)
      const { data: authRes, error: authError } = await supabaseAdmin.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: {
          data: { 
            role: "doctor",
            project_id: active?.id,
          }
        }
      });

      if (authError) throw authError;
      if (!authRes.user) throw new Error("Не удалось создать пользователя");

      // 2. Profile update/create (REQUIRED: Run the SQL migration first!)
      const { error: profError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: authRes.user.id,
          email: finalEmail,
          full_name: formData.name,
          phone: formData.phone,
          role: "doctor",
          permissions: ROLE_PRESETS.doctor,
          specialty: formData.specialty,
          office: formData.office,
          working_days: formData.workingDays,
          working_hours: formData.workingHours,
        } as any);

      if (profError) {
        console.error("Profile update failed:", profError);
        toast({ 
          title: "Ошибка обновления профиля", 
          description: "Убедитесь, что миграция базы данных добавлена в Supabase SQL Editor.",
          variant: "destructive"
        });
      }

      toast({ title: "Врач добавлен" });

      // 3. Link to Project
      const { error: memberError } = await supabaseAdmin
        .from("project_members")
        .insert({
          user_id: authRes.user.id,
          project_id: active?.id,
        } as any);

      if (memberError) throw memberError;

      const newDoctor: TeamMember = {
        id: authRes.user.id,
        name: formData.name,
        email: finalEmail,
        role: "doctor",
        status: "active",
        lastLogin: null,
        permissions: ROLE_PRESETS.doctor,
        phone: formData.phone,
        office: formData.office,
        specialty: formData.specialty,
        workingDays: formData.workingDays,
        workingHours: formData.workingHours,
        userId: authRes.user.id,
      };

      setTeam(prev => [...prev.filter(m => m.id !== newDoctor.id), newDoctor]);
      setShowAddForm(false);
      setFormData({
        name: "", email: "", password: "",
        phone: "", office: "", specialty: "",
        workingDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
        workingHours: "09:00 - 18:00",
      });

      toast({ title: "Врач добавлен", description: `${formData.name} теперь в системе` });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = (id: string) => {
    const updatedTeam = team.filter(m => m.id !== id);
    setTeam(updatedTeam);
    saveTeam(updatedTeam);
    toast({ title: "Удалено", description: "Врач удален из системы" });
  };

  // If the user is a doctor, filter the list to show ONLY them
  // or allow them to "claim" a profile if userId matches
  const displayDoctors = team.filter(m => {
    if (m.role !== "doctor") return false;
    
    // If current user is a doctor, they should see only their linked profile
    // or if they haven't linked yet, maybe all? Actually, user said: "Врач видит карточку своего профиля"
    if (isDoctor && user) {
        return m.userId === user.id || m.email === user.email;
    }

    return m.name.toLowerCase().includes(search.toLowerCase()) || 
           m.specialty?.toLowerCase().includes(search.toLowerCase());
  });

  if (selectedDoctor) {
      return (
        <DashboardLayout breadcrumb={`Терминал / ${selectedDoctor.name}`}>
            <div className="max-w-6xl mx-auto space-y-6">
                <Button 
                    variant="ghost" 
                    onClick={() => setSelectedDoctor(null)}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" /> Назад к списку
                </Button>
                <DoctorWorkspace doctor={selectedDoctor} />
            </div>
        </DashboardLayout>
      );
  }

  return (
    <DashboardLayout breadcrumb="Терминал Врача">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Терминал Врача</h2>
            <p className="text-sm text-muted-foreground mt-1">Управление медицинским персоналом и графиком работы</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            {showAddForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showAddForm ? "Отмена" : "Добавить врача"}
          </Button>
        </div>

        {showAddForm && (
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleAddDoctor} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold ml-1">ФИО Врача *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name"
                      placeholder="Иванов Иван Иванович"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold ml-1">Логин (Email) *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      placeholder="ivanov"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pass" className="text-sm font-semibold ml-1">Пароль *</Label>
                  <Input 
                    id="pass"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="h-10 rounded-xl bg-background/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold ml-1">Номер телефона</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone"
                      placeholder="+7 (999) 000-00-00"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office" className="text-sm font-semibold ml-1">Номер кабинета</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="office"
                      placeholder="№ 204"
                      value={formData.office}
                      onChange={e => setFormData({...formData, office: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm font-semibold ml-1">Направление *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="specialty"
                      placeholder="Терапевт, Хирург..."
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold ml-1">Дни приема</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={cn(
                          "h-10 w-11 rounded-xl text-xs font-bold border transition-all duration-200",
                          formData.workingDays.includes(day)
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-semibold ml-1">Время приема</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="hours"
                      placeholder="09:00 - 18:00"
                      value={formData.workingHours}
                      onChange={e => setFormData({...formData, workingHours: e.target.value})}
                      className="pl-10 h-10 rounded-xl bg-background/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20 font-bold uppercase tracking-wider text-xs">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Сохранение..." : "Сохранить врача"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Поиск по ФИО или направлению..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-10 rounded-xl bg-card border-border/50 h-11"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-xl border border-border/40">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{displayDoctors.length}</span>
            <span className="text-xs text-muted-foreground">Врачей</span>
          </div>
        </div>

        {/* Doctors List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayDoctors.map(doc => (
            <div 
                key={doc.id} 
                className="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 shadow-sm overflow-hidden cursor-pointer"
                onClick={() => setSelectedDoctor(doc)}
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDoctor(doc.id);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {(doc.name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground leading-tight truncate">{doc.name}</h4>
                  <Badge variant="secondary" className="mt-1.5 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">
                    {doc.specialty}
                  </Badge>
                </div>
              </div>

              <div className="mt-5 space-y-3 pt-4 border-t border-border/40">
                {doc.phone && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary/60" />
                    <span>{doc.phone}</span>
                  </div>
                )}
                {doc.office && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Building className="h-3.5 w-3.5 text-primary/60" />
                    <span>Кабинет {doc.office}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-xs">
                  <Calendar className="h-3.5 w-3.5 mt-1.5 text-primary/60 shrink-0" />
                  <div className="flex-1">
                    <div className="grid grid-cols-5 gap-1 overflow-x-auto min-w-0">
                      {allWeekDays.map(day => {
                        const isWorking = doc.workingDays?.includes(day);
                        const count = weekCounts[doc.name]?.[day] || 0;
                        return (
                          <div 
                            key={day} 
                            className={cn(
                              "flex flex-col items-center rounded-lg py-1.5 transition-all",
                              isWorking ? "bg-primary/10" : "bg-secondary/30 opacity-40"
                            )}
                          >
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider",
                              isWorking ? "text-primary" : "text-muted-foreground"
                            )}>{day}</span>
                            <span className={cn(
                              "text-sm font-black tabular-nums mt-0.5",
                              count > 0 ? "text-foreground" : "text-muted-foreground/40"
                            )}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    {doc.workingHours && <p className="mt-1.5 text-[10px] opacity-60 italic text-muted-foreground">{doc.workingHours}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {displayDoctors.length === 0 && !showAddForm && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {isDoctor ? "Ваш профиль не найден" : "Врачи не найдены"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {isDoctor 
                    ? "Свяжитесь с администратором для создания вашей учетной записи врача."
                    : "Добавьте первого специалиста, чтобы начать работу с расписанием"
                }
              </p>
              {!isDoctor && (
                  <Button onClick={() => setShowAddForm(true)} variant="link" className="mt-2 text-primary">
                    Добавить врача прямо сейчас
                  </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorTerminal;
