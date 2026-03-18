import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Stethoscope, ArrowRight, ArrowLeft, Check,
    Calendar, ClipboardList, Star, CheckCheck, Loader2,
    MessageCircle, ShieldCheck, Heart, Info, Send, Phone, User, Clock, MapPin, Receipt, X,
    CreditCard, Smartphone, MessageSquare, Flag, CheckCircle2, ShieldAlert
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
    // Primary Survey
    complaints: string;
    painDuration: string;
    painType: string;
    painTriggers: string[];
    previousTreatment: string[];
    medicalHistory: string;
    mriCtHistory: string;
    hasResults: string;
    painRadiation: string[];
    painIntensity: number;
    numbness: string;
    lifeImpact: string[];
    
    // Presentation
    presentationDone: boolean;

    // Booking
    bookingDate?: Date;
    bookingTime?: string;
    adminComment: string;

    // Prepayment
    kaspiLinked: string;
    paymentMethod: string;
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
        painDuration: "",
        painType: "periodic",
        painTriggers: [],
        previousTreatment: [],
        medicalHistory: "",
        mriCtHistory: "",
        hasResults: "no",
        painRadiation: [],
        painIntensity: 5,
        numbness: "no",
        lifeImpact: [],
        presentationDone: false,
        bookingDate: undefined,
        bookingTime: "",
        adminComment: "",
        kaspiLinked: "u", // yes, no, unknown
        paymentMethod: "Kaspi",
        paymentStatus: "pending",
        confirmed: false,
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
        reminderNeeded: "yes",
        knowsAddress: "yes",
        confirmationComment: "",
    });
    const totalSteps = 5;

    const adminName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Администратор";

    // Autosave effect
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                handleAutosave();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [formData, step]);

    const handleAutosave = async () => {
        // Implementation for autosave to a draft table or similar
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
                if (!formData.complaints || !formData.painDuration || !formData.painType || !formData.painIntensity) {
                    toast({ title: "Внимание", description: "Заполните обязательные поля первого этапа", variant: "destructive" });
                    return false;
                }
                break;
            case 3:
                if (!formData.bookingDate || !formData.bookingTime) {
                    toast({ title: "Внимание", description: "Выберите дату и время записи", variant: "destructive" });
                    return false;
                }
                break;
            case 4:
                if (!formData.paymentMethod) {
                    toast({ title: "Внимание", description: "Выберите способ оплаты", variant: "destructive" });
                    return false;
                }
                break;
            case 5:
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
- Длительность: ${formData.painDuration}
- Характер: ${formData.painType === "constant" ? "Постоянная" : "Периодическая"}
- Триггеры: ${formData.painTriggers.join(", ")}

2. УТОЧНЕНИЕ СОСТОЯНИЯ
- Прошлые методы лечения: ${formData.previousTreatment.join(", ")}
- История обращений/Диагноз: ${formData.medicalHistory}
- МРТ/КТ: ${formData.mriCtHistory}
- Результаты на руках: ${formData.hasResults === "yes" ? "Да" : "Нет"}

3. ДОПОЛНИТЕЛЬНО
- Куда отдает: ${formData.painRadiation.join(", ")}
- Интенсивность: ${formData.painIntensity}/10
- Онемение/покалывание: ${formData.numbness === "yes" ? "Да" : "Нет"}
- Влияние на жизнь: ${formData.lifeImpact.join(", ")}

ЗАПИСЬ И ОПЛАТА
- Запись: ${formData.bookingDate ? `${formData.bookingDate.toLocaleDateString()} в ${formData.bookingTime}` : "Не назначена"}
- Статус оплаты: ${formData.paymentStatus}
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

                const { error: leadError } = await (supabase as any).from("leads").update({
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
        { id: "primary_survey", title: "Первичный опрос", icon: ClipboardList },
        { id: "presentation", title: "Презентация", icon: MessageCircle },
        { id: "booking", title: "Запись", icon: Calendar },
        { id: "prepayment", title: "Предоплата", icon: Receipt },
        { id: "confirmation", title: "Подтверждение", icon: ShieldCheck },
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
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: MAIN CONTENT */}
                    <ScrollArea className="flex-1 bg-background border-r border-border">
                        <div className="max-w-4xl mx-auto p-12 pb-32">
                        {/* Step 1: Первичный опрос */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <ClipboardList className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">1. Первичный опрос</h2>
                                            <p className="text-muted-foreground">Задайте вопросы клиенту и зафиксируйте ответы для врача.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {/* Section 1: Выявление проблемы */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-lg shadow-primary/20">1</div>
                                            <h3 className="text-lg font-bold">Выявление проблемы пациента</h3>
                                        </div>
                                        
                                        <div className="grid gap-6 pl-10">
                                          <div className="space-y-2">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                                Что именно вас сейчас беспокоит? <span className="text-destructive">*</span>
                                              </Label>
                                              <Textarea
                                                  placeholder="Боль в пояснице, шее, между лопатками, в суставах..."
                                                  className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-24 text-base resize-none rounded-2xl p-4"
                                                  value={formData.complaints}
                                                  onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-2">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                                Как давно появилась эта проблема? <span className="text-destructive">*</span>
                                              </Label>
                                              <Input
                                                  placeholder="Укажите примерный срок: дни, недели, месяцы, годы..."
                                                  className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                                  value={formData.painDuration}
                                                  onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                                Характер боли <span className="text-destructive">*</span>
                                              </Label>
                                              <RadioGroup
                                                  value={formData.painType}
                                                  onValueChange={(v) => setFormData({ ...formData, painType: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-4 rounded-2xl flex-1 cursor-pointer transition-all",
                                                        formData.painType === "constant" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, painType: "constant" })}
                                                  >
                                                      <RadioGroupItem value="constant" id="type-constant" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.painType === "constant" && "bg-primary")}>
                                                          {formData.painType === "constant" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="type-constant" className="text-sm font-semibold cursor-pointer">Постоянная</Label>
                                                  </div>
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-4 rounded-2xl flex-1 cursor-pointer transition-all",
                                                        formData.painType === "periodic" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, painType: "periodic" })}
                                                  >
                                                      <RadioGroupItem value="periodic" id="type-periodic" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.painType === "periodic" && "bg-primary")}>
                                                          {formData.painType === "periodic" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="type-periodic" className="text-sm font-semibold cursor-pointer">Периодическая</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-3">
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
                                                            formData.painTriggers.includes(t.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/10"
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
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Уточнение состояния */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-lg shadow-primary/20">2</div>
                                            <h3 className="text-lg font-bold">Уточнение состояния</h3>
                                        </div>

                                        <div className="grid gap-6 pl-10">
                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Пробовали ли вы уже как-то лечить эту проблему?</Label>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                      { id: "massage", label: "Массаж" },
                                                      { id: "pills", label: "Таблетки" },
                                                      { id: "injections", label: "Уколы" },
                                                      { id: "physio", label: "Физиотерапия" },
                                                  ].map((m) => (
                                                      <div 
                                                        key={m.id} 
                                                        className={cn(
                                                            "flex items-center space-x-3 bg-secondary/5 border p-4 rounded-xl transition-all cursor-pointer",
                                                            formData.previousTreatment.includes(m.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/10"
                                                        )}
                                                        onClick={() => toggleArrayItem("previousTreatment", m.id)}
                                                      >
                                                          <div className={cn("h-4 w-4 rounded border border-primary flex items-center justify-center", formData.previousTreatment.includes(m.id) && "bg-primary")}>
                                                              {formData.previousTreatment.includes(m.id) && <Check className="h-3 w-3 text-white" />}
                                                          </div>
                                                          <span className="text-sm font-medium">{m.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-2">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Обращались ли ранее к врачам? Какой диагноз ставили?</Label>
                                              <Textarea
                                                  placeholder="Диагнозы, рекомендации, клиники, специалисты..."
                                                  className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-20 text-base resize-none rounded-xl p-4"
                                                  value={formData.medicalHistory}
                                                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-2">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Делали ли вы МРТ или КТ? Когда проводилось?</Label>
                                              <Input
                                                  placeholder="Например: МРТ поясницы в октябре 2023..."
                                                  className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                                  value={formData.mriCtHistory}
                                                  onChange={(e) => setFormData({ ...formData, mriCtHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли у вас результаты обследований на руках?</Label>
                                              <RadioGroup
                                                  value={formData.hasResults}
                                                  onValueChange={(v) => setFormData({ ...formData, hasResults: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-3 rounded-xl flex-1 cursor-pointer transition-all",
                                                        formData.hasResults === "yes" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, hasResults: "yes" })}
                                                  >
                                                      <RadioGroupItem value="yes" id="results-yes" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.hasResults === "yes" && "bg-primary")}>
                                                          {formData.hasResults === "yes" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="results-yes" className="text-sm font-semibold cursor-pointer">Да</Label>
                                                  </div>
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-3 rounded-xl flex-1 cursor-pointer transition-all",
                                                        formData.hasResults === "no" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, hasResults: "no" })}
                                                  >
                                                      <RadioGroupItem value="no" id="results-no" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.hasResults === "no" && "bg-primary")}>
                                                          {formData.hasResults === "no" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="results-no" className="text-sm font-semibold cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Дополнительные вопросы */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-lg shadow-primary/20">3</div>
                                            <h3 className="text-lg font-bold">Дополнительные уточняющие вопросы</h3>
                                        </div>

                                        <div className="grid gap-8 pl-10">
                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Боль отдает куда-то?</Label>
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                  {[
                                                      { id: "leg", label: "В ногу" },
                                                      { id: "arm", label: "В руку" },
                                                      { id: "shoulder", label: "В плечо" },
                                                  ].map((r) => (
                                                      <div 
                                                        key={r.id} 
                                                        className={cn(
                                                            "flex items-center space-x-3 bg-secondary/5 border p-4 rounded-xl transition-all cursor-pointer",
                                                            formData.painRadiation.includes(r.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/10"
                                                        )}
                                                        onClick={() => toggleArrayItem("painRadiation", r.id)}
                                                      >
                                                          <div className={cn("h-4 w-4 rounded border border-primary flex items-center justify-center", formData.painRadiation.includes(r.id) && "bg-primary")}>
                                                              {formData.painRadiation.includes(r.id) && <Check className="h-3 w-3 text-white" />}
                                                          </div>
                                                          <span className="text-sm font-medium">{r.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-6">
                                              <div className="flex items-center justify-between">
                                                  <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                                    Насколько сильная боль (1-10)? <span className="text-destructive">*</span>
                                                  </Label>
                                                  <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">{formData.painIntensity}</span>
                                              </div>
                                              <div className="flex items-center justify-between gap-1">
                                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                      <button
                                                          key={num}
                                                          type="button"
                                                          onClick={() => setFormData({ ...formData, painIntensity: num })}
                                                          className={cn(
                                                              "flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all border shadow-sm",
                                                              formData.painIntensity === num
                                                                  ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_-4px_var(--primary)] scale-110 z-10"
                                                                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
                                                          )}
                                                      >
                                                          {num}
                                                      </button>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли онемение или покалывание в руках или ногах?</Label>
                                              <RadioGroup
                                                  value={formData.numbness}
                                                  onValueChange={(v) => setFormData({ ...formData, numbness: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-3 rounded-xl flex-1 cursor-pointer transition-all",
                                                        formData.numbness === "yes" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, numbness: "yes" })}
                                                  >
                                                      <RadioGroupItem value="yes" id="numbness-yes" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.numbness === "yes" && "bg-primary")}>
                                                          {formData.numbness === "yes" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="numbness-yes" className="text-sm font-semibold cursor-pointer">Да</Label>
                                                  </div>
                                                  <div 
                                                    className={cn(
                                                        "flex items-center space-x-3 bg-secondary/5 border px-5 py-3 rounded-xl flex-1 cursor-pointer transition-all",
                                                        formData.numbness === "no" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, numbness: "no" })}
                                                  >
                                                      <RadioGroupItem value="no" id="numbness-no" className="sr-only" />
                                                      <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.numbness === "no" && "bg-primary")}>
                                                          {formData.numbness === "no" && <Check className="h-3 w-3 text-white" />}
                                                      </div>
                                                      <Label htmlFor="numbness-no" className="text-sm font-semibold cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Мешает ли эта проблема в повседневной жизни?</Label>
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                  {[
                                                      { id: "sitting", label: "Трудно сидеть" },
                                                      { id: "working", label: "Трудно работать" },
                                                      { id: "sleeping", label: "Трудно спать" },
                                                  ].map((l) => (
                                                      <div 
                                                        key={l.id} 
                                                        className={cn(
                                                            "flex items-center space-x-3 bg-secondary/5 border p-4 rounded-xl transition-all cursor-pointer",
                                                            formData.lifeImpact.includes(l.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/10"
                                                        )}
                                                        onClick={() => toggleArrayItem("lifeImpact", l.id)}
                                                      >
                                                          <div className={cn("h-4 w-4 rounded border border-primary flex items-center justify-center", formData.lifeImpact.includes(l.id) && "bg-primary")}>
                                                              {formData.lifeImpact.includes(l.id) && <Check className="h-3 w-3 text-white" />}
                                                          </div>
                                                          <span className="text-sm font-medium">{l.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Презентация */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <MessageCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">2. Презентация диагностики</h2>
                                            <p className="text-muted-foreground">Объясните ценность диагностики и подведите пациента к записи.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { t: "Комплексная диагностика позвоночника", d: "Не просто консультация, а полноценное обследование", i: Stethoscope },
                                        { t: "2 врача высшей категории", d: "Терапевт + реабилитолог", i: User },
                                        { t: "Что входит", d: "Осмотр, тесты, рекомендации, план лечения", i: ClipboardList },
                                        { t: "Главный бонус", d: "Первая лечебная процедура в день обращения", i: Star },
                                        { t: "Стоимость", d: "9 990 ₸ за весь комплекс", i: Receipt },
                                    ].map((card, i) => (
                                        <div key={i} className="p-6 rounded-3xl bg-secondary/5 border border-border/50 hover:border-primary/20 transition-all flex gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
                                                <card.i className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm mb-1">{card.t}</h4>
                                                <p className="text-xs text-muted-foreground">{card.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 bg-primary/5 p-8 rounded-[32px] border border-primary/10">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <CheckCheck className="h-5 w-5 text-primary" /> Ключевые тезисы
                                    </h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            "Это не разовая консультация",
                                            "Важно определить причину боли",
                                            "Пациент получает понятный план лечения",
                                            "Уже в первый визит делается первый шаг к облегчению боли"
                                        ].map((point, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm font-medium">
                                                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                </div>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Запись */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">3. Выбор времени записи</h2>
                                            <p className="text-muted-foreground">Предложите пациенту удобное время и зафиксируйте бронь.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-secondary/5 p-8 rounded-[32px] border border-border/50">
                                        <BookingWidget
                                            selectedDate={formData.bookingDate}
                                            selectedTime={formData.bookingTime}
                                            onBookingChange={(booking) => setFormData({ 
                                                ...formData, 
                                                bookingDate: booking.date, 
                                                bookingTime: booking.time 
                                            })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Комментарий администратора</Label>
                                        <Textarea
                                            placeholder="Например: удобнее после 18:00, будет с МРТ, просил напомнить..."
                                            className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-24 text-base resize-none rounded-2xl p-4"
                                            value={formData.adminComment}
                                            onChange={(e) => setFormData({ ...formData, adminComment: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Предоплата */}
                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">4. Предоплата и гарантия визита</h2>
                                            <p className="text-muted-foreground">Подтвердите серьезность намерений пациента через внесение задатка.</p>
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
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Отправьте ссылку на оплату через WhatsApp. Это стандартная процедура клиники для фиксации времени.
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                className="w-full h-12 rounded-2xl gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-bold"
                                                onClick={() => {
                                                    toast({
                                                        title: "Ссылка отправлена",
                                                        description: "Ссылка на оплату Kaspi отправлена в WhatsApp",
                                                    });
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4" /> Отправить ссылку в WhatsApp
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Статус предоплаты</Label>
                                            <RadioGroup
                                                value={formData.paymentStatus}
                                                onValueChange={(val: "pending" | "paid" | "declined") => setFormData({ ...formData, paymentStatus: val })}
                                                className="grid grid-cols-1 gap-3"
                                            >
                                                {[
                                                    { id: "pending", label: "Ожидается оплата", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                                                    { id: "paid", label: "Оплачено (9 990 ₸)", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                                    { id: "declined", label: "Отказ от предоплаты", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
                                                ].map((item) => (
                                                    <div key={item.id} className="flex items-center">
                                                        <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                                        <Label
                                                            htmlFor={item.id}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-between p-5 rounded-3xl border-2 cursor-pointer transition-all",
                                                                formData.paymentStatus === item.id 
                                                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                                    : "border-transparent bg-secondary/5 hover:bg-secondary/10"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                                                                    <item.icon className="h-5 w-5" />
                                                                </div>
                                                                <span className="font-bold">{item.label}</span>
                                                            </div>
                                                            {formData.paymentStatus === item.id && (
                                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                                </div>
                                                            )}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Подтверждение */}
                        {step === 5 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Flag className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">5. Финал и подтверждение</h2>
                                            <p className="text-muted-foreground">Проверьте данные и завершите оформление записи.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="p-8 rounded-[32px] bg-secondary/5 border border-border/50 space-y-6">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <User className="h-5 w-5 text-primary" /> Резюме записи
                                            </h3>
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
                                                    <span className="text-sm text-muted-foreground">Статус оплаты</span>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                        formData.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-500" : 
                                                        formData.paymentStatus === "declined" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {formData.paymentStatus === "paid" ? "Оплачено" : 
                                                         formData.paymentStatus === "declined" ? "Отказ" : "Ожидание"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex flex-col justify-center">
                                        <div 
                                            className={cn(
                                                "p-8 rounded-[32px] border-2 transition-all cursor-pointer select-none",
                                                formData.confirmed ? "border-primary bg-primary/5" : "border-dashed border-border hover:border-primary/50"
                                            )}
                                            onClick={() => setFormData({ ...formData, confirmed: !formData.confirmed })}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all",
                                                    formData.confirmed ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                )}>
                                                    {formData.confirmed && <Check className="h-4 w-4 text-primary-foreground" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-2">Данные верны</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Я подтверждаю, что вся информация внесена корректно, время согласовано с пациентом и зафиксировано в CRM.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </ScrollArea>

                    {/* RIGHT PANEL: ADMIN ASSISTANT */}
                    <aside className="w-[380px] border-l border-border bg-muted/5 flex flex-col shrink-0 overflow-hidden">
                        <div className="p-6 border-b border-border bg-background">
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest">Admin Assistant</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Чек-лист текущего этапа</p>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            {step === 1 && (
                                <div className="space-y-8 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            1. Контакт и эмпатия
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Обратиться по имени №1", h: "В начале разговора" },
                                                { t: "Проявить эмпатию", h: "«Понимаю вас...»" },
                                                { t: "Обратиться по имени №2", h: "После ответов пациента" },
                                            ].map((item, i) => (
                                                <div key={i} className="group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all cursor-default">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-md border border-border flex items-center justify-center mt-0.5 group-hover:border-primary/50 transition-colors">
                                                            <Check className="h-3 w-3 text-transparent group-hover:text-primary/20" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold leading-none mb-1">{item.t}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">{item.h}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            2. Что обязательно уточнить
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { t: "Локализация боли", v: !!formData.complaints },
                                                { t: "Срок проблемы", v: !!formData.painDuration },
                                                { t: "Усиление боли", v: formData.painTriggers.length > 0 },
                                                { t: "Интенсивность", v: true },
                                                { t: "Онемение", v: !!formData.numbness },
                                                { t: "Ограничения в жизни", v: formData.lifeImpact.length > 0 },
                                                { t: "Наличие МРТ / КТ", v: !!formData.mriCtHistory },
                                            ].map((item, i) => (
                                                <div key={i} className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                    item.v ? "bg-primary/5 border-primary/20 text-primary" : "bg-background border-border/50 text-muted-foreground"
                                                )}>
                                                    <span className="text-[11px] font-bold">{item.t}</span>
                                                    {item.v ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground space-y-2 shadow-lg shadow-primary/20">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Совет администратору</span>
                                        </div>
                                        <p className="text-[11px] font-medium leading-relaxed italic">
                                            «Слушайте пациента внимательно. Важно не просто заполнить форму, а почувствовать его боль и желание вылечиться.»
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            1. Акценты презентации
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Не просто консультация", h: "Комплексная диагностика" },
                                                { t: "2 врача", h: "Терапевт + реабилитолог" },
                                                { t: "Понять причину боли", h: "Не просто снять симптомы" },
                                                { t: "Есть план лечения", h: "Понятные дальнейшие шаги" },
                                                { t: "Есть первая процедура", h: "В день обращения" },
                                            ].map((item, i) => (
                                                <div key={i} className="group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-md border border-border flex items-center justify-center mt-0.5">
                                                            <Check className="h-3 w-3 text-transparent group-hover:text-primary/20" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold leading-none mb-1">{item.t}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">{item.h}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            2. Правила подачи
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Спокойно и уверенно", h: "Без давления на пациента" },
                                                { t: "Связать с его жалобой", h: "«Так как у вас болит...»" },
                                                { t: "Подвести к записи", h: "После ценности сразу к делу" },
                                            ].map((item, i) => (
                                                <div key={i} className="p-3 rounded-xl border border-border/50 bg-background">
                                                    <p className="text-[11px] font-bold mb-0.5">{item.t}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.h}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            1. Как закрывать на запись
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Не спрашивать «будете?»", h: "Только выбор времени" },
                                                { t: "Дать 2 варианта", h: "Утро или вечер / 11:00 или 17:00" },
                                                { t: "Повторить время вслух", h: "Для фиксации в сознании" },
                                                { t: "Записываю вас...", h: "Утвердительная форма" },
                                            ].map((item, i) => (
                                                <div key={i} className="group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-md border border-border flex items-center justify-center mt-0.5">
                                                            <Check className="h-3 w-3 text-transparent group-hover:text-primary/20" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold leading-none mb-1">{item.t}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">{item.h}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "p-5 rounded-3xl border transition-all space-y-3",
                                        formData.bookingDate && formData.bookingTime ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-background border-border"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Текущий выбор</span>
                                        </div>
                                        {formData.bookingDate ? (
                                            <div>
                                                <p className="text-sm font-bold">{formData.bookingDate.toLocaleDateString("ru-RU", { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                <p className="text-xl font-black mt-1">{formData.bookingTime}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium opacity-60 italic">Время еще не выбрано</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-8 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            1. Работа с возражениями по предоплате
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Почему нужно платить?", h: "Бронь времени врачей и кабинета" },
                                                { t: "А если я не приду?", h: "Возврат при отмене за 24 часа" },
                                                { t: "Это безопасно?", h: "Офиц. платеж через Kaspi" },
                                            ].map((item, i) => (
                                                <div key={i} className="group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-md border border-border flex items-center justify-center mt-0.5">
                                                            <Check className="h-3 w-3 text-transparent group-hover:text-primary/20" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold leading-none mb-1">{item.t}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">{item.h}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#00A2E8]/10 text-[#00A2E8] border border-[#00A2E8]/20 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Kaspi Tip</span>
                                        </div>
                                        <p className="text-[11px] font-medium leading-relaxed italic">
                                            «Отправьте счет сразу. Пациент горячий и готов подтвердить визит действием.»
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-8 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            1. Финальная сверка
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { t: "Подтвердить время", v: true },
                                                { t: "Проверить оплату", v: formData.paymentStatus === "paid" },
                                                { t: "Проверить ФИО", v: !!lead.name },
                                                { t: "Напомнить про МРТ", v: formData.hasResults === "yes" },
                                            ].map((item, i) => (
                                                <div key={i} className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                    item.v ? "bg-primary/5 border-primary/20 text-primary" : "bg-background border-border/50 text-muted-foreground"
                                                )}>
                                                    <span className="text-[11px] font-bold">{item.t}</span>
                                                    {item.v ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[32px] bg-primary text-primary-foreground space-y-4 shadow-xl shadow-primary/30">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white/20 mx-auto">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Почти готово!</p>
                                            <p className="text-sm font-medium leading-relaxed">
                                                Нажмите «Завершить», чтобы сохранить все данные и отправить их в систему.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </aside>
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
                            <Button
                                onClick={nextStep}
                                className="gap-2 px-8 h-12 font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Далее <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinalSave}
                                disabled={isSaving || !formData.confirmed}
                                className="gap-2 px-10 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95"
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
