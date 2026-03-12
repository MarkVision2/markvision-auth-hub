import React, { useState } from "react";
import { Patient } from "@/types/doctor";
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
        <div className="p-4 lg:p-6 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-black tracking-tight text-foreground">{patient.name}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-2 py-0 h-4 font-bold text-[8px] uppercase tracking-widest">
                            {patient.type} прием
                        </Badge>
                        <span className="text-muted-foreground text-[10px] font-medium tabular-nums opacity-60">Запись на {patient.time}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-card border-border hover:bg-muted/50 gap-1.5 h-8 rounded-lg px-3 transition-all text-[10px] font-bold uppercase tracking-wider">
                        <Save className="w-3 h-3 text-primary" />
                        Сохранить
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/30 border border-border p-0.5 rounded-xl mb-6 w-fit">
                    <TabsTrigger value="anamnesis" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all">
                        <ClipboardList className="w-3.5 h-3.5" />
                        1. Анамнез
                    </TabsTrigger>
                    <TabsTrigger value="diagnosis" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all">
                        <Stethoscope className="w-3.5 h-3.5" />
                        2. Диагностика
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="rounded-lg px-4 py-2 data-[state=active]:bg-[hsl(var(--status-good))] data-[state=active]:text-white data-[state=active]:shadow-md gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all">
                        <Zap className="w-3.5 h-3.5" />
                        3. План и Продажа
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="anamnesis" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card border-border shadow-sm hover:border-primary/10 transition-all overflow-hidden">
                            <div className="bg-primary/5 border-b border-border/50 p-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <ClipboardList className="w-3 h-3" />
                                    Заметки регистратуры
                                </h3>
                            </div>
                            <CardContent className="p-4">
                                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 italic text-foreground/80 leading-relaxed text-xs">
                                    "{patient.notes}"
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm hover:border-primary/10 transition-all overflow-hidden">
                            <div className="bg-primary/5 border-b border-border/50 p-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Характерные симптомы</h3>
                            </div>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                                    {symptoms.map((symptom) => (
                                        <div key={symptom} className="flex items-center space-x-2 group cursor-pointer">
                                            <Checkbox id={symptom} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded h-3.5 w-3.5 transition-all" />
                                            <Label htmlFor={symptom} className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer leading-none">
                                                {symptom}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card border-border shadow-sm overflow-hidden border-l-2 border-l-primary/30">
                        <CardContent className="p-5">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Жалобы пациента</h3>
                            <Textarea
                                placeholder="Опишите подробнее жалобы со слов пациента..."
                                defaultValue={patient.complaint}
                                className="bg-muted/20 border-border min-h-[100px] resize-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 transition-all rounded-xl p-4 text-sm font-medium leading-relaxed"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => setActiveTab("diagnosis")} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-xl text-xs font-bold gap-2 shadow-lg shadow-primary/10 transition-all hover:translate-y-[-1px]">
                            Перейти к диагностике
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="diagnosis" className="space-y-6 focus-visible:outline-none">
                    <Card className="bg-card border-border shadow-lg overflow-hidden border-t-2 border-t-primary/30">
                        <div className="bg-primary/5 p-4 border-b border-border/50">
                            <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-2">
                                <Stethoscope className="w-3.5 h-3.5" />
                                Медицинское заключение
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Основной диагноз / Состояние</Label>
                                <Input
                                    placeholder="Введите код по МКБ-10 или описание..."
                                    className="bg-muted/20 border-border h-10 text-sm font-bold tracking-tight focus:ring-1 focus:ring-primary/20 rounded-xl px-4"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Детализация диагноза, результаты осмотра, пальпации..."
                                    className="bg-muted/10 border-border min-h-[150px] resize-none focus:ring-1 focus:ring-primary/20 transition-all rounded-xl p-4 text-sm leading-relaxed mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setActiveTab("anamnesis")} className="text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-widest px-4 h-9 rounded-lg border border-transparent hover:border-border transition-all">
                            Назад
                        </Button>
                        <Button onClick={() => setActiveTab("sales")} className="bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] text-white h-10 px-8 rounded-xl text-xs font-bold gap-2 shadow-lg shadow-[hsl(var(--status-good))/0.1] transition-all hover:translate-y-[-1px]">
                            Сформировать план лечения
                            <Zap className="w-3.5 h-3.5 fill-current" />
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
