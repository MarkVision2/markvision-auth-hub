import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
    Stethoscope, ArrowRight, ArrowLeft, Check,
    Calendar, ClipboardList, Star, CheckCheck, Loader2,
    MessageCircle, Heart, Info, Phone, User, X,
    CreditCard, Smartphone, MessageSquare, Flag, CheckCircle2, 
    ShieldAlert, History as LucideHistory, Edit2, Clock,
    Activity, FileSearch, ShieldCheck, Zap, HeartPulse, UserCheck
} from "lucide-react";
import { Lead } from "../../crm/KanbanBoard";
import { cn } from "@/lib/utils";
import { BookingWidget } from "../../crm/BookingWidget";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AdminFormData {
    complaints: string;
    painLocation: string;
    painLocationOther: string;
    painDuration: string;
    painType: string;
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
    bookingDate?: Date;
    bookingTime?: string;
    bookingDoctor?: string;
    adminComment: string;
    paymentMethod: string;
    paymentStatus: "pending" | "paid" | "declined";
    prepaymentAmount: string;
    refusalReason: string;
    confirmed: boolean;
    finalFio: string;
    finalPhone: string;
}

interface Props {
    lead: Lead;
    data: AdminFormData | null;
    onChange: (data: AdminFormData) => void;
    onNext: () => void;
    readOnly?: boolean;
}

export const AdminDiagnosticTab: React.FC<Props> = ({ lead, data, onChange, onNext, readOnly = false }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState<AdminFormData>(data || {
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
        bookingDate: undefined,
        bookingTime: "",
        bookingDoctor: "",
        adminComment: "",
        paymentMethod: "Kaspi",
        paymentStatus: "pending",
        prepaymentAmount: "",
        refusalReason: "",
        confirmed: false,
        finalFio: lead.name || "",
        finalPhone: lead.phone || "",
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const nextStep = () => {
        if (validateStage(step)) {
            if (step === 3 && formData.paymentStatus === "declined") {
                // Skip step 4 if declined
                handleConfirm();
            } else {
                setStep((s) => Math.min(s + 1, totalSteps));
            }
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

    const handleConfirm = () => {
        const stageToValidate = (step === 3 && formData.paymentStatus === "declined") ? 3 : 4;
        if (validateStage(stageToValidate)) {
            setFormData(prev => ({ ...prev, confirmed: true }));
            if (formData.paymentStatus === "declined") {
                toast({ title: "Отказ зафиксирован", description: "Сделка будет переведена в архив/отказ." });
            } else {
                toast({ title: "Подтверждено", description: "Запись подтверждена. Передача врачу." });
            }
            onNext();
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
        { id: 2, title: "Запись" },
        { id: 3, title: "Предоплата" },
        { id: 4, title: "Завершение" },
    ];

    // Inline edit states for Step 4
    const [editPatientData, setEditPatientData] = useState(false);
    const [editBookingData, setEditBookingData] = useState(false);


    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in pb-10">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 max-w-lg mx-auto w-full">
                {stages.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <div className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold border-2 transition-all",
                            step === s.id ? "border-primary bg-primary/10 text-primary" :
                            step > s.id ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground"
                        )}>
                            {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                        </div>
                        {i < stages.length - 1 && (
                            <div className={cn(
                                "flex-1 h-1 transition-all",
                                step > s.id ? "bg-primary" : "bg-border"
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="max-w-4xl mx-auto w-full">
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">Шаг 1. Выявление основной проблемы</h2>
                                    <p className="text-muted-foreground">Понять, что именно беспокоит пациента.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">Совет администратору</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                    Не перебивайте. Слушайте внимательно. Ведите пациента мягко, без хаоса и допроса.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Что именно вас сейчас беспокоит? <span className="text-destructive">*</span></Label>
                                <Textarea
                                    placeholder="Дайте пациенту выговориться..."
                                    className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-24 text-base resize-none rounded-2xl p-4"
                                    value={formData.complaints}
                                    onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Где именно ощущается боль? <span className="text-destructive">*</span></Label>
                                <RadioGroup
                                    value={formData.painLocation}
                                    onValueChange={(v) => !readOnly && setFormData({ ...formData, painLocation: v })}
                                    className="grid grid-cols-2 gap-3"
                                    disabled={readOnly}
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
                                                "flex items-center space-x-3 bg-secondary/5 border px-5 py-4 rounded-2xl transition-all",
                                                formData.painLocation === opt.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30",
                                                !readOnly && "cursor-pointer"
                                            )}
                                            onClick={() => !readOnly && setFormData({ ...formData, painLocation: opt.id })}
                                        >
                                            <RadioGroupItem value={opt.id} id={`loc-${opt.id}`} className="sr-only" />
                                            <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", formData.painLocation === opt.id && "bg-primary")}>
                                                {formData.painLocation === opt.id && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <Label htmlFor={`loc-${opt.id}`} className={cn("text-sm font-semibold", !readOnly && "cursor-pointer")}>{opt.label}</Label>
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
                                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Как давно появилась эта проблема? <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="Например: 2 недели..."
                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                        value={formData.painDuration}
                                        onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Боль постоянная или периодическая? <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="Введите ответ пациента..."
                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                        value={formData.painType}
                                        onChange={(e) => setFormData({ ...formData, painType: e.target.value })}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional questions (abbreviated for brevity in this step) */}
                        {/* They are similar to what was in DiagnosticMap we can omit some non-core ones if too long or keep them. Let's keep a few critical ones. */}
                        <div className="space-y-6 pt-4 border-t border-border/40">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                                <LucideHistory className="h-4 w-4" /> Анамнез и доп. вопросы
                            </h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground ">Сила боли (1-10)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Например: 7..."
                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                        value={formData.painIntensity}
                                        onChange={(e) => setFormData({ ...formData, painIntensity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Пробовали лечить?</Label>
                                    <Input
                                        placeholder="Да / Нет / Что именно..."
                                        className="bg-secondary/10 border-none text-base h-12 rounded-xl px-4 focus:ring-1 focus:ring-primary"
                                        value={formData.previousTreatment}
                                        onChange={(e) => setFormData({ ...formData, previousTreatment: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <MessageCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">2. Презентация диагностики и запись</h2>
                                    <p className="text-muted-foreground">Показать ценность и записать на удобное время.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
                            <div className="space-y-6">
                                <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-8">
                                    <div className="flex items-center gap-3 text-primary">
                                        <Star className="h-6 w-6 fill-primary/20" />
                                        <h3 className="text-lg font-bold uppercase tracking-tight">Ценность диагностики</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            {
                                                icon: Stethoscope,
                                                title: "Осмотр терапевта",
                                                desc: "Общий осмотр, давление, пульс, анамнез для исключения факторов."
                                            },
                                            {
                                                icon: Activity,
                                                title: "Осмотр реабилитолога",
                                                desc: "Диагностика позвоночника, подвижности и нервных реакций."
                                            },
                                            {
                                                icon: UserCheck,
                                                title: "Функциональные тесты",
                                                desc: "Тестовые движения для выявления блоков и перегрузок."
                                            },
                                            {
                                                icon: FileSearch,
                                                title: "Анализ обследований",
                                                desc: "Разбор ваших МРТ/КТ/Рентген на понятном языке."
                                            },
                                            {
                                                icon: ClipboardList,
                                                title: "Рекомендации",
                                                desc: "Причины боли, допустимые нагрузки и ограничения."
                                            },
                                            {
                                                icon: ShieldCheck,
                                                title: "План лечения",
                                                desc: "Пошаговый индивидуальный план восстановления."
                                            },
                                            {
                                                icon: Zap,
                                                title: "Первая процедура",
                                                desc: "Сразу после диагностики для быстрого снижения боли."
                                            }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-background/60 border border-primary/5 hover:bg-background transition-colors group">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-bold text-foreground leading-tight uppercase tracking-wide">{item.title}</h4>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-5 rounded-2xl bg-primary/10 border border-primary/10 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                            <HeartPulse className="h-5 w-5" />
                                        </div>
                                        <p className="text-[11px] font-bold text-primary leading-tight italic">
                                            «Это не просто консультация, а комплексное обследование для устранения причины боли.»
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 sticky top-8">
                                <div className="bg-background p-6 rounded-[32px] border border-border/80 shadow-xl shadow-primary/5 space-y-6">
                                    <div className="space-y-1 px-1">
                                        <h3 className="text-lg font-bold tracking-tight">Запись на прием</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Выберите дату и время</p>
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
                                    <div className="space-y-3 pt-4 border-t border-border/40">
                                        <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Комментарий админа</Label>
                                        <Textarea
                                            placeholder="Например: будет с МРТ..."
                                            className="bg-secondary/10 border-none focus:ring-1 focus:ring-primary h-20 text-xs font-medium resize-none rounded-xl p-3"
                                            value={formData.adminComment}
                                            onChange={(e) => setFormData({ ...formData, adminComment: e.target.value })}
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">3. Предоплата и гарантия визита</h2>
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
                                        <span className="font-semibold">Kaspi.kz</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Отправьте ссылку на оплату через WhatsApp. Это стандартная процедура клиники для фиксации времени.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full h-12 rounded-2xl gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-semibold"
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
                                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Статус предоплаты</Label>
                                    <RadioGroup
                                        value={formData.paymentStatus}
                                        onValueChange={(val: "pending" | "paid" | "declined") => !readOnly && setFormData({ ...formData, paymentStatus: val })}
                                        className="grid grid-cols-1 gap-3"
                                        disabled={readOnly}
                                    >
                                        {[
                                            { id: "pending", label: "Ожидается оплата", color: "text-amber-500", bg: "bg-amber-500/10" },
                                            { id: "paid", label: "Оплачено", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                            { id: "declined", label: "Отказ от предоплаты", color: "text-rose-500", bg: "bg-rose-500/10" },
                                        ].map((item) => (
                                            <div key={item.id} className="space-y-3">
                                                <div className="flex items-center">
                                                    <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                                                    <Label
                                                        htmlFor={item.id}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-between p-5 rounded-3xl border-2 transition-all",
                                                            formData.paymentStatus === item.id 
                                                                ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                                : "border-transparent bg-secondary/5 hover:bg-secondary/10",
                                                            !readOnly && "cursor-pointer"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", item.bg, item.color)} />
                                                            <span className="font-semibold">{item.label}</span>
                                                        </div>
                                                        {formData.paymentStatus === item.id && (
                                                            <Check className="h-4 w-4 text-primary animate-in zoom-in" />
                                                        )}
                                                    </Label>
                                                </div>

                                                {/* Conditional Inputs */}
                                                {formData.paymentStatus === "paid" && item.id === "paid" && (
                                                    <div className="px-2 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                                                            <Label className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Сумма предоплаты (₸)</Label>
                                                            <Input 
                                                                type="number"
                                                                placeholder="Введите сумму, например: 9990"
                                                                value={formData.prepaymentAmount}
                                                                onChange={e => setFormData({ ...formData, prepaymentAmount: e.target.value })}
                                                                className="h-10 bg-background border-emerald-500/20 focus:ring-emerald-500 font-bold"
                                                                disabled={readOnly}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {formData.paymentStatus === "declined" && item.id === "declined" && (
                                                    <div className="px-2 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                                                            <Label className="text-[10px] uppercase font-bold tracking-widest text-rose-600">Причина отказа</Label>
                                                            <Select 
                                                                value={formData.refusalReason} 
                                                                onValueChange={val => setFormData({ ...formData, refusalReason: val })}
                                                                disabled={readOnly}
                                                            >
                                                                <SelectTrigger className="h-10 bg-background border-rose-500/20 focus:ring-rose-500 font-medium">
                                                                    <SelectValue placeholder="Выберите причину" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="expensive">Дорого</SelectItem>
                                                                    <SelectItem value="thinking">Подумает</SelectItem>
                                                                    <SelectItem value="not_now">Не сейчас</SelectItem>
                                                                    <SelectItem value="other">Другое</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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

                {/* STEP 4 */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Flag className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">4. Финал и подтверждение</h2>
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
                                            <Button variant="link" size="sm" onClick={() => setStep(3)}>Изменить</Button>
                                        ) : (
                                            <p className={cn("font-semibold text-right", formData.paymentStatus === "paid" ? "text-emerald-500" : "text-amber-500")}>
                                                {formData.paymentStatus === "paid" ? "Оплачено" : "Ожидается"}
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
            {step < 4 && (
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
