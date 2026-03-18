import React from "react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Plus, User, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface WeekViewProps {
    selectedDate: Date;
    doctorId: string;
    appointments: any[];
    onDateSelect: (date: Date) => void;
    onViewChange: (view: "day" | "week" | "month") => void;
    onAddAppointment: (date: Date, time: string) => void;
    onEditAppointment: (appt: any) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const WeekView: React.FC<WeekViewProps> = ({
    selectedDate, doctorId, appointments, onDateSelect, onViewChange,
    onAddAppointment, onEditAppointment
}) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "planned": return "bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-950/10 border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 shadow-[0_4px_12px_rgba(245,158,11,0.05)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)]";
            case "completed": return "bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.05)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)]";
            case "no-show": return "bg-gradient-to-br from-rose-50 to-rose-100/30 dark:from-rose-950/40 dark:to-rose-950/10 border-rose-200/60 dark:border-rose-800/50 text-rose-900 dark:text-rose-100 shadow-[0_4px_12px_rgba(244,63,94,0.05)] hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)]";
            default: return "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-sm hover:shadow-md";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse";
            case "completed": return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
            case "no-show": return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]";
            default: return "bg-slate-400";
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0a0a0a] select-none">
            {/* Week Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl z-20 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-center p-4 border-r border-border/40">
                    <Clock className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
                {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div 
                            key={i} 
                            onClick={() => {
                                onDateSelect(day);
                                onViewChange("day");
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center py-4 border-r border-border/40 transition-all cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 group relative",
                                isToday ? "" : ""
                            )}
                        >
                            {isToday && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(0,123,255,0.4)]" />}
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-[0.2em] mb-1.5 transition-colors",
                                isToday ? "text-primary" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                            )}>
                                {DAYS[i]}
                            </span>
                            <div className={cn(
                                "h-10 w-10 flex items-center justify-center text-[15px] font-semibold transition-all duration-300 rounded-2xl",
                                isToday 
                                    ? "bg-primary text-white shadow-[0_4px_12px_rgba(0,123,255,0.3)] scale-110" 
                                    : "text-slate-700 dark:text-zinc-200 group-hover:bg-slate-200/50 dark:group-hover:bg-zinc-700/50 group-hover:scale-105"
                            )}>
                                {format(day, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid with ScrollArea */}
            <ScrollArea className="flex-1 bg-white dark:bg-[#0a0a0a]">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
                    
                    {/* Current Time Line Mockup (Static for visual logic) */}
                    <div className="absolute left-[80px] right-0 h-px bg-red-500 z-20 pointer-events-none opacity-50 shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{ top: '350px' }}>
                        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>

                    {/* Horizontal lines */}
                    {HOURS.map((hour) => (
                        <React.Fragment key={hour}>
                            {/* Hour Labels */}
                            <div className="h-[120px] border-r border-border/40 flex items-start justify-center pt-3 sticky left-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl z-20">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-[0.1em]">
                                    {hour.toString().padStart(2, "0")}:00
                                </span>
                            </div>

                            {/* Day Slots */}
                            {weekDays.map((day, i) => {
                                const hourStr = hour.toString().padStart(2, "0") + ":00";
                                const appt = appointments.find(a => 
                                    isSameDay(a.date, day) && a.time === hourStr
                                );

                                return (
                                    <div 
                                        key={`${i}-${hour}`} 
                                        onClick={() => !appt && onAddAppointment(day, hourStr)}
                                        className="h-[120px] border-r border-b border-border/30 relative group transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/30 cursor-pointer"
                                    >
                                        {appt ? (
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment(appt);
                                                }}
                                                className={cn(
                                                    "absolute inset-1.5 p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group/appt hover:-translate-y-0.5",
                                                    getStatusStyles(appt.status)
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[12px] font-bold tracking-tight truncate leading-tight mb-1.5">
                                                            {appt.patient}
                                                        </span>
                                                        <div className="flex items-center gap-2 opacity-80">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", getStatusIndicator(appt.status))} />
                                                            <span className="text-[9px] uppercase font-bold tracking-[0.15em] truncate">{appt.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-6 w-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center opacity-0 group-hover/appt:opacity-100 transition-opacity backdrop-blur-md">
                                                        <Plus className="h-3 w-3 opacity-70" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <div className="flex -space-x-1.5">
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="h-5 w-5 rounded-md bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-sm">
                                                                <FileText className="h-2.5 w-2.5 opacity-60" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-[0.05em] ml-auto opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md backdrop-blur-sm">{appt.time}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
