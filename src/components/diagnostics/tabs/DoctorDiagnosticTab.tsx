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
import { AdminFormData, Question } from "./AdminDiagnosticTab";
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
    adminQuestions?: Question[];
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
    lead, adminData, adminQuestions = [], data, questions, onQuestionsChange, onChange, onComplete, readOnly = false 
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
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(section)} className="border border-border/50 rounded-2xl overflow-hidden transition-all">
                <CollapsibleTrigger asChild>
                    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors bg-secondary/5">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
                            <span className="text-[10px] text-muted-foreground/50 font-bold">{sectionQuestions.length} полей</span>
                        </div>
                        <div className="flex items-center gap-2">
                             {!readOnly && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-lg hover:bg-primary/10" 
                                    onClick={(e) => { e.stopPropagation(); addQuestion(section); }}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                             )}
                             {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="divide-y divide-border/30 animate-in slide-in-from-top-1 duration-200">
                        {sectionQuestions.map(q => (
                            <div key={q.id} className="group/row hover:bg-secondary/5 transition-colors">
                                <div className="px-4 py-3 flex items-start gap-4">
                                    <div className="w-[180px] shrink-0 pt-2">
                                        <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-tight">{q.label}</Label>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {q.type === "textarea" ? (
                                            <Textarea
                                                placeholder="Введите..."
                                                className="bg-background/50 border-border/40 focus:ring-1 focus:ring-primary h-16 text-sm resize-none rounded-xl p-3"
                                                value={formData.answers[q.id] || ""}
                                                onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                disabled={readOnly}
                                            />
                                        ) : (
                                            <Input
                                                placeholder="Введите..."
                                                className="bg-background/50 border-border/40 h-9 rounded-lg px-3 text-sm focus:ring-1 focus:ring-primary"
                                                value={formData.answers[q.id] || ""}
                                                onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                disabled={readOnly}
                                            />
                                        )}
                                    </div>
                                    {!readOnly && (
                                        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0 pt-1">
                                            <DoctorQuestionEditor 
                                                question={q}
                                                onUpdate={(updated) => onQuestionsChange(questions.map(item => item.id === q.id ? updated : item))}
                                                onDelete={() => onQuestionsChange(questions.filter(item => item.id !== q.id))}
                                                onMoveUp={() => moveQuestion(questions.indexOf(q), 'up')}
                                                onMoveDown={() => moveQuestion(questions.indexOf(q), 'down')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    const [adminInfoOpen, setAdminInfoOpen] = useState(false);

    return (
        <div className="space-y-4 animate-in fade-in pb-10 max-w-4xl mx-auto w-full">
             {/* Collapsible Admin Summary Box */}
             {adminData && (
                <Collapsible open={adminInfoOpen} onOpenChange={setAdminInfoOpen}>
                    <CollapsibleTrigger asChild>
                        <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Info className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="font-bold text-primary text-xs uppercase tracking-widest">Информация от администратора</h3>
                            </div>
                            {adminInfoOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="mt-1 border border-primary/10 rounded-2xl bg-primary/[0.02] animate-in slide-in-from-top-1 duration-200">
                            {/* All admin questions with answers */}
                            <div className="divide-y divide-primary/10">
                                {adminQuestions.length > 0 ? (
                                    adminQuestions.map((q, idx) => {
                                        const answer = adminData.answers?.[q.id];
                                        const displayVal = answer 
                                            ? (Array.isArray(answer) ? answer.join(', ') : String(answer))
                                            : '—';
                                        return (
                                            <div key={q.id} className="px-4 py-3 flex items-start gap-4">
                                                <div className="w-[200px] shrink-0 pt-0.5">
                                                    <span className="text-[9px] uppercase font-bold text-primary/60 tracking-wider leading-tight">{q.label}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        answer ? "text-foreground" : "text-muted-foreground/40 italic"
                                                    )}>{displayVal}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    /* Fallback: show raw answers if no admin questions available */
                                    adminData.answers && Object.entries(adminData.answers).map(([key, val]) => {
                                        if (!val) return null;
                                        return (
                                            <div key={key} className="px-4 py-3 flex items-start gap-4">
                                                <div className="w-[200px] shrink-0 pt-0.5">
                                                    <span className="text-[9px] uppercase font-bold text-primary/60 tracking-wider">{key.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">{String(val)}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {/* Admin comment */}
                                {adminData.adminComment && (
                                    <div className="px-4 py-3 flex items-start gap-4 bg-amber-500/5">
                                        <div className="w-[200px] shrink-0 pt-0.5">
                                            <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Комментарий админа</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{adminData.adminComment}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {renderQuestionsSection("complaints", "1. Жалобы и анамнез", FileText)}
            {renderQuestionsSection("exam", "2. Объективный осмотр", Stethoscope)}
            {renderQuestionsSection("procedure", "3. Первая процедура", Zap)}
            {renderQuestionsSection("conclusion", "4. План лечения и итог", Activity)}

            {!readOnly && (
                <div className="flex justify-end pt-4">
                    <Button 
                        onClick={onComplete}
                        className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Перейти к листу назначения
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
