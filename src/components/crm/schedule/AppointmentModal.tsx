import React, { useState, useEffect } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Calendar as CalendarIcon, Clock, User, 
    Phone, MessageSquare, Briefcase, CheckCircle2,
    ShieldAlert, XCircle, Search, ExternalLink, Plus,
    ChevronDown, Stethoscope, Building
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DiagnosticModule } from "../../diagnostics/DiagnosticModule";
import { Lead } from "../KanbanBoard";
import { useWorkspace } from "@/hooks/useWorkspace";
import { fetchTeamMembers, TeamMember } from "@/pages/settings/types";

interface AppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any; // If editing, pass the existing appointment
    selectedDate?: Date;
    selectedTime?: string;
    onSave: (data: any) => void;
    mode?: "admin" | "doctor";
    doctorSchedule?: {
        workingDays?: string[];
        workingHoursPerDay?: Record<string, string>;
    };
}

const STATUSES = [
    { id: "planned", label: "Запланирован", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "completed", label: "Прием совершен", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "no-show", label: "Не явился", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const DOCTOR_STATUSES = [
    { id: "planned", label: "Запланирован", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "completed", label: "Лечение начато", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "thinking", label: "Думает", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "no-show", label: "Отказ", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const VISIT_TYPES = [
    { id: "primary", label: "Первичный приём" },
    { id: "repeat", label: "Повторный приём" },
];

const MOCK_PATIENTS = [
    { name: "Алексей Павлов", phone: "+7 777 123 45 67" },
    { name: "Мадина Сулейменова", phone: "+7 701 987 65 43" },
    { name: "Игорь Ким", phone: "+7 705 555 44 33" },
    { name: "Елена Петрова", phone: "+7 747 111 22 33" },
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    open, onOpenChange, appointment, 
    selectedDate, selectedTime, onSave, mode = "admin",
    doctorSchedule
}) => {
    const { active } = useWorkspace();
    const isEditing = !!appointment;
    const [formData, setFormData] = useState({
        patientName: appointment?.patient || "",
        phone: appointment?.phone || "",
        service: appointment?.service || "",
        status: appointment?.status || "planned",
        comment: appointment?.comment || "",
        date: appointment?.date || selectedDate || new Date(),
        time: appointment?.time || selectedTime || "09:00",
        doctorName: appointment?.doctor || "",
        officeName: appointment?.cabinet || "",
    });

    const [doctorsList, setDoctorsList] = useState<TeamMember[]>([]);

    // Combined Initialization & State Management
    useEffect(() => {
        if (!open) return;

        async function initModal() {
            // 1. Load team members (doctors)
            const team = await fetchTeamMembers();
            const doctors = team.filter(m => m.role === "doctor");
            setDoctorsList(doctors);

            // 2. Prepare initial form state
            const initialData = {
                patientName: appointment?.patient || "",
                phone: appointment?.phone || "",
                service: appointment?.service || "",
                status: appointment?.status || "planned",
                comment: appointment?.comment || "",
                date: appointment?.date || selectedDate || new Date(),
                time: appointment?.time || selectedTime || "09:00",
                doctorName: appointment?.doctor || "",
                officeName: appointment?.cabinet || "",
            };

            // 3. Handle auto-selection for NEW appointments
            if (!isEditing && !initialData.doctorName && appointment?.doctorId && appointment?.doctorId !== "all") {
                const doc = doctors.find(m => m.name === appointment.doctorId);
                if (doc) {
                    initialData.doctorName = doc.name;
                    initialData.officeName = doc.office || "";
                }
            }

            setFormData(initialData);
            setShowResults(false);
            setSearchResults([]);
        }

        initModal();
    }, [open, appointment, selectedDate, selectedTime]);

    const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<typeof MOCK_PATIENTS>([]);
    const [showResults, setShowResults] = useState(false);

    const handlePatientSearch = (val: string) => {
        setFormData({ ...formData, patientName: val });
        if (val.length > 1) {
            const filtered = MOCK_PATIENTS.filter(p => 
                p.name.toLowerCase().includes(val.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const handleSelectPatient = (patient: typeof MOCK_PATIENTS[0]) => {
        setFormData({
            ...formData,
            patientName: patient.name,
            phone: patient.phone
        });
        setShowResults(false);
    };

    const handleSave = () => {
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none rounded-[32px] bg-background shadow-2xl">
                {/* Header Section */}
                <DialogHeader className="bg-background px-8 py-6 border-b border-border/40 relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-secondary/20 text-muted-foreground flex items-center justify-center border border-border/40">
                            {isEditing ? <Briefcase className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                {isEditing ? "Изменить запись" : "Новая запись"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                {isEditing ? "Редактирование данных визита" : "Заполнение данных о визите"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 py-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Patient Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                            <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Данные пациента</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 relative group">
                                <div className="absolute left-4 top-[38px] -translate-y-1/2 z-10">
                                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input 
                                    placeholder="Поиск по ФИО..." 
                                    className="h-12 pl-11 rounded-2xl bg-secondary/10 border-border/40 font-bold focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
                                    value={formData.patientName}
                                    onChange={(e) => handlePatientSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-card border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                                        {searchResults.map((p, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-all group/item flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-foreground group-hover/item:text-primary">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{p.phone}</p>
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                        <Phone className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <Input 
                                        placeholder="Номер телефона" 
                                        className="h-12 pl-11 rounded-2xl bg-secondary/10 border-border/40 font-bold focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl bg-secondary/10 border-border/40 text-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40 shrink-0 transition-all"
                                    onClick={() => window.open(`https://wa.me/${formData.phone.replace(/\D/g,'')}`, '_blank')}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Visit Details Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                            <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Детали визита</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="h-14 flex items-center justify-between px-5 rounded-2xl bg-secondary/10 border border-border/40 font-bold text-sm cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-xl bg-secondary/20 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <CalendarIcon className="h-4 w-4" />
                                            </div>
                                            <span className="text-foreground">{format(formData.date, "d MMMM yyyy", { locale: ru })}</span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-all" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-border/40 shadow-2xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(date) => date && setFormData({ ...formData, date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Select value={formData.time} onValueChange={(val) => setFormData({...formData, time: val})}>
                                <SelectTrigger className="h-14 px-5 rounded-2xl bg-secondary/10 border border-border/40 font-bold transition-all hover:border-primary/40 hover:bg-primary/[0.02] group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-9 w-9 rounded-xl bg-secondary/20 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border border-border shadow-2xl p-2 bg-card/95 backdrop-blur-xl max-h-[280px]">
                                    {Array.from({ length: 25 }, (_, i) => {
                                        const h = Math.floor(i / 2) + 8;
                                        const m = i % 2 === 0 ? "00" : "30";
                                        const t = `${h.toString().padStart(2, "0")}:${m}`;
                                        
                                        // Working hour check
                                        let isWorking = true;
                                        if (doctorSchedule) {
                                            const dName = format(formData.date, "eeeee", { locale: ru });
                                            if (!doctorSchedule.workingDays?.includes(dName)) {
                                                isWorking = false;
                                            } else {
                                                const hoursStr = doctorSchedule.workingHoursPerDay?.[dName];
                                                if (hoursStr) {
                                                    try {
                                                        const parts = hoursStr.split("-").map(p => p.trim());
                                                        if (parts.length === 2) {
                                                            const startH = parseInt(parts[0]);
                                                            const endH = parseInt(parts[1]);
                                                            isWorking = h >= startH && h < endH;
                                                        }
                                                    } catch {}
                                                }
                                            }
                                        }

                                        return (
                                            <SelectItem 
                                                key={t} 
                                                value={t} 
                                                disabled={!isWorking}
                                                className={cn(
                                                    "rounded-xl py-3 px-4 font-bold cursor-pointer mb-1 last:mb-0 transition-all",
                                                    !isWorking ? "opacity-30 line-through grayscale" : "hover:bg-primary/5 focus:bg-primary/5"
                                                )}
                                            >
                                                {t} {!isWorking && "(Вне графика)"}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={formData.service || "primary"} onValueChange={(val) => setFormData({...formData, service: val})}>
                            <SelectTrigger className="h-14 px-5 rounded-2xl bg-secondary/10 border border-border/40 font-bold transition-all hover:border-primary/40 hover:bg-primary/[0.02] group">
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-secondary/20 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <Stethoscope className="h-4 w-4" />
                                    </div>
                                    <SelectValue placeholder="Тип приёма" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-border shadow-2xl p-2 bg-card/95 backdrop-blur-xl">
                                {VISIT_TYPES.map(vt => (
                                    <SelectItem key={vt.id} value={vt.id} className="rounded-xl py-3 px-4 font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 mb-1 last:mb-0 transition-all">
                                        {vt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Doctor & Cabinet Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                            <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Специалист и кабинет</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Select 
                                    value={formData.doctorName} 
                                    onValueChange={(val) => {
                                        setFormData(prev => ({ ...prev, doctorName: val }));
                                        const doc = doctorsList.find(d => d.name === val);
                                        if (doc?.office) setFormData(prev => ({ ...prev, officeName: doc.office! }));
                                    }}
                                >
                                    <SelectTrigger className="h-14 px-5 rounded-2xl bg-secondary/10 border-border/40 font-bold transition-all hover:border-primary/40 hover:bg-primary/[0.02] group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-xl bg-secondary/20 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <SelectValue placeholder="Выберите врача" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-border shadow-2xl p-2 bg-card/95 backdrop-blur-xl">
                                        {doctorsList.map(doc => (
                                            <SelectItem key={doc.id} value={doc.name} className="rounded-xl py-3 px-4 font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 mb-1 last:mb-0 transition-all">
                                                {doc.name} ({doc.specialty || "Врач"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                    <Building className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input 
                                    placeholder="Кабинет" 
                                    className="h-14 pl-11 rounded-2xl bg-secondary/10 border-border/40 font-bold focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                                    value={formData.officeName}
                                    onChange={(e) => setFormData({...formData, officeName: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status & Comment Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Статус</Label>
                            </div>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                                className="grid gap-2 grid-cols-1"
                            >
                            {(mode === "doctor" ? DOCTOR_STATUSES : STATUSES).map((item) => {
                                    const isActive = formData.status === item.id;
                                    let activeClasses = "";
                                    let dotColor = "";
                                    
                                    if (item.id === "planned" && isActive) {
                                        activeClasses = "bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20";
                                        dotColor = "bg-amber-500";
                                    } else if (item.id === "completed" && isActive) {
                                        activeClasses = "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20";
                                        dotColor = "bg-emerald-500";
                                    } else if (item.id === "thinking" && isActive) {
                                        activeClasses = "bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20";
                                        dotColor = "bg-blue-500";
                                    } else if (item.id === "no-show" && isActive) {
                                        activeClasses = "bg-rose-500/5 border-rose-500/30 ring-1 ring-rose-500/20";
                                        dotColor = "bg-rose-500";
                                    } else {
                                        activeClasses = "bg-secondary/10 border-border/40 hover:bg-secondary/20 hover:border-border/60";
                                    }

                                    return (
                                        <Label
                                            key={item.id}
                                            htmlFor={item.id}
                                            className={cn(
                                                "relative flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all duration-300 group",
                                                activeClasses
                                            )}
                                        >
                                            <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0", 
                                                isActive ? "bg-background border border-border/50 shadow-md scale-105" : "bg-secondary/30"
                                            )}>
                                                <item.icon className={cn("h-5 w-5", isActive ? item.color : "text-muted-foreground/50")} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-[11px] font-black uppercase tracking-[0.05em] leading-tight", 
                                                    isActive ? item.color : "text-muted-foreground/70 group-hover:text-foreground"
                                                )}>
                                                    {item.label}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">Выбрано</span>
                                                )}
                                            </div>
                                            {isActive && (
                                                <div className="ml-auto mr-2 h-2 w-2 rounded-full">
                                                    <span className={cn("relative flex h-2 w-2 rounded-full", dotColor)}>
                                                       <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)}></span>
                                                    </span>
                                                </div>
                                            )}
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Заметки</Label>
                            </div>
                            <Textarea 
                                placeholder="Особенности пациента, жалобы..." 
                                className="bg-secondary/10 border-border/40 rounded-2xl p-4 min-h-[105px] font-bold text-xs leading-relaxed resize-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
                                value={formData.comment}
                                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-secondary/10 px-8 py-6 border-t border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isEditing && (
                            <Button 
                                variant="outline"
                                className="h-12 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] bg-secondary/10 border-border/40 text-muted-foreground hover:bg-primary hover:text-white transition-all flex items-center gap-2 group"
                                onClick={() => setIsDiagnosticOpen(true)}
                            >
                                <ExternalLink className="h-4 w-4" />
                                Провести осмотр
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="h-12 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] text-muted-foreground hover:bg-secondary/60"
                        >
                            Отмена
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="h-12 px-10 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
                        >
                            {isEditing ? "Обновить запись" : "Создать запись"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {isEditing && (
                <DiagnosticModule 
                    open={isDiagnosticOpen}
                    onOpenChange={setIsDiagnosticOpen}
                    onComplete={() => {
                        setIsDiagnosticOpen(false);
                        onOpenChange(false);
                    }}
                    lead={{
                        id: appointment.id,
                        name: appointment.patient,
                        phone: appointment.phone || formData.phone,
                        status: appointment.status === "completed" ? "Готов к лечению" : (appointment.status === "planned" ? "Записан" : "Новая заявка"),
                        scheduled_at: appointment.date ? (appointment.date instanceof Date ? appointment.date.toISOString() : appointment.date) : undefined,
                        project_id: active.id || "default",
                        comments: appointment.comment || formData.comment,
                        email: "",
                        source: "Schedule",
                        created_at: new Date().toISOString(),
                        amount: "0",
                        utm_campaign: "",
                        ai_score: 0,
                        ai_summary: appointment.service || formData.service
                    } as any as Lead}
                    mode={mode}
                />
            )}
        </Dialog>
    );
};
