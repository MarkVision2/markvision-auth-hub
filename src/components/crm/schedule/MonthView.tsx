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
        <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] select-none animate-in fade-in duration-500">
            {/* Month Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                {DAYS.map((day) => (
                    <div key={day} className="py-4 text-center border-r border-slate-200 dark:border-zinc-800 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-500 dark:text-zinc-500">
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Month Grid Body */}
            <div className="flex-1 grid grid-cols-7">
                {calendarDays.map((day, i) => (
                    <div 
                        key={i} 
                        onClick={() => onDateSelect(day)}
                        className={cn(
                            "min-h-[120px] p-4 border-r border-b border-slate-200 dark:border-zinc-800 transition-all cursor-pointer relative group",
                            !isSameMonth(day, monthStart) ? "bg-slate-50/50 dark:bg-zinc-900/30" : "bg-white dark:bg-[#0a0a0a] hover:bg-slate-50 dark:hover:bg-zinc-900"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <span className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                isSameDay(day, new Date()) 
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                                    : !isSameMonth(day, monthStart) 
                                        ? "text-slate-400 dark:text-zinc-600" 
                                        : "text-slate-800 dark:text-zinc-200 group-hover:bg-slate-200 dark:group-hover:bg-zinc-800"
                            )}>
                                {format(day, "d")}
                            </span>
                            
                            {/* Mock Data Indicator */}
                            {isSameMonth(day, monthStart) && day.getDate() % 3 === 0 && (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex -space-x-1.5">
                                        {[1, 2, 3].slice(0, (day.getDate() % 3) + 1).map(dot => (
                                            <div key={dot} className="h-2 w-2 rounded-full bg-blue-500 border-2 border-white dark:border-[#0a0a0a] shadow-sm" />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-bold tracking-wider text-blue-500/80 uppercase">
                                        {(day.getDate() % 3) + 1} Записи
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-blue-500/20 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};
