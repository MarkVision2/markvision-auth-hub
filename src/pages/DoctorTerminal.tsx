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
        <div className="flex flex-col h-screen bg-[#0a0a0c] text-white overflow-hidden font-sans">
            {/* TOP NAVIGATION BAR */}
            <header className="h-16 border-b border-white/5 bg-[#0d0d10] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Terminal <span className="text-blue-500">|</span> Dr. Murat</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <span>Сегодня: <span className="font-semibold">5 пациентов</span></span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <span>Конверсия: <span className="font-semibold text-emerald-400">60%</span></span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/")}
                        className="text-white/40 hover:text-white hover:bg-white/5 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Выход
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT SPLIT SCREEN */}
            <main className="flex flex-1 overflow-hidden">
                {/* LEFT COLUMN (Patient Queue) */}
                <aside className="w-[30%] border-r border-white/5 flex flex-col bg-[#0d0d10]/50 backdrop-blur-sm shadow-2xl z-10">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Очередь приема</h2>
                        <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400 uppercase">Live</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <PatientQueue
                            patients={MOCK_PATIENTS}
                            activeId={activePatient?.id}
                            onSelect={setActivePatient}
                        />
                    </div>
                </aside>

                {/* RIGHT COLUMN (Diagnostic & Sales Engine) */}
                <section className="flex-1 flex flex-col bg-gradient-to-br from-[#0a0a0c] to-[#121218] overflow-y-auto">
                    {activePatient ? (
                        <DiagnosticEngine patient={activePatient} />
                    ) : (
                        <div className="flex-1 flex flex-center justify-center items-center opacity-20 flex-col gap-4">
                            <Users className="w-16 h-16" />
                            <p className="text-xl font-medium">Выберите пациента для начала работы</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DoctorTerminal;
