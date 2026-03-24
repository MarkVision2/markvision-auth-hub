import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Plus, Edit2, X, ChevronDown, ChevronUp, Stethoscope, Activity, Zap, CheckCircle2, ArrowRight, FileText, Info
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData } from "./AdminDiagnosticTab";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DoctorQuestion {
    id: string;
    label: string;
    section: "complaints" | "exam" | "procedure" | "conclusion";
    type: "text" | "textarea" | "radio" | "checkbox";
    options?: { id: string; label: string }[];
    required?: boolean;
}

export const DEFAULT_DOCTOR_QUESTIONS: DoctorQuestion[] = [
    { id: "main_complaint", label: "Основная жалоба", section: "complaints", type: "textarea" },
    { id: "add_complaints", label: "Доп. жалобы", section: "complaints", type: "text" },
    { id: "duration", label: "Длительность", section: "complaints", type: "text" },
    { id: "triggers", label: "Что усиливает или уменьшает боль?", section: "complaints", type: "text" },
    { id: "visual_exam", label: "Визуальная оценка", section: "exam", type: "textarea" },
    { id: "palpation", label: "Пальпация и тесты", section: "exam", type: "textarea" },
    { id: "diagnosis", label: "Предварительное заключение / Диагноз", section: "exam", type: "text" },
    { id: "procedure_type", label: "Вид процедуры", section: "procedure", type: "text" },
    { id: "procedure_reaction", label: "Реакция пациента после процедуры", section: "procedure", type: "textarea" },
    { id: "recommended_course", label: "Рекомендованный курс лечения (Пакет)", section: "conclusion", type: "text" },
    { id: "conclusion_comments", label: "Скрытый комментарий (для клиники)", section: "conclusion", type: "textarea" },
];

export interface DoctorFormData {
    answers: Record<string, any>;
    readiness: "not_ready" | "thinking" | "ready" | "";
    refusalReason?: string;
    refusalReasonOther?: string;
    // Legacy mapping
    mainComplaint: string;
    recommendedCourse: string;
    packageId?: string;
}

const REFUSAL_REASONS = [
    "Дорого",
    "Другой город",
    "Подумает",
    "Не сейчас",
    "Другое"
];

interface Props {
    lead: Lead;
    adminData: AdminFormData | null;
    data: DoctorFormData | null;
    questions: DoctorQuestion[];
    onQuestionsChange: (questions: DoctorQuestion[]) => void;
    onChange: (data: DoctorFormData) => void;
    onComplete: () => void;
    readOnly?: boolean;
}

const DoctorQuestionEditor = ({ 
    question, 
    onUpdate, 
    onDelete,
    onMoveUp,
    onMoveDown,
    readOnly = false
}: { 
    question: DoctorQuestion; 
    onUpdate: (q: DoctorQuestion) => void; 
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    readOnly?: boolean;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(question.label);

    if (readOnly) return null;

    const handleSave = () => {
        onUpdate({ ...question, label: editLabel });
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-2 min-w-[120px]">
            {!isEditing ? (
                <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-xl border border-border/40">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                        onClick={() => setIsEditing(true)}
                        title="Редактировать пункт"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex items-center">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                            onClick={onMoveUp}
                            title="Переместить вверх"
                        >
                            <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                            onClick={onMoveDown}
                            title="Переместить вниз"
                        >
                            <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                        </Button>
                    </div>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" 
                        onClick={onDelete}
                        title="Удалить пункт"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ) : (
                <div className="p-3 bg-background border border-primary/30 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 z-50 w-80">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Текст вопроса</Label>
                            <Input 
                                value={editLabel} 
                                onChange={e => setEditLabel(e.target.value)} 
                                className="h-9 text-xs mb-2 bg-secondary/10 border-none rounded-xl" 
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Тип ответа</Label>
                            <Select 
                                value={question.type} 
                                onValueChange={(v: any) => onUpdate({ ...question, type: v, options: (v === 'radio' || v === 'checkbox') ? (question.options || []) : [] })}
                            >
                                <SelectTrigger className="h-8 text-[11px] bg-secondary/10 border-none rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Текст (строка)</SelectItem>
                                    <SelectItem value="textarea">Текст (абзац)</SelectItem>
                                    <SelectItem value="radio">Один из списка</SelectItem>
                                    <SelectItem value="checkbox">Несколько из списка</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(question.type === "radio" || question.type === "checkbox") && (
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Варианты ответа</Label>
                                <div className="space-y-1.5">
                                    {(question.options || []).map((opt, idx) => (
                                        <div key={idx} className="flex gap-1">
                                            <Input 
                                                value={opt.label}
                                                onChange={(e) => {
                                                    const newOpts = [...(question.options || [])];
                                                    newOpts[idx] = { ...newOpts[idx], label: e.target.value };
                                                    onUpdate({ ...question, options: newOpts });
                                                }}
                                                className="h-8 text-[11px] bg-secondary/5 border-none rounded-lg"
                                            />
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 shrink-0 hover:bg-destructive/10 text-destructive"
                                                onClick={() => {
                                                    const newOpts = (question.options || []).filter((_, i) => i !== idx);
                                                    onUpdate({ ...question, options: newOpts });
                                                }}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full h-8 text-[10px] border-dashed gap-1 rounded-lg"
                                        onClick={() => {
                                            const newOpts = [...(question.options || []), { id: `opt_${Date.now()}`, label: "" }];
                                            onUpdate({ ...question, options: newOpts });
                                        }}
                                    >
                                        <Plus className="h-3 w-3" /> Добавить вариант
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-1 pt-2">
                            <Button size="sm" variant="ghost" className="h-8 px-3 text-[10px] uppercase font-bold tracking-wider rounded-xl" onClick={() => setIsEditing(false)}>Отмена</Button>
                            <Button size="sm" className="h-8 px-3 text-[10px] uppercase font-bold tracking-wider bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleSave}>Сохранить</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const DoctorDiagnosticTab: React.FC<Props> = ({ 
    lead, adminData, data, questions, onQuestionsChange, onChange, onComplete, readOnly = false 
}) => {
    // const [questions, setQuestions] = useState<DoctorQuestion[]>(DEFAULT_DOCTOR_QUESTIONS);
    const [formData, setFormData] = useState<DoctorFormData>(data || {
        answers: {},
        readiness: "",
        mainComplaint: "",
        recommendedCourse: "",
    });

    const [openSections, setOpenSections] = useState<string[]>(["complaints", "exam", "procedure", "conclusion"]);

    useEffect(() => {
        const updated = { ...formData };
        updated.mainComplaint = formData.answers["main_complaint"] || "";
        updated.recommendedCourse = formData.answers["recommended_course"] || "";
        onChange(updated);
    }, [formData]);

    const addQuestion = (section: DoctorQuestion["section"]) => {
        const newQ: DoctorQuestion = {
            id: `dq_${Date.now()}`,
            label: "Новый пункт",
            section,
            type: "text"
        };
        onQuestionsChange([...questions, newQ]);
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Ensure we only move within the SAME section for doctor questions UI
        if (targetIndex >= 0 && targetIndex < newQuestions.length) {
            const currentQ = newQuestions[index];
            const targetQ = newQuestions[targetIndex];
            
            if (currentQ.section === targetQ.section) {
                [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
                onQuestionsChange(newQuestions);
            }
        }
    };

    const toggleSection = (section: string) => {
        setOpenSections(prev => 
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const renderQuestionsSection = (section: DoctorQuestion["section"], title: string, icon: any) => {
        const sectionQuestions = questions.filter(q => q.section === section);
        const isOpen = openSections.includes(section);
        const Icon = icon;

        return (
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(section)} className="bg-secondary/5 border border-border/50 rounded-[32px] overflow-hidden transition-all">
                <CollapsibleTrigger asChild>
                    <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                             {!readOnly && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full" 
                                    onClick={(e) => { e.stopPropagation(); addQuestion(section); }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                             )}
                             {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {sectionQuestions.map(q => (
                            <div key={q.id} className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">{q.label}</Label>
                                    {!readOnly && (
                                        <DoctorQuestionEditor 
                                            question={q}
                                            onUpdate={(updated) => onQuestionsChange(questions.map(item => item.id === q.id ? updated : item))}
                                            onDelete={() => onQuestionsChange(questions.filter(item => item.id !== q.id))}
                                            onMoveUp={() => moveQuestion(questions.indexOf(q), 'up')}
                                            onMoveDown={() => moveQuestion(questions.indexOf(q), 'down')}
                                        />
                                    )}
                                </div>
                                {q.type === "textarea" ? (
                                    <Textarea
                                        placeholder="..."
                                        className="bg-background border-border/50 focus:ring-1 focus:ring-primary h-24 text-sm resize-none rounded-2xl p-4"
                                        value={formData.answers[q.id] || ""}
                                        onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                        disabled={readOnly}
                                    />
                                ) : (
                                    <Input
                                        placeholder="..."
                                        className="bg-background border-border/50 h-12 rounded-xl px-4 text-sm focus:ring-1 focus:ring-primary"
                                        value={formData.answers[q.id] || ""}
                                        onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                        disabled={readOnly}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-10 max-w-4xl mx-auto w-full">
             {/* Admin Summary Box */}
             {adminData && (
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                        <Info className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Информация от администратора</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Жалобы</span>
                            <p className="text-sm font-medium">{adminData.complaints || "Не указаны"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Локализация</span>
                            <p className="text-sm font-medium">{adminData.painLocation} {adminData.painLocationOther}</p>
                        </div>
                    </div>
                </div>
            )}

            {renderQuestionsSection("complaints", "1. Жалобы и анамнез", FileText)}
            {renderQuestionsSection("exam", "2. Объективный осмотр", Stethoscope)}
            {renderQuestionsSection("procedure", "3. Первая процедура", Zap)}
            {renderQuestionsSection("conclusion", "4. План лечения и итог", Activity)}

            {/* Decision Status */}
            <div className="p-8 bg-secondary/5 border border-border/50 rounded-[32px] space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground ml-1">Готовность к лечению</Label>
                    <RadioGroup
                        value={formData.readiness}
                        onValueChange={(val: any) => !readOnly && setFormData({ ...formData, readiness: val })}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        disabled={readOnly}
                    >
                        {[
                            { id: "ready", label: "Готов начать", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { id: "thinking", label: "Думает", color: "text-amber-500", bg: "bg-amber-500/10" },
                            { id: "not_ready", label: "Не готов", color: "text-rose-500", bg: "bg-rose-500/10" },
                        ].map((item) => (
                            <div 
                                key={item.id}
                                className={cn(
                                    "flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer",
                                    formData.readiness === item.id ? "border-primary bg-primary/5" : "border-transparent bg-background hover:bg-secondary/5"
                                )}
                                onClick={() => !readOnly && setFormData({...formData, readiness: item.id as any})}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-3 w-3 rounded-full", item.bg, item.color)} />
                                    <span className="font-bold text-sm">{item.label}</span>
                                </div>
                                <RadioGroupItem value={item.id} id={`rd-${item.id}`} className="sr-only" />
                                {formData.readiness === item.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {formData.readiness === "not_ready" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-rose-600 ml-1">Причина отказа</Label>
                        <Select value={formData.refusalReason} onValueChange={(v) => !readOnly && setFormData({ ...formData, refusalReason: v })} disabled={readOnly}>
                            <SelectTrigger className="h-12 rounded-2xl border-rose-500/20 bg-rose-500/5 focus:ring-rose-500 font-bold">
                                <SelectValue placeholder="Выберите причину..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/50">
                                {REFUSAL_REASONS.map(r => (
                                    <SelectItem key={r} value={r} className="rounded-xl">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {formData.refusalReason === "Другое" && (
                            <div className="pt-2 animate-in slide-in-from-top-1 duration-200">
                                <Input 
                                    placeholder="Укажите свою причину..."
                                    value={formData.refusalReasonOther || ""}
                                    onChange={e => setFormData({ ...formData, refusalReasonOther: e.target.value })}
                                    className="h-12 rounded-2xl border-rose-500/20 bg-background focus:ring-rose-500 font-medium"
                                    disabled={readOnly}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="flex justify-end pt-4">
                    <Button 
                        onClick={onComplete}
                        className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Завершить диагностику
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
};
