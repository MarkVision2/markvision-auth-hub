import React, { useState } from "react";
import { ScheduleHeader } from "@/components/crm/schedule/ScheduleHeader";
import { WeekView } from "@/components/crm/schedule/WeekView";
import { MonthView } from "@/components/crm/schedule/MonthView";
import { DayView } from "@/components/crm/schedule/DayView";
import { AppointmentModal } from "@/components/crm/schedule/AppointmentModal";

const SchedulePage = () => {
    const [view, setView] = useState<"day" | "week" | "month">("week");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("1"); // Default to first mock doctor
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeAppointment, setActiveAppointment] = useState<any>(null);
    const [targetTime, setTargetTime] = useState<string | undefined>();

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
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
                        console.log("Saving appointment:", data);
                        // Here we would implement the logic to save to Supabase/state
                    }}
                />
            </div>
        </div>
    );
};

export default SchedulePage;
