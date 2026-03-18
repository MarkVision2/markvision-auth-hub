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
    appointments: any[];
    onAddAppointment: (time: string) => void;
    onEditAppointment: (appt: any) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

export const DayView: React.FC<DayViewProps> = ({
    selectedDate, doctorId, appointments, onAddAppointment, onEditAppointment
}) => {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50";
            case "completed": return "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/50";
            case "no-show": return "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-500/50";
            default: return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-sm hover:shadow-md hover:border-slate-300";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500";
            case "completed": return "bg-emerald-500";
            case "no-show": return "bg-rose-500";
            default: return "bg-slate-400";
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0a] select-none animate-in slide-in-from-right-4 duration-500">
            {/* Day Header Summary */}
            <div className="px-8 py-6 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[20px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                        <span className="text-2xl font-black tracking-tighter">{format(selectedDate, "d")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold tracking-tight capitalize text-slate-800 dark:text-zinc-100">
                            {format(selectedDate, "EEEE, d MMMM", { locale: ru })}
                        </h2>
                        <span className="text-[11px] uppercase font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-500 flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5" /> Рабочий день: 08:00 – 20:00
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-6 py-3 rounded-2xl shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none mb-1">2</span>
                        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-500">Всего записей</span>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-zinc-800" />
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-emerald-500 leading-none mb-1">1</span>
                        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-500">Завершено</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-5xl mx-auto space-y-4">
                    {HOURS.map((hour) => {
                        const hourStr = hour.toString().padStart(2, "0") + ":00";
                        const appt = appointments.find(a => 
                            isSameDay(a.date, selectedDate) && a.time.startsWith(hour.toString().padStart(2, "0"))
                        );

                        return (
                            <div key={hour} className="group relative flex items-start gap-6">
                                {/* Time Column */}
                                <div className="w-24 pt-6 flex flex-col items-end shrink-0">
                                    <span className="text-[13px] font-bold text-slate-400 dark:text-zinc-500 tracking-[0.05em] transition-colors">
                                        {hourStr}
                                    </span>
                                    <div className="h-[85px] w-px bg-border/30 mt-4 mr-2" />
                                </div>

                                {/* Content Slot */}
                                <div className="flex-1 min-h-[100px] pb-4 relative">
                                    
                                    {/* Mock Current Time Indicator (Visual Demo) */}
                                    {hourStr === "10:00" && (
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-rose-500 z-10 pointer-events-none">
                                            <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950 bg-rose-500 shadow-sm" />
                                        </div>
                                    )}

                                    {appt ? (
                                        <div 
                                            onClick={() => onEditAppointment(appt)}
                                            className={cn(
                                                "w-full rounded-[24px] border p-4 transition-all duration-300 cursor-pointer group/appt hover:-translate-y-1 relative z-20",
                                                getStatusStyles(appt.status)
                                            )}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="space-y-5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("h-3 w-3 rounded-full shrink-0", getStatusIndicator(appt.status))} />
                                                        <h3 className="text-xl font-bold tracking-tight truncate uppercase">{appt.patient}</h3>
                                                        <span className={cn(
                                                            "text-[9px] font-black tracking-[0.15em] uppercase px-3 py-1 rounded-full",
                                                            appt.status === "completed" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                                        )}>
                                                            {getStatusText(appt.status)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.15em] opacity-60">
                                                                <Briefcase className="h-3.5 w-3.5" /> Услуга
                                                            </div>
                                                            <p className="text-[13px] font-bold opacity-90">{appt.service}</p>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.15em] opacity-60">
                                                                <Phone className="h-3.5 w-3.5" /> Контакт
                                                            </div>
                                                            <p className="text-[13px] font-bold opacity-90">{appt.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-1">
                                                        <Button variant="secondary" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm transition-all">
                                                            Перейти в карту
                                                        </Button>
                                                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm transition-all">
                                                            <MessageSquare className="h-4 w-4 opacity-80" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-[15px] font-bold opacity-70 bg-white/60 dark:bg-black/20 px-2.5 py-1 rounded-lg">{appt.time}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg">
                                                        {appt.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => onAddAppointment(hourStr)}
                                            className="w-full h-full min-h-[60px] rounded-[24px] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex items-center p-4 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 group/empty cursor-pointer bg-white/50 dark:bg-[#0a0a0a]/50"
                                        >
                                            <div className="flex items-center gap-5 transition-transform duration-300 group-hover/empty:translate-x-3">
                                                <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-zinc-800 group-hover/empty:bg-blue-100 group-hover/empty:border-blue-200 group-hover/empty:text-blue-500 dark:group-hover/empty:bg-blue-900/30 dark:group-hover/empty:border-blue-800/50 dark:group-hover/empty:text-blue-400 transition-colors shadow-sm">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <span className="text-[11px] uppercase font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-500 group-hover/empty:text-blue-600 dark:group-hover/empty:text-blue-400 transition-colors">
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
