import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Calendar, Settings, Clock, User, Phone, Building, 
  Briefcase, Save, Loader2, Activity, CheckCircle2,
  ExternalLink, MessageCircle, ShieldAlert, ClipboardList,
  FileDown, Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { WeekView } from "../crm/schedule/WeekView";
import { MonthView } from "../crm/schedule/MonthView";
import { ScheduleHeader } from "../crm/schedule/ScheduleHeader";
import { AppointmentModal } from "../crm/schedule/AppointmentModal";
import { TeamMember, saveTeam, loadTeam } from "@/pages/settings/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DoctorWorkspaceProps {
    doctor: TeamMember;
}

export const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ doctor: initialDoctor }) => {
    const [doctor, setDoctor] = useState<TeamMember>(initialDoctor);
    const [activeTab, setActiveTab] = useState("schedule");
    const [view, setView] = useState<"week" | "month">("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSaving, setIsSaving] = useState(false);
    
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoadingAppts(true);
            try {
                const { data, error } = await (supabase as any)
                    .from("leads_crm")
                    .select("*")
                    .eq("doctor_name", doctor.name)
                    .not("scheduled_at", "is", null);

                if (error) throw error;

                const mapped = (data || []).map((lead: any) => {
                    const date = new Date(lead.scheduled_at);
                    const isCompleted = ["Визит совершен", "Лечение начато", "Думает", "Отказ"].includes(lead.status);
                    const isDiag = lead.status === "Записан" || lead.status === "Визит совершен" || lead.is_diagnostic;
                    
                    return {
                        id: lead.id,
                        patient: lead.name,
                        phone: lead.phone,
                        date: date,
                        time: format(date, "HH:mm"),
                        type: isDiag ? "Диагностика" : "Приём",
                        service: lead.ai_summary || (isDiag ? "Первичная диагностика" : "Повторный приём"),
                        status: isCompleted ? "completed" : "planned",
                        doctor: lead.doctor_name,
                        lead: lead
                    };
                });
                setAppointments(mapped);
            } catch (err) {
                console.error("Error fetching doctor appointments:", err);
            } finally {
                setLoadingAppts(false);
            }
        };

        fetchAppointments();

        // Real-time subscription
        const channel = supabase
            .channel(`doctor_appts_${doctor.id}`)
            .on("postgres_changes", { 
                event: "*", 
                schema: "public", 
                table: "leads_crm",
                filter: `doctor_name=eq.${doctor.name}`
            }, () => fetchAppointments())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [doctor.name]);

    const [isApptModalOpen, setIsApptModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<any>(null);
    const [newApptDate, setNewApptDate] = useState<Date | undefined>(undefined);
    const [newApptTime, setNewApptTime] = useState<string | undefined>(undefined);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Эмуляция сохранения в localStorage
            const team = loadTeam();
            const updatedTeam = team.map(m => m.id === doctor.id ? doctor : m);
            saveTeam(updatedTeam);
            
            await new Promise(r => setTimeout(r, 800));
            toast({ title: "Успешно", description: "Ваши настройки обновлены" });
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    const handleToggleDay = (day: string) => {
        setDoctor(prev => ({
            ...prev,
            workingDays: prev.workingDays?.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...(prev.workingDays || []), day]
        }));
    };

    const handleUpdateDayHours = (day: string, hours: string) => {
        setDoctor(prev => ({
            ...prev,
            workingHoursPerDay: {
                ...(prev.workingHoursPerDay || {}),
                [day]: hours
            }
        }));
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("ru-RU").format(amount);
    };

    const todayAppointments = useMemo(() => {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        return appointments.filter(a => format(a.date, "yyyy-MM-dd") === todayStr)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments]);

    const monthlyAppointments = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return appointments.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }, [appointments]);

    const stats = useMemo(() => {
        const totalMonth = monthlyAppointments.length;
        const diagnostics = monthlyAppointments.filter(a => 
            a.type === "Диагностика" || a.lead?.is_diagnostic
        ).length;
        const treatments = monthlyAppointments.filter(a => 
            a.type === "Приём" || a.status === "completed"
        ).length;
        const todayTotal = todayAppointments.length;
        const todayCompleted = todayAppointments.filter(a => a.status === "completed").length;
        const todayRemaining = todayTotal - todayCompleted;
        return { totalMonth, diagnostics, treatments, todayTotal, todayCompleted, todayRemaining };
    }, [monthlyAppointments, todayAppointments]);

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top Stats & Profile Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
                <div className="lg:col-span-2 xl:col-span-3 flex flex-col md:flex-row md:items-center gap-6 bg-card p-6 rounded-[32px] border border-border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                    
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group">
                            <Stethoscope className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-black tracking-tight text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{doctor.name}</h2>
                            <div className="flex flex-wrap gap-2 mt-1.5 line-clamp-1">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                                    {doctor.specialty}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-border/50 px-2.5 py-0.5 bg-background/50 backdrop-blur-sm">
                                    КАБИНЕТ {doctor.office || "—"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0 w-full md:w-auto">
                        <TabsList className="bg-muted/30 p-1 rounded-2xl h-11 w-full md:w-auto">
                            <TabsTrigger value="schedule" className="flex-1 md:flex-none rounded-xl px-5 text-xs font-black uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                                <Calendar className="h-4 w-4" /> ГРАФИК
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="flex-1 md:flex-none rounded-xl px-5 text-xs font-black uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                                <Activity className="h-4 w-4" /> РЕЙТИНГ
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex-1 md:flex-none rounded-xl px-5 text-xs font-black uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                                <Settings className="h-4 w-4" /> ОПЦИИ
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-5 rounded-[32px] flex items-center justify-between group hover:bg-primary/10 transition-all cursor-default">
                    <div>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Пациенты в месяце</p>
                        <p className="text-2xl font-black text-primary tabular-nums tracking-tighter">{stats.totalMonth}</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Activity className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-[32px] flex items-center justify-between group hover:bg-amber-500/10 transition-all cursor-default text-amber-600">
                    <div>
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Диагностик</p>
                        <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.diagnostics}</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[32px] flex items-center justify-between group hover:bg-emerald-500/10 transition-all cursor-default text-emerald-600">
                    <div>
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Курс лечения</p>
                        <p className="text-2xl font-black tabular-nums tracking-tighter">{stats.treatments}</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1">
                {/* Main Content Area */}
                <div className={cn(
                    "flex-1 min-w-0 space-y-4 transition-all duration-500",
                    activeTab !== "settings" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 hidden"
                )}>
                    {activeTab === "schedule" && (
                        <>
                            <ScheduleHeader
                                view={view as any}
                                onViewChange={(v: any) => setView(v)}
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                selectedDoctorId={doctor.id}
                                onDoctorChange={() => {}}
                                hideDoctorSelector={true}
                            />

                            <div className="border border-border/40 rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 bg-background h-[calc(100vh-340px)] min-h-[450px] relative ring-1 ring-border/5">
                                {loadingAppts && (
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-30 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Загрузка данных...</p>
                                        </div>
                                    </div>
                                )}
                                {view === "week" ? (
                                    <WeekView 
                                        selectedDate={selectedDate}
                                        doctorId={doctor.userId || doctor.id}
                                        appointments={appointments}
                                        onDateSelect={setSelectedDate}
                                        onViewChange={(v: any) => v !== 'month' && setView(v)}
                                        onAddAppointment={(date, time) => {
                                            setNewApptDate(date);
                                            setNewApptTime(time);
                                            setSelectedAppt(null);
                                            setIsApptModalOpen(true);
                                        }} 
                                        onEditAppointment={(appt) => {
                                            setSelectedAppt(appt);
                                            setIsApptModalOpen(true);
                                        }}
                                        workingDays={doctor.workingDays}
                                        workingHoursPerDay={doctor.workingHoursPerDay}
                                    />
                                ) : (
                                    <MonthView 
                                        selectedDate={selectedDate}
                                        doctorId={doctor.userId || doctor.id}
                                        appointments={appointments}
                                        onDateSelect={setSelectedDate}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "analytics" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-card border border-border/60 p-6 rounded-[32px] shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-none text-[9px] font-black">МЕСЯЦ</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Диагностик проведено</p>
                                    <h4 className="text-3xl font-black mt-1">
                                        {appointments.filter(a => a.lead?.is_diagnostic).length}
                                    </h4>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                                        +12% к прошлому периоду
                                    </p>
                                </div>

                                <div className="bg-card border border-border/60 p-6 rounded-[32px] shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-purple-500/5 text-purple-500 border-none text-[9px] font-black">KPI</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Конверсия в лечение</p>
                                    <h4 className="text-3xl font-black mt-1">
                                        {Math.round((appointments.filter(a => a.status === "completed").length / (appointments.length || 1)) * 100)}%
                                    </h4>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                                        Цель: 65%
                                    </p>
                                </div>

                                <div className="bg-card border border-border/60 p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                        <Briefcase className="h-24 w-24" />
                                    </div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <Save className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-none text-[9px] font-black">БОНУС 10%</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ваши бонусы</p>
                                    <h4 className="text-3xl font-black mt-1 text-emerald-600">
                                        {formatAmount(appointments.filter(a => a.status === "completed").reduce((s, a) => s + (Number(a.lead?.amount) || 0), 0) * 0.1)} ₸
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground font-bold mt-2 truncate">
                                        Выручка: {formatAmount(appointments.filter(a => a.status === "completed").reduce((s, a) => s + (Number(a.lead?.amount) || 0), 0))} ₸
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card border border-border/60 rounded-[40px] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <ClipboardList className="h-4 w-4" />
                                        </div>
                                        История назначений
                                    </h3>
                                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                                        <FileDown className="h-3.5 w-3.5" /> Экспорт
                                    </Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead>
                                            <tr>
                                                <th className="pb-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Дата</th>
                                                <th className="pb-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Пациент</th>
                                                <th className="pb-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Пакет лечения</th>
                                                <th className="pb-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Сумма</th>
                                                <th className="pb-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Бонус</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-2">
                                            {appointments.filter(a => a.status === "completed").length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center text-xs font-bold text-muted-foreground opacity-40">
                                                        Пока нет завершенных приемов с назначениями
                                                    </td>
                                                </tr>
                                            ) : (
                                                appointments.filter(a => a.status === "completed").map((appt) => (
                                                    <tr key={appt.id} className="group transition-all duration-300">
                                                        <td className="py-4 px-4 text-xs font-bold text-muted-foreground tabular-nums bg-secondary/5 rounded-l-2xl group-hover:bg-secondary/10">{format(appt.date, "dd.MM.yyyy")}</td>
                                                        <td className="py-4 px-4 text-xs font-black bg-secondary/5 group-hover:bg-secondary/10 whitespace-nowrap">{appt.patient}</td>
                                                        <td className="py-4 px-4 bg-secondary/5 group-hover:bg-secondary/10">
                                                            <div className="flex flex-wrap gap-1">
                                                                {appt.lead?.prescribed_packages?.map((pkg: string) => (
                                                                    <Badge key={pkg} variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black px-2 py-0.5">
                                                                        {pkg}
                                                                    </Badge>
                                                                )) || <span className="text-[10px] text-muted-foreground/30 italic">Пакет не указан</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-xs font-black tabular-nums text-right bg-secondary/5 group-hover:bg-secondary/10">{formatAmount(Number(appt.lead?.amount) || 0)} ₸</td>
                                                        <td className="py-4 px-4 text-xs font-black text-emerald-600 tabular-nums text-right bg-secondary/5 rounded-r-2xl group-hover:bg-secondary/10">+{formatAmount((Number(appt.lead?.amount) || 0) * 0.1)} ₸</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Today's Focus */}
                {activeTab === "schedule" && (
                    <div className="w-full lg:w-[360px] flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                        <div className="bg-card border border-border/60 rounded-[40px] p-6 shadow-sm flex flex-col h-[calc(100vh-340px)] min-h-[450px]">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Пациенты сегодня</h3>
                                </div>
                                <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black border-none">
                                    {stats.todayRemaining} ОСТАЛОСЬ
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar space-y-3">
                                {todayAppointments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
                                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <User className="h-8 w-8" />
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground">На сегодня записей нет</p>
                                    </div>
                                ) : (
                                    todayAppointments.map((appt, i) => {
                                        const isNext = appt.status === "planned" && 
                                            (!todayAppointments[i-1] || todayAppointments[i-1].status === "completed");
                                        
                                        return (
                                            <div 
                                                key={appt.id} 
                                                className={cn(
                                                    "group p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                                                    appt.status === "completed" 
                                                        ? "bg-secondary/10 border-border/30 opacity-60 grayscale-[0.5]" 
                                                        : isNext 
                                                            ? "bg-primary/[0.03] border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5" 
                                                            : "bg-background border-border/50 hover:border-primary/30 hover:shadow-md"
                                                )}
                                            >
                                                {isNext && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                                                
                                                <div className="flex items-start justify-between gap-3 relative z-10">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn(
                                                                "text-[10px] font-black tabular-nums tracking-tighter px-1.5 py-0.5 rounded-md",
                                                                appt.status === "completed" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                                            )}>
                                                                {appt.time}
                                                            </span>
                                                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest truncate">{appt.type}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                                                            {appt.patient}
                                                        </h4>
                                                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">{appt.service}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-2">
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-8 w-8 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                            onClick={() => {
                                                                setSelectedAppt(appt);
                                                                setIsApptModalOpen(true);
                                                            }}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-8 w-8 rounded-xl text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-sm"
                                                            onClick={() => window.open(`https://wa.me/${appt.phone.replace(/\D/g,'')}`, '_blank')}
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <Button 
                                className="w-full mt-4 h-12 rounded-2xl bg-secondary/50 hover:bg-secondary text-foreground font-black text-[10px] uppercase tracking-widest gap-2 shrink-0 border border-border/40"
                                onClick={() => setActiveTab("settings")}
                            >
                                <Settings className="h-4 w-4" /> Управление графиком
                            </Button>
                        </div>
                    </div>
                )}

                {/* Settings Area */}
                {activeTab === "settings" && (
                    <div className="flex-1 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-card border border-border/60 rounded-[40px] p-8 shadow-sm">
                            <form onSubmit={handleSaveProfile} className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                Личные данные
                                            </h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">ФИО</Label>
                                                <Input 
                                                    id="name"
                                                    value={doctor.name}
                                                    onChange={e => setDoctor({...doctor, name: e.target.value})}
                                                    className="h-12 rounded-2xl bg-secondary/20 border-border/50 focus:bg-background transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Телефон</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id="phone"
                                                        value={doctor.phone}
                                                        onChange={e => setDoctor({...doctor, phone: e.target.value})}
                                                        className="pl-11 h-12 rounded-2xl bg-secondary/20 border-border/50 focus:bg-background transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <Building className="h-4 w-4" />
                                                </div>
                                                Профиль в клинике
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="specialty" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Специальность</Label>
                                                    <Input 
                                                        id="specialty"
                                                        value={doctor.specialty}
                                                        onChange={e => setDoctor({...doctor, specialty: e.target.value})}
                                                        className="h-12 rounded-2xl bg-secondary/20 border-border/50 font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="office" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Кабинет</Label>
                                                    <Input 
                                                        id="office"
                                                        value={doctor.office}
                                                        onChange={e => setDoctor({...doctor, office: e.target.value})}
                                                        className="h-12 rounded-2xl bg-secondary/20 border-border/50 font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                Конструктор графика
                                            </h3>
                                            <div className="space-y-4 rounded-[32px] border border-border/60 p-6 bg-secondary/10">
                                                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block mb-4">Часы приема (Четко по дням)</Label>
                                                
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {daysOfWeek.map(day => (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => handleToggleDay(day)}
                                                            className={cn(
                                                                "h-10 w-11 rounded-xl text-[10px] font-black border transition-all duration-300",
                                                                doctor.workingDays?.includes(day)
                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                    : "bg-background border-border/60 text-muted-foreground/60 hover:border-primary/50"
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-border/40">
                                                    {doctor.workingDays?.length === 0 ? (
                                                        <p className="text-[11px] text-muted-foreground/60 italic text-center py-4 font-bold uppercase tracking-tighter">Выберите рабочие дни сверху</p>
                                                    ) : (
                                                        doctor.workingDays?.sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)).map(day => (
                                                            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                                                                    {day}
                                                                </div>
                                                                <Input 
                                                                    placeholder="Напр: 12:00 - 17:00"
                                                                    value={doctor.workingHoursPerDay?.[day] || ""}
                                                                    onChange={e => handleUpdateDayHours(day, e.target.value)}
                                                                    className="h-11 rounded-xl bg-background/50 font-bold border-border/50 text-xs focus:ring-1 ring-primary/30"
                                                                />
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <div className="pt-4 border-t border-border/20">
                                                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                        <ShieldAlert className="h-3 w-3 text-amber-500" /> Интервал записи фиксирован: 1 час
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-border/40">
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="h-14 px-10 rounded-2xl shadow-xl shadow-primary/20 gap-3 font-black uppercase tracking-widest text-[11px] bg-primary hover:scale-[1.02] transition-all"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Сохранить профиль
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <AppointmentModal 
                open={isApptModalOpen}
                onOpenChange={(open) => {
                    setIsApptModalOpen(open);
                    if (!open) {
                        setNewApptDate(undefined);
                        setNewApptTime(undefined);
                    }
                }}
                appointment={selectedAppt}
                selectedDate={newApptDate}
                selectedTime={newApptTime}
                mode="doctor"
                onSave={() => {
                    setIsApptModalOpen(false);
                    setNewApptDate(undefined);
                    setNewApptTime(undefined);
                }}
            />
        </div>
    );
};
