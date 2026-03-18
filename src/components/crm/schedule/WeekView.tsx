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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] select-none">
            {/* Week Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 z-20">
                <div className="flex items-center justify-center p-4 border-r border-slate-200 dark:border-zinc-800">
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
                                "flex flex-col items-center justify-center py-4 border-r border-slate-200 dark:border-zinc-800 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900 group relative",
                            )}
                        >
                            {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />}
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-[0.1em] mb-1.5 transition-colors",
                                isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-300"
                            )}>
                                {DAYS[i]}
                            </span>
                            <div className={cn(
                                "h-9 w-9 flex items-center justify-center text-[15px] font-bold transition-all rounded-full",
                                isToday 
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                                    : "text-slate-800 dark:text-zinc-200 group-hover:bg-slate-200 dark:group-hover:bg-zinc-800"
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
                    <div className="absolute left-[80px] right-0 h-px bg-rose-500 z-20 pointer-events-none" style={{ top: '350px' }}>
                        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950 bg-rose-500 shadow-sm" />
                    </div>

                    {/* Horizontal lines */}
                    {HOURS.map((hour) => (
                        <React.Fragment key={hour}>
                            {/* Hour Labels */}
                            <div className="h-[120px] border-r border-slate-200 dark:border-zinc-800 flex items-start justify-center pt-3 sticky left-0 bg-slate-50 dark:bg-zinc-950 z-20">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 tracking-wider">
                                    {hour.toString().padStart(2, "0")}:00
                                </span>
                            </div>

                            {/* Day Slots */}
                            {weekDays.map((day, i) => {
                                const hourStr = hour.toString().padStart(2, "0") + ":00";
                                const appt = appointments.find(a => 
                                    isSameDay(a.date, day) && a.time.startsWith(hour.toString().padStart(2, "0"))
                                );

                                return (
                                    <div 
                                        key={`${i}-${hour}`} 
                                        onClick={() => !appt && onAddAppointment(day, hourStr)}
                                        className="h-[120px] border-r border-b border-slate-100 dark:border-zinc-800/50 relative group transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer p-1"
                                    >
                                        {appt ? (
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment(appt);
                                                }}
                                                className={cn(
                                                    "absolute inset-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group/appt hover:-translate-y-0.5",
                                                    getStatusStyles(appt.status)
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold truncate leading-tight mb-1">
                                                            {appt.patient}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 opacity-90">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", getStatusIndicator(appt.status))} />
                                                            <span className="text-[9px] uppercase font-bold tracking-wider truncate text-inherit opacity-80">{appt.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <span className="text-[10px] font-bold tracking-wider ml-auto opacity-70 px-1.5 rounded-md bg-black/5 dark:bg-white/10">{appt.time}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
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
