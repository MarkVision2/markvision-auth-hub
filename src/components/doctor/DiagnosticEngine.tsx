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
        <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div className="space-y-3">
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">{patient.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                            {patient.type} прием
                        </Badge>
                        <span className="text-muted-foreground text-xs font-medium tabular-nums opacity-60">Запись на {patient.time}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-card border-border hover:bg-muted/50 gap-2 h-11 rounded-xl px-5 transition-all text-xs font-bold uppercase tracking-wider">
                        <Save className="w-4 h-4 text-primary" />
                        Сохранить
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/30 border border-border p-1 rounded-2xl mb-10 w-fit">
                    <TabsTrigger value="anamnesis" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                        <ClipboardList className="w-4 h-4" />
                        1. Анамнез
                    </TabsTrigger>
                    <TabsTrigger value="diagnosis" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                        <Stethoscope className="w-4 h-4" />
                        2. Диагностика
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="rounded-xl px-8 py-3 data-[state=active]:bg-[hsl(var(--status-good))] data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                        <Zap className="w-4 h-4" />
                        3. План и Продажа
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="anamnesis" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-card border-border shadow-sm hover:border-primary/10 transition-all overflow-hidden">
                            <div className="bg-primary/5 border-b border-border/50 p-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    Заметки регистратуры
                                </h3>
                            </div>
                            <CardContent className="p-6">
                                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 italic text-foreground/80 leading-relaxed text-sm">
                                    "{patient.notes}"
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm hover:border-primary/10 transition-all overflow-hidden">
                            <div className="bg-primary/5 border-b border-border/50 p-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Характерные симптомы</h3>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                    {symptoms.map((symptom) => (
                                        <div key={symptom} className="flex items-center space-x-3 group cursor-pointer">
                                            <Checkbox id={symptom} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md h-4 w-4 transition-all" />
                                            <Label htmlFor={symptom} className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer leading-none">
                                                {symptom}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card border-border shadow-sm overflow-hidden border-l-4 border-l-primary/30">
                        <CardContent className="p-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Жалобы пациента</h3>
                            <Textarea
                                placeholder="Опишите подробнее жалобы со слов пациента..."
                                defaultValue={patient.complaint}
                                className="bg-muted/20 border-border min-h-[150px] resize-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 transition-all rounded-2xl p-6 text-lg font-medium leading-relaxed"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setActiveTab("diagnosis")} className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 rounded-2xl text-lg font-bold gap-3 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]">
                            Перейти к диагностике
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="diagnosis" className="space-y-8 focus-visible:outline-none">
                    <Card className="bg-card border-border shadow-lg overflow-hidden border-t-4 border-t-primary/30">
                        <div className="bg-primary/5 p-5 border-b border-border/50">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Медицинское заключение
                            </h3>
                        </div>
                        <CardContent className="p-10 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Основной диагноз / Состояние</Label>
                                <Input
                                    placeholder="Введите код по МКБ-10 или описание..."
                                    className="bg-muted/20 border-border h-16 text-2xl font-black tracking-tight focus:ring-1 focus:ring-primary/20 rounded-2xl px-6"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Детализация диагноза, результаты осмотра, пальпации..."
                                    className="bg-muted/10 border-border min-h-[220px] resize-none focus:ring-1 focus:ring-primary/20 transition-all rounded-2xl p-8 text-lg leading-relaxed mt-4"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center pt-6">
                        <Button variant="ghost" onClick={() => setActiveTab("anamnesis")} className="text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-xs uppercase tracking-widest px-6 h-12 rounded-xl border border-transparent hover:border-border transition-all">
                            Назад к анамнезу
                        </Button>
                        <Button onClick={() => setActiveTab("sales")} className="bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] text-white px-10 py-7 rounded-2xl text-lg font-bold gap-3 shadow-xl shadow-[hsl(var(--status-good))/0.2] transition-all hover:translate-y-[-2px]">
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
