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
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[40px] bg-background shadow-2xl">
                <div className="bg-primary/5 px-10 py-8 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                                {isEditing ? <Briefcase className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                                    {isEditing ? "Изменить запись" : "Новая запись"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase">
                                    {isEditing ? `ID записи: #${appointment.id.slice(0,8)}` : "Заполнение данных о визите"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-10 py-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Patient Search / Info */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Пациент</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Поиск по ФИО..." 
                                    className="h-14 pl-12 rounded-2xl bg-secondary/10 border-none font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30"
                                    value={formData.patientName}
                                    onChange={(e) => handlePatientSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-background border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                                        {searchResults.map((p, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors group/item"
                                            >
                                                <p className="text-sm font-bold group-hover/item:text-primary">{p.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{p.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Номер телефона" 
                                    className="h-14 pl-12 rounded-2xl bg-secondary/10 border-none font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Дата визита</Label>
                            <div className="h-14 flex items-center gap-3 px-5 rounded-2xl bg-secondary/10 font-bold text-sm">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                {format(formData.date, "d MMMM yyyy", { locale: ru })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Время приема</Label>
                            <Select value={formData.time} onValueChange={(val) => setFormData({...formData, time: val})}>
                                <SelectTrigger className="h-14 rounded-2xl bg-secondary/10 border-none font-bold transition-all focus:ring-2 focus:ring-primary/20">
                                    <Clock className="h-4 w-4 text-primary mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-background/95 backdrop-blur-xl max-h-[200px]">
                                    {Array.from({ length: 25 }, (_, i) => {
                                        const h = Math.floor(i / 2) + 8;
                                        const m = i % 2 === 0 ? "00" : "30";
                                        const t = `${h.toString().padStart(2, "0")}:${m}`;
                                        return <SelectItem key={t} value={t} className="rounded-xl py-3 font-bold">{t}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Service & Status */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Причина обращения / Услуга</Label>
                            <Input 
                                placeholder="Напр. Первичная консультация" 
                                className="h-14 rounded-2xl bg-secondary/10 border-none font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/30"
                                value={formData.service}
                                onChange={(e) => setFormData({...formData, service: e.target.value})}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Статус визита</Label>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                            >
                                {STATUSES.map((item) => (
                                    <Label
                                        key={item.id}
                                        htmlFor={item.id}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-5 rounded-[24px] border-2 cursor-pointer transition-all hover:bg-secondary/20",
                                            formData.status === item.id 
                                                ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                : "border-transparent bg-secondary/10 opacity-60"
                                        )}
                                    >
                                        <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                                            <item.icon size={20} />
                                        </div>
                                        <span className={cn("text-[10px] font-black uppercase tracking-wider text-center", formData.status === item.id ? "text-primary" : "text-muted-foreground")}>
                                            {item.label}
                                        </span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-1">Комментарий к записи</Label>
                        <Textarea 
                            placeholder="Важные детали (жалобы, наличие МРТ, особенности пациента)..." 
                            className="bg-secondary/10 border-none rounded-3xl p-6 min-h-[120px] font-medium resize-none focus:ring-2 focus:ring-primary/20"
                            value={formData.comment}
                            onChange={(e) => setFormData({...formData, comment: e.target.value})}
                        />
                    </div>
                </div>

                <DialogFooter className="px-10 py-8 border-t border-border flex flex-col sm:flex-row gap-4">
                    {isEditing && (
                        <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-secondary/10 flex items-center gap-2">
                            <ExternalLink size={14} /> CRM Карточка
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-secondary/10"
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                    >
                        {isEditing ? "Сохранить изменения" : "Создать запись"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
