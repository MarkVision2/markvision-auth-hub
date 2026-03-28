import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Stethoscope, ArrowRight, ArrowLeft, Check,
    Calendar, ClipboardList, Star, CheckCheck, Loader2,
    MessageCircle, Heart, Info, Phone, User, X,
    CreditCard, Smartphone, MessageSquare, Flag, CheckCircle2, 
    ShieldAlert, History as LucideHistory, Edit2, Clock,
    Activity, FileSearch, ShieldCheck, Zap, HeartPulse, UserCheck, Plus,
    GripVertical, ChevronUp, ChevronDown, Trash2
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { cn } from "@/lib/utils";
import { BookingWidget } from "../../crm/BookingWidget";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export interface Question {
    id: string;
    label: string;
    type: "text" | "textarea" | "radio" | "checkbox";
    options?: { id: string; label: string }[];
    required?: boolean;
    section?: string; // For compatibility with DoctorQuestion
}

export const DEFAULT_QUESTIONS: Question[] = [
    {
        id: "complaints",
        label: "Что именно вас сейчас беспокоит?",
        type: "textarea",
        required: true
    },
    {
        id: "pain_radiation",
        label: "Боль куда-то отдает? Например в ногу, руку или плечо?",
        type: "text",
        required: true
    },
    {
        id: "pain_duration",
        label: "Как давно появилась эта проблема?",
        type: "text",
        required: true
    },
    {
        id: "pain_type",
        label: "Боль постоянная или появляется периодически?",
        type: "text",
        required: true
    },
    {
        id: "morning_stiffness",
        label: "Когда утром встаете, долго расходитесь или утром всё нормально?",
        type: "text"
    },
    {
        id: "pain_timing",
        label: "Когда боль проявляется сильнее: утром или ближе к вечеру после рабочего дня?",
        type: "text"
    },
    {
        id: "cramps_spasms",
        label: "Есть ли судороги или спазмы в мышцах?",
        type: "text"
    },
    {
        id: "pain_intensity",
        label: "Насколько сильная боль по шкале от 1 до 10?",
        type: "text"
    },
    {
        id: "previous_treatment",
        label: "Пробовали ли вы уже как-то лечить эту проблему? Например: массаж, таблетки, уколы, физиотерапию?",
        type: "textarea"
    },
    {
        id: "previous_doctors",
        label: "Обращались ли ранее к врачам с этой проблемой? Если да, какой диагноз вам ставили?",
        type: "textarea"
    },
    {
        id: "mri_ct_xray",
        label: "Делали ли МРТ, КТ или рентген позвоночника? Если делали — есть ли результаты на руках?",
        type: "text"
    }
];

export interface AdminFormData {
    answers: Record<string, any>;
    painLocationOther?: string; // Special case for "other" in radioactive/checkbox
    bookingDate?: Date;
    bookingTime?: string;
    bookingDoctor?: string;
    adminComment: string;
    paymentMethod: string;
    paymentStatus: "pending" | "paid" | "declined";
    prepaymentAmount: string;
    refusalReason: string;
    refusalReasonOther?: string;
    confirmed: boolean;
    finalFio: string;
    finalPhone: string;
    invoicePhone: string;
    mriCtHistory?: string;
    // Legacy mapping (to avoid breaking exports)
    complaints: string;
    painLocation: string;
    painDuration: string;
    painType: string;
    painIntensity: string;
    previousTreatment: string;
}

interface Props {
    lead: Lead;
    data: AdminFormData | null;
    questions: Question[];
    onQuestionsChange: (questions: Question[]) => void;
    onChange: (data: AdminFormData) => void;
    onNext: () => void;
    readOnly?: boolean;
    onSave?: () => void;
}

const QuestionEditor = ({ 
    question, 
    onUpdate, 
    onDelete,
    onMoveUp,
    onMoveDown,
    readOnly = false
}: { 
    question: Question; 
    onUpdate: (q: Question) => void; 
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

    if (isEditing) {
        return (
            <div className="p-4 bg-background border border-primary/30 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 z-50 w-full mt-2">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Текст вопроса</Label>
                        <Input 
                            value={editLabel} 
                            onChange={e => setEditLabel(e.target.value)} 
                            className="h-10 text-sm mb-2 bg-secondary/10 border-none rounded-xl" 
                            autoFocus
                        />
                    </div>

                    {(question.type === "radio" || question.type === "checkbox") && (
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Варианты ответа</Label>
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
                                            className="h-9 text-sm bg-secondary/5 border-none rounded-lg"
                                        />
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 shrink-0 hover:bg-destructive/10 text-destructive"
                                            onClick={() => {
                                                const newOpts = (question.options || []).filter((_, i) => i !== idx);
                                                onUpdate({ ...question, options: newOpts });
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full h-9 text-xs border-dashed gap-1 rounded-lg"
                                    onClick={() => {
                                        const newOpts = [...(question.options || []), { id: `opt_${Date.now()}`, label: "" }];
                                        onUpdate({ ...question, options: newOpts });
                                    }}
                                >
                                    <Plus className="h-3.5 w-3.5" /> Добавить вариант
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="h-9 px-4 text-xs font-semibold rounded-xl" onClick={() => setIsEditing(false)}>Отмена</Button>
                        <Button size="sm" className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleSave}>Сохранить</Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// Drag handle + action buttons component for question cards
const QuestionActions = ({
    onMoveUp,
    onMoveDown,
    onEdit,
    onDelete,
}: {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => (
    <div className="flex items-center justify-center px-2 py-4 text-muted-foreground/40 cursor-grab hover:text-muted-foreground/70 transition-colors"
         onDoubleClick={onMoveUp}
    >
        <GripVertical className="h-5 w-5" />
    </div>
);

export const AdminDiagnosticTab: React.FC<Props> = ({ 
    lead, data, questions, onQuestionsChange, onChange, onNext, readOnly = false, onSave 
}) => {
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    // const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);

    const [formData, setFormData] = useState<AdminFormData>(data || {
        answers: {},
        complaints: "",
        painLocation: "",
        painDuration: "",
        painType: "",
        painIntensity: "",
        previousTreatment: "",
        adminComment: "",
        paymentMethod: "Kaspi",
        paymentStatus: "pending",
        prepaymentAmount: "",
        refusalReason: "",
        refusalReasonOther: "",
        confirmed: false,
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
        invoicePhone: lead.phone || "",
    });

    const [isBookingOpen, setIsBookingOpen] = useState(false);

    useEffect(() => {
        // Map dynamic answers to legacy fields for compatibility
        const updated = { ...formData };
        updated.complaints = formData.answers["complaints"] || "";
        updated.painLocation = formData.answers["pain_location"] || "";
        updated.painDuration = formData.answers["pain_duration"] || "";
        updated.painType = formData.answers["pain_type"] || "";
        updated.painIntensity = formData.answers["pain_intensity"] || "";
        updated.previousTreatment = formData.answers["previous_treatment"] || "";
        
        onChange(updated);
    }, [formData]);

    const addQuestion = () => {
        const newQ: Question = {
            id: `q_${Date.now()}`,
            label: "Новый вопрос",
            type: "text",
            options: []
        };
        onQuestionsChange([...questions, newQ]);
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newQuestions.length) {
            [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
            onQuestionsChange(newQuestions);
        }
    };

    const nextStep = () => {
        if (validateStage(step)) {
            if (step === 2 && formData.paymentStatus === "declined") {
                handleConfirm();
            } else {
                setStep((s) => Math.min(s + 1, totalSteps));
            }
        }
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const validateStage = (currentStep: number) => {
        if (currentStep === 1) {
            const missing = questions.filter(q => q.required && !formData.answers[q.id]);
            if (missing.length > 0) {
                toast({ title: "Внимание", description: `Заполните обязательное поле: "${missing[0].label}"`, variant: "destructive" });
                return false;
            }
        }
        // Other steps validation stays similar
        switch (currentStep) {
            case 2:
                if (!formData.paymentStatus) {
                    toast({ title: "Внимание", description: "Выберите статус оплаты", variant: "destructive" });
                    return false;
                }
                if (formData.paymentStatus === "paid" && (!formData.bookingDate || !formData.bookingTime || !formData.bookingDoctor)) {
                    toast({ title: "Внимание", description: "Для подтвержденной оплаты необходимо выбрать время и врача", variant: "destructive" });
                    return false;
                }
                if (formData.paymentStatus === "declined" && !formData.refusalReason) {
                    toast({ title: "Внимание", description: "Укажите причину отказа", variant: "destructive" });
                    return false;
                }
                break;
            case 3:
                if (!formData.finalFio || !formData.finalPhone) {
                    toast({ title: "Внимание", description: "Заполните ФИО и телефон пациента", variant: "destructive" });
                    return false;
                }
                break;
        }
        return true;
    };

    const handleConfirm = () => {
        const stageToValidate = (step === 2 && formData.paymentStatus === "declined") ? 2 : 3;
        if (validateStage(stageToValidate)) {
            setFormData(prev => ({ ...prev, confirmed: true }));
            if (formData.paymentStatus === "declined") {
                toast({ title: "Отказ зафиксирован", description: "Сделка будет переведена в архив/отказ." });
            } else {
                toast({ title: "Подтверждено", description: "Запись подтверждена. Передача врачу." });
            }
            if (onSave) onSave();
            if (formData.paymentStatus !== "declined") {
                onNext();
            }
        }
    };

    const toggleArrayItem = (field: keyof AdminFormData, item: string) => {
        setFormData(prev => {
            const current = (prev[field] as string[]) || [];
            return {
                ...prev,
                [field]: current.includes(item)
                    ? current.filter(i => i !== item)
                    : [...current, item]
            };
        });
    };

    const stages = [
        { id: 1, title: "Опрос" },
        { id: 2, title: "Презентация и Оплата" },
        { id: 3, title: "Завершение" },
    ];

    // Inline edit states for Step 4
    const [editPatientData, setEditPatientData] = useState(false);
    const [editBookingData, setEditBookingData] = useState(false);


    return (
        <div className="flex flex-col h-full space-y-10 animate-in fade-in pb-16 max-w-6xl mx-auto w-full">
            {/* High-End Progress Stepper */}
            <div className="relative px-4 py-8 bg-secondary/10 rounded-[40px] border border-border/20 shadow-inner">
                <div className="flex items-center justify-between relative z-10 max-w-2xl mx-auto w-full">
                    {stages.map((s, i) => {
                        const isCurrent = step === s.id;
                        const isCompleted = step > s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-3 group">
                                    <div className={cn(
                                        "flex items-center justify-center h-12 w-12 rounded-[22px] text-xs font-black transition-all duration-500 border-2",
                                        isCurrent ? "border-primary bg-primary shadow-xl shadow-primary/30 text-white scale-110" :
                                        isCompleted ? "bg-primary border-primary text-white" : "border-border/60 bg-secondary/10 text-muted-foreground/40"
                                    )}>
                                        {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : s.id}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                                        isCurrent ? "text-primary" : "text-muted-foreground/40"
                                    )}>
                                        {s.title}
                                    </span>
                                </div>
                                {i < stages.length - 1 && (
                                    <div className="flex-1 px-4 mb-6">
                                        <div className={cn(
                                            "h-[3px] rounded-full transition-all duration-700",
                                            isCompleted ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "bg-border/30"
                                        )} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                {/* Subtle background glow for the active step */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden rounded-[40px]">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </div>
            </div>

            <div className="w-full">
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">Шаг 1. Опрос пациента</h2>
                                    <p className="text-xs text-muted-foreground">Слушайте внимательно. Ведите пациента мягко.</p>
                                </div>
                            </div>
                            {!readOnly && (
                                <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5 rounded-lg h-8 text-xs">
                                    <Plus className="h-3.5 w-3.5" /> Вопрос
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-6">
                            {questions.map((q, qIndex) => (
                                <div key={q.id} className="group/q bg-card border border-border/20 hover:border-primary/30 rounded-[32px] p-6 transition-all hover:shadow-xl hover:shadow-black/20 relative">
                                    <div className="flex items-start gap-6">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0 border border-primary/20 group-hover/q:scale-110 transition-transform">
                                            <span className="text-[10px] font-black uppercase leading-none mb-0.5 opacity-40">Q</span>
                                            <span className="text-sm font-black leading-none">{qIndex + 1}</span>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[13px] font-black uppercase tracking-widest text-foreground/80 leading-relaxed">
                                                    {q.label}
                                                    {q.required && <span className="text-primary ml-1.5">*</span>}
                                                </Label>
                                                
                                                {!readOnly && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-xl text-muted-foreground/30 hover:text-primary hover:bg-primary/5"
                                                            onClick={() => {
                                                                const el = document.getElementById(`q-editor-${q.id}`);
                                                                if (el) el.classList.toggle('hidden');
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5"
                                                            onClick={() => onQuestionsChange(questions.filter(item => item.id !== q.id))}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Answer Input */}
                                            <div className="relative">
                                                {q.type === "textarea" ? (
                                                    <Textarea
                                                        placeholder="ВВЕДИТЕ РАЗВЕРНУТЫЙ ОТВЕТ..."
                                                        className="h-24 bg-secondary/5 border-none rounded-2xl p-5 text-[11px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/20 shadow-inner resize-none"
                                                        value={formData.answers[q.id] || ""}
                                                        onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                        disabled={readOnly}
                                                    />
                                                ) : q.type === "text" ? (
                                                    <Input
                                                        placeholder="ОТВЕТ ПАЦИЕНТА..."
                                                        className="h-14 bg-secondary/5 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/20 shadow-inner"
                                                        value={formData.answers[q.id] || ""}
                                                        onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                        disabled={readOnly}
                                                    />
                                                ) : (q.type === "radio" || q.type === "checkbox") && q.options ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options.map((opt) => {
                                                            const isSelected = q.type === "radio"
                                                                ? formData.answers[q.id] === opt.id
                                                                : (Array.isArray(formData.answers[q.id]) && formData.answers[q.id].includes(opt.id));
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
                                                                        if (q.type === "radio") {
                                                                            setFormData({ ...formData, answers: { ...formData.answers, [q.id]: opt.id } });
                                                                        } else {
                                                                            const current = Array.isArray(formData.answers[q.id]) ? formData.answers[q.id] : [];
                                                                            const newVal = current.includes(opt.id)
                                                                                ? current.filter((i: string) => i !== opt.id)
                                                                                : [...current, opt.id];
                                                                            setFormData({ ...formData, answers: { ...formData.answers, [q.id]: newVal } });
                                                                        }
                                                                    }}
                                                                    disabled={readOnly}
                                                                >
                                                                    {isSelected && <Check className="h-4 w-4 inline mr-2" />}
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline editor */}
                                    {!readOnly && (
                                        <div id={`q-editor-${q.id}`} className="hidden pt-6">
                                            <QuestionEditor
                                                question={q}
                                                onUpdate={(updated) => onQuestionsChange(questions.map(item => item.id === q.id ? updated : item))}
                                                onDelete={() => onQuestionsChange(questions.filter(item => item.id !== q.id))}
                                                onMoveUp={() => moveQuestion(qIndex, 'up')}
                                                onMoveDown={() => moveQuestion(qIndex, 'down')}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Presentation & Payment Selection */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-10 max-w-6xl mx-auto w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight uppercase">2. Презентация и Оплата</h2>
                                    <p className="text-sm text-muted-foreground font-medium">Покажите пользу диагностики и выберите статус оплаты.</p>
                                </div>
                            </div>
                        </div>

                        {/* Presentation Cards (Value propositions) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { icon: Stethoscope, title: "Терапевт", desc: "Общий осмотр, анамнез." },
                                { icon: Activity, title: "Реабилитолог", desc: "Позвоночник, подвижность." },
                                { icon: FileSearch, title: "Анализ МРТ", desc: "Разбор ваших МРТ/результатов." },
                                { icon: Zap, title: "Процедура", desc: "Первая процедура для боли." }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-primary/[0.03] border border-primary/5 hover:bg-primary/[0.06] transition-all cursor-default group">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-foreground leading-tight uppercase">{item.title}</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Invoice & Status Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
                            {/* Left: Invoice Controls */}
                            <div className="p-8 rounded-[40px] bg-secondary/10 border-none relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-background shadow-xl flex items-center justify-center border border-border/20">
                                            <Smartphone className="h-6 w-6 text-[#00A2E8]" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00A2E8]">KASPI.KZ</span>
                                            <h3 className="text-lg font-black uppercase tracking-tight">Счет на оплату</h3>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.15em] leading-relaxed text-muted-foreground/60">
                                        Предоплата 5 000 ₸. Входит в стоимость диагностики. Оплата подтверждает серьезность намерений.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black tracking-widest text-muted-foreground/60 ml-1">НОМЕР ДЛЯ СЧЕТА</Label>
                                            <Input 
                                                value={formData.invoicePhone}
                                                onChange={e => setFormData({ ...formData, invoicePhone: e.target.value })}
                                                placeholder="+7 (___) ___-__-__"
                                                className="h-12 bg-white border-none rounded-2xl px-5 text-sm font-black"
                                            />
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-14 rounded-2xl gap-3 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"
                                            onClick={() => toast({ title: "СЧЕТ ОТПРАВЛЕН", description: `Запрос на 5 000 ₸ отправлен на ${formData.invoicePhone}` })}
                                        >
                                            <MessageSquare className="h-4 w-4" /> Отправить счет
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Status Selection */}
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-4">Выберите результат этапа</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: "pending", label: "Ожидание оплаты", desc: "Оплатит позже", color: "amber", icon: Clock },
                                        { id: "paid", label: "Оплачено", desc: "Подтверждено", color: "emerald", icon: CheckCircle2 },
                                        { id: "declined", label: "Отказ", desc: "Не согласен", color: "rose", icon: X },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setFormData({ 
                                                ...formData, 
                                                paymentStatus: item.id as any,
                                                refusalReason: item.id === "declined" ? formData.refusalReason : "",
                                                prepaymentAmount: item.id === "paid" ? "5000" : ""
                                            })}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all duration-300",
                                                formData.paymentStatus === item.id 
                                                    ? `border-${item.color}-500 bg-${item.color}-500 shadow-2xl shadow-${item.color}-500/20 text-white scale-105` 
                                                    : "border-border/20 bg-card hover:border-primary/20",
                                            )}
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                                                formData.paymentStatus === item.id ? "bg-white/20" : `bg-${item.color}-500/10`
                                            )}>
                                                <item.icon className={cn(
                                                    "h-6 w-6",
                                                    formData.paymentStatus === item.id ? "text-white" : `text-${item.color}-500`
                                                )} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-black uppercase tracking-wider">{item.label}</p>
                                                <p className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest opacity-40 mt-0.5",
                                                    formData.paymentStatus === item.id ? "text-white/60" : "text-muted-foreground"
                                                )}>{item.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Conditional View: REFUSAL REASONS */}
                                {formData.paymentStatus === "declined" && (
                                    <div className="p-8 rounded-[32px] bg-rose-500/5 border border-rose-500/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-rose-600 ml-1">Укажите причину отказа</Label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {["Дорого", "Другой город", "Подумает", "Не сейчас", "Другое"].map(reason => (
                                                <button
                                                    key={reason}
                                                    onClick={() => setFormData({ ...formData, refusalReason: reason })}
                                                    className={cn(
                                                        "h-10 px-4 rounded-xl text-[10px] font-bold uppercase transition-all",
                                                        formData.refusalReason === reason 
                                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                                                            : "bg-white border border-rose-500/20 text-rose-600 hover:bg-rose-50/10"
                                                    )}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                        {formData.refusalReason === "Другое" && (
                                            <Input 
                                                placeholder="Своя причина..."
                                                value={formData.refusalReasonOther || ""}
                                                onChange={e => setFormData({ ...formData, refusalReasonOther: e.target.value })}
                                                className="bg-white border-rose-500/40 rounded-xl h-12 text-sm"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Conditional View: PAID (AMOUNT + BOOKING) */}
                                {formData.paymentStatus === "paid" && (
                                    <div className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                                    <CreditCard className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wide text-emerald-600">Подтверждение и Запись</h3>
                                                    <p className="text-[10px] font-bold uppercase text-emerald-500/60 tracking-wider">Оплата подтверждена, выберите время приема</p>
                                                </div>
                                            </div>
                                            <div className="w-32">
                                                <Label className="text-[9px] uppercase font-bold text-emerald-600 mb-1 block">Сумма (₸)</Label>
                                                <Input 
                                                    type="number"
                                                    value={formData.prepaymentAmount}
                                                    onChange={e => setFormData({ ...formData, prepaymentAmount: e.target.value })}
                                                    className="h-10 bg-white border-emerald-500/40 font-black text-emerald-600 text-center"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white rounded-[24px] shadow-sm border border-border/40">
                                            <BookingWidget
                                                selectedDate={formData.bookingDate}
                                                selectedTime={formData.bookingTime}
                                                selectedDoctor={formData.bookingDoctor}
                                                onBookingChange={(booking) => setFormData({ 
                                                    ...formData, 
                                                    bookingDate: booking.date, 
                                                    bookingTime: booking.time,
                                                    bookingDoctor: booking.doctor
                                                })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* STEP 3: SUMMARY */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Flag className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">3. Финал и подтверждение</h2>
                                    <p className="text-muted-foreground">Обязательно перепроверьте данные перед передачей врачу.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Блок 1. Данные пациента */}
                            <div className="p-6 rounded-[32px] bg-secondary/5 border border-border/50 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" /> Данные пациента
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => !readOnly && setEditPatientData(!editPatientData)} className="h-8 text-xs gap-1" disabled={readOnly}>
                                        <Edit2 className="h-3 w-3" /> {editPatientData ? "Готово" : "Изменить"}
                                    </Button>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">ФИО пациента</Label>
                                        {editPatientData ? (
                                            <Input value={formData.finalFio} onChange={e => setFormData({...formData, finalFio: e.target.value})} className="h-9"/>
                                        ) : (
                                            <p className="font-semibold">{formData.finalFio || "Не указано"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Телефон</Label>
                                        {editPatientData ? (
                                            <Input value={formData.finalPhone} onChange={e => setFormData({...formData, finalPhone: e.target.value})} className="h-9"/>
                                        ) : (
                                            <p className="font-semibold">{formData.finalPhone || "Не указан"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Блок 2. Запись на диагностику */}
                            <div className="p-6 rounded-[32px] bg-secondary/5 border border-border/50 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" /> Запись
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => !readOnly && setEditBookingData(!editBookingData)} className="h-8 text-xs gap-1" disabled={readOnly}>
                                        <Edit2 className="h-3 w-3" /> {editBookingData ? "Готово" : "Изменить"}
                                    </Button>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Дата и время</Label>
                                        {editBookingData ? (
                                            <Button variant="link" size="sm" onClick={() => setStep(2)}>Выбрать заново</Button>
                                        ) : (
                                            <p className="font-semibold text-right">{formData.bookingDate?.toLocaleDateString()} в {formData.bookingTime}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Врач</Label>
                                        <p className="font-semibold text-right">{formData.bookingDoctor || "Не выбран"}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Предоплата</Label>
                                        {editBookingData ? (
                                            <Button variant="link" size="sm" onClick={() => setStep(2)}>Изменить</Button>
                                        ) : (
                                            <p className={cn("font-semibold text-right", formData.paymentStatus === "paid" ? "text-emerald-500" : "text-amber-500")}>
                                                {formData.paymentStatus === "paid" ? "Оплачено" : formData.paymentStatus === "declined" ? "Отказ" : "Ожидается"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Блок 3. Выжимка анкеты */}
                            <div className="md:col-span-2 p-6 rounded-[32px] bg-primary/5 border border-primary/20 space-y-4">
                                <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2 text-primary">
                                        <ClipboardList className="h-5 w-5" /> Краткая выжимка (Для врача)
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => !readOnly && setStep(1)} className="h-8 text-xs gap-1 text-primary hover:bg-primary/10" disabled={readOnly}>
                                        <Edit2 className="h-3 w-3" /> Изменить анкету
                                    </Button>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <p className="text-sm"><strong>Основная жалоба:</strong> {formData.complaints || "Не указана"}</p>
                                    <p className="text-sm"><strong>Локализация:</strong> {formData.painLocation} {formData.painLocationOther}</p>
                                    <p className="text-sm"><strong>МРТ/КТ:</strong> {formData.mriCtHistory === "yes" ? "Да" : "Нет"}</p>
                                </div>
                            </div>
                        </div>

                        {!readOnly && (
                            <div className="flex justify-end pt-4">
                                <Button 
                                    onClick={handleConfirm}
                                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm uppercase gap-3 shadow-xl shadow-primary/20"
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                    Подтвердить запись
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            {step < 3 && (
                <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-8 border-t border-border mt-8">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1}
                        className="gap-2 font-semibold uppercase tracking-wider text-xs h-12 px-6 rounded-2xl"
                    >
                        <ArrowLeft className="h-4 w-4" /> Назад
                    </Button>
                    <Button
                        onClick={nextStep}
                        className="gap-2 px-8 h-12 font-semibold uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-primary/20 transition-all"
                    >
                        Далее <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
