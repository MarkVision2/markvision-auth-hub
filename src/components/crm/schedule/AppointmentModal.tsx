import React, { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Calendar as CalendarIcon, Clock, User, 
    Phone, MessageSquare, Briefcase, CheckCircle2,
    ShieldAlert, XCircle, Search, ExternalLink, Plus
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any; // If editing, pass the existing appointment
    selectedDate?: Date;
    selectedTime?: string;
    onSave: (data: any) => void;
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
    selectedDate, selectedTime, onSave
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
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border border-white/20 dark:border-white/10 rounded-[40px] bg-slate-50/80 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.1)]">
                <div className="bg-white/50 dark:bg-zinc-900/40 px-10 py-8 border-b border-border/40 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center gap-5 mb-1">
                            <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,123,255,0.3)]">
                                {isEditing ? <Briefcase className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-100 uppercase">
                                    {isEditing ? "Изменить запись" : "Новая запись"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 dark:text-zinc-500 font-bold tracking-[0.15em] text-[11px] uppercase">
                                    {isEditing ? `ID записи: #${appointment.id.slice(0,8)}` : "Заполнение данных о визите"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-10 py-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Patient Search / Info */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Пациент</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Поиск по ФИО..." 
                                    className="h-14 pl-14 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 font-bold focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400 backdrop-blur-md shadow-sm transition-all"
                                    value={formData.patientName}
                                    onChange={(e) => handlePatientSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                                        {searchResults.map((p, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors group/item"
                                            >
                                                <p className="text-sm font-bold group-hover/item:text-primary">{p.name}</p>
                                                <p className="text-[11px] text-muted-foreground font-medium">{p.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Номер телефона" 
                                    className="h-14 pl-14 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 font-bold focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400 backdrop-blur-md shadow-sm transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Дата визита</Label>
                            <div className="h-14 flex items-center gap-4 px-6 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 font-bold text-[13px] backdrop-blur-md shadow-sm">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {format(formData.date, "d MMMM yyyy", { locale: ru })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Время приема</Label>
                            <Select value={formData.time} onValueChange={(val) => setFormData({...formData, time: val})}>
                                <SelectTrigger className="h-14 px-6 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 font-bold transition-all focus:ring-2 focus:ring-primary/30 backdrop-blur-md shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl max-h-[200px]">
                                    {Array.from({ length: 25 }, (_, i) => {
                                        const h = Math.floor(i / 2) + 8;
                                        const m = i % 2 === 0 ? "00" : "30";
                                        const t = `${h.toString().padStart(2, "0")}:${m}`;
                                        return <SelectItem key={t} value={t} className="rounded-xl py-3 font-bold hover:bg-primary/5 cursor-pointer">{t}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Service & Status */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Причина обращения / Услуга</Label>
                            <Input 
                                placeholder="Напр. Первичная консультация" 
                                className="h-14 pl-6 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 font-bold focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400 backdrop-blur-md shadow-sm transition-all"
                                value={formData.service}
                                onChange={(e) => setFormData({...formData, service: e.target.value})}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Статус визита</Label>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                            >
                                {STATUSES.map((item) => {
                                    const isActive = formData.status === item.id;
                                    let activeClasses = "";
                                    let glowIndicator = "";
                                    if (item.id === "planned" && isActive) {
                                        activeClasses = "bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-950/10 border-amber-200/60 dark:border-amber-800/50 shadow-[0_8px_30px_rgba(245,158,11,0.08)] scale-[1.02]";
                                        glowIndicator = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse";
                                    } else if (item.id === "completed" && isActive) {
                                        activeClasses = "bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/50 shadow-[0_8px_30px_rgba(16,185,129,0.08)] scale-[1.02]";
                                        glowIndicator = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]";
                                    } else if (item.id === "no-show" && isActive) {
                                        activeClasses = "bg-gradient-to-br from-rose-50 to-rose-100/30 dark:from-rose-950/40 dark:to-rose-950/10 border-rose-200/60 dark:border-rose-800/50 shadow-[0_8px_30px_rgba(244,63,94,0.08)] scale-[1.02]";
                                        glowIndicator = "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]";
                                    } else {
                                        activeClasses = "border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/10 hover:bg-white/60 dark:hover:bg-black/30 backdrop-blur-md opacity-70";
                                        glowIndicator = "bg-slate-300 dark:bg-zinc-700";
                                    }

                                    return (
                                        <Label
                                            key={item.id}
                                            htmlFor={item.id}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-3 p-5 rounded-[24px] border cursor-pointer transition-all duration-300",
                                                activeClasses
                                            )}
                                        >
                                            <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                            <div className="relative">
                                                <div className={cn("h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0", item.bg, item.color)}>
                                                    <item.icon size={20} />
                                                </div>
                                                {isActive && (
                                                    <div className={cn("absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900", glowIndicator)} />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-[0.1em] text-center transition-colors", 
                                                isActive ? item.color : "text-slate-500"
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
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 px-1">Комментарий к записи</Label>
                        <Textarea 
                            placeholder="Важные детали (жалобы, наличие МРТ, особенности пациента)..." 
                            className="bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-3xl p-6 min-h-[120px] font-medium resize-none focus:ring-2 focus:ring-primary/30 backdrop-blur-md shadow-sm transition-all"
                            value={formData.comment}
                            onChange={(e) => setFormData({...formData, comment: e.target.value})}
                        />
                    </div>
                </div>

                <DialogFooter className="bg-white/50 dark:bg-zinc-900/40 px-10 py-6 border-t border-border/40 flex flex-col sm:flex-row gap-4 backdrop-blur-xl">
                    {isEditing && (
                        <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 flex items-center gap-3 transition-colors">
                            <ExternalLink size={16} /> CRM Карточка
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="h-14 px-8 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 transition-colors"
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="h-14 px-10 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_8px_24px_rgba(0,123,255,0.3)] hover:shadow-[0_12px_32px_rgba(0,123,255,0.4)] hover:scale-[1.02] transition-all"
                    >
                        {isEditing ? "Сохранить изменения" : "Создать запись"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
