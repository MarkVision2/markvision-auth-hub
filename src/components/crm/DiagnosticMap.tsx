import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Stethoscope, ArrowRight, ArrowLeft, Check,
    Calendar, User, ClipboardList, Info, Sparkles, Star, FileText, CheckCheck, Loader2
} from "lucide-react";
import { Lead } from "./KanbanBoard";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { BookingWidget } from "./BookingWidget";
import { PaymentBlock } from "./PaymentBlock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FormData {
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
    finalFio: string;
    finalPhone: string;
    createLtvTrigger: boolean;
    booking?: { date: Date; time: string; doctor: string };
    payment?: { amount: number; method: string };
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
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
        createLtvTrigger: true,
    });
    const totalSteps = 7;

    const adminName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Администратор";

    const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

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
            // 1. Create a note with diagnostic summary
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
- Запись: ${formData.booking ? `${formData.booking.date.toLocaleDateString()} в ${formData.booking.time} к ${formData.booking.doctor}` : "Не назначена"}
- Оплата: ${formData.payment ? `${formData.payment.amount} ₸ (${formData.payment.method})` : "Нет"}
      `.trim();

            const { error: noteError } = await (supabase as any).from("crm_notes").insert({
                lead_id: lead.id,
                body: summary,
                author_name: adminName
            });
            if (noteError) throw noteError;

            // 2. Update lead status if booked
            if (formData.booking) {
                const scheduledAt = new Date(formData.booking.date);
                const [hours, minutes] = formData.booking.time.split(":");
                scheduledAt.setHours(parseInt(hours), parseInt(minutes));

                const { error: leadError } = await (supabase as any).from("leads").update({
                    status: "Записан",
                    scheduled_at: scheduledAt.toISOString(),
                    doctor_name: formData.booking.doctor,
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col bg-background border-border overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">Диагностическая карта</DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">Лид: {lead.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Шаг {step} из {totalSteps}</span>
                            <div className="flex gap-1">
                                {Array.from({ length: totalSteps }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 w-6 rounded-full transition-all duration-300",
                                            i + 1 <= step ? "bg-primary" : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-2xl mx-auto py-4">
                        {/* Step 1: Выявление проблемы (formerly step 2) */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10">
                                <div className="space-y-4 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-2">
                                        <ClipboardList className="h-6 w-6 text-primary" /> Диагностика пациента
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Заполните данные для формирования диагностической карты</p>
                                </div>

                                <div className="space-y-10">
                                    {/* Section 1: Выявление проблемы */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Выявление проблемы пациента</h3>
                                        </div>
                                        
                                        <div className="grid gap-6 pl-9">
                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Что именно вас сейчас беспокоит?</Label>
                                              <Textarea
                                                  placeholder="Боль в пояснице, шее, между лопатками, в суставах?"
                                                  className="bg-secondary/20 border-border focus:ring-primary h-20 text-sm resize-none"
                                                  value={formData.complaints}
                                                  onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Как давно появилась эта проблема?</Label>
                                              <Input
                                                  placeholder="Укажите срок..."
                                                  className="bg-secondary/20 border-border text-sm h-11"
                                                  value={formData.painDuration}
                                                  onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Характер боли</Label>
                                              <RadioGroup
                                                  value={formData.painType}
                                                  onValueChange={(v) => setFormData({ ...formData, painType: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, painType: "constant" })}>
                                                      <RadioGroupItem value="constant" id="type-constant" />
                                                      <Label htmlFor="type-constant" className="text-sm font-medium cursor-pointer">Постоянная</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, painType: "periodic" })}>
                                                      <RadioGroupItem value="periodic" id="type-periodic" />
                                                      <Label htmlFor="type-periodic" className="text-sm font-medium cursor-pointer">Периодическая</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">В какой момент боль усиливается?</Label>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                      { id: "walking", label: "При ходьбе" },
                                                      { id: "sitting", label: "При сидении" },
                                                      { id: "bending", label: "При наклонах" },
                                                      { id: "morning", label: "Утром после сна" },
                                                  ].map((t) => (
                                                      <div key={t.id} className="flex items-center space-x-2 bg-secondary/10 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-colors cursor-pointer" onClick={() => toggleArrayItem("painTriggers", t.id)}>
                                                          <Checkbox checked={formData.painTriggers.includes(t.id)} />
                                                          <span className="text-xs font-medium">{t.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Уточнение состояния */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Уточнение состояния</h3>
                                        </div>

                                        <div className="grid gap-6 pl-9">
                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Пробовали ли вы уже как-то лечить эту проблему?</Label>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                      { id: "massage", label: "Массаж" },
                                                      { id: "pills", label: "Таблетки" },
                                                      { id: "injections", label: "Уколы" },
                                                      { id: "physio", label: "Физиотерапия" },
                                                  ].map((m) => (
                                                      <div key={m.id} className="flex items-center space-x-2 bg-secondary/10 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-colors cursor-pointer" onClick={() => toggleArrayItem("previousTreatment", m.id)}>
                                                          <Checkbox checked={formData.previousTreatment.includes(m.id)} />
                                                          <span className="text-xs font-medium">{m.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Обращались ли ранее к врачам? Какой диагноз ставили?</Label>
                                              <Input
                                                  placeholder="Укажите диагноз или клинику..."
                                                  className="bg-secondary/20 border-border text-sm h-11"
                                                  value={formData.medicalHistory}
                                                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Делали ли вы МРТ или КТ? Когда проводилось?</Label>
                                              <Input
                                                  placeholder="Укажите дату и вид обследования..."
                                                  className="bg-secondary/20 border-border text-sm h-11"
                                                  value={formData.mriCtHistory}
                                                  onChange={(e) => setFormData({ ...formData, mriCtHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли у вас результаты обследований на руках?</Label>
                                              <RadioGroup
                                                  value={formData.hasResults}
                                                  onValueChange={(v) => setFormData({ ...formData, hasResults: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, hasResults: "yes" })}>
                                                      <RadioGroupItem value="yes" id="results-yes" />
                                                      <Label htmlFor="results-yes" className="text-sm font-medium cursor-pointer">Да</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, hasResults: "no" })}>
                                                      <RadioGroupItem value="no" id="results-no" />
                                                      <Label htmlFor="results-no" className="text-sm font-medium cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Дополнительные вопросы */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Дополнительные уточняющие вопросы</h3>
                                        </div>

                                        <div className="grid gap-6 pl-9">
                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Боль отдает куда-то?</Label>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                      { id: "leg", label: "В ногу" },
                                                      { id: "arm", label: "В руку" },
                                                      { id: "shoulder", label: "В плечо" },
                                                  ].map((r) => (
                                                      <div key={r.id} className="flex items-center space-x-2 bg-secondary/10 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-colors cursor-pointer" onClick={() => toggleArrayItem("painRadiation", r.id)}>
                                                          <Checkbox checked={formData.painRadiation.includes(r.id)} />
                                                          <span className="text-xs font-medium">{r.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-6">
                                              <div className="flex items-center justify-between">
                                                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Насколько сильная боль (1-10)?</Label>
                                                  <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">{formData.painIntensity}</span>
                                              </div>
                                              <div className="flex items-center justify-between gap-1">
                                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                      <button
                                                          key={num}
                                                          type="button"
                                                          onClick={() => setFormData({ ...formData, painIntensity: num })}
                                                          className={cn(
                                                              "flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all border",
                                                              formData.painIntensity === num
                                                                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                                                  : "bg-secondary/20 text-muted-foreground border-border hover:border-primary/50"
                                                          )}
                                                      >
                                                          {num}
                                                      </button>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли онемение или покалывание в руках или ногах?</Label>
                                              <RadioGroup
                                                  value={formData.numbness}
                                                  onValueChange={(v) => setFormData({ ...formData, numbness: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, numbness: "yes" })}>
                                                      <RadioGroupItem value="yes" id="numbness-yes" />
                                                      <Label htmlFor="numbness-yes" className="text-sm font-medium cursor-pointer">Да</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-3 rounded-lg flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, numbness: "no" })}>
                                                      <RadioGroupItem value="no" id="numbness-no" />
                                                      <Label htmlFor="numbness-no" className="text-sm font-medium cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Мешает ли эта проблема в повседневной жизни?</Label>
                                              <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                      { id: "sitting", label: "Трудно сидеть" },
                                                      { id: "working", label: "Трудно работать" },
                                                      { id: "sleeping", label: "Трудно спать" },
                                                  ].map((l) => (
                                                      <div key={l.id} className="flex items-center space-x-2 bg-secondary/10 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-colors cursor-pointer" onClick={() => toggleArrayItem("lifeImpact", l.id)}>
                                                          <Checkbox checked={formData.lifeImpact.includes(l.id)} />
                                                          <span className="text-xs font-medium">{l.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                                <div className="space-y-4 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                                        <Info className="h-8 w-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Как мы работаем</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-secondary/20 rounded-2xl p-6 border border-border relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3 block">Скрипт для администратора</Label>
                                        <p className="text-lg leading-relaxed text-foreground/90 italic">
                                            «Мы используем комплексный подход. На диагностике врач не просто посмотрит снимки, но и проведет функциональные тесты. Это позволит найти первопричину боли, а не просто убрать симптом.»
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { title: "Точная диагностика", desc: "Используем современное оборудование и тесты." },
                                            { title: "Индивидуальный план", desc: "Каждый случай уникален, и лечение тоже." },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-background transition-all hover:bg-secondary/5">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Check className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                                <div className="space-y-4 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                                        <Sparkles className="h-8 w-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Ценность для клиента</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-secondary/20 rounded-2xl p-6 border border-border relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3 block">Скрипт для администратора</Label>
                                        <p className="text-lg leading-relaxed text-foreground/90 italic">
                                            «После диагностики вы получите четкое понимание: что происходит с вашим организмом и сколько времени займет восстановление. Мы работаем на результат.»
                                        </p>
                                    </div>
                                    <div className="flex bg-primary/5 rounded-2xl p-6 border border-primary/10 gap-4 transition-all hover:bg-primary/10">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <Star className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base mb-1 text-foreground">Почему это важно?</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Без точного диагноза лечение может быть неэффективным или даже вредным. Наша цель — вернуть вам качество жизни.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                                <div className="space-y-4 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Подготовка</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-secondary/20 rounded-2xl p-6 border border-border relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3 block">Скрипт для администратора</Label>
                                        <p className="text-lg leading-relaxed text-foreground/90 italic">
                                            «Пожалуйста, возьмите с собой все имеющиеся результаты обследований (МРТ, КТ, выписки). Также рекомендуем надеть удобную одежду для проведения тестов.»
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block text-center">Чек-лист для клиента</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                "Снимки МРТ/КТ",
                                                "Заключения врачей",
                                                "Спортивная одежда",
                                                "Хорошее настроение",
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border shadow-sm transition-all hover:shadow-md">
                                                    <CheckCheck className="h-5 w-5 text-[hsl(var(--status-good))]" />
                                                    <span className="text-sm font-medium text-foreground">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                                <div className="space-y-2 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-2">
                                        <Calendar className="h-6 w-6 text-primary" /> Запись на время
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Выберите удобное окно в расписании</p>
                                </div>
                                <BookingWidget
                                    selectedDoctor={formData.booking?.doctor}
                                    selectedDate={formData.booking?.date}
                                    selectedTime={formData.booking?.time}
                                    onBookingChange={(booking) => setFormData({ ...formData, booking })}
                                />
                            </div>
                        )}

                        {step === 6 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                                <div className="space-y-2 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-2">
                                        <Star className="h-6 w-6 text-primary" /> Оплата и подтверждение
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Выставите счет для закрепления записи</p>
                                </div>
                                <PaymentBlock
                                    customerPhone={lead.phone || ""}
                                    onPaymentConfirm={(payment) => setFormData({ ...formData, payment })}
                                />
                            </div>
                        )}

                        {step === 7 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                                <div className="space-y-4 text-center">
                                    <div className="h-20 w-20 rounded-full bg-[hsl(var(--status-good))/0.1] flex items-center justify-center mx-auto scale-110">
                                        <CheckCheck className="h-10 w-10 text-[hsl(var(--status-good))]" />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Завершение</h2>
                                    <p className="text-sm text-muted-foreground italic">
                                        «Ваша запись подтверждена. Мы отправили вам детали встречи в WhatsApp. Ждем вас!»
                                    </p>
                                </div>
                                <div className="grid gap-6 bg-secondary/10 p-8 rounded-3xl border border-border/50">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">ФИО Клиента</Label>
                                                <Input value={formData.finalFio} onChange={(e) => setFormData({ ...formData, finalFio: e.target.value })} className="bg-background" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Телефон</Label>
                                                <Input value={formData.finalPhone} disabled className="bg-background opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || isSaving}
                        className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft className="h-4 w-4" /> Назад
                    </Button>
                    {step < totalSteps ? (
                        <Button
                            onClick={nextStep}
                            className="gap-2 px-8 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Далее <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinalSave}
                            disabled={isSaving}
                            className="gap-2 px-10 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] font-bold uppercase tracking-widest text-[10px]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Завершить</>}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
