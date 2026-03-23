import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Stethoscope, Activity, FileText, Zap, ChevronDown, ChevronUp, CheckCircle2, ArrowRight
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData } from "./AdminDiagnosticTab";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const REFUSAL_REASONS = [
    "Дорого",
    "Ушел в другую клинику",
    "Сам передумал",
    "Нет времени",
    "Не понравился врач",
    "Другое"
];

export interface DoctorFormData {
    // 1. Жалобы
    mainComplaint: string;
    addComplaints: string;
    duration: string;
    triggers: string;
    // 2. История
    history: string;
    injuries: string;
    pastTreatment: string;
    // 3. Осмотр
    visualExam: string;
    palpation: string;
    mobility: string;
    preliminaryDiagnosis: string;
    // 4. Первая процедура
    procedureType: string;
    procedureReaction: string;
    procedureComment: string;
    // 5. Итог
    conclusion: string;
    recommendedCourse: string;
    readiness: "not_ready" | "thinking" | "ready" | "";
    refusalReason?: string;
}

interface Props {
    lead: Lead;
    adminData: AdminFormData | null;
    data: DoctorFormData | null;
    onChange: (data: DoctorFormData) => void;
    onNext: () => void;
}

export const DoctorDiagnosticTab: React.FC<Props> = ({ lead, adminData, data, onChange, onNext }) => {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    const [formData, setFormData] = useState<DoctorFormData>(data || {
        mainComplaint: adminData?.complaints || "",
        addComplaints: "",
        duration: adminData?.painDuration || "",
        triggers: "",
        history: "",
        injuries: "",
        pastTreatment: adminData?.previousTreatment || "",
        visualExam: "",
        palpation: "",
        mobility: "",
        preliminaryDiagnosis: "",
        procedureType: "",
        procedureReaction: "",
        procedureComment: "",
        conclusion: "",
        recommendedCourse: "",
        readiness: "thinking"
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleTextChange = (field: keyof DoctorFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in pb-10 max-w-4xl mx-auto w-full">
            
            {/* Блок 1: Информация от администратора (Сворачиваемый) */}
            <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen} className="bg-secondary/10 border border-border/50 rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-semibold text-sm bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Информация от регистратуры
                    </span>
                    {isInfoOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">ФИО:</span> <span className="font-semibold">{lead.name}</span></div>
                        <div><span className="text-muted-foreground">Телефон:</span> <span className="font-semibold">{lead.phone}</span></div>
                        <div><span className="text-muted-foreground">Жалоба (от админа):</span> <span className="font-semibold">{adminData?.complaints || "—"}</span></div>
                        <div><span className="text-muted-foreground">Предоплата:</span> <span className="font-semibold">{adminData?.paymentStatus === "paid" ? "✅ Внесена" : "❌ Ожидается"}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Комментарий:</span> <span className="font-semibold">{adminData?.adminComment || "—"}</span></div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Блок 1. Жалобы пациента */}
            <div className="p-8 bg-card border border-border/60 rounded-[32px] shadow-sm space-y-6">
                <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2 text-primary">
                    <Stethoscope className="h-5 w-5" /> 1. Жалобы пациента (Уточнение)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Основная жалоба (измените при необходимости)</Label>
                        <Textarea value={formData.mainComplaint} onChange={handleTextChange("mainComplaint")} className="h-20 resize-none bg-muted/20" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Доп. жалобы</Label>
                        <Input value={formData.addComplaints} onChange={handleTextChange("addComplaints")} className="bg-muted/20" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Длительность</Label>
                        <Input value={formData.duration} onChange={handleTextChange("duration")} className="bg-muted/20" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Что усиливает или уменьшает боль?</Label>
                        <Input value={formData.triggers} onChange={handleTextChange("triggers")} className="bg-muted/20" placeholder="Например: Усиливается при ходьбе, уменьшается лежа" />
                    </div>
                </div>
            </div>

            {/* Блок 2. Осмотр */}
            <div className="p-8 bg-card border border-border/60 rounded-[32px] shadow-sm space-y-6">
                <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2 text-primary">
                    <Activity className="h-5 w-5" /> 2. Осмотр и Диагностика
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Визуальная оценка</Label>
                        <Textarea value={formData.visualExam} onChange={handleTextChange("visualExam")} className="h-20 resize-none bg-muted/20" placeholder="Осанка, асимметрия..." />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пальпация и тесты</Label>
                        <Textarea value={formData.palpation} onChange={handleTextChange("palpation")} className="h-20 resize-none bg-muted/20" placeholder="Болевые точки, напряжение мышц..." />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Предварительное заключение / Диагноз</Label>
                        <Input value={formData.preliminaryDiagnosis} onChange={handleTextChange("preliminaryDiagnosis")} className="bg-primary/5 border-primary/20" />
                    </div>
                </div>
            </div>

            {/* Блок 3. Первая процедура */}
            <div className="p-8 bg-card border border-border/60 rounded-[32px] shadow-sm space-y-6">
                <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2 text-primary">
                    <Zap className="h-5 w-5" /> 3. Первая процедура
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Вид процедуры</Label>
                        <Input value={formData.procedureType} onChange={handleTextChange("procedureType")} className="bg-muted/20" placeholder="Например: УВТ + массаж" />
                    </div>
                    <div className="space-y-3 md:col-span-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Реакция пациента после процедуры</Label>
                        <Textarea value={formData.procedureReaction} onChange={handleTextChange("procedureReaction")} className="h-20 resize-none bg-muted/20" placeholder="Как себя чувствует? Стало ли легче?" />
                    </div>
                </div>
            </div>

            {/* Блок 4. Итог */}
            <div className="p-8 bg-primary/5 border border-primary/20 rounded-[32px] shadow-sm space-y-8">
                <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" /> 4. Итог врача и Рекомендации
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Рекомендованный курс лечения (Пакет)</Label>
                        <Input value={formData.recommendedCourse} onChange={handleTextChange("recommendedCourse")} className="bg-background border-primary/20 h-12 text-lg" placeholder="Например: Комплекс №2 (10 дней)" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Скрытый комментарий (для клиники)</Label>
                        <Textarea value={formData.conclusion} onChange={handleTextChange("conclusion")} className="bg-background border-primary/20 h-24" />
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-primary/10">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Готовность пациента к лечению</Label>
                    <RadioGroup 
                        value={formData.readiness} 
                        onValueChange={(val: any) => setFormData({...formData, readiness: val})}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <Label className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all text-center gap-2",
                            formData.readiness === "not_ready" ? "border-rose-500 bg-rose-500/10 text-rose-700" : "border-border bg-background"
                        )}>
                            <RadioGroupItem value="not_ready" className="sr-only" />
                            <span className="font-semibold">❌ Не готов</span>
                            <span className="text-xs opacity-70">Отказ или дорого</span>
                        </Label>
                        <Label className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all text-center gap-2",
                            formData.readiness === "thinking" ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-border bg-background"
                        )}>
                            <RadioGroupItem value="thinking" className="sr-only" />
                            <span className="font-semibold">🤔 Думает</span>
                            <span className="text-xs opacity-70">Ушел думать</span>
                        </Label>
                        <Label className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all text-center gap-2",
                            formData.readiness === "ready" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-md scale-105" : "border-border bg-background"
                        )}>
                            <RadioGroupItem value="ready" className="sr-only" />
                            <span className="font-semibold hidden md:block">✅ Готов лечиться</span>
                            <span className="font-semibold md:hidden">✅ Готов</span>
                            <span className="text-xs opacity-70">Оформить лист назначения</span>
                        </Label>
                    </RadioGroup>

                    {formData.readiness === "not_ready" && (
                        <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Укажите причину отказа</Label>
                            <Select 
                                value={formData.refusalReason} 
                                onValueChange={(val) => setFormData({...formData, refusalReason: val})}
                            >
                                <SelectTrigger className="h-12 bg-rose-50/50 border-rose-200">
                                    <SelectValue placeholder="Выберите одну из причин..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {REFUSAL_REASONS.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {formData.readiness === "ready" && (
                    <div className="flex justify-end pt-4 animate-in slide-in-from-bottom-4 fade-in">
                        <Button 
                            onClick={onNext}
                            className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm uppercase gap-3 shadow-xl"
                        >
                            К списку назначений
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

        </div>
    );
};
