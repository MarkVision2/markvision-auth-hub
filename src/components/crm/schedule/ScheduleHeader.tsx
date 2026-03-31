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
import { loadTeam, fetchTeamMembers, TeamMember } from "@/pages/settings/types";
import { useState, useEffect } from "react";

interface ScheduleHeaderProps {
    view: "day" | "week" | "month";
    onViewChange: (view: "day" | "week" | "month") => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    selectedDoctorId: string;
    onDoctorChange: (id: string) => void;
    hideDoctorSelector?: boolean;
}

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    view, onViewChange,
    selectedDate, onDateChange,
    selectedDoctorId, onDoctorChange,
    hideDoctorSelector = false
}) => {
    const [doctors, setDoctors] = useState<{ id: string; name: string; specialty: string }[]>([
        { id: "all", name: "Все врачи", specialty: "Медицинский центр" }
    ]);

    useEffect(() => {
        async function init() {
            const team = await fetchTeamMembers();
            const filtered = team
                .filter(m => m.role === "doctor")
                .map(m => ({
                    id: m.name,
                    name: m.name,
                    specialty: m.specialty || "Врач"
                }));
            setDoctors([{ id: "all", name: "Все врачи", specialty: "Медицинский центр" }, ...filtered]);
        }
        init();
    }, []);

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
        <div className="px-5 py-3 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Left: View Controls */}
                <div className="flex items-center gap-4">
                    {!hideDoctorSelector && (
                        <div className="w-[200px] mr-2">
                            <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
                                <SelectTrigger className="h-9 rounded-xl bg-secondary/50 border-border shadow-none text-xs font-semibold">
                                    <SelectValue placeholder="Врач" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 shadow-2xl p-1 bg-background/95 backdrop-blur-xl">
                                    {doctors.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id} className="rounded-lg text-xs">
                                            {doc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex bg-secondary/40 p-1 rounded-xl border border-white/5">
                        {[
                            { id: "week", label: "НЕДЕЛЯ" },
                            { id: "month", label: "МЕСЯЦ" },
                        ].map((v) => {
                            const isActive = view === v.id;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => onViewChange(v.id as any)}
                                    className={cn(
                                        "relative flex items-center justify-center px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all duration-300 min-w-[90px]",
                                        isActive ? "text-primary bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Center: Date Navigation */}
                <div className="flex items-center bg-secondary/30 rounded-xl p-1 border border-border/40">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handlePrev} 
                        className="h-8 w-8 rounded-lg hover:bg-background text-muted-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 px-4 rounded-lg hover:bg-background gap-2 text-xs font-bold text-foreground/80 capitalize transition-colors"
                            >
                                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                {dateLabel()}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl" align="center">
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
                        className="h-8 w-8 rounded-lg hover:bg-background text-muted-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Right: Today Button */}
                <Button 
                    onClick={() => onDateChange(new Date())}
                    variant="outline" 
                    className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] border-border bg-background shadow-sm hover:text-primary transition-all"
                >
                    СЕГОДНЯ
                </Button>
            </div>
        </div>
    );
};
