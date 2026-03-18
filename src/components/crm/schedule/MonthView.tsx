import React from "react";
import { cn } from "@/lib/utils";
import { 
    format, addDays, startOfMonth, endOfMonth, 
    startOfWeek, endOfWeek, isSameMonth, isSameDay 
} from "date-fns";
import { ru } from "date-fns/locale";

interface MonthViewProps {
    selectedDate: Date;
    doctorId: string;
    appointments: any[];
    onDateSelect: (date: Date) => void;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MonthView: React.FC<MonthViewProps> = ({
    selectedDate, doctorId, appointments, onDateSelect
}) => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays: Date[] = [];
    let currentDay = calendarStart;
    while (currentDay <= calendarEnd) {
        calendarDays.push(currentDay);
        currentDay = addDays(currentDay, 1);
    }

    return (
        <div className="flex flex-col h-full bg-background select-none animate-in fade-in duration-500">
            {/* Month Grid Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/5">
                {DAYS.map((day) => (
                    <div key={day} className="py-4 text-center">
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Month Grid Body */}
            <div className="flex-1 grid grid-cols-7 border-l border-border">
                {calendarDays.map((day, i) => (
                    <div 
                        key={i} 
                        onClick={() => onDateSelect(day)}
                        className={cn(
                            "min-h-[120px] p-4 border-r border-b border-border transition-all cursor-pointer relative group",
                            !isSameMonth(day, monthStart) ? "bg-muted/10" : "hover:bg-primary/5",
                            isSameDay(day, new Date()) ? "bg-primary/5" : ""
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <span className={cn(
                                "h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black transition-all",
                                isSameDay(day, new Date()) 
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                    : !isSameMonth(day, monthStart) 
                                        ? "text-muted-foreground/40" 
                                        : "text-foreground group-hover:bg-secondary/20"
                            )}>
                                {format(day, "d")}
                            </span>
                            
                            {/* Mock Data Indicator */}
                            {isSameMonth(day, monthStart) && day.getDate() % 3 === 0 && (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex -space-x-1.5">
                                        {[1, 2, 3].slice(0, (day.getDate() % 3) + 1).map(dot => (
                                            <div key={dot} className="h-2 w-2 rounded-full bg-primary border-2 border-background shadow-sm" />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black tracking-widest text-primary/60 uppercase">
                                        {(day.getDate() % 3) + 1} Записи
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-primary/20 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};
