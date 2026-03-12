import React, { useState } from "react";
import { PatientQueue } from "@/components/doctor/PatientQueue";
import { DiagnosticEngine } from "@/components/doctor/DiagnosticEngine";
import { Activity, Users, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/doctor";

const MOCK_PATIENTS: Patient[] = [
    {
        id: "1",
        name: "Иванов Иван Иванович",
        time: "14:00",
        type: "Первичный",
        complaint: "Острая боль в пояснице после поднятия тяжестей 2 дня назад. Боль иррадиирует в левую ногу до колена.",
        notes: "Пациент жалуется на сильную боль (8/10). Рекомендуется провести тест Ласега."
    },
    {
        id: "2",
        name: "Петрова Анна Сергеевна",
        time: "14:45",
        type: "Повторный",
        complaint: "Плановый осмотр после 3-го сеанса терапии. Динамика положительная.",
        notes: "Наблюдается увеличение амплитуды движений в шейном отделе на 15 градусов."
    },
    {
        id: "3",
        name: "Сидоров Алексей Петрович",
        time: "15:30",
        type: "Первичный",
        complaint: "Хронические головные боли, головокружение, шум в ушах.",
        notes: "Возможно нарушение кровообращения. Нужно проверить шейные позвонки."
    },
];

const DoctorTerminal = () => {
    const [activePatient, setActivePatient] = useState<Patient | null>(MOCK_PATIENTS[0]);
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans antialiased selection:bg-primary/20">
            {/* TOP NAVIGATION BAR - Slimmer & More Precise */}
            <header className="h-12 border-b border-border bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                            <Activity className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-tight leading-none uppercase text-foreground/90">
                                Terminal <span className="text-primary mx-0.5">/</span>
                                <span className="text-muted-foreground font-bold">Dr. Murat</span>
                            </span>
                            <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">Medical Dashboard v2.0</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.1em]">
                        <div className="flex items-center gap-1.5 bg-muted/30 border border-border/50 py-1 px-3 rounded-lg">
                            <Users className="w-2.5 h-2.5 text-primary" />
                            <span className="text-muted-foreground">Today: <span className="text-foreground">5 patients</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 border border-border/50 py-1 px-3 rounded-lg">
                            <TrendingUp className="w-2.5 h-2.5 text-[hsl(var(--status-good))]" />
                            <span className="text-muted-foreground">CR: <span className="text-[hsl(var(--status-good))]">60%</span></span>
                        </div>
                    </div>

                    <div className="w-px h-5 bg-border mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/")}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 h-8 rounded-lg px-2.5 transition-all text-xs font-bold border border-transparent hover:border-destructive/10"
                    >
                        <LogOut className="w-3 h-3" />
                        Exit
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT SPLIT SCREEN */}
            <main className="flex flex-1 overflow-hidden">
                {/* LEFT COLUMN (Patient Queue) - Fixed width, high density */}
                <aside className="w-[280px] lg:w-[300px] border-r border-border flex flex-col bg-card/30 backdrop-blur-xl z-20">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
                        <h2 className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em]">Workflow Queue</h2>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[7px] text-primary font-black uppercase tracking-tighter">Live Monitor</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrub-scrollbar custom-scrollbar">
                        <PatientQueue
                            patients={MOCK_PATIENTS}
                            activeId={activePatient?.id}
                            onSelect={setActivePatient}
                        />
                    </div>
                </aside>

                {/* RIGHT COLUMN (Diagnostic & Sales Engine) - Clean canvas */}
                <section className="flex-1 flex flex-col bg-background relative overflow-y-auto">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary-rgb),transparent_500px)] opacity-[0.03] pointer-events-none" />
                    {activePatient ? (
                        <DiagnosticEngine patient={activePatient} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-6">
                            <div className="h-24 w-24 rounded-[40px] bg-muted/30 border border-border flex items-center justify-center shadow-xl">
                                <Users className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-black tracking-tight text-foreground/50 uppercase">Waiting Area</p>
                                <p className="text-xs font-medium text-muted-foreground">Select a patient card to begin diagnosis</p>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DoctorTerminal;
