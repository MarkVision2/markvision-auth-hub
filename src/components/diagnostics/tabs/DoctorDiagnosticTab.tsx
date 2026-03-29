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
import { Badge } from "@/components/ui/badge";
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
    { id: "flex_forward", label: "Когда вы наклоняетесь вперед, боль усиливается или становится легче?", section: "complaints", type: "textarea" },
    { id: "flex_back", label: "А если прогнуться назад, что происходит с болью?", section: "complaints", type: "textarea" },
    { id: "sitting_pain", label: "Когда вы долго сидите, боль: усиливается / появляется / остаётся без изменений", section: "complaints", type: "textarea" },
    { id: "walking_relief", label: "Если немного походить или размяться, становится легче?", section: "complaints", type: "textarea" },
    { id: "movement_difficulty", label: "Есть ли движения, которые сейчас неприятно или сложно выполнять?", section: "exam", type: "textarea" },
    { id: "avoidance", label: "Иногда пациенты начинают подсознательно избегать некоторых движений. Вы замечали такое за собой?", section: "exam", type: "textarea" },
    { id: "neurological", label: "Бывает ли: резкая простреливающая боль при движении / ощущение натяжения в ноге или руке / усиление напряжения мышц?", section: "exam", type: "textarea" },
    { id: "weakness", label: "Иногда пациенты чувствуют слабость в руке или ноге. Вы замечали что-то подобное?", section: "exam", type: "textarea" },
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
            <div className="bg-card border border-border/40 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
                <div 
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors"
                    onClick={() => toggleSection(section)}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{title}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{sectionQuestions.length} полей заполнено</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {!readOnly && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl hover:bg-primary/10 text-primary transition-all" 
                                onClick={(e) => { e.stopPropagation(); addQuestion(section); }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                         )}
                         <div className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}>
                            <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
                         </div>
                    </div>
                </div>
                
                {isOpen && (
                    <div className="divide-y divide-border/20 border-t border-border/20 bg-secondary/5 animate-in slide-in-from-top-2 duration-300">
                        {sectionQuestions.length === 0 ? (
                            <div className="px-6 py-10 text-center opacity-40">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Нет вопросов в этой секции</p>
                            </div>
                        ) : (
                            sectionQuestions.map(q => (
                                <div key={q.id} className="group/row hover:bg-background/40 transition-colors border-b border-border/10 last:border-0">
                                    <div className="px-8 py-6 flex flex-col gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0 group-hover/row:bg-primary group-hover/row:animate-pulse transition-all" />
                                            <Label className="text-[12px] uppercase font-black tracking-widest text-foreground group-hover/row:text-primary transition-colors leading-[1.4]">{q.label}</Label>
                                            {q.required && <span className="text-destructive font-black">*</span>}
                                        </div>
                                        <div className="relative pl-[18px]">
                                            {q.type === "textarea" ? (
                                                <Textarea
                                                    placeholder="Напишите ответ здесь..."
                                                    className="bg-card border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 min-h-[120px] text-sm font-bold resize-none rounded-[24px] p-5 transition-all shadow-inner group-hover/row:border-primary/30 group-hover/row:shadow-md"
                                                    value={formData.answers[q.id] || ""}
                                                    onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                    disabled={readOnly}
                                                />
                                            ) : (
                                                <Input
                                                    placeholder="Введите значение..."
                                                    className="bg-card border-border/40 h-14 rounded-[20px] px-6 text-sm font-bold focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner group-hover/row:border-primary/30 group-hover/row:shadow-md"
                                                    value={formData.answers[q.id] || ""}
                                                    onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                    disabled={readOnly}
                                                />
                                            )}
                                            
                                            {!readOnly && (
                                                <div className="absolute right-3 top-3 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
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
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-12 max-w-5xl mx-auto w-full">
             {/* Redesigned Admin Data: High-density compact card */}
            {adminData && (
                <div className="bg-secondary/5 border border-border/20 rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 hover:shadow-black/30 transition-shadow duration-300">
                    <div className="px-8 py-5 bg-secondary/10 flex items-center justify-between border-b border-border/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/20 shadow-lg shadow-black/10 text-primary flex items-center justify-center">
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-foreground text-xs uppercase tracking-[0.2em] leading-tight">Данные от администратора</h3>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-1">Опрос на этапе регистрации</p>
                            </div>
                        </div>
                        <Badge className="bg-primary text-white hover:bg-primary/90 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
                            READY
                        </Badge>
                    </div>
                    
                    <div className="px-6 py-6 sm:px-8 bg-background/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {adminQuestions.length > 0 ? (
                                adminQuestions.map((q) => {
                                    const answer = adminData.answers?.[q.id];
                                    const displayVal = answer 
                                        ? (Array.isArray(answer) ? answer.join(', ') : String(answer))
                                        : '—';
                                    return (
                                        <div key={q.id} className="flex flex-col gap-2 p-5 rounded-2xl bg-secondary/10 border border-border/10 hover:border-primary/20 hover:bg-secondary/20 transition-all">
                                            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-snug">{q.label}</span>
                                            <div className="flex-1 flex items-end">
                                                <p className={cn(
                                                    "text-[13px] font-bold",
                                                    answer ? "text-foreground" : "text-muted-foreground/40 italic"
                                                )}>{displayVal}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                adminData.answers && Object.entries(adminData.answers).slice(0, 9).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <div key={key} className="flex flex-col gap-2 p-5 rounded-2xl bg-secondary/10 border border-border/10 hover:border-primary/20 hover:bg-secondary/20 transition-all">
                                            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-snug">{key.replace(/_/g, ' ')}</span>
                                            <div className="flex-1 flex items-end">
                                                <p className="text-[13px] font-bold text-foreground">{String(val)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {adminData.adminComment && (
                            <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4 items-start relative overflow-hidden group/comment">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/comment:scale-110 transition-transform">
                                    <Activity className="h-16 w-16 text-amber-600" />
                                </div>
                                <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-black text-amber-600 tracking-widest block mb-1">Комментарий админа</span>
                                    <p className="text-xs font-bold text-foreground leading-relaxed">{adminData.adminComment}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {renderQuestionsSection("complaints", "1. Жалобы и двигательные тесты", FileText)}
                {renderQuestionsSection("exam", "2. Функциональная оценка и симптомы", Activity)}
                
                {questions.some(q => q.section === "procedure") && renderQuestionsSection("procedure", "3. Первая процедура", Zap)}
                {questions.some(q => q.section === "conclusion") && renderQuestionsSection("conclusion", "4. План лечения и итог", Stethoscope)}
            </div>

            {!readOnly && (
                <div className="flex justify-end pt-8">
                    <Button 
                        onClick={onComplete}
                        className="h-16 px-10 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    >
                        Перейти к листу назначения
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};
