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
    ShieldAlert, XCircle, Search, ExternalLink, Plus
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
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none rounded-[32px] bg-card shadow-2xl">
                {/* Header Section */}
                <div className="bg-gradient-to-b from-secondary to-card px-10 py-8 border-b border-border/50 relative">
                    <DialogHeader>
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-sm">
                                {isEditing ? <Briefcase className="h-6 w-6" /> : <Plus className="h-6 w-6 cursor-pointer" />}
                            </div>
                            <div className="flex flex-col">
                                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                    {isEditing ? "Изменить запись" : "Новая запись"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs font-medium uppercase tracking-wider mt-1">
                                    {isEditing ? `ID записи: #${appointment.id?.slice(0,8)}` : "Заполнение данных о визите"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-10 py-6 space-y-7 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Patient Search / Info */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Пациент</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Поиск по ФИО..." 
                                    className="h-12 pl-12 rounded-xl bg-secondary border-border font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
                                    value={formData.patientName}
                                    onChange={(e) => handlePatientSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-card border border-border rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
                                        {searchResults.map((p, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors group/item"
                                            >
                                                <p className="text-sm font-bold text-foreground group-hover/item:text-blue-400">{p.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">{p.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Номер телефона" 
                                    className="h-12 pl-12 rounded-xl bg-secondary border-border font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Дата визита</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="h-12 flex items-center gap-3 px-4 rounded-xl bg-secondary border border-border font-semibold text-sm cursor-pointer hover:bg-secondary/80 transition-colors">
                                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                                        <span className="text-foreground">{format(formData.date, "d MMMM yyyy", { locale: ru })}</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(date) => date && setFormData({ ...formData, date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Время приема</Label>
                            <Select value={formData.time} onValueChange={(val) => setFormData({...formData, time: val})}>
                                <SelectTrigger className="h-12 px-4 rounded-xl bg-secondary border border-border font-semibold transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-blue-500" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border shadow-xl p-1.5 bg-card max-h-[220px]">
                                    {Array.from({ length: 25 }, (_, i) => {
                                        const h = Math.floor(i / 2) + 8;
                                        const m = i % 2 === 0 ? "00" : "30";
                                        const t = `${h.toString().padStart(2, "0")}:${m}`;
                                        return <SelectItem key={t} value={t} className="rounded-lg py-2.5 font-semibold cursor-pointer">{t}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Service & Status */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Причина обращения / Услуга</Label>
                            <Input 
                                placeholder="Напр. Первичная консультация" 
                                className="h-12 px-4 rounded-xl bg-secondary border-border font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
                                value={formData.service}
                                onChange={(e) => setFormData({...formData, service: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Статус визита</Label>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                            >
                                {STATUSES.map((item) => {
                                    const isActive = formData.status === item.id;
                                    let activeClasses = "";
                                    let dotColor = "";
                                    
                                    if (item.id === "planned" && isActive) {
                                        activeClasses = "bg-amber-500/10 border-amber-500/50 shadow-sm";
                                        dotColor = "bg-amber-500";
                                    } else if (item.id === "completed" && isActive) {
                                        activeClasses = "bg-emerald-500/10 border-emerald-500/50 shadow-sm";
                                        dotColor = "bg-emerald-500";
                                    } else if (item.id === "no-show" && isActive) {
                                        activeClasses = "bg-rose-500/10 border-rose-500/50 shadow-sm";
                                        dotColor = "bg-rose-500";
                                    } else {
                                        activeClasses = "bg-card border-border hover:bg-secondary";
                                    }

                                    return (
                                        <Label
                                            key={item.id}
                                            htmlFor={item.id}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                                activeClasses
                                            )}
                                        >
                                            <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                            {isActive && (
                                                <div className="absolute top-3 right-3 flex h-3 w-3">
                                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-40", dotColor)}></span>
                                                    <span className={cn("relative inline-flex rounded-full h-3 w-3", dotColor)}></span>
                                                </div>
                                            )}
                                            <item.icon className={cn("h-6 w-6 mb-2", isActive ? item.color : "text-muted-foreground/60")} />
                                            <span className={cn(
                                                "text-[11px] font-bold uppercase tracking-wider text-center", 
                                                isActive ? item.color : "text-muted-foreground"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                        </div>
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Комментарий к записи</Label>
                        <Textarea 
                            placeholder="Важные детали (жалобы, наличие МРТ, особенности пациента)..." 
                            className="bg-secondary border-border rounded-xl p-4 min-h-[100px] font-medium resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
                            value={formData.comment}
                            onChange={(e) => setFormData({...formData, comment: e.target.value})}
                        />
                    </div>
                </div>

                <DialogFooter className="bg-secondary/50 px-10 py-5 border-t border-border/50 flex flex-col sm:flex-row gap-3 items-center">
                    {isEditing && (
                        <Button 
                            variant="ghost" 
                            className="h-12 px-6 rounded-xl font-bold uppercase tracking-wider text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                            onClick={() => setIsDiagnosticOpen(true)}
                        >
                            <ExternalLink className="h-4 w-4" /> В карточку
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="h-12 px-6 rounded-xl font-bold uppercase tracking-wider text-[11px] border-border text-muted-foreground hover:bg-secondary"
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="h-12 px-8 rounded-xl font-bold uppercase tracking-wider text-[11px] bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
                    >
                        {isEditing ? "Сохранить изменения" : "Создать запись"}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {isEditing && (
                <DiagnosticModule 
                    open={isDiagnosticOpen}
                    onOpenChange={setIsDiagnosticOpen}
                    lead={{
                        id: appointment.id,
                        name: appointment.patient,
                        phone: appointment.phone,
                        status: appointment.status === "completed" ? "Готов к лечению" : (appointment.status === "planned" ? "Записан" : "Новая заявка"),
                        scheduled_at: appointment.date ? (appointment.date instanceof Date ? appointment.date.toISOString() : appointment.date) : undefined,
                        project_id: "default",
                        comments: appointment.comment,
                        email: "",
                        source: "Schedule",
                        created_at: new Date().toISOString(),
                        amount: "0",
                        utm_campaign: "",
                        ai_score: 0,
                        ai_summary: ""
                    } as any as Lead}
                    mode={mode}
                />
            )}
        </Dialog>
    );
};
