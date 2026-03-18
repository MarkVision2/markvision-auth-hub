import React from "react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Plus, User, FileText, Phone, MessageSquare, Briefcase } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface DayViewProps {
    selectedDate: Date;
    doctorId: string;
    onAddAppointment: (time: string) => void;
    onEditAppointment: (appt: any) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

// Mock appointments
const MOCK_APPOINTMENTS = [
    { 
        id: "1", patient: "Алексей Павлов", time: "09:00", date: new Date(), 
        status: "planned", type: "Первичный", phone: "+7 777 123 45 67", 
        service: "Консультация терапевта", comment: "Боли в спине"
    },
    { 
        id: "2", patient: "Мадина Сулейменова", time: "11:30", date: new Date(), 
        status: "completed", type: "Повторный", phone: "+7 701 987 65 43",
        service: "Курс реабилитации", comment: "Плановый осмотр"
    },
];

export const DayView: React.FC<DayViewProps> = ({
    selectedDate, doctorId, onAddAppointment, onEditAppointment
}) => {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500/10 border-amber-500/20";
            case "completed": return "bg-emerald-500/10 border-emerald-500/20";
            case "no-show": return "bg-rose-500/10 border-rose-500/20";
            default: return "bg-secondary/10 border-border";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
            case "completed": return "bg-emerald-500";
            case "no-show": return "bg-rose-500";
            default: return "bg-muted-foreground/30";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "planned": return "Ожидается";
            case "completed": return "Завершен";
            case "no-show": return "Не явился";
            default: return "—";
        }
    };

    return (
        <div className="flex flex-col h-full bg-background select-none animate-in slide-in-from-right-4 duration-500">
            {/* Day Header Summary */}
            <div className="px-8 py-6 border-b border-border bg-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <span className="text-xl font-black">{format(selectedDate, "d")}</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight capitalize">
                            {format(selectedDate, "EEEE, d MMMM", { locale: ru })}
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                             <Clock className="h-3 w-3" /> Рабочий день: 08:00 – 20:00
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary">2</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Всего записей</span>
                    </div>
                    <div className="h-10 w-px bg-border/50" />
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-emerald-500">1</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Завершено</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-5xl mx-auto space-y-4">
                    {HOURS.map((hour) => {
                        const hourStr = hour.toString().padStart(2, "0") + ":00";
                        const appt = MOCK_APPOINTMENTS.find(a => 
                            isSameDay(a.date, selectedDate) && a.time === hourStr
                        );

                        return (
                            <div key={hour} className="group relative flex items-start gap-6">
                                {/* Time Column */}
                                <div className="w-20 pt-4 flex flex-col items-end shrink-0">
                                    <span className="text-sm font-black text-muted-foreground/40 tracking-tighter group-hover:text-primary transition-colors">
                                        {hourStr}
                                    </span>
                                    <div className="h-24 w-px bg-border/50 mt-2" />
                                </div>

                                {/* Content Slot */}
                                <div className="flex-1 min-h-[120px] pb-8">
                                    {appt ? (
                                        <div 
                                            onClick={() => onEditAppointment(appt)}
                                            className={cn(
                                                "w-full rounded-[32px] border p-6 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:scale-[1.01] group/appt",
                                                getStatusStyles(appt.status)
                                            )}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="space-y-4 flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-3 w-3 rounded-full shrink-0", getStatusIndicator(appt.status))} />
                                                        <h3 className="text-xl font-bold tracking-tight truncate uppercase">{appt.patient}</h3>
                                                        <span className={cn(
                                                            "text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full",
                                                            appt.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                        )}>
                                                            {getStatusText(appt.status)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                                                                <Briefcase className="h-3 w-3" /> Услуга
                                                            </div>
                                                            <p className="text-sm font-bold text-foreground/80">{appt.service}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                                                                <Phone className="h-3 w-3" /> Контакт
                                                            </div>
                                                            <p className="text-sm font-bold text-foreground/80">{appt.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-2">
                                                        <Button variant="secondary" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/50 hover:bg-white text-foreground/60 shadow-none border border-border/50">
                                                            Перейти в карту
                                                        </Button>
                                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl bg-white/50 hover:bg-white text-foreground/60 shadow-none border border-border/50">
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-sm font-black opacity-40">{appt.time}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/10 px-3 py-1 rounded-lg">
                                                        {appt.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => onAddAppointment(hourStr)}
                                            className="w-full h-full min-h-[40px] rounded-3xl border-2 border-dashed border-border/50 flex items-center p-6 transition-all hover:border-primary/50 group/empty cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4 transition-transform group-hover/empty:translate-x-2">
                                                <div className="h-10 w-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-muted-foreground group-hover/empty:bg-primary/10 group-hover/empty:text-primary transition-colors">
                                                    <Plus size={18} />
                                                </div>
                                                <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/40 group-hover/empty:text-primary/60 transition-colors">
                                                    Свободное время: {hourStr} — Нажмите для записи
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};
