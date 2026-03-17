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
    const totalSteps = 3;

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
            <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-col bg-background border-none rounded-none overflow-hidden">
                <DialogHeader className="px-8 py-6 border-b border-border shrink-0 bg-background z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Диагностика и запись на прием</DialogTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">Клиент: <span className="text-foreground font-semibold">{lead.name}</span> · {lead.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Прогресс диагностики</span>
                                <div className="flex gap-1.5">
                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1.5 w-12 rounded-full transition-all duration-500",
                                                i + 1 <= step ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : "bg-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-10 w-10">
                                <Check className="h-5 w-5 rotate-45" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: MAIN CONTENT */}
                    <div className="flex-1 overflow-y-auto bg-background p-10 relative">
                        <div className="max-w-3xl mx-auto">
                        {/* Step 1: Выявление проблемы (formerly step 2) */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-12">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                                        <ClipboardList className="h-8 w-8 text-primary" /> 1. Первичный опрос
                                    </h2>
                                    <p className="text-muted-foreground text-lg">Задайте вопросы клиенту и зафиксируйте ответы для врача.</p>
                                </div>

                                <div className="space-y-12">
                                    {/* Section 1: Выявление проблемы */}
                                    <div className="space-y-8 bg-secondary/5 rounded-3xl p-8 border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                                            <h3 className="text-lg font-bold">Выявление проблемы пациента</h3>
                                        </div>
                                        
                                        <div className="grid gap-8 pl-12 border-l-2 border-primary/10">
                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Что именно вас сейчас беспокоит?</Label>
                                              <Textarea
                                                  placeholder="Боль в пояснице, шее, между лопатками, в суставах?"
                                                  className="bg-background border-border focus:ring-primary h-24 text-base resize-none"
                                                  value={formData.complaints}
                                                  onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Как давно появилась эта проблема?</Label>
                                              <Input
                                                  placeholder="Укажите примерный срок (недели, месяцы)..."
                                                  className="bg-background border-border text-base h-12"
                                                  value={formData.painDuration}
                                                  onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Характер боли</Label>
                                              <RadioGroup
                                                  value={formData.painType}
                                                  onValueChange={(v) => setFormData({ ...formData, painType: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, painType: "constant" })}>
                                                      <RadioGroupItem value="constant" id="type-constant" />
                                                      <Label htmlFor="type-constant" className="text-base font-medium cursor-pointer">Постоянная</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, painType: "periodic" })}>
                                                      <RadioGroupItem value="periodic" id="type-periodic" />
                                                      <Label htmlFor="type-periodic" className="text-base font-medium cursor-pointer">Периодическая</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-4">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">В какой момент боль усиливается?</Label>
                                              <div className="grid grid-cols-2 gap-4">
                                                  {[
                                                      { id: "walking", label: "При ходьбе" },
                                                      { id: "sitting", label: "При сидении" },
                                                      { id: "bending", label: "При наклонах" },
                                                      { id: "morning", label: "Утром после сна" },
                                                  ].map((t) => (
                                                      <div key={t.id} className="flex items-center space-x-3 bg-background border border-border p-4 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => toggleArrayItem("painTriggers", t.id)}>
                                                          <Checkbox checked={formData.painTriggers.includes(t.id)} />
                                                          <span className="text-sm font-medium">{t.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Уточнение состояния */}
                                    <div className="space-y-8 bg-secondary/5 rounded-3xl p-8 border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                                            <h3 className="text-lg font-bold">Уточнение состояния</h3>
                                        </div>

                                        <div className="grid gap-8 pl-12 border-l-2 border-primary/10">
                                          <div className="space-y-4">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Пробовали ли вы уже как-то лечить эту проблему?</Label>
                                              <div className="grid grid-cols-2 gap-4">
                                                  {[
                                                      { id: "massage", label: "Массаж" },
                                                      { id: "pills", label: "Таблетки" },
                                                      { id: "injections", label: "Уколы" },
                                                      { id: "physio", label: "Физиотерапия" },
                                                  ].map((m) => (
                                                      <div key={m.id} className="flex items-center space-x-3 bg-background border border-border p-4 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => toggleArrayItem("previousTreatment", m.id)}>
                                                          <Checkbox checked={formData.previousTreatment.includes(m.id)} />
                                                          <span className="text-sm font-medium">{m.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Обращались ли ранее к врачам? Какой диагноз ставили?</Label>
                                              <Input
                                                  placeholder="Диагнозы или посещенные клиники..."
                                                  className="bg-background border-border text-base h-12"
                                                  value={formData.medicalHistory}
                                                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Делали ли вы МРТ или КТ? Когда проводилось?</Label>
                                              <Input
                                                  placeholder="Пример: МРТ поясницы в октябре 2023..."
                                                  className="bg-background border-border text-base h-12"
                                                  value={formData.mriCtHistory}
                                                  onChange={(e) => setFormData({ ...formData, mriCtHistory: e.target.value })}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли у вас результаты обследований на руках?</Label>
                                              <RadioGroup
                                                  value={formData.hasResults}
                                                  onValueChange={(v) => setFormData({ ...formData, hasResults: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, hasResults: "yes" })}>
                                                      <RadioGroupItem value="yes" id="results-yes" />
                                                      <Label htmlFor="results-yes" className="text-base font-medium cursor-pointer">Да</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, hasResults: "no" })}>
                                                      <RadioGroupItem value="no" id="results-no" />
                                                      <Label htmlFor="results-no" className="text-base font-medium cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Дополнительные вопросы */}
                                    <div className="space-y-8 bg-secondary/5 rounded-3xl p-8 border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                                            <h3 className="text-lg font-bold">Дополнительные уточняющие вопросы</h3>
                                        </div>

                                        <div className="grid gap-8 pl-12 border-l-2 border-primary/10">
                                          <div className="space-y-4">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Боль отдает куда-то?</Label>
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                  {[
                                                      { id: "leg", label: "В ногу" },
                                                      { id: "arm", label: "В руку" },
                                                      { id: "shoulder", label: "В плечо" },
                                                  ].map((r) => (
                                                      <div key={r.id} className="flex items-center space-x-3 bg-background border border-border p-4 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => toggleArrayItem("painRadiation", r.id)}>
                                                          <Checkbox checked={formData.painRadiation.includes(r.id)} />
                                                          <span className="text-sm font-medium">{r.label}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-8">
                                              <div className="flex items-center justify-between">
                                                  <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Насколько сильная боль (1-10)?</Label>
                                                  <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">{formData.painIntensity}</span>
                                              </div>
                                              <div className="flex items-center justify-between gap-1 sm:gap-2">
                                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                      <button
                                                          key={num}
                                                          type="button"
                                                          onClick={() => setFormData({ ...formData, painIntensity: num })}
                                                          className={cn(
                                                              "flex-1 h-14 rounded-xl flex items-center justify-center text-base font-bold transition-all border shadow-sm",
                                                              formData.painIntensity === num
                                                                  ? "bg-primary text-primary-foreground border-primary shadow-[0_5px_15px_-5px_var(--primary)] scale-110 z-10"
                                                                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-secondary/5"
                                                          )}
                                                      >
                                                          {num}
                                                      </button>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="space-y-3">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Есть ли онемение или покалывание в руках или ногах?</Label>
                                              <RadioGroup
                                                  value={formData.numbness}
                                                  onValueChange={(v) => setFormData({ ...formData, numbness: v })}
                                                  className="flex gap-4"
                                              >
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, numbness: "yes" })}>
                                                      <RadioGroupItem value="yes" id="numbness-yes" />
                                                      <Label htmlFor="numbness-yes" className="text-base font-medium cursor-pointer">Да</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-3 bg-background border border-border px-6 py-4 rounded-xl flex-1 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFormData({ ...formData, numbness: "no" })}>
                                                      <RadioGroupItem value="no" id="numbness-no" />
                                                      <Label htmlFor="numbness-no" className="text-base font-medium cursor-pointer">Нет</Label>
                                                  </div>
                                              </RadioGroup>
                                          </div>

                                          <div className="space-y-4">
                                              <Label className="text-[12px] uppercase font-bold tracking-widest text-muted-foreground">Мешает ли эта проблема в повседневной жизни?</Label>
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                  {[
                                                      { id: "sitting", label: "Трудно сидеть" },
                                                      { id: "working", label: "Трудно работать" },
                                                      { id: "sleeping", label: "Трудно спать" },
                                                  ].map((l) => (
                                                      <div key={l.id} className="flex items-center space-x-3 bg-background border border-border p-4 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => toggleArrayItem("lifeImpact", l.id)}>
                                                          <Checkbox checked={formData.lifeImpact.includes(l.id)} />
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

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-12">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                                        <Calendar className="h-8 w-8 text-primary" /> 2. Запись и Оплата
                                    </h2>
                                    <p className="text-muted-foreground text-lg">Нужно получить предоплату, чтобы зафиксировать время.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-12">
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2 italic">
                                            <ArrowRight className="h-5 w-5 text-primary" /> Выбор свободного окна
                                        </h3>
                                        <BookingWidget
                                            selectedDoctor={formData.booking?.doctor}
                                            selectedDate={formData.booking?.date}
                                            selectedTime={formData.booking?.time}
                                            onBookingChange={(booking) => setFormData({ ...formData, booking })}
                                        />
                                    </div>

                                    <div className="space-y-6 bg-primary/5 p-8 rounded-3xl border border-primary/20">
                                        <h3 className="text-xl font-bold flex items-center gap-2 italic">
                                            <Star className="h-5 w-5 text-primary" /> Оплата диагностики
                                        </h3>
                                        <p className="text-sm text-balance leading-relaxed mb-6">
                                            Администратор говорит про важность предоплаты и выставляет счет в WhatsApp.
                                        </p>
                                        <PaymentBlock
                                            customerPhone={lead.phone || ""}
                                            onPaymentConfirm={(payment) => setFormData({ ...formData, payment })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
                                <div className="space-y-8 max-w-xl">
                                    <div className="h-32 w-32 rounded-full bg-[hsl(var(--status-good))/0.1] flex items-center justify-center mx-auto animate-bounce-subtle">
                                        <CheckCheck className="h-16 w-16 text-[hsl(var(--status-good))]" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black tracking-tighter text-foreground">Запись подтверждена!</h2>
                                        <p className="text-xl text-muted-foreground font-medium italic leading-relaxed">
                                            «Ваша запись подтверждена. Мы отправим вам информацию о клинике и видео как до нас добраться до встречи.»
                                        </p>
                                    </div>
                                    <div className="bg-secondary/10 p-10 rounded-[40px] border border-border/50 text-left">
                                        <div className="grid gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">ФИО Клиента для системы</Label>
                                                <Input 
                                                    value={formData.finalFio} 
                                                    onChange={(e) => setFormData({ ...formData, finalFio: e.target.value })} 
                                                    className="bg-background text-lg h-14 rounded-2xl border-border"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-2xl bg-background border border-border">
                                                    <span className="block text-[10px] uppercase font-black text-muted-foreground mb-1">Время</span>
                                                    <span className="text-lg font-bold">{formData.booking?.time || "—"}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-background border border-border">
                                                    <span className="block text-[10px] uppercase font-black text-muted-foreground mb-1">Сумма</span>
                                                    <span className="text-lg font-bold text-primary">{formData.payment?.amount ? `${formData.payment.amount} ₸` : "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: ADMIN ASSISTANT */}
                <aside className="w-[380px] border-l border-border bg-muted/30 flex flex-col overflow-hidden">
                        <div className="px-6 py-8 border-b border-border bg-background">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" /> Admin Assistant
                            </h3>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-10 pb-12">
                                {/* Checklist Grouped */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Чек-лист опроса</h4>
                                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                            {[ 
                                                formData.complaints.length > 5, 
                                                !!formData.painDuration, 
                                                formData.painTriggers.length > 0, 
                                                formData.previousTreatment.length > 0, 
                                                !!formData.mriCtHistory, 
                                                formData.hasResults !== "", 
                                                formData.lifeImpact.length > 0 
                                            ].filter(Boolean).length} / 7
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {[ 
                                            { label: "Жалобы пациента", filled: formData.complaints.length > 5, icon: Stethoscope },
                                            { label: "Срок проблемы", filled: !!formData.painDuration, icon: Calendar },
                                            { label: "Характер и триггеры", filled: formData.painTriggers.length > 0, icon: Sparkles },
                                            { label: "Пред. лечение", filled: formData.previousTreatment.length > 0, icon: ClipboardList },
                                            { label: "МРТ / КТ история", filled: !!formData.mriCtHistory, icon: FileText },
                                            { label: "Наличие результатов", filled: formData.hasResults !== "", icon: CheckCheck },
                                            { label: "Влияние на жизнь", filled: formData.lifeImpact.length > 0, icon: User },
                                        ].map((item, i) => (
                                            <div key={i} className={cn(
                                                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300",
                                                item.filled 
                                                    ? "bg-primary/[0.03] border-primary/20 shadow-sm" 
                                                    : "bg-background border-border"
                                            )}>
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500",
                                                    item.filled 
                                                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                        : "border-muted text-muted-foreground bg-muted/20"
                                                )}>
                                                    {item.filled ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <item.icon className="h-3.5 w-3.5" />}
                                                </div>
                                                <span className={cn(
                                                    "text-[11px] font-bold tracking-tight",
                                                    item.filled ? "text-foreground" : "text-muted-foreground"
                                                )}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sales Scripts */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Скрипты продаж</h4>
                                    
                                    <div className="grid gap-3">
                                        {[ 
                                            { 
                                                q: "Зачем предоплата?", 
                                                a: "«Это гарантирует ваше место в графике врача. Мы клиника с плотной записью, и так мы уверены, что вы точно придете.»" 
                                            },
                                            { 
                                                q: "\"Дорого\"", 
                                                a: "«Здоровье — это инвестиция. Мы не просто снимаем боль, мы решаем причину, чтобы вы больше не тратили на таблетки.»" 
                                            },
                                            { 
                                                q: "\"Я подумаю\"", 
                                                a: "«Конечно, подумайте. Но помните, что грыжи и протрузии сами не проходят. Пока вы думаете, процесс разрушения идет.»" 
                                            }
                                        ].map((script, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-background border border-border hover:border-primary/20 transition-all space-y-2 group cursor-default shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    <p className="text-[9px] font-black text-primary uppercase">{script.q}</p>
                                                </div>
                                                <p className="text-[11px] leading-relaxed italic text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {script.a}
                                                </p>
                                            </div>
                                        ))}

                                        <div className="p-5 rounded-3xl bg-primary/[0.04] border-2 border-primary/20 space-y-2.5 relative overflow-hidden">
                                            <div className="absolute -right-2 -top-2 opacity-5">
                                                <Sparkles className="h-12 w-12" />
                                            </div>
                                            <p className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5">
                                                Закрытие на запись
                                            </p>
                                            <p className="text-[12px] leading-relaxed font-bold">
                                                «Давайте я забронирую вам время на завтра в 14:00, чтобы вы уже после первого сеанса почувствовали облегчение?»
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Tip Card */}
                                <div className="p-6 rounded-[32px] bg-foreground text-background relative overflow-hidden shadow-xl">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Info className="h-12 w-12" />
                                    </div>
                                    <h5 className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Золотое правило</h5>
                                    <p className="text-[12px] leading-snug font-medium">
                                        Будьте уверены в голосе. Вы не продаете услугу, вы предлагаете решение боли пациента.
                                    </p>
                                </div>
                            </div>
                        </ScrollArea>
                    </aside>
                </div>

                <div className="px-10 py-6 border-t border-border flex items-center justify-between bg-muted/10 shrink-0 z-10">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || isSaving}
                        className="gap-2 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl hover:bg-secondary/10"
                    >
                        <ArrowLeft className="h-4 w-4" /> Назад
                    </Button>
                    {step < totalSteps ? (
                        <Button
                            onClick={nextStep}
                            className="gap-2 px-10 h-12 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20"
                            disabled={step === 2 && (!formData.booking || !formData.payment)}
                        >
                            Далее <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinalSave}
                            disabled={isSaving}
                            className="gap-2 px-12 h-14 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-[hsl(var(--status-good))/0.3]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-5 w-5" /> Завершить</>}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
