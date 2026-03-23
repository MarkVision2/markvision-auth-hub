import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Stethoscope, ArrowRight, ArrowLeft, Check,
    Calendar, ClipboardList, Star, CheckCheck, Loader2,
    MessageCircle, ShieldCheck, Heart, Info, Send, Phone, User, Clock, MapPin, Receipt, X,
    CreditCard, Smartphone, MessageSquare, Flag, CheckCircle2, ShieldAlert, History as LucideHistory
} from "lucide-react";
import { Lead } from "./KanbanBoard";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { BookingWidget } from "./BookingWidget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FormData {
    // Stage 1: Finding the problem
    complaints: string;
    painLocation: string;
    painLocationOther: string;
    painDuration: string;
    painType: string;

    // Stage 2: Symptoms and condition
    painTriggers: string[];
    painTriggersOther: string;
    painRadiation: string[];
    painRadiationOther: string;
    numbness: string;
    painIntensity: string;
    lifeImpact: string[];
    lifeImpactOther: string;
    previousTreatment: string;
    treatmentMethods: string;
    doctorsSeen: string;
    mriCtHistory: string;
    hasResults: string;
    
    // Presentation
    presentationDone: boolean;

    // Booking
    bookingDate?: Date;
    bookingTime?: string;
    bookingDoctor?: string;
    adminComment: string;

    // Prepayment
    kaspiLinked: string;
    paymentMethod: string;
    paymentAmount: number;
    paymentStatus: "pending" | "paid" | "declined";
    confirmed: boolean;

    // Confirmation
    finalFio: string;
    finalPhone: string;
    reminderNeeded: string;
    knowsAddress: string;
    confirmationComment: string;
}

interface DiagnosticMapProps {
    lead: Lead;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: (data: any) => void;
}

export const DiagnosticMap: React.FC<DiagnosticMapProps> = ({ lead, open, onOpenChange, onComplete }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        complaints: "",
        painLocation: "",
        painLocationOther: "",
        painDuration: "",
        painType: "",
        painTriggers: [],
        painTriggersOther: "",
        painRadiation: [],
        painRadiationOther: "",
        numbness: "",
        painIntensity: "",
        lifeImpact: [],
        lifeImpactOther: "",
        previousTreatment: "",
        treatmentMethods: "",
        doctorsSeen: "no",
        mriCtHistory: "no",
        hasResults: "no",
        presentationDone: false,
        bookingDate: undefined,
        bookingTime: "",
        bookingDoctor: "",
        adminComment: "",
        kaspiLinked: "u",
        paymentMethod: "Kaspi",
        paymentAmount: 9990,
        paymentStatus: "pending",
        confirmed: false,
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
        reminderNeeded: "yes",
        knowsAddress: "yes",
        confirmationComment: "",
    });
    const totalSteps = 4;

    const adminName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Администратор";

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                handleAutosave();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [formData, step]);

    const handleAutosave = async () => {
        console.log("Autosaving...", formData);
    };

    const nextStep = () => {
        if (validateStage(step)) {
            setStep((s) => Math.min(s + 1, totalSteps));
        }
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const validateStage = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                if (!formData.complaints || !formData.painLocation || !formData.painDuration || !formData.painType) {
                    toast({ title: "Внимание", description: "Заполните обязательные поля первого этапа", variant: "destructive" });
                    return false;
                }
                break;
            case 2:
                if (!formData.bookingDate || !formData.bookingTime || !formData.bookingDoctor) {
                    toast({ title: "Внимание", description: "Для перехода укажите время и врача", variant: "destructive" });
                    return false;
                }
                break;
            case 3:
                if (!formData.paymentStatus) {
                    toast({ title: "Внимание", description: "Выберите статус оплаты", variant: "destructive" });
                    return false;
                }
                break;
            case 4:
                if (!formData.finalFio || !formData.finalPhone) {
                    toast({ title: "Внимание", description: "Заполните ФИО и телефон пациента", variant: "destructive" });
                    return false;
                }
                break;
        }
        return true;
    };

    const toggleArrayItem = (field: keyof FormData, item: string) => {
        setFormData(prev => {
            const current = prev[field] as string[];
            return {
                ...prev,
                [field]: current.includes(item)
                    ? current.filter(i => i !== item)
                    : [...current, item]
            };
        });
    };

    const handleFinalSave = async () => {
        setIsSaving(true);
        try {
            const summary = `
[ДИАГНОСТИЧЕСКАЯ КАРТА]
1. ВЫЯВЛЕНИЕ ПРОБЛЕМЫ
- Жалобы: ${formData.complaints}
- Локализация: ${formData.painLocation === "other" ? formData.painLocationOther : formData.painLocation}
- Длительность: ${formData.painDuration}
- Характер: ${formData.painType}

2. УТОЧНЕНИЕ СОСТОЯНИЯ
- Триггеры: ${formData.painTriggers.join(", ")}${formData.painTriggersOther ? ` (+ ${formData.painTriggersOther})` : ""}
- Куда отдает: ${formData.painRadiation.join(", ")}${formData.painRadiationOther ? ` (+ ${formData.painRadiationOther})` : ""}
- Онемение/покалывание: ${formData.numbness}
- Интенсивность: ${formData.painIntensity}/10
- Влияние на жизнь: ${formData.lifeImpact.join(", ")}${formData.lifeImpactOther ? ` (+ ${formData.lifeImpactOther})` : ""}

3. ДОПОЛНИТЕЛЬНО
- Пробовали лечить: ${formData.previousTreatment}
- Методы: ${formData.treatmentMethods}
- Обращались к врачам: ${formData.doctorsSeen === "yes" ? "Да" : "Нет"}
- МРТ/КТ/Рентген: ${formData.mriCtHistory === "yes" ? "Да" : "Нет"}
- Результаты на руках: ${formData.hasResults === "yes" ? "Да" : "Нет"}

ЗАПИСЬ И ОПЛАТА
- Запись: ${formData.bookingDate ? `${formData.bookingDate.toLocaleDateString()} в ${formData.bookingTime}` : "Не назначена"}
- Статус оплаты: ${formData.paymentStatus === "paid" ? `Оплачено (${formData.paymentAmount} тг)` : formData.paymentStatus}
- Способ оплаты: ${formData.paymentMethod}
- ФИО: ${formData.finalFio}
- Тел: ${formData.finalPhone}
      `.trim();

            const { error: noteError } = await (supabase as any).from("crm_notes").insert({
                lead_id: lead.id,
                body: summary,
                author_name: adminName
            });
            if (noteError) throw noteError;

            if (formData.bookingDate && formData.bookingTime) {
                const scheduledAt = new Date(formData.bookingDate);
                const [hours, minutes] = formData.bookingTime.split(":");
                scheduledAt.setHours(parseInt(hours), parseInt(minutes));

                const { error: leadError } = await (supabase as any).from("leads_crm").update({
                    status: "Записан на диагностику",
                    scheduled_at: scheduledAt.toISOString(),
                }).eq("id", lead.id);
                if (leadError) throw leadError;
            }

            toast({ title: "Успешно", description: "Диагностическая карта сохранена" });
            onComplete(formData);
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const stages = [
        { id: 1, title: "Опрос", icon: Stethoscope },
        { id: 2, title: "Запись", icon: Calendar },
        { id: 3, title: "Предоплата", icon: CreditCard },
        { id: 4, title: "Завершение", icon: CheckCircle2 },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-col bg-background border-none rounded-none overflow-hidden">
                <DialogHeader className="px-8 py-4 border-b border-border shrink-0 bg-background z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">Диагностика и запись на прием</DialogTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.name}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1 text-primary font-medium">{stages[step-1].title}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Прогресс диагностики</span>
                                <div className="flex gap-1">
                                    {stages.map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1 w-8 rounded-full transition-all duration-500",
                                                i + 1 <= step ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" : "bg-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    <ScrollArea className="flex-1 bg-background">
                        <div className="w-full max-w-[1400px] mx-auto p-8 lg:p-12 pb-32">
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <ClipboardList className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold tracking-tight">Шаг 1. Выявление основной проблемы</h2>
                                                <p className="text-muted-foreground">Понять, что именно беспокоит пациента.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
                                            <div className="flex items-center gap-2 text-amber-800">
                                                <Info className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Совет администратору</span>
                                            </div>
                                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                                Не перебивайте. Слушайте внимательно. Ведите пациента мягко, без хаоса и допроса.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Что именно вас сейчас беспокоит? <span className="text-destructive">*</span></Label>
                                                <Textarea
                                                    placeholder="Дайте пациенту выговориться..."
                                                    className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-24 text-base resize-none rounded-2xl p-4 italic"
                                                    value={formData.complaints}
                                                    onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Где именно ощущается боль? <span className="text-destructive">*</span></Label>
                                                <RadioGroup
                                                    value={formData.painLocation}
                                                    onValueChange={(v) => setFormData({ ...formData, painLocation: v })}
                                                    className="grid grid-cols-2 gap-3"
                                                >
                                                    {[
                                                        { id: "lumbar", label: "Поясница" },
                                                        { id: "neck", label: "Шея" },
                                                        { id: "scapula", label: "Между лопатками" },
                                                        { id: "joints", label: "Суставы" },
                                                        { id: "other", label: "Другое" },
                                                    ].map((opt) => (
                                                        <div 
                                                            key={opt.id}
                                                            className={cn(
                                                                "flex items-center space-x-3 bg-secondary/5 border px-5 py-4 rounded-2xl cursor-pointer transition-all",
                                                                formData.painLocation === opt.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                                                            )}
                                                            onClick={() => setFormData({ ...formData, painLocation: opt.id })}
                                                        >
                                                            <RadioGroupItem value={opt.id} id={`loc-${opt.id}`} className="sr-only" />
                                                            <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.painLocation === opt.id && "bg-primary")}>
                                                                {formData.painLocation === opt.id && <Check className="h-3 w-3 text-white" />}
                                                            </div>
                                                            <Label htmlFor={`loc-${opt.id}`} className="text-sm font-semibold cursor-pointer">{opt.label}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                                {formData.painLocation === "other" && (
                                                    <Input
                                                        placeholder="Введите место..."
                                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary animate-in zoom-in-95 duration-200"
                                                        value={formData.painLocationOther}
                                                        onChange={(e) => setFormData({ ...formData, painLocationOther: e.target.value })}
                                                    />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Как давно появилась эта проблема? <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        placeholder="Например: 2 недели..."
                                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary font-bold"
                                                        value={formData.painDuration}
                                                        onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Боль постоянная или периодическая? <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        placeholder="Введите ответ пациента..."
                                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary font-bold"
                                                        value={formData.painType}
                                                        onChange={(e) => setFormData({ ...formData, painType: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">В какой момент боль усиливается?</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: "walking", label: "При ходьбе" },
                                                        { id: "sitting", label: "При сидении" },
                                                        { id: "bending", label: "При наклонах" },
                                                        { id: "morning", label: "Утром после сна" },
                                                    ].map((t) => (
                                                        <div 
                                                            key={t.id} 
                                                            className={cn(
                                                                "flex items-center space-x-3 bg-secondary/5 border p-4 rounded-xl transition-all cursor-pointer",
                                                                formData.painTriggers.includes(t.id) ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-secondary/10"
                                                            )}
                                                            onClick={() => toggleArrayItem("painTriggers", t.id)}
                                                        >
                                                            <div className={cn("h-4 w-4 rounded border border-primary flex items-center justify-center", formData.painTriggers.includes(t.id) && "bg-primary")}>
                                                                {formData.painTriggers.includes(t.id) && <Check className="h-3 w-3 text-white" />}
                                                            </div>
                                                            <span className="text-sm font-medium">{t.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Input
                                                    placeholder="Другое..."
                                                    className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                                    value={formData.painTriggersOther}
                                                    onChange={(e) => setFormData({ ...formData, painTriggersOther: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Онемение или покалывание?</Label>
                                                    <Input
                                                        placeholder="Введите ответ..."
                                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                                        value={formData.numbness}
                                                        onChange={(e) => setFormData({ ...formData, numbness: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground italic">Сила боли (1-10)</Label>
                                                    <Input
                                                        placeholder="Например: 7..."
                                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary font-bold"
                                                        value={formData.painIntensity}
                                                        onChange={(e) => setFormData({ ...formData, painIntensity: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[32px] bg-sky-50 border border-sky-100 space-y-4 shadow-sm">
                                                <div className="flex items-center gap-3 text-sky-800">
                                                    <Heart className="h-6 w-6 fill-sky-800/20" />
                                                    <h3 className="text-lg font-black uppercase tracking-tight">Эмпатия (Сочувствие)</h3>
                                                </div>
                                                <p className="text-sm font-bold text-sky-900 leading-relaxed italic">
                                                    «Понимаю вас. Да, при таких симптомах это действительно сильно мешает. 
                                                    В такой ситуации важно не просто снимать боль, а понять её причину.»
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-sky-600 bg-card w-fit px-3 py-1 rounded-full border border-sky-200">
                                                    <CheckCircle2 className="h-3 w-3" /> Проявите участие перед записью
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold tracking-tight">2. Презентация диагностики и запись</h2>
                                                <p className="text-muted-foreground">Показать ценность и записать на удобное время.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                                        <div className="xl:col-span-2 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                                <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-6">
                                                    <div className="flex items-center gap-3 text-primary">
                                                        <Star className="h-6 w-6 fill-primary/20" />
                                                        <h3 className="text-lg font-black uppercase tracking-tight">Ценность</h3>
                                                    </div>
                                                    <p className="text-sm font-bold leading-relaxed italic text-foreground bg-card p-6 rounded-2xl border border-primary/5 shadow-sm">
                                                        «У нас проводится комплексная диагностика, где вас смотрят сразу ДВА врача высшей категории.»
                                                    </p>
                                                    <div className="space-y-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-tight px-1">Что входит в стоимость:</span>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {[
                                                                "Осмотр 2 врачей высшей категории",
                                                                "Функциональные тесты и разбор МРТ/КТ",
                                                                "Индивидуальный план лечения",
                                                                "ПЕРВАЯ ЛЕЧЕБНАЯ ПРОЦЕДУРА"
                                                            ].map((item, i) => (
                                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40 shadow-sm">
                                                                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                                        <Check className="h-3 w-3" />
                                                                    </div>
                                                                    <span className="text-xs font-bold leading-tight">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-8 rounded-[32px] bg-amber-50 border border-amber-100 space-y-6">
                                                    <div className="flex items-center gap-3 text-amber-800">
                                                        <Receipt className="h-6 w-6" />
                                                        <h3 className="text-lg font-black uppercase tracking-tight">Цена и Дефицит</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-baseline gap-3">
                                                            <span className="text-sm line-through text-muted-foreground font-bold">23 000 тг</span>
                                                            <span className="text-3xl font-black text-amber-900 leading-none tracking-tight">9 990 тг</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-amber-800/80 leading-relaxed italic bg-card p-4 rounded-xl border border-amber-200/50">
                                                            «Желающих много, врачи берут всего 3-4 человека в день.»
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[32px] bg-sky-50 border border-sky-100 space-y-4 shadow-sm">
                                                <div className="flex items-center gap-3 text-sky-800">
                                                    <CreditCard className="h-6 w-6" />
                                                    <h3 className="text-lg font-black uppercase tracking-tight">Бронирование</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-sm font-bold text-sky-900 leading-relaxed italic">
                                                        «Предоплата — 5 000 тенге. Это гарантия, что врачи ждут именно вас.»
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-600 bg-card w-fit px-3 py-1 rounded-full border border-sky-200">
                                                        <Smartphone className="h-3 w-3" /> «Номер привязан к Kaspi? Отправляю счет.»
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-background p-8 rounded-[40px] border border-border/80 shadow-xl shadow-primary/5 space-y-8 sticky top-0">
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold tracking-tight">Выбор времени</h3>
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Актуальное расписание</p>
                                                </div>
                                                
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
                                                
                                                <div className="p-6 rounded-2xl bg-secondary/10 space-y-3">
                                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-tight">Комментарий</Label>
                                                    <Textarea
                                                        placeholder="Особенности записи..."
                                                        className="bg-background border-none focus:ring-1 focus:ring-primary h-24 text-sm font-medium resize-none rounded-xl p-4"
                                                        value={formData.adminComment}
                                                        onChange={(e) => setFormData({ ...formData, adminComment: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <CreditCard className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold tracking-tight">3. Предоплата и гарантия</h2>
                                                <p className="text-muted-foreground">Подтвердите серьезность намерений через внесение задатка.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="p-8 rounded-[32px] bg-secondary/10 border-none space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center">
                                                        <Smartphone className="h-5 w-5 text-[#00A2E8]" />
                                                    </div>
                                                    <span className="font-bold">Kaspi.kz</span>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full h-12 rounded-2xl gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-bold"
                                                    onClick={() => toast({ title: "Ссылка отправлена", description: "Ссылка в WhatsApp" })}
                                                >
                                                    <MessageSquare className="h-4 w-4" /> Отправить в WhatsApp
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Статус оплаты</Label>
                                                <RadioGroup
                                                    value={formData.paymentStatus}
                                                    onValueChange={(val: any) => setFormData({ ...formData, paymentStatus: val })}
                                                    className="grid grid-cols-1 gap-3"
                                                >
                                                    {[
                                                        { id: "pending", label: "Ожидается", icon: Clock, color: "text-amber-500" },
                                                        { id: "paid", label: "Оплачено", icon: CheckCircle2, color: "text-emerald-500" },
                                                        { id: "declined", label: "Отказ", icon: ShieldAlert, color: "text-rose-500" },
                                                    ].map((item) => (
                                                        <div key={item.id} className="space-y-2">
                                                            <div 
                                                                className={cn(
                                                                    "flex-1 flex items-center justify-between p-5 rounded-3xl border-2 cursor-pointer transition-all",
                                                                    formData.paymentStatus === item.id ? "border-primary bg-primary/5" : "border-transparent bg-secondary/5"
                                                                )}
                                                                onClick={() => setFormData({ ...formData, paymentStatus: item.id as any })}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                                                    <span className="font-bold">{item.label}</span>
                                                                </div>
                                                                <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                                            </div>
                                                            {formData.paymentStatus === "paid" && item.id === "paid" && (
                                                                <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-300">
                                                                    <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-primary/20 shadow-sm">
                                                                        <Label className="text-[10px] font-bold uppercase shrink-0">Сумма:</Label>
                                                                        <Input 
                                                                            type="number"
                                                                            value={formData.paymentAmount}
                                                                            onChange={(e) => setFormData({ ...formData, paymentAmount: parseInt(e.target.value) || 0 })}
                                                                            className="h-8 border-none bg-secondary/10 text-sm font-bold w-32 focus-visible:ring-0"
                                                                        />
                                                                        <span className="text-xs font-bold text-muted-foreground underline underline-offset-4 font-mono">ТЕНГЕ</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Flag className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold tracking-tight">4. Финал и подтверждение</h2>
                                                <p className="text-muted-foreground">Проверьте данные и завершите запись.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 rounded-[32px] bg-secondary/5 border border-border/50 space-y-6">
                                            <h3 className="font-bold flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Резюме</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                                    <span className="text-sm text-muted-foreground">Пациент</span>
                                                    <span className="text-sm font-bold text-primary">{lead.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                                    <span className="text-sm text-muted-foreground">Дата и время</span>
                                                    <span className="text-sm font-bold">
                                                        {formData.bookingDate ? formData.bookingDate.toLocaleDateString("ru-RU") : "—"} в {formData.bookingTime || "—"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-3">
                                                    <span className="text-sm text-muted-foreground">Оплата</span>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                        formData.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {formData.paymentStatus === "paid" ? `Оплачено (${formData.paymentAmount} тг)` : "Ожидание"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div 
                                            className={cn(
                                                "p-8 rounded-[32px] border-2 transition-all cursor-pointer select-none flex items-start gap-4",
                                                formData.confirmed ? "border-primary bg-primary/5" : "border-dashed border-border"
                                            )}
                                            onClick={() => setFormData({ ...formData, confirmed: !formData.confirmed })}
                                        >
                                            <div className={cn("h-7 w-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all", formData.confirmed ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                                {formData.confirmed && <Check className="h-4 w-4 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-2">Данные верны</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    Я подтверждаю корректность всех данных.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="px-10 py-5 border-t border-border flex items-center justify-between bg-background shrink-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || isSaving}
                        className="gap-2 font-bold uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl hover:bg-secondary/10"
                    >
                        <ArrowLeft className="h-4 w-4" /> Назад
                    </Button>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Этап {step} из {totalSteps}
                        </p>
                        {step < totalSteps ? (
                            <Button onClick={nextStep} className="gap-2 px-8 h-12 font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-lg">
                                Далее <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinalSave}
                                disabled={isSaving || !formData.confirmed}
                                className="gap-2 px-10 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Завершить</>}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
