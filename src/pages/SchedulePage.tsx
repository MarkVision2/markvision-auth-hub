import React, { useState, useEffect } from "react";
import { ScheduleHeader } from "@/components/crm/schedule/ScheduleHeader";
import { WeekView } from "@/components/crm/schedule/WeekView";
import { MonthView } from "@/components/crm/schedule/MonthView";
import { DayView } from "@/components/crm/schedule/DayView";
import { AppointmentModal } from "@/components/crm/schedule/AppointmentModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { loadTeam } from "@/pages/settings/types";
import DashboardLayout from "@/components/DashboardLayout";
import { useWorkspace } from "@/hooks/useWorkspace";

const SchedulePage = () => {
    const { user } = useAuth();
    const { isDoctor, isSuperadmin, isClientAdmin, isClientManager } = useRole();
    const { active } = useWorkspace();
    
    const [view, setView] = useState<"day" | "week" | "month">("week");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeAppointment, setActiveAppointment] = useState<any>(null);
    const [targetTime, setTargetTime] = useState<string | undefined>();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // If the user is a doctor, they should only see their own schedule by default
    useEffect(() => {
        if (isDoctor && user) {
            // In a real system, we'd use the doctor's name or ID from their profile
            // For now, we use the name from user_metadata or email as a fallback
            const name = (user.user_metadata?.full_name as string) || (user.email as string);
            if (name) {
                setSelectedDoctorId(name);
            }
        }
    }, [isDoctor, user]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("leads_crm" as any)
                .select("*")
                .not("scheduled_at", "is", null);

            if (error) throw error;

            const mapped = data.map((lead: any) => {
                const scheduledDate = new Date(lead.scheduled_at);
                return {
                    id: lead.id,
                    patient: lead.name,
                    phone: lead.phone,
                    date: scheduledDate,
                    time: scheduledDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
                    status: mapLeadStatusToAppt(lead.status),
                    type: "Консультация",
                    service: lead.ai_summary || "Первичный прием",
                    comment: lead.comments || "",
                    doctorId: lead.doctor_name || "all" // Use doctor_name for consistency
                };
            });

            setAppointments(mapped);
        } catch (err: any) {
            toast({ title: "Ошибка", description: "Не удалось загрузить записи: " + err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const mapLeadStatusToAppt = (status: string) => {
        if (status === "Записан на диагностику") return "planned";
        if (status === "Завершен") return "completed";
        if (status === "Не явился") return "no-show";
        return "planned";
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = selectedDoctorId === "all" 
        ? appointments 
        : appointments.filter(a => a.doctorId === selectedDoctorId);

    const handleSaveAppointment = async (data: any) => {
        setIsLoading(true);
        try {
            // Adjust the date for storage (combine date and time)
            const [hours, minutes] = data.time.split(":").map(Number);
            const scheduled_at = new Date(data.date);
            scheduled_at.setHours(hours, minutes, 0, 0);

            const payload: any = {
                name: data.patientName || "Без имени",
                phone: data.phone || "",
                status: data.status === "completed" ? "Завершен" : "Записан на диагностику",
                comments: data.comment || "",
                scheduled_at: scheduled_at.toISOString(),
                doctor_name: data.doctorName || selectedDoctorId,
                ai_summary: data.service || "Первичный прием",
                project_id: active?.id || "default"
            };

            if (activeAppointment?.id) {
                payload.id = activeAppointment.id;
            }

            const { error } = await supabase
                .from("leads_crm")
                .upsert(payload);

            if (error) throw error;

            toast({ title: "Успех", description: "Запись успешно сохранена" });
            fetchAppointments();
            setIsModalOpen(false);
        } catch (err: any) {
            toast({ title: "Ошибка", description: "Не удалось сохранить запись: " + err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout breadcrumb="Расписание" noPadding>
            <div className="flex flex-col h-full bg-background overflow-hidden relative">
                <ScheduleHeader 
                view={view} 
                onViewChange={setView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedDoctorId={selectedDoctorId}
                onDoctorChange={setSelectedDoctorId}
            />
            
            <div className="flex-1 overflow-hidden relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
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
                    </>
                )}

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
    </DashboardLayout>
    );
};

export default SchedulePage;
