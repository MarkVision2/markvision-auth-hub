import React from "react";
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    User, LayoutGrid, LayoutList, CalendarDays,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";

interface ScheduleHeaderProps {
    view: "day" | "week" | "month";
    onViewChange: (view: "day" | "week" | "month") => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    selectedDoctorId: string;
    onDoctorChange: (id: string) => void;
}

const MOCK_DOCTORS = [
    { id: "1", name: "Иванов Иван Иванович", specialty: "Терапевт" },
    { id: "2", name: "Петров Петр Петрович", specialty: "Реабилитолог" },
    { id: "3", name: "Сидорова Анна Сергеевна", specialty: "Невролог" },
];

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    view, onViewChange,
    selectedDate, onDateChange,
    selectedDoctorId, onDoctorChange
}) => {
    const handlePrev = () => {
        const newDate = new Date(selectedDate);
        if (view === "day") newDate.setDate(selectedDate.getDate() - 1);
        else if (view === "week") newDate.setDate(selectedDate.getDate() - 7);
        else if (view === "month") newDate.setMonth(selectedDate.getMonth() - 1);
        onDateChange(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(selectedDate);
        if (view === "day") newDate.setDate(selectedDate.getDate() + 1);
        else if (view === "week") newDate.setDate(selectedDate.getDate() + 7);
        else if (view === "month") newDate.setMonth(selectedDate.getMonth() + 1);
        onDateChange(newDate);
    };

    const dateLabel = () => {
        if (view === "day") return format(selectedDate, "d MMMM yyyy", { locale: ru });
        if (view === "month") return format(selectedDate, "LLLL yyyy", { locale: ru });
        
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        
        if (start.getMonth() === end.getMonth()) {
            return `${format(start, "d", { locale: ru })} - ${format(end, "d MMMM yyyy", { locale: ru })}`;
        }
        return `${format(start, "d MMM", { locale: ru })} - ${format(end, "d MMM yyyy", { locale: ru })}`;
    };

    return (
        <div className="px-6 md:px-10 py-4 border-b border-border/40 bg-background/80 backdrop-blur-3xl sticky top-0 z-40 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left Side: Doctor Selector & View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    
                    {/* Doctor Selector */}
                    <div className="w-full sm:w-[320px]">
                        <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-primary/20 font-medium transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/80">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <SelectValue placeholder="Выберите врача" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/50 shadow-2xl p-1 bg-background/95 backdrop-blur-xl">
                                {MOCK_DOCTORS.map(doc => {
                                    const isSelected = doc.id === selectedDoctorId;
                                    return (
                                        <SelectItem 
                                            key={doc.id} 
                                            value={doc.id} 
                                            className={cn(
                                                "rounded-xl py-3 px-3 mx-1 my-1 cursor-pointer transition-colors",
                                                isSelected ? "bg-primary/10" : "hover:bg-accent focus:bg-accent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                                    isSelected ? "bg-primary" : "bg-slate-300 dark:bg-zinc-700"
                                                )}>
                                                    {doc.name.split(" ").map(n => n[0]).join("").substring(0,2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm tracking-tight">{doc.name}</span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">{doc.specialty}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Controls (iOS Segmented Style) */}
                    <div className="flex items-center bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl relative shadow-inner border border-black/5 dark:border-white/5">
                        {[
                            { id: "day", label: "День", icon: LayoutList },
                            { id: "week", label: "Неделя", icon: LayoutGrid },
                            { id: "month", label: "Месяц", icon: CalendarDays },
                        ].map((v) => {
                            const isActive = view === v.id;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => onViewChange(v.id as any)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 z-10 w-28 justify-center",
                                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] -z-10" />
                                    )}
                                    <v.icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground/60")} />
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Date Nav & Today Button */}
                <div className="flex items-center gap-4">
                    
                    {/* Date Navigator */}
                    <div className="flex items-center bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-200 dark:border-zinc-800">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handlePrev} 
                            className="h-9 w-9 rounded-[12px] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="h-9 px-4 rounded-[12px] hover:bg-slate-100 dark:hover:bg-zinc-800 gap-2.5 text-sm font-semibold text-foreground/90 capitalize mx-1 transition-colors"
                                >
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    {dateLabel()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-border/40 shadow-[0_10px_40px_rgba(0,0,0,0.12)] bg-background/95 backdrop-blur-2xl" align="end">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(d) => d && onDateChange(d)}
                                    initialFocus
                                    locale={ru}
                                    className="p-3"
                                />
                            </PopoverContent>
                        </Popover>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleNext} 
                            className="h-9 w-9 rounded-[12px] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Today Button */}
                    <Button 
                        onClick={() => onDateChange(new Date())}
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-primary transition-all shrink-0"
                    >
                        Сегодня
                    </Button>
                </div>
            </div>
        </div>
    );
};
