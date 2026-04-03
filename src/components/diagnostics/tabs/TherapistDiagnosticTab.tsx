import React, { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Plus, Edit2, X, ChevronDown, Stethoscope, Activity, ArrowRight, FileText, Info, ShieldAlert, AlertTriangle
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData, Question } from "./AdminDiagnosticTab";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface TherapistQuestion {
    id: string;
    label: string;
    type: "text" | "textarea" | "select" | "checkbox";
    options?: { id: string; label: string }[];
    required?: boolean;
}

export const DEFAULT_THERAPIST_QUESTIONS: TherapistQuestion[] = [
    { 
        id: "sides", 
        label: "Сторона", 
        type: "select", 
        options: [
            { id: "left", label: "лево" },
            { id: "right", label: "право" },
            { id: "both", label: "двухсторонне" }
        ],
        required: true 
    },
    { 
        id: "numbness", 
        label: "Онемение", 
        type: "checkbox", 
        options: [
            { id: "fingers_hands", label: "пальцы рук" },
            { id: "fingers_feet", label: "пальцы ног" },
            { id: "front_thigh", label: "передняя поверхность бедра" },
            { id: "back_thigh", label: "задняя поверхность бедра" },
            { id: "foot", label: "стопа" }
        ] 
    },
    { id: "weakness", label: "Слабость", type: "text" },
    { id: "mobility_restriction", label: "Ограничение подвижности", type: "text" },
    { id: "morning_stiffness", label: "Утренняя скованность", type: "text" },
    { id: "red_flags", label: "Температура / боли ночью / потеря веса (Красные флаги)", type: "text" },
    { 
        id: "previous_exams", 
        label: "Предыдущие обследования", 
        type: "checkbox", 
        options: [
            { id: "mri", label: "МРТ" },
            { id: "rkt", label: "РКТ" },
            { id: "xray", label: "Рентген" },
            { id: "ultrasound", label: "УЗИ" },
            { id: "tests", label: "Анализы" }
        ] 
    },
    { id: "exam_results", label: "Что показали обследования?", type: "textarea" },
    { id: "contraindications", label: "Противопоказания (давление / операции / аллергии)", type: "text" },
    { id: "conclusion", label: "Заключение терапевта", type: "textarea", required: true },
];

export interface TherapistFormData {
    answers: Record<string, any>;
}

interface Props {
    lead: Lead;
    adminData: AdminFormData | null;
    adminQuestions?: Question[];
    data: TherapistFormData | null;
    questions: TherapistQuestion[];
    onQuestionsChange: (questions: TherapistQuestion[]) => void;
    onChange: (data: TherapistFormData) => void;
    onComplete: () => void;
    readOnly?: boolean;
}

export const TherapistDiagnosticTab: React.FC<Props> = ({ 
    lead, adminData, adminQuestions = [], data, questions, onQuestionsChange, onChange, onComplete, readOnly = false 
}) => {
    const { isClientManager } = useRole();
    const canManageQuestions = !isClientManager && !readOnly;
    const [formData, setFormData] = useState<TherapistFormData>(data || {
        answers: {},
    });
    const [attemptedNext, setAttemptedNext] = useState(false);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleComplete = () => {
        setAttemptedNext(true);
        const missing = questions.filter(q => q.required && !formData.answers[q.id]);
        if (missing.length > 0) {
            toast({
                title: "Заполните обязательные поля",
                description: `Остались пустые пункты: ${missing.map(m => m.label).join(", ")}`,
                variant: "destructive"
            });
            return;
        }
        onComplete();
    };

    const renderQuestion = (q: TherapistQuestion, index: number) => {
        const isMissing = attemptedNext && q.required && !formData.answers[q.id];
        
        return (
            <div key={q.id} className="group/row hover:bg-background/40 transition-colors border-b border-border/10 last:border-0 p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 transition-all",
                                isMissing ? "bg-destructive animate-pulse scale-125" : "bg-primary/40 group-hover/row:bg-primary"
                            )} />
                            <Label className={cn(
                                "text-[12px] uppercase font-black tracking-widest leading-[1.4]",
                                isMissing ? "text-destructive" : "text-foreground group-hover/row:text-primary"
                            )}>
                                {q.label}
                                {q.required && <span className="text-primary ml-1">*</span>}
                            </Label>
                        </div>
                    </div>

                    <div className="relative">
                        {q.type === "textarea" ? (
                            <Textarea
                                placeholder="Введите развернутый ответ..."
                                className={cn(
                                    "bg-card min-h-[100px] focus:ring-4 text-sm font-bold resize-none rounded-[24px] p-5 transition-all shadow-inner border-border/40 focus:border-primary/40 focus:ring-primary/10",
                                    isMissing && "border-destructive/50 ring-2 ring-destructive/10"
                                )}
                                value={formData.answers[q.id] || ""}
                                onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                disabled={readOnly}
                            />
                        ) : q.type === "select" && q.options ? (
                            <Select 
                                value={formData.answers[q.id] || ""} 
                                onValueChange={(val) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: val } })}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="h-14 bg-card border-border/40 rounded-[20px] px-6 text-sm font-bold shadow-inner">
                                    <SelectValue placeholder="Выберите вариант..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {q.options.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id} className="font-bold">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : q.type === "checkbox" && q.options ? (
                            <div className="flex flex-wrap gap-2">
                                {q.options.map(opt => {
                                    const current = Array.isArray(formData.answers[q.id]) ? formData.answers[q.id] : [];
                                    const isSelected = current.includes(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            className={cn(
                                                "h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary shadow-lg shadow-primary/20 text-white"
                                                    : "border-border/20 bg-secondary/20 text-muted-foreground/40 hover:border-primary/20",
                                                !readOnly && "cursor-pointer"
                                            )}
                                            onClick={() => {
                                                if (readOnly) return;
                                                const newVal = isSelected 
                                                    ? current.filter((i: string) => i !== opt.id)
                                                    : [...current, opt.id];
                                                setFormData({ ...formData, answers: { ...formData.answers, [q.id]: newVal } });
                                            }}
                                            disabled={readOnly}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <Input
                                placeholder="Введите значение..."
                                className={cn(
                                    "bg-card h-14 rounded-[20px] px-6 text-sm font-bold focus:ring-4 border-border/40 transition-all shadow-inner",
                                    isMissing && "border-destructive/50 ring-2 ring-destructive/10"
                                )}
                                value={formData.answers[q.id] || ""}
                                onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                disabled={readOnly}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto w-full">
            {/* Admin Info Summary */}
            {adminData && (
                <div className="bg-secondary/5 border border-border/20 rounded-[40px] overflow-hidden shadow-sm">
                    <div className="px-8 py-4 bg-secondary/10 flex items-center justify-between border-b border-border/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                                <Info className="h-5 w-5" />
                            </div>
                            <h3 className="font-black text-foreground text-xs uppercase tracking-[0.2em]">История администратора</h3>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {adminQuestions.slice(0, 6).map(q => {
                            const answer = adminData.answers?.[q.id];
                            if (!answer) return null;
                            return (
                                <div key={q.id} className="p-4 rounded-2xl bg-background/50 border border-border/10 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase">{q.label}</span>
                                    <p className="text-xs font-bold">{Array.isArray(answer) ? answer.join(", ") : String(answer)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-card border border-border/40 rounded-[40px] overflow-hidden shadow-sm">
                 <div className="px-8 py-6 bg-secondary/10 border-b border-border/20 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Анамнез и осмотр терапевта</h3>
                </div>
                <div className="divide-y divide-border/10">
                    {questions.map((q, i) => renderQuestion(q, i))}
                </div>
            </div>

            {!readOnly && (
                <div className="flex justify-end pt-8">
                    <Button 
                        onClick={handleComplete}
                        className="h-16 px-10 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase gap-3 shadow-2xl transition-all hover:scale-[1.02] group"
                    >
                        Перейти к реабилитологу
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};
