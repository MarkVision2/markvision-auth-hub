import React, { useState, useEffect } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar, User, Clock, Check } from "lucide-react";
import { loadTeam, TeamMember } from "@/pages/settings/types";
import { format, parse, addHours, isBefore } from "date-fns";

interface BookingWidgetProps {
    onBookingChange: (data: { date: Date; time: string; doctor: string }) => void;
    selectedDoctor?: string;
    selectedDate?: Date;
    selectedTime?: string;
}

const RU_DAYS_MAP: Record<string, number> = {
    "Вс": 0, "Пн": 1, "Вт": 2, "Ср": 3, "Чт": 4, "Пт": 5, "Сб": 6
};

export const BookingWidget: React.FC<BookingWidgetProps> = ({
    onBookingChange,
    selectedDoctor: initialDoctor,
    selectedDate: initialDate,
    selectedTime: initialTime
}) => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [doctor, setDoctor] = useState(initialDoctor || "");
    const [date, setDate] = useState<Date | undefined>(initialDate);
    const [time, setTime] = useState(initialTime || "");

    useEffect(() => {
        setTeam(loadTeam());
    }, []);

    const doctors = team.filter(m => m.role === "doctor");
    const selectedDoctorObj = doctors.find(d => d.name === doctor);

    // Helper to generate time slots from "09:00 - 18:00"
    const getTimeSlots = (hoursStr?: string) => {
        if (!hoursStr || !hoursStr.includes("-")) {
            return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
        }
        
        try {
            const [start, end] = hoursStr.split("-").map(s => s.trim());
            const slots: string[] = [];
            let current = parse(start, "HH:mm", new Date());
            const endTime = parse(end, "HH:mm", new Date());

            while (isBefore(current, endTime) || current.getTime() === endTime.getTime()) {
                slots.push(format(current, "HH:mm"));
                current = addHours(current, 1);
            }
            return slots;
        } catch (e) {
            return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
        }
    };

    const timeSlots = getTimeSlots(selectedDoctorObj?.workingHours);

    const handleUpdate = (newDoctor: string, newDate: Date | undefined, newTime: string) => {
        setDoctor(newDoctor);
        setDate(newDate);
        setTime(newTime);
        if (newDate && newTime && newDoctor) {
            onBookingChange({ date: newDate, time: newTime, doctor: newDoctor });
        }
    };

    // Filter for calendar days
    const isDayDisabled = (day: Date) => {
        if (!selectedDoctorObj?.workingDays?.length) return false;
        const dayOfWeek = day.getDay();
        const allowedDays = selectedDoctorObj.workingDays.map(d => RU_DAYS_MAP[d]);
        return !allowedDays.includes(dayOfWeek);
    };

    return (
        <div className="space-y-10 max-w-2xl mx-auto py-4">
            {/* Header & Doctor Selection */}
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] uppercase font-bold tracking-widest text-primary">
                    <User className="h-3 w-3" /> ВЫБЕРИТЕ ВРАЧА
                </div>
                <div className="max-w-md mx-auto">
                    <Select value={doctor} onValueChange={(v) => {
                        handleUpdate(v, undefined, "");
                    }}>
                        <SelectTrigger className="h-12 bg-background border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Выберите специалиста из списка" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            {doctors.map(d => (
                                <SelectItem key={d.id} value={d.name} className="rounded-lg">
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold">{d.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{d.specialty}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Calendar Section */}
            <div className={cn("space-y-4 flex flex-col items-center transition-opacity", !doctor && "opacity-50 pointer-events-none")}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] uppercase font-bold tracking-widest text-primary">
                    <Calendar className="h-3 w-3" /> ВЫБЕРИТЕ ДАТУ
                </div>
                <div className="inline-block p-4 rounded-3xl bg-card border border-border shadow-xl shadow-primary/5">
                    <CalendarUI
                        mode="single"
                        selected={date}
                        onSelect={(d) => handleUpdate(doctor, d, "")}
                        disabled={isDayDisabled}
                        className="rounded-xl border-none p-0"
                    />
                </div>
            </div>

            {/* Time Slots Section */}
            <div className={cn("space-y-4 text-center transition-opacity", !date && "opacity-50 pointer-events-none")}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] uppercase font-bold tracking-widest text-primary">
                    <Clock className="h-3 w-3" /> ДОСТУПНОЕ ВРЕМЯ
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-xl mx-auto">
                    {timeSlots.map(t => (
                        <button
                            key={t}
                            onClick={() => handleUpdate(doctor, date, t)}
                            className={cn(
                                "h-12 text-sm font-bold rounded-xl border transition-all duration-200",
                                time === t
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Confirmation Alert */}
            {date && time && doctor && (
                <div className="p-6 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                        <Check className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground leading-tight">Запись подтверждена</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-600 font-bold">{doctor}</span> • {format(date, "dd.MM.yyyy")} в <span className="text-emerald-600 font-bold">{time}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
