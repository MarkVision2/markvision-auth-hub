import React from "react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Plus } from "lucide-react";
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
    workingDays?: string[];
    workingHoursPerDay?: Record<string, string>;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const WeekView: React.FC<WeekViewProps> = ({
    selectedDate, doctorId, appointments, onDateSelect, onViewChange,
    onAddAppointment, onEditAppointment, workingDays, workingHoursPerDay
}) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const today = startOfDay(new Date());

    const ALL_HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 - 21:00

    const isWorkingHour = (day: Date, hour: number) => {
        const dName = format(day, "eeeee", { locale: ru }); // Пн, Вт etc
        if (!workingDays?.includes(dName)) return false;
        
        const hoursStr = workingHoursPerDay?.[dName];
        if (!hoursStr) return true; 

        try {
            const parts = hoursStr.split("-").map(p => p.trim());
            if (parts.length === 2) {
                const startH = parseInt(parts[0]);
                const endH = parseInt(parts[1]);
                return hour >= startH && hour < endH;
            }
        } catch (e) {
            console.error("Error parsing hours:", hoursStr);
        }
        return true;
    };

    const getDateStyles = (apptDate: Date) => {
        const apptDay = startOfDay(apptDate);
        if (isSameDay(apptDay, today)) {
            return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10 hover:shadow-md hover:border-emerald-500/60";
        } else if (isBefore(apptDay, today)) {
            return "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10 hover:shadow-md hover:border-rose-500/60";
        } else {
            return "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10 hover:shadow-md hover:border-amber-500/60";
        }
    };

    const getDateIndicator = (apptDate: Date) => {
        const apptDay = startOfDay(apptDate);
        if (isSameDay(apptDay, today)) return "bg-emerald-500";
        if (isBefore(apptDay, today)) return "bg-rose-500";
        return "bg-amber-500";
    };

    return (
        <div className="flex flex-col h-full bg-card select-none">
            {/* Week Header */}
            <div className="grid grid-cols-[80px_repeat(7,minmax(130px,1fr))] border-b border-border bg-secondary z-20 sticky top-0">
                <div className="flex items-center justify-center p-4 border-r border-border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    const isWorkDay = workingDays?.includes(DAYS[i]);
                    return (
                        <div 
                            key={i} 
                            onClick={() => {
                                onDateSelect(day);
                                onViewChange("day" as any);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center py-4 border-r border-border transition-all cursor-pointer hover:bg-secondary group relative",
                                !isWorkDay && "opacity-40 grayscale-[0.5]"
                            )}
                        >
                            {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />}
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-[0.1em] mb-1.5 transition-colors",
                                isToday ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {DAYS[i]}
                            </span>
                            <div className={cn(
                                "h-9 w-9 flex items-center justify-center text-[15px] font-bold transition-all rounded-full",
                                isToday 
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                                    : "text-foreground group-hover:bg-secondary"
                            )}>
                                {format(day, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>

            <ScrollArea className="flex-1 bg-card">
                <div className="grid grid-cols-[80px_repeat(7,minmax(130px,1fr))] relative">
                    {ALL_HOURS.map((hour) => (
                        <React.Fragment key={hour}>
                            <div className="h-[120px] border-r border-border flex items-start justify-center pt-4 sticky left-0 bg-secondary z-20 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
                                <span className="text-xs font-black text-muted-foreground tabular-nums">
                                    {hour}:00
                                </span>
                            </div>

                            {weekDays.map((day, i) => {
                                const hourStr = hour.toString().padStart(2, "0") + ":00";
                                const appt = appointments.find(a => 
                                    isSameDay(a.date, day) && a.time.startsWith(hour.toString().padStart(2, "0"))
                                );
                                const isWorking = isWorkingHour(day, hour);

                                return (
                                    <div 
                                        key={`${i}-${hour}`} 
                                        onClick={() => !appt && isWorking && onAddAppointment(day, hourStr)}
                                        className={cn(
                                            "h-[120px] border-r border-b border-border relative group transition-all p-1.5",
                                            !isWorking && "bg-secondary/30 bg-dashed opacity-30 cursor-not-allowed",
                                            isWorking && !appt && "hover:bg-primary/[0.02] cursor-pointer"
                                        )}
                                    >
                                        {appt ? (
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment(appt);
                                                }}
                                                className={cn(
                                                    "absolute inset-1.5 p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col group/appt hover:scale-[1.02] hover:shadow-xl hover:z-10 shadow-sm overflow-hidden",
                                                    getDateStyles(appt.date)
                                                )}
                                            >
                                                <span className="text-[12px] font-black leading-tight break-words line-clamp-2">
                                                    {appt.patient}
                                                </span>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={cn("h-2 w-2 rounded-full shrink-0 animate-pulse", getDateIndicator(appt.date))} />
                                                    <span className="text-[9px] uppercase font-black opacity-80 tracking-widest truncate">{appt.type}</span>
                                                </div>
                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-[11px] font-black opacity-60 tabular-nums">{appt.time}</span>
                                                </div>
                                            </div>
                                        ) : isWorking && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
                                                    <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <Plus className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {!isWorking && (
                                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                               <Clock className="h-4 w-4 text-muted-foreground/20" />
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
