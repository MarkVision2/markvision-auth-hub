import React, { useState } from "react";
import { PatientQueue } from "@/components/doctor/PatientQueue";
import { DiagnosticEngine } from "@/components/doctor/DiagnosticEngine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface Patient {
    id: string;
    name: string;
    time: string;
    type: 'Первичный' | 'Повторный';
    complaint?: string;
    notes?: string;
}

const MOCK_PATIENTS: Patient[] = [
    {
        id: "1",
        name: "Иванов Иван Иванович",
        time: "14:00",
        type: "Первичный",
        complaint: "Боль в пояснице, отдает в левую ногу уже 2 недели.",
        notes: "Пациент жалуется на дискомфорт при длительном сидении. Настроен на комплексное обследование."
    },
    {
        id: "2",
        name: "Петрова Анна Сергеевна",
        time: "14:45",
        type: "Повторный",
        complaint: "Контроль после курса физиотерапии.",
        notes: "Наблюдается положительная динамика. Нужно скорректировать план упражнений."
    },
    {
        id: "3",
        name: "Сидоров Алексей Петрович",
        time: "15:30",
        type: "Первичный",
        complaint: "Онемение пальцев правой руки.",
        notes: "Связывает с профессиональной деятельностью (ИТ). Рекомендовано МРТ шейного отдела."
    },
];

const DoctorTerminal = () => {
    const [activePatient, setActivePatient] = useState<Patient | null>(MOCK_PATIENTS[0]);
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* TOP NAVIGATION BAR */}
            <header className="h-16 border-b border-border glass flex items-center justify-between px-6 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Terminal <span className="text-primary/40">|</span>
                            <span className="ml-1.5 font-medium opacity-80">Dr. Murat</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider font-bold">
                        <div className="flex items-center gap-2.5 bg-card border border-border py-2 px-4 rounded-xl shadow-sm">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">Сегодня: <span className="text-foreground">5 пациентов</span></span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-card border border-border py-2 px-4 rounded-xl shadow-sm">
                            <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--status-good))]" />
                            <span className="text-muted-foreground">Конверсия: <span className="text-[hsl(var(--status-good))]">60%</span></span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/")}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-10 rounded-xl px-4 border border-transparent hover:border-border transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Выход
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT SPLIT SCREEN */}
            <main className="flex flex-1 overflow-hidden">
                {/* LEFT COLUMN (Patient Queue) */}
                <aside className="w-[320px] lg:w-[380px] border-r border-border flex flex-col bg-card/50 backdrop-blur-md z-20">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Очередь приема</h2>
                        <Badge variant="outline" className="text-[9px] border-primary/30 bg-primary/5 text-primary uppercase font-black px-2 py-0.5">Live</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto scrub-scrollbar">
                        <PatientQueue
                            patients={MOCK_PATIENTS}
                            activeId={activePatient?.id}
                            onSelect={setActivePatient}
                        />
                    </div>
                </aside>

                {/* RIGHT COLUMN (Diagnostic & Sales Engine) */}
                <section className="flex-1 flex flex-col bg-background/50 overflow-y-auto">
                    {activePatient ? (
                        <DiagnosticEngine patient={activePatient} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                            <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                                <Users className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="text-xl font-bold tracking-tight text-muted-foreground">Выберите пациента для начала работы</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DoctorTerminal;
