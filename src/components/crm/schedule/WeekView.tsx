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
    onDateSelect: (date: Date) => void;
    onViewChange: (view: "day" | "week" | "month") => void;
    onAddAppointment: (date: Date, time: string) => void;
    onEditAppointment: (appt: any) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Mock appointments
const MOCK_APPOINTMENTS = [
    { id: "1", patient: "Алексей Павлов", time: "09:00", date: new Date(), status: "planned", type: "Первичный" },
    { id: "2", patient: "Мадина Сулейменова", time: "11:30", date: new Date(), status: "completed", type: "Повторный" },
    { id: "3", patient: "Игорь Ким", time: "14:00", date: new Date(), status: "no-show", type: "Консультация" },
];

export const WeekView: React.FC<WeekViewProps> = ({
    selectedDate, doctorId, onDateSelect, onViewChange,
    onAddAppointment, onEditAppointment
}) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500/10 border-amber-500/20 text-amber-700 shadow-amber-500/5 hover:bg-amber-500/20";
            case "completed": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 shadow-emerald-500/5 hover:bg-emerald-500/20";
            case "no-show": return "bg-rose-500/10 border-rose-500/20 text-rose-700 shadow-rose-500/5 hover:bg-rose-500/20";
            default: return "bg-secondary/10 border-border hover:bg-secondary/20";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "planned": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse";
            case "completed": return "bg-emerald-500";
            case "no-show": return "bg-rose-500";
            default: return "bg-muted-foreground/30";
        }
    };

    return (
        <div className="flex flex-col h-full bg-background select-none">
            {/* Week Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-border bg-muted/5">
                <div className="flex items-center justify-center p-4 border-r border-border">
                    <Clock className="h-4 w-4 text-muted-foreground/50" />
                </div>
                {weekDays.map((day, i) => (
                    <div 
                        key={i} 
                        onClick={() => {
                            onDateSelect(day);
                            onViewChange("day");
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center py-4 border-r border-border transition-all cursor-pointer hover:bg-primary/5 group",
                            isSameDay(day, new Date()) ? "bg-primary/5" : ""
                        )}
                    >
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1 group-hover:text-primary transition-colors">
                            {DAYS[i]}
                        </span>
                        <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all",
                            isSameDay(day, new Date()) 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" 
                                : "text-foreground group-hover:scale-105"
                        )}>
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Grid with ScrollArea */}
            <ScrollArea className="flex-1">
                <div className="grid grid-cols-[100px_repeat(7,1fr)] relative">
                    {/* Horizontal lines */}
                    {HOURS.map((hour) => (
                        <React.Fragment key={hour}>
                            {/* Hour Labels */}
                            <div className="h-32 border-r border-border flex items-start justify-center pt-4 sticky left-0 bg-background z-10 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                                <span className="text-[11px] font-black text-muted-foreground/60 tracking-tighter">
                                    {hour.toString().padStart(2, "0")}:00
                                </span>
                            </div>

                            {/* Day Slots */}
                            {weekDays.map((day, i) => {
                                // Find appointment for this day and hour (simple mock logic)
                                const hourStr = hour.toString().padStart(2, "0") + ":00";
                                const appt = MOCK_APPOINTMENTS.find(a => 
                                    isSameDay(a.date, day) && a.time === hourStr
                                );

                                return (
                                    <div 
                                        key={`${i}-${hour}`} 
                                        onClick={() => !appt && onAddAppointment(day, hourStr)}
                                        className="h-32 border-r border-b border-border/50 relative group transition-colors hover:bg-muted/5 cursor-pointer"
                                    >
                                        {appt ? (
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment(appt);
                                                }}
                                                className={cn(
                                                    "absolute inset-1 p-3 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between group/appt",
                                                    getStatusStyles(appt.status)
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black tracking-tight truncate leading-tight mb-1">
                                                            {appt.patient}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 opacity-70">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", getStatusIndicator(appt.status))} />
                                                            <span className="text-[9px] uppercase font-bold tracking-widest truncate">{appt.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center opacity-0 group-hover/appt:opacity-100 transition-opacity">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="h-5 w-5 rounded-lg bg-white/30 border border-white/20 flex items-center justify-center">
                                                                <FileText className="h-2.5 w-2.5 opacity-60" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-black tracking-tighter ml-auto opacity-50 uppercase tracking-widest">{appt.time}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-white transition-all shadow-lg hover:shadow-primary/30">
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
