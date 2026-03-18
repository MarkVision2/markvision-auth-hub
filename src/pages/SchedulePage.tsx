import React, { useState } from "react";
import { ScheduleHeader } from "@/components/crm/schedule/ScheduleHeader";
import { WeekView } from "@/components/crm/schedule/WeekView";
import { MonthView } from "@/components/crm/schedule/MonthView";
import { DayView } from "@/components/crm/schedule/DayView";
import { AppointmentModal } from "@/components/crm/schedule/AppointmentModal";

const SchedulePage = () => {
    const [view, setView] = useState<"day" | "week" | "month">("week");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all"); // Default to All doctors for admin view
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeAppointment, setActiveAppointment] = useState<any>(null);
    const [targetTime, setTargetTime] = useState<string | undefined>();

    const [appointments, setAppointments] = useState<any[]>([
        { 
            id: "1", patient: "Алексей Павлов", time: "09:00", date: new Date(), 
            status: "planned", type: "Первичный", phone: "+7 777 123 45 67", 
            service: "Консультация терапевта", comment: "Боли в спине", doctorId: "1"
        },
        { 
            id: "2", patient: "Мадина Сулейменова", time: "11:30", date: new Date(), 
            status: "completed", type: "Повторный", phone: "+7 701 987 65 43",
            service: "Курс реабилитации", comment: "Плановый осмотр", doctorId: "2"
        },
    ]);

    const filteredAppointments = selectedDoctorId === "all" 
        ? appointments 
        : appointments.filter(a => a.doctorId === selectedDoctorId);

    const handleSaveAppointment = (data: any) => {
        if (activeAppointment) {
            // Update existing
            setAppointments(prev => prev.map(a => a.id === activeAppointment.id ? { ...a, ...data } : a));
        } else {
            // Create new
            const newAppt = {
                id: Math.random().toString(36).substr(2, 9),
                patient: data.patientName || "Новый пациент",
                time: data.time,
                date: data.date,
                status: data.status,
                type: "Первичный",
                phone: data.phone,
                service: data.service,
                comment: data.comment,
                doctorId: selectedDoctorId === "all" ? "1" : selectedDoctorId
            };
            setAppointments(prev => [...prev, newAppt]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden">
            <ScheduleHeader 
                view={view} 
                onViewChange={setView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedDoctorId={selectedDoctorId}
                onDoctorChange={setSelectedDoctorId}
            />
            
            <div className="flex-1 overflow-hidden relative">
                {view === "day" && <DayView 
                    selectedDate={selectedDate} 
                    doctorId={selectedDoctorId} 
                    appointments={filteredAppointments}
                    onAddAppointment={(time) => {
                        setTargetTime(time);
                        setActiveAppointment(null);
                        setIsModalOpen(true);
                    }}
                    onEditAppointment={(appt) => {
                        setActiveAppointment(appt);
                        setIsModalOpen(true);
                    }}
                />}
                {view === "week" && <WeekView 
                    selectedDate={selectedDate} 
                    doctorId={selectedDoctorId} 
                    appointments={filteredAppointments}
                    onDateSelect={setSelectedDate} 
                    onViewChange={setView} 
                    onAddAppointment={(date, time) => {
                        setSelectedDate(date);
                        setTargetTime(time);
                        setActiveAppointment(null);
                        setIsModalOpen(true);
                    }}
                    onEditAppointment={(appt) => {
                        setActiveAppointment(appt);
                        setIsModalOpen(true);
                    }}
                />}
                {view === "month" && <MonthView 
                    selectedDate={selectedDate} 
                    doctorId={selectedDoctorId} 
                    appointments={filteredAppointments}
                    onDateSelect={(date) => {
                        setSelectedDate(date);
                        setView("week");
                    }} 
                />}

                <AppointmentModal 
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    appointment={activeAppointment}
                    selectedDate={selectedDate}
                    selectedTime={targetTime}
                    onSave={(data) => {
                        handleSaveAppointment(data);
                    }}
                />
            </div>
        </div>
    );
};

export default SchedulePage;
