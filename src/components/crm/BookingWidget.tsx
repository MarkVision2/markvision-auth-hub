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
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column: Doctor & Date */}
                <div className="space-y-6">
                    {/* Doctor Selection */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                            <User className="h-2.5 w-2.5" /> ВЫБЕРИТЕ ВРАЧА
                        </div>
                        <Select value={doctor} onValueChange={(v) => handleUpdate(v, undefined, "")}>
                            <SelectTrigger className="h-12 bg-background border-border rounded-xl shadow-sm hover:border-primary/50 transition-all">
                                <SelectValue placeholder="Выберите специалиста" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                                {doctors.map(d => (
                                    <SelectItem key={d.id} value={d.name} className="rounded-lg">
                                        <div className="flex flex-col items-start translate-y-[-2px]">
                                            <span className="font-bold text-sm">{d.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{d.specialty}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Calendar Section */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                            <Calendar className="h-2.5 w-2.5" /> ВЫБЕРИТЕ ДАТУ
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex justify-center">
                            <CalendarUI
                                mode="single"
                                selected={date}
                                onSelect={(d) => handleUpdate(doctor, d, "")}
                                disabled={isDayDisabled}
                                className="rounded-xl border-none p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Time Slots & Confirmation */}
                <div className="space-y-6">
                    <div className={cn("space-y-4 transition-opacity duration-300", !date && "opacity-40 pointer-events-none")}>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                            <Clock className="h-2.5 w-2.5" /> ДОСТУПНОЕ ВРЕМЯ
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleUpdate(doctor, date, t)}
                                    className={cn(
                                        "h-10 text-[11px] font-bold rounded-xl border transition-all duration-200",
                                        time === t
                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                                            : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {!date && (
                            <p className="text-[10px] text-muted-foreground text-center italic py-4">
                                Выберите дату на календаре слева
                            </p>
                        )}
                    </div>

                    {/* Confirmation Alert */}
                    {date && time && doctor && (
                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300 ring-1 ring-emerald-500/20">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                                <Check className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-foreground leading-tight">Записан к врачу: {doctor}</p>
                                <p className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                                    {format(date, "dd.MM.yyyy")} в {time}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
