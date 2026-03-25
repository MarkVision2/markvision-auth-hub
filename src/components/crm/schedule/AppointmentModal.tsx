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
    ChevronDown, Stethoscope
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DiagnosticModule } from "../../diagnostics/DiagnosticModule";
import { Lead } from "../KanbanBoard";

interface AppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any; // If editing, pass the existing appointment
    selectedDate?: Date;
    selectedTime?: string;
    onSave: (data: any) => void;
    mode?: "admin" | "doctor";
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
    selectedDate, selectedTime, onSave, mode = "admin"
}) => {
    const isEditing = !!appointment;
    const [formData, setFormData] = useState({
        patientName: appointment?.patient || "",
        phone: appointment?.phone || "",
        service: appointment?.service || "",
        status: appointment?.status || "planned",
        comment: appointment?.comment || "",
        date: appointment?.date || selectedDate || new Date(),
        time: appointment?.time || selectedTime || "09:00",
    });

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setFormData({
                patientName: appointment?.patient || "",
                phone: appointment?.phone || "",
                service: appointment?.service || "",
                status: appointment?.status || "planned",
                comment: appointment?.comment || "",
                date: appointment?.date || selectedDate || new Date(),
                time: appointment?.time || selectedTime || "09:00",
            });
            setShowResults(false);
            setSearchResults([]);
        }
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
                <div className="bg-gradient-to-br from-primary/10 via-background to-background px-8 py-6 border-b border-border/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <DialogHeader>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                                {isEditing ? <Briefcase className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                            </div>
                            <div className="flex flex-col">
                                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                    {isEditing ? "Изменить запись" : "Новая запись"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    {isEditing ? `ID записи: #${appointment.id?.slice(0,8)}` : "Заполнение данных о визите"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-8 py-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Patient Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Данные пациента</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 relative group">
                                <div className="absolute left-4 top-[38px] -translate-y-1/2 z-10">
                                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input 
                                    placeholder="Поиск по ФИО..." 
                                    className="h-12 pl-11 rounded-2xl bg-secondary/30 border-border/50 font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
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
                                        className="h-12 pl-11 rounded-2xl bg-secondary/30 border-border/50 font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl bg-[#25D366]/5 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white shrink-0 transition-all shadow-sm"
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
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Детали визита</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="h-14 flex items-center justify-between px-5 rounded-2xl bg-card border border-border/60 font-bold text-sm cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
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
                                <SelectTrigger className="h-14 px-5 rounded-2xl bg-card border border-border/60 font-bold transition-all hover:border-primary/40 hover:bg-primary/[0.02] shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
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
                                        return <SelectItem key={t} value={t} className="rounded-xl py-3 px-4 font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 mb-1 last:mb-0 transition-all">{t}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={formData.service || "primary"} onValueChange={(val) => setFormData({...formData, service: val})}>
                            <SelectTrigger className="h-14 px-5 rounded-2xl bg-card border border-border/60 font-bold transition-all hover:border-primary/40 hover:bg-primary/[0.02] shadow-sm group">
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
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

                    {/* Status & Comment Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Статус</Label>
                            </div>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                                className={`grid gap-2 ${mode === "doctor" ? "grid-cols-4" : "grid-cols-3"}`}
                            >
                            {(mode === "doctor" ? DOCTOR_STATUSES : STATUSES).map((item) => {
                                    const isActive = formData.status === item.id;
                                    let activeClasses = "";
                                    let dotColor = "";
                                    
                                    if (item.id === "planned" && isActive) {
                                        activeClasses = "bg-amber-500/10 border-amber-500/30 shadow-inner";
                                        dotColor = "bg-amber-500";
                                    } else if (item.id === "completed" && isActive) {
                                        activeClasses = "bg-emerald-500/10 border-emerald-500/30 shadow-inner";
                                        dotColor = "bg-emerald-500";
                                    } else if (item.id === "thinking" && isActive) {
                                        activeClasses = "bg-blue-500/10 border-blue-500/30 shadow-inner";
                                        dotColor = "bg-blue-500";
                                    } else if (item.id === "no-show" && isActive) {
                                        activeClasses = "bg-rose-500/10 border-rose-500/30 shadow-inner";
                                        dotColor = "bg-rose-500";
                                    } else {
                                        activeClasses = "bg-secondary/20 border-border/40 hover:bg-secondary/40";
                                    }

                                    return (
                                        <Label
                                            key={item.id}
                                            htmlFor={item.id}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group",
                                                activeClasses,
                                                isActive ? "ring-2 ring-offset-2 ring-offset-background" : ""
                                            )}
                                        >
                                            <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                            {isActive && (
                                                <div className="absolute top-2 right-2 flex h-2 w-2">
                                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-40", dotColor)}></span>
                                                    <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
                                                </div>
                                            )}
                                            <item.icon className={cn("h-5 w-5 mb-2 transition-transform group-hover:scale-110", isActive ? item.color : "text-muted-foreground/40")} />
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-tighter text-center", 
                                                isActive ? item.color : "text-muted-foreground/60"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Заметки</Label>
                            </div>
                            <Textarea 
                                placeholder="Особенности пациента, жалобы..." 
                                className="bg-secondary/20 border-border/40 rounded-2xl p-4 min-h-[105px] font-bold text-xs leading-relaxed resize-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:font-medium placeholder:text-muted-foreground/40 shadow-inner"
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
                                className="h-12 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10 flex items-center gap-2 group border-2"
                                onClick={() => setIsDiagnosticOpen(true)}
                            >
                                <ExternalLink className="h-4 w-4 group-hover:rotate-12 transition-transform" />
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
                            className="h-12 px-10 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5"
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
                        project_id: "default",
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
