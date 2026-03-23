import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Calendar, Settings, Clock, User, Phone, Building, 
  Briefcase, Save, Loader2, Activity 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { WeekView } from "../crm/schedule/WeekView";
import { MonthView } from "../crm/schedule/MonthView";
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
                    return {
                        id: lead.id,
                        patient: lead.name,
                        phone: lead.phone, // Added phone
                        date: date,
                        time: format(date, "HH:mm"),
                        type: lead.status === "Записан" ? "Диагностика" : "Приём",
                        service: lead.ai_summary || "Первичный приём", // Added service
                        status: lead.status === "Визит совершен" ? "completed" : "planned",
                        doctor: lead.doctor_name,
                        lead: lead // Keep original for modal
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-primary">
                            {doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{doctor.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">
                                {doctor.specialty}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-border">
                                Кабинет {doctor.office || "—"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl h-11">
                        <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                            <Calendar className="h-4 w-4" /> Расписание
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                            <Settings className="h-4 w-4" /> Настройки
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="min-h-[600px]">
                {activeTab === "schedule" ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between bg-card px-6 py-3 rounded-2xl border border-border/50 shadow-sm">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    Мой график
                                </h3>
                                <div className="h-4 w-px bg-border hidden sm:block" />
                                <div className="flex rounded-lg bg-secondary/30 p-1 h-9">
                                    <button 
                                        onClick={() => setView("week")}
                                        className={cn(
                                            "px-3 text-xs font-bold transition-all rounded-md", 
                                            view === "week" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Неделя
                                    </button>
                                    <button 
                                        onClick={() => setView("month")}
                                        className={cn(
                                            "px-3 text-xs font-bold transition-all rounded-md", 
                                            view === "month" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Месяц
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Рабочее время</span>
                                </div>
                            </div>
                        </div>

                        <div className="border border-border rounded-[32px] overflow-hidden shadow-xl shadow-primary/5 bg-background h-[calc(100vh-320px)] min-h-[500px] relative">
                            {loadingAppts && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            {view === "week" ? (
                                <WeekView 
                                    selectedDate={selectedDate}
                                    doctorId={doctor.userId || doctor.id}
                                    appointments={appointments}
                                    onDateSelect={setSelectedDate}
                                    onViewChange={(v: any) => v !== 'month' && setView(v)}
                                    onAddAppointment={() => {}} // Врач не добавляет сам?
                                    onEditAppointment={(appt) => {
                                        setSelectedAppt(appt);
                                        setIsApptModalOpen(true);
                                    }}
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
                    </div>
                ) : (
                    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-card border border-border rounded-[32px] p-8 shadow-sm">
                            <form onSubmit={handleSaveProfile} className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <User className="h-5 w-5 text-primary" /> Личные данные
                                            </h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-semibold ml-1">ФИО</Label>
                                                <Input 
                                                    id="name"
                                                    value={doctor.name}
                                                    onChange={e => setDoctor({...doctor, name: e.target.value})}
                                                    className="h-11 rounded-xl bg-secondary/20 border-border/50 focus:bg-background transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-sm font-semibold ml-1">Телефон</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        id="phone"
                                                        value={doctor.phone}
                                                        onChange={e => setDoctor({...doctor, phone: e.target.value})}
                                                        className="pl-10 h-11 rounded-xl bg-secondary/20 border-border/50 focus:bg-background transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Building className="h-5 w-5 text-primary" /> Профиль в клинике
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="specialty" className="text-sm font-semibold ml-1">Специальность</Label>
                                                    <Input 
                                                        id="specialty"
                                                        value={doctor.specialty}
                                                        onChange={e => setDoctor({...doctor, specialty: e.target.value})}
                                                        className="h-11 rounded-xl bg-secondary/20 border-border/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="office" className="text-sm font-semibold ml-1">Кабинет</Label>
                                                    <Input 
                                                        id="office"
                                                        value={doctor.office}
                                                        onChange={e => setDoctor({...doctor, office: e.target.value})}
                                                        className="h-11 rounded-xl bg-secondary/20 border-border/50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-primary" /> Конструктор графика
                                            </h3>
                                            <div className="space-y-4 rounded-2xl border border-border p-6 bg-secondary/5">
                                                <Label className="text-sm font-bold block mb-2">Рабочие дни (1 час на прием)</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {daysOfWeek.map(day => (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => handleToggleDay(day)}
                                                            className={cn(
                                                                "h-10 w-11 rounded-xl text-xs font-bold border transition-all duration-200",
                                                                doctor.workingDays?.includes(day)
                                                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                                                                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="space-y-2 pt-4 border-t border-border/50">
                                                    <Label htmlFor="hours" className="text-sm font-semibold ml-1">Часы приема</Label>
                                                    <Input 
                                                        id="hours"
                                                        placeholder="09:00 - 18:00"
                                                        value={doctor.workingHours}
                                                        onChange={e => setDoctor({...doctor, workingHours: e.target.value})}
                                                        className="h-11 rounded-xl bg-background/50"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                                                        * Интервал записи фиксирован: 1 час
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border/50">
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold uppercase tracking-wider text-xs"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Сохранить изменения
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <AppointmentModal 
                open={isApptModalOpen}
                onOpenChange={setIsApptModalOpen}
                appointment={selectedAppt}
                mode="doctor"
                onSave={() => {}}
            />
        </div>
    );
};
