import React, { useState } from "react";
import { Patient } from "@/pages/DoctorTerminal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesPresentation } from "./SalesPresentation";
import { Stethoscope, ClipboardList, Zap, ArrowRight, Save } from "lucide-react";

interface DiagnosticEngineProps {
    patient: Patient;
}

export const DiagnosticEngine: React.FC<DiagnosticEngineProps> = ({ patient }) => {
    const [activeTab, setActiveTab] = useState("anamnesis");
    const [diagnosis, setDiagnosis] = useState("");

    const symptoms = [
        "Острый болевой синдром",
        "Ограничение подвижности",
        "Онемение конечностей",
        "Мышечная слабость",
        "Головные боли",
        "Нарушение сна",
        "Головокружение",
        "Шум в ушах"
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{patient.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-none px-3 py-1">
                            {patient.type} прием
                        </Badge>
                        <span className="text-white/30 text-sm italic">Запись на {patient.time}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 gap-2">
                        <Save className="w-4 h-4" />
                        Сохранить черновик
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-8 w-fit">
                    <TabsTrigger value="anamnesis" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
                        <ClipboardList className="w-4 h-4" />
                        1. Анамнез
                    </TabsTrigger>
                    <TabsTrigger value="diagnosis" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
                        <Stethoscope className="w-4 h-4" />
                        2. Диагностика
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2">
                        <Zap className="w-4 h-4" />
                        3. План и Продажа
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="anamnesis" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-[#121218]/80 border-white/5 shadow-2xl backdrop-blur-md">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    Заметки регистратуры
                                </h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 italic text-white/60 leading-relaxed">
                                    "{patient.notes}"
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#121218]/80 border-white/5 shadow-2xl backdrop-blur-md">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4 text-emerald-400">Характерные симптомы</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {symptoms.map((symptom) => (
                                        <div key={symptom} className="flex items-center space-x-3 group cursor-pointer">
                                            <Checkbox id={symptom} className="border-white/20 data-[state=checked]:bg-blue-500 rounded-md" />
                                            <Label htmlFor={symptom} className="text-sm text-white/60 group-hover:text-white transition-colors cursor-pointer">
                                                {symptom}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-[#121218]/80 border-white/5 shadow-2xl backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Жалобы пациента</h3>
                            <Textarea
                                placeholder="Опишите подробнее жалобы со слов пациента..."
                                defaultValue={patient.complaint}
                                className="bg-white/[0.03] border-white/10 min-h-[150px] resize-none focus:border-blue-500/50 transition-all rounded-xl p-4 text-lg"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => setActiveTab("diagnosis")} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-2xl text-lg gap-2 shadow-lg shadow-blue-600/20">
                            Перейти к диагностике
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="diagnosis" className="space-y-6 focus-visible:outline-none">
                    <Card className="bg-[#121218]/80 border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
                        <div className="bg-blue-600/10 p-4 border-b border-blue-500/20">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest px-2">Медицинское заключение</h3>
                        </div>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <Label className="text-lg text-white/50">Основной диагноз / Состояние</Label>
                                <Input
                                    placeholder="Введите код по МКБ-10 или описание..."
                                    className="bg-white/5 border-white/10 h-16 text-2xl font-bold focus:border-blue-500/50 rounded-xl"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Детализация диагноза, результаты осмотра, пальпации..."
                                    className="bg-white/[0.03] border-white/10 min-h-[200px] resize-none focus:border-blue-500/50 transition-all rounded-xl p-6 text-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setActiveTab("anamnesis")} className="text-white/40 hover:text-white">Назад</Button>
                        <Button onClick={() => setActiveTab("sales")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 rounded-2xl text-lg gap-2 shadow-lg shadow-emerald-600/20">
                            Сформировать план лечения
                            <Zap className="w-5 h-5 fill-current" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="sales" className="focus-visible:outline-none">
                    <SalesPresentation patient={patient} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
