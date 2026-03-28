import React, { useState, useEffect } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar, User, Clock, Check, Loader2, DoorOpen } from "lucide-react";
import { loadTeam, TeamMember } from "@/pages/settings/types";
import { format, parse, addHours, isBefore, startOfDay, endOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface BookingWidgetProps {
    onBookingChange: (data: { date: Date; time: string; doctor: string; cabinet: string }) => void;
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
    const [cabinet, setCabinet] = useState("");
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        setTeam(loadTeam());
    }, []);

    // Fetch booked slots when doctor or date changes
    useEffect(() => {
        const fetchBookedSlots = async () => {
            if (!doctor || !date) {
                setBookedSlots([]);
                return;
            }

            setIsLoadingSlots(true);
            try {
                const dayStart = startOfDay(date).toISOString();
                const dayEnd = endOfDay(date).toISOString();

                const { data, error } = await (supabase as any)
                    .from("leads_crm")
                    .select("scheduled_at")
                    .eq("doctor_name", doctor)
                    .gte("scheduled_at", dayStart)
                    .lte("scheduled_at", dayEnd);

                if (error) throw error;

                if (data) {
                    const booked = (data as any[])
                        .filter(item => item.scheduled_at)
                        .map(item => format(new Date(item.scheduled_at), "HH:mm"));
                    setBookedSlots(booked);
                }
            } catch (err) {
                console.error("Error fetching booked slots:", err);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchBookedSlots();
    }, [doctor, date]);

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

    const allSlots = getTimeSlots(selectedDoctorObj?.workingHours);
    // Filter out already booked slots
    const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

    const handleUpdate = (newDoctor: string, newDate: Date | undefined, newTime: string, newCabinet?: string) => {
        setDoctor(newDoctor);
        setDate(newDate);
        setTime(newTime);
        const cab = newCabinet ?? cabinet;
        if (newCabinet !== undefined) setCabinet(cab);
        if (newDate && newTime && newDoctor) {
            onBookingChange({ date: newDate, time: newTime, doctor: newDoctor, cabinet: cab });
        }
    };

    // Auto-populate cabinet when doctor changes
    const handleDoctorChange = (newDoctor: string) => {
        const doc = doctors.find(d => d.name === newDoctor);
        const docCabinet = doc?.office || "";
        setCabinet(docCabinet);
        handleUpdate(newDoctor, date, "", docCabinet);
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column: Doctor & Date */}
                <div className="space-y-6">
                    {/* Doctor Selection */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                            <User className="h-2.5 w-2.5" /> ВЫБЕРИТЕ ВРАЧА
                        </div>
                        <Select value={doctor} onValueChange={handleDoctorChange}>
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

                        {/* Cabinet field */}
                        {doctor && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                    <DoorOpen className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={cabinet}
                                        onChange={(e) => { setCabinet(e.target.value); if (date && time && doctor) onBookingChange({ date, time, doctor, cabinet: e.target.value }); }}
                                        placeholder="Кабинет №"
                                        className="w-full h-9 px-3 text-xs font-bold bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/40"
                                    />
                                </div>
                            </div>
                        )}
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
                                locale={ru}
                                className="rounded-xl border-none p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Time Slots & Confirmation */}
                <div className="space-y-6">
                    <div className={cn("space-y-4 transition-opacity duration-300", !date && "opacity-40 pointer-events-none")}>
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                                <Clock className="h-2.5 w-2.5" /> ДОСТУПНОЕ ВРЕМЯ
                            </div>
                            {isLoadingSlots && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.length > 0 ? (
                                availableSlots.map(t => (
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
                                ))
                            ) : date ? (
                                <div className="col-span-3 py-8 text-center bg-secondary/10 rounded-2xl border border-dashed border-border/60">
                                    <p className="text-[11px] text-muted-foreground font-medium italic">
                                        Нет свободного времени на эту дату
                                    </p>
                                </div>
                            ) : null}
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
                                <p className="text-xs font-bold text-foreground leading-tight">Записан к врачу: {doctor}{cabinet ? ` · Каб. ${cabinet}` : ""}</p>
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
