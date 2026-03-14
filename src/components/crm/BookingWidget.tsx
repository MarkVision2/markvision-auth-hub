import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar, User, Clock, Check } from "lucide-react";

interface BookingWidgetProps {
    onBookingChange: (data: { date: Date; time: string; doctor: string }) => void;
    selectedDoctor?: string;
    selectedDate?: Date;
    selectedTime?: string;
}

const DOCTORS = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Смирнова А.В."];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const BookingWidget: React.FC<BookingWidgetProps> = ({
    onBookingChange,
    selectedDoctor: initialDoctor,
    selectedDate: initialDate,
    selectedTime: initialTime
}) => {
    const [doctor, setDoctor] = useState(initialDoctor || "");
    const [date, setDate] = useState<Date | undefined>(initialDate);
    const [time, setTime] = useState(initialTime || "");

    const handleUpdate = (newDoctor: string, newDate: Date | undefined, newTime: string) => {
        setDoctor(newDoctor);
        setDate(newDate);
        setTime(newTime);
        if (newDate && newTime && newDoctor) {
            onBookingChange({ date: newDate, time: newTime, doctor: newDoctor });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="h-3 w-3" /> Выберите врача
                    </label>
                    <Select value={doctor} onValueChange={(v) => handleUpdate(v, date, time)}>
                        <SelectTrigger className="h-11 bg-secondary/20 border-border">
                            <SelectValue placeholder="Выберите врача" />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCTORS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Выберите дату
                    </label>
                    <div className="border border-border rounded-xl p-3 bg-secondary/10">
                        <CalendarUI
                            mode="single"
                            selected={date}
                            onSelect={(d) => handleUpdate(doctor, d, time)}
                            className="rounded-md"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Доступное время
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(t => (
                        <button
                            key={t}
                            onClick={() => handleUpdate(doctor, date, t)}
                            className={cn(
                                "h-10 text-xs font-medium rounded-lg border transition-all",
                                time === t
                                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                                    : "bg-secondary/10 border-border hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {date && time && doctor && (
                <div className="p-4 rounded-xl bg-[hsl(var(--status-good))/0.1] border border-[hsl(var(--status-good))/0.2] flex items-center gap-3 animate-in fade-in zoom-in-95">
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--status-good))] flex items-center justify-center text-white shrink-0">
                        <Check className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        Запись к <span className="text-[hsl(var(--status-good))] font-bold">{doctor}</span> на <span className="text-[hsl(var(--status-good))] font-bold">{date.toLocaleDateString("ru-RU")}</span> в <span className="text-[hsl(var(--status-good))] font-bold">{time}</span> выбрана.
                    </p>
                </div>
            )}
        </div>
    );
};
