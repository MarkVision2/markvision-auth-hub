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
            case "planned": return "bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-950/10 border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.12)]";
            case "completed": return "bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100 shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.12)]";
            case "no-show": return "bg-gradient-to-br from-rose-50 to-rose-100/30 dark:from-rose-950/40 dark:to-rose-950/10 border-rose-200/60 dark:border-rose-800/50 text-rose-900 dark:text-rose-100 shadow-[0_8px_30px_rgba(244,63,94,0.06)] hover:shadow-[0_12px_40px_rgba(244,63,94,0.12)]";
            default: return "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-sm hover:shadow-md";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse";
            case "completed": return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]";
            case "no-show": return "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]";
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
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0a0a0a] select-none animate-in slide-in-from-right-4 duration-500">
            {/* Day Header Summary */}
            <div className="px-8 py-6 border-b border-border/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl flex items-center justify-between z-20 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,123,255,0.3)] shrink-0">
                        <span className="text-2xl font-black tracking-tighter">{format(selectedDate, "d")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold tracking-tight capitalize text-slate-800 dark:text-zinc-100">
                            {format(selectedDate, "EEEE, d MMMM", { locale: ru })}
                        </h2>
                        <span className="text-[11px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5" /> Рабочий день: 08:00 – 20:00
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-white/40 dark:bg-black/20 px-6 py-3 rounded-2xl border border-white/50 dark:border-white/5 backdrop-blur-md shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary leading-none mb-1">2</span>
                        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500">Всего записей</span>
                    </div>
                    <div className="h-10 w-px bg-border/40" />
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-emerald-500 leading-none mb-1">1</span>
                        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500">Завершено</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-5xl mx-auto space-y-4">
                    {HOURS.map((hour) => {
                        const hourStr = hour.toString().padStart(2, "0") + ":00";
                        const appt = appointments.find(a => 
                            isSameDay(a.date, selectedDate) && a.time === hourStr
                        );

                        return (
                            <div key={hour} className="group relative flex items-start gap-6">
                                {/* Time Column */}
                                <div className="w-24 pt-6 flex flex-col items-end shrink-0">
                                    <span className="text-[13px] font-bold text-slate-400 dark:text-zinc-500 tracking-[0.05em] transition-colors">
                                        {hourStr}
                                    </span>
                                    <div className="h-[120px] w-px bg-border/30 mt-4 mr-2" />
                                </div>

                                {/* Content Slot */}
                                <div className="flex-1 min-h-[140px] pb-6 relative">
                                    
                                    {/* Mock Current Time Indicator (Visual Demo) */}
                                    {hourStr === "10:00" && (
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500 z-10 pointer-events-none opacity-50 shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                                            <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]" />
                                        </div>
                                    )}

                                    {appt ? (
                                        <div 
                                            onClick={() => onEditAppointment(appt)}
                                            className={cn(
                                                "w-full rounded-[24px] border p-6 transition-all duration-300 cursor-pointer group/appt hover:-translate-y-1 relative z-20",
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

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/40 dark:bg-black/10 p-4 rounded-xl backdrop-blur-md border border-black/5 dark:border-white/5">
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
                                                        <Button variant="secondary" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] bg-white/60 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 shadow-sm border border-black/5 dark:border-white/10 backdrop-blur-md transition-all">
                                                            Перейти в карту
                                                        </Button>
                                                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-white/60 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 shadow-sm border border-black/5 dark:border-white/10 backdrop-blur-md transition-all">
                                                            <MessageSquare className="h-4 w-4 opacity-80" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-[15px] font-bold opacity-50 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">{appt.time}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                        {appt.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => onAddAppointment(hourStr)}
                                            className="w-full h-full min-h-[60px] rounded-[24px] border-2 border-dashed border-border/40 flex items-center p-6 transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.02] group/empty cursor-pointer"
                                        >
                                            <div className="flex items-center gap-5 transition-transform duration-300 group-hover/empty:translate-x-3">
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400 group-hover/empty:bg-primary/10 group-hover/empty:text-primary transition-colors shadow-sm">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <span className="text-[11px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-zinc-500 group-hover/empty:text-primary/70 transition-colors">
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
