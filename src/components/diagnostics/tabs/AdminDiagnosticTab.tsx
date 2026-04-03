import React, { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Check, Calendar, ClipboardList, Loader2,
    X, CreditCard, CheckCircle2, 
    Edit2, Trash2, Plus, GripVertical, ChevronUp, ChevronDown, 
    Stethoscope, Activity, FileSearch, Zap, ArrowRight, User, DoorOpen
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingWidget } from "../../crm/BookingWidget";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export interface Question {
    id: string;
    label: string;
    type: "text" | "textarea" | "radio" | "checkbox" | "select";
    options?: { id: string; label: string }[];
    required?: boolean;
    section?: string;
}

export const DEFAULT_QUESTIONS: Question[] = [
    {
        id: "source",
        label: "Источник заявки",
        type: "select",
        options: [
            { id: "ad", label: "реклама" },
            { id: "site", label: "сайт" },
            { id: "whatsapp", label: "WhatsApp" },
            { id: "other", label: "другое" }
        ],
        required: true
    },
    {
        id: "complaints",
        label: "Жалобы пациента",
        type: "textarea",
        required: true
    },
    {
        id: "pain_location",
        label: "Локализация боли",
        type: "checkbox",
        options: [
            { id: "neck", label: "шея" },
            { id: "shoulder", label: "плечо" },
            { id: "elbow", label: "локоть" },
            { id: "wrist", label: "запястье" },
            { id: "thoracic", label: "грудной отдел" },
            { id: "lower_back", label: "поясница" },
            { id: "hip", label: "тазобедренный" },
            { id: "knee", label: "колено" },
            { id: "ankle", label: "голеностоп" }
        ]
    },
    {
        id: "problem_duration",
        label: "Длительность проблемы",
        type: "select",
        options: [
            { id: "days", label: "несколько дней" },
            { id: "weeks", label: "несколько недель" },
            { id: "months", label: "несколько месяцев" },
            { id: "year_plus", label: "> года" }
        ]
    },
    {
        id: "pain_character",
        label: "Характер боли",
        type: "checkbox",
        options: [
            { id: "aching", label: "ноющая" },
            { id: "acute", label: "острая" },
            { id: "shooting", label: "стреляющая" },
            { id: "pulling", label: "тянущая" },
            { id: "burning", label: "жгучая" }
        ]
    }
];

export interface AdminFormData {
    answers: Record<string, any>;
    bookingDate?: Date;
    bookingTime?: string;
    bookingDoctor?: string;
    bookingCabinet?: string;
    adminComment: string;
    paymentMethod: string;
    paymentStatus: "pending" | "paid" | "declined";
    prepaymentAmount: string;
    refusalReason: string;
    confirmed: boolean;
    finalFio: string;
    finalPhone: string;
    invoicePhone: string;
    complaints: string;
    painLocation: string;
    painDuration: string;
    painType: string;
    painIntensity: string;
    previousTreatment: string;
}

interface QuestionEditorProps {
    question: Question;
    onUpdate: (q: Question) => void;
    onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdate, onCancel }) => {
    const [editLabel, setEditLabel] = useState(question.label);
    const [editType, setEditType] = useState(question.type);

    return (
        <div className="p-6 bg-secondary/10 border border-primary/20 rounded-[24px] space-y-4 animate-in zoom-in-95">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Текст вопроса</Label>
                    <Input 
                        value={editLabel} 
                        onChange={e => setEditLabel(e.target.value)} 
                        className="bg-background/50 border-none rounded-xl h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Тип ответа</Label>
                    <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                        <SelectTrigger className="bg-background/50 border-none rounded-xl h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[160]">
                            <SelectItem value="text">Текст (строка)</SelectItem>
                            <SelectItem value="textarea">Текст (абзац)</SelectItem>
                            <SelectItem value="select">Выпадающий список</SelectItem>
                            <SelectItem value="checkbox">Множественный выбор</SelectItem>
                            <SelectItem value="radio">Одиночный выбор</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {(editType === "select" || editType === "checkbox" || editType === "radio") && (
                <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Варианты ответов</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {(question.options || []).map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input 
                                    value={opt.label}
                                    onChange={(e) => {
                                        const newOpts = [...(question.options || [])];
                                        newOpts[idx] = { ...newOpts[idx], label: e.target.value };
                                        onUpdate({ ...question, label: editLabel, type: editType, options: newOpts });
                                    }}
                                    className="h-10 bg-background/30 border-none rounded-lg text-xs"
                                    placeholder="Вариант..."
                                />
                                <Button 
                                    variant="ghost" size="icon" 
                                    className="h-10 w-10 text-destructive/40 hover:text-destructive shrink-0"
                                    onClick={() => {
                                        const newOpts = (question.options || []).filter((_, i) => i !== idx);
                                        onUpdate({ ...question, options: newOpts });
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="outline" size="sm" 
                            className="border-dashed border-primary/30 h-10 rounded-xl gap-2 font-bold text-[10px] uppercase"
                            onClick={() => {
                                const newOpts = [...(question.options || []), { id: `opt_${Date.now()}`, label: "Новый вариант" }];
                                onUpdate({ ...question, options: newOpts });
                            }}
                        >
                            <Plus className="h-4 w-4" /> Добавить вариант
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" className="rounded-xl h-10 px-6 text-xs uppercase font-black" onClick={onCancel}>Отмена</Button>
                <Button className="rounded-xl h-10 px-8 text-xs uppercase font-black" onClick={() => onUpdate({ ...question, label: editLabel, type: editType })}>Применить</Button>
            </div>
        </div>
    );
};

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

export const AdminDiagnosticTab: React.FC<Props> = ({ 
    lead, data, questions, onQuestionsChange, onChange, onNext, readOnly = false, onSave 
}) => {
    const { role } = useRole();
    const canManageQuestions = (role === "superadmin" || role === "client_admin") && !readOnly;
    
    const [step, setStep] = useState(1);
    const [attemptedNext, setAttemptedNext] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<AdminFormData>(data || {
        answers: {},
        adminComment: "",
        paymentMethod: "Kaspi",
        paymentStatus: lead.status === "Записан" ? "paid" : "pending",
        prepaymentAmount: lead.amount ? String(lead.amount) : "15000",
        refusalReason: "",
        confirmed: false,
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
        invoicePhone: lead.phone || "",
        complaints: "",
        painLocation: "",
        painDuration: "",
        painType: "",
        painIntensity: "",
        previousTreatment: "",
        bookingDoctor: lead.doctor_name || "",
        bookingCabinet: "",
        bookingDate: lead.scheduled_at ? new Date(lead.scheduled_at) : undefined,
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const addQuestion = () => {
        const newQ: Question = {
            id: `q_${Date.now()}`,
            label: "Новый вопрос",
            type: "text",
            options: []
        };
        onQuestionsChange([...questions, newQ]);
        setEditingId(newQ.id);
    };

    const validateStage = (currentStep: number) => {
        if (currentStep === 1) {
            const missing = questions.filter(q => q.required && !formData.answers[q.id]);
            if (missing.length > 0) {
                toast({ 
                    title: "Заполните обязательные поля", 
                    description: `Необходимо ответить на: ${missing[0].label}`, 
                    variant: "destructive" 
                });
                return false;
            }
        }
        if (currentStep === 2) {
            if (!formData.bookingDate || !formData.bookingTime || !formData.bookingDoctor) {
                toast({ 
                    title: "Запись не зафиксирована", 
                    description: "Выберите дату, время и врача для проведения диагностики", 
                    variant: "destructive" 
                });
                return false;
            }
        }
        return true;
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto w-full pb-20">
            {/* Steps Visualizer */}
            <div className="flex justify-between items-center px-12 py-8 bg-secondary/5 rounded-[40px] border border-white/5 shadow-inner">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-3">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all duration-300 border-2",
                            step === s ? "bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-110" : 
                            step > s ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-white/10 text-muted-foreground/30"
                        )}>
                            {step > s ? <Check className="h-6 w-6" /> : s}
                        </div>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", step === s ? "text-primary" : "text-muted-foreground/40")}>
                            {s === 1 ? "Анкета" : s === 2 ? "Запись и Продажа" : "Готовность"}
                        </span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Анкетирование пациента</h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Слушайте пациента, заполняйте карту</p>
                        </div>
                        {canManageQuestions && (
                            <Button variant="outline" size="sm" onClick={addQuestion} className="h-9 px-5 rounded-xl gap-2 font-black text-[10px] uppercase border-primary/20 hover:bg-primary/5">
                                <Plus className="h-4 w-4" /> Добавить вопрос
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="group relative">
                                <div className={cn(
                                    "p-8 rounded-[36px] border bg-card transition-all duration-300",
                                    editingId === q.id ? "ring-2 ring-primary border-primary/50" : "border-border/30 hover:border-primary/20 shadow-sm"
                                )}>
                                    <div className="flex items-start gap-8">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-secondary/10 flex items-center justify-center font-black text-sm text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[12px] font-black uppercase tracking-widest text-foreground/80 leading-relaxed">
                                                    {q.label} {q.required && <span className="text-primary">*</span>}
                                                </Label>
                                                {canManageQuestions && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingId(editingId === q.id ? null : q.id)} className="h-8 w-8 rounded-lg hover:bg-primary/5 text-primary/40 hover:text-primary">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => onQuestionsChange(questions.filter(item => item.id !== q.id))} className="h-8 w-8 rounded-lg hover:bg-destructive/5 text-destructive/40 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {editingId === q.id ? (
                                                <QuestionEditor 
                                                    question={q} 
                                                    onUpdate={(updated) => {
                                                        onQuestionsChange(questions.map(item => item.id === q.id ? updated : item));
                                                        setEditingId(null);
                                                    }}
                                                    onCancel={() => setEditingId(null)}
                                                />
                                            ) : (
                                                <div className="pt-2">
                                                    {q.type === "select" ? (
                                                        <Select 
                                                            value={formData.answers[q.id] || ""} 
                                                            onValueChange={(val) => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: val } })}
                                                        >
                                                            <SelectTrigger className="h-14 bg-secondary/10 border-none rounded-2xl px-6 font-bold text-xs uppercase tracking-widest focus:ring-1">
                                                                <SelectValue placeholder="ВЫБЕРИТЕ ВАРИАНТ..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[150] rounded-[24px]">
                                                                {(q.options || []).map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : q.type === "textarea" ? (
                                                        <Textarea 
                                                            className="bg-secondary/10 border-none rounded-2xl min-h-[120px] p-6 text-sm font-medium"
                                                            value={formData.answers[q.id] || ""}
                                                            onChange={e => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                            placeholder="Ответ пациента..."
                                                        />
                                                    ) : q.type === "text" ? (
                                                        <Input 
                                                            className="h-14 bg-secondary/10 border-none rounded-2xl px-6 text-sm font-medium"
                                                            value={formData.answers[q.id] || ""}
                                                            onChange={e => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                                                            placeholder="Ответ пациента..."
                                                        />
                                                    ) : (q.type === "checkbox" || q.type === "radio") ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(q.options || []).map(opt => {
                                                                const isSelected = q.type === "radio" 
                                                                    ? formData.answers[q.id] === opt.id 
                                                                    : (Array.isArray(formData.answers[q.id]) && formData.answers[q.id].includes(opt.id));
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() => {
                                                                            if (q.type === "radio") {
                                                                                setFormData({ ...formData, answers: { ...formData.answers, [q.id]: opt.id } });
                                                                            } else {
                                                                                const current = Array.isArray(formData.answers[q.id]) ? formData.answers[q.id] : [];
                                                                                const newVal = current.includes(opt.id) ? current.filter((i: any) => i !== opt.id) : [...current, opt.id];
                                                                                setFormData({ ...formData, answers: { ...formData.answers, [q.id]: newVal } });
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                                                            isSelected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-secondary/5 border-white/5 text-muted-foreground/50 hover:border-primary/30"
                                                                        )}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-8">
                        <Button onClick={() => validateStage(1) && setStep(2)} className="h-16 px-12 rounded-3xl font-black text-xs uppercase tracking-widest bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Далее: Фиксация записи <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Booking Widget Column */}
                        <div className="bg-card border border-border/40 rounded-[40px] p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest">Запись на диагностику</h2>
                            </div>
                            
                            <BookingWidget 
                                selectedDate={formData.bookingDate}
                                selectedTime={formData.bookingTime}
                                selectedDoctor={formData.bookingDoctor}
                                onBookingChange={(b) => setFormData({
                                    ...formData,
                                    bookingDate: b.date,
                                    bookingTime: b.time,
                                    bookingDoctor: b.doctor,
                                    bookingCabinet: b.cabinet
                                })}
                            />
                        </div>

                        {/* Payment & Conditions Column */}
                        <div className="space-y-8">
                            <div className="bg-card border border-border/40 rounded-[40px] p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest">Оплата и финансы</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest ml-1">Стоимость диагностики (₸)</Label>
                                        <Input 
                                            type="number"
                                            className="h-14 bg-secondary/5 border-border/40 rounded-2xl text-xl font-black px-6"
                                            value={formData.prepaymentAmount}
                                            onChange={e => setFormData({ ...formData, prepaymentAmount: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest ml-1">Статус оплаты</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setFormData({ ...formData, paymentStatus: "paid" })}
                                                className={cn(
                                                    "h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                                    formData.paymentStatus === "paid" 
                                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                                        : "bg-transparent border-white/5 text-muted-foreground/40 hover:border-emerald-500/30"
                                                )}
                                            >
                                                Оплачено
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, paymentStatus: "pending" })}
                                                className={cn(
                                                    "h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                                    formData.paymentStatus === "pending" 
                                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                                                        : "bg-transparent border-white/5 text-muted-foreground/40 hover:border-amber-500/30"
                                                )}
                                            >
                                                Лист ожидания
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <Textarea 
                                            placeholder="Внутренний комментарий администратора..."
                                            className="min-h-[100px] bg-secondary/5 border-border/40 rounded-[24px] p-5 text-xs font-bold"
                                            value={formData.adminComment}
                                            onChange={e => setFormData({ ...formData, adminComment: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Block */}
                            <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex items-start gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Важно</p>
                                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                                        После завершения заявка перейдет в статус "ЗАПИСАН" и появится в терминале врача для проведения диагностики.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setStep(1)} className="h-16 px-10 rounded-3xl uppercase font-black text-[10px] tracking-widest">Назад</Button>
                        <Button onClick={() => validateStage(2) && setStep(3)} className="h-16 px-14 rounded-3xl font-black text-xs uppercase tracking-[0.2em] bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Зафиксировать диагностику <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="p-12 bg-emerald-500/5 border border-emerald-500/10 rounded-[50px] text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
                        <div className="h-24 w-24 bg-emerald-500/20 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/20 shadow-inner">
                            <Check className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Диагностика продана</h2>
                            <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.3em]">Patient is ready for examination</p>
                        </div>
                        
                        <div className="p-8 bg-white/50 dark:bg-card border border-white/20 rounded-[32px] space-y-4 text-left">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Врач</span>
                                <span className="text-sm font-black">{formData.bookingDoctor}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Дата и время</span>
                                <span className="text-sm font-black">{formData.bookingDate ? format(formData.bookingDate, "dd.MM.yyyy") : "—"} в {formData.bookingTime}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Стоимость</span>
                                <span className="text-sm font-black text-emerald-600">{formData.prepaymentAmount} ₸</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-6">
                            <Button onClick={() => { if (onSave) onSave(); onNext(); }} className="h-20 w-full rounded-[32px] uppercase font-black text-xs tracking-[0.2em] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] transition-all">
                                Завершить и передать врачу
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(2)} className="h-12 uppercase font-black text-[9px] tracking-widest text-muted-foreground">
                                Вернуться и отредактировать
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
