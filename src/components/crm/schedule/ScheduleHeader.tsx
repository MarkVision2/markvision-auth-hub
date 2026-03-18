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
import { format } from "date-fns";
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
        
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
    };

    return (
        <div className="px-8 py-5 border-b border-border bg-background shrink-0 z-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    <div className="w-full sm:w-72">
                        <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
                            <SelectTrigger className="h-12 rounded-2xl bg-secondary/10 border-none shadow-none focus:ring-1 focus:ring-primary font-bold transition-all hover:bg-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <SelectValue placeholder="Выберите врача" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-background/95 backdrop-blur-xl">
                                {MOCK_DOCTORS.map(doc => (
                                    <SelectItem key={doc.id} value={doc.id} className="rounded-xl py-3 focus:bg-primary/10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{doc.name}</span>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{doc.specialty}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center bg-secondary/10 p-1 rounded-2xl">
                        {[
                            { id: "day", label: "День", icon: LayoutList },
                            { id: "week", label: "Неделя", icon: LayoutGrid },
                            { id: "month", label: "Месяц", icon: CalendarDays },
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => onViewChange(v.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    view === v.id 
                                        ? "bg-background text-primary shadow-sm scale-[1.02]" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <v.icon className={cn("h-3.5 w-3.5", view === v.id ? "text-primary" : "text-muted-foreground/50")} />
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-secondary/10 rounded-2xl p-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9 rounded-xl hover:bg-background">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-9 px-4 rounded-xl hover:bg-background gap-2 text-sm font-bold capitalize">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                    {dateLabel()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl bg-background" align="end">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(d) => d && onDateChange(d)}
                                    initialFocus
                                    locale={ru}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9 rounded-xl hover:bg-background">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button 
                        onClick={() => onDateChange(new Date())}
                        variant="outline" 
                        className="h-11 px-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-border hover:bg-secondary/10 shrink-0"
                    >
                        Сегодня
                    </Button>
                </div>
            </div>
        </div>
    );
};
