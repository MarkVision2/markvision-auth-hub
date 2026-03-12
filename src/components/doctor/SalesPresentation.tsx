import React, { useState } from "react";
import { Patient } from "@/pages/DoctorTerminal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, X, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SalesPresentationProps {
    patient: Patient;
}

export const SalesPresentation: React.FC<SalesPresentationProps> = ({ patient }) => {
    const [status, setStatus] = useState<'idle' | 'sold' | 'thinking' | 'refused'>('idle');
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [refusalReason, setRefusalReason] = useState<string>("");

    const treatmentPlans = [
        { id: "intensive", name: "Интенсивный курс (2 недели)", price: "250 000 ₸", description: "10 сеансов терапии + 5 консультаций специалистов" },
        { id: "standard", name: "Стандарт (4 недели)", price: "300 000 ₸", description: "12 сеансов терапии + ЛФК + сопровождение" },
        { id: "premium", name: "Premium | Реабилитация (8 недель)", price: "450 000 ₸", description: "Полный цикл восстановления, VIP палата, индивидуальный куратор" },
    ];

    const handleSale = () => {
        if (!selectedPlan) {
            toast.error("Сначала выберите курс реабилитации");
            return;
        }
        setStatus('sold');
        toast.success("Пакет успешно продан!", {
            className: "bg-[hsl(var(--status-good))] text-white border-none",
        });
    };

    const handleRefusal = () => {
        if (!refusalReason) {
            toast.error("Выберите причину отказа");
            return;
        }
        setStatus('refused');
    };

    const activePlanData = treatmentPlans.find(p => p.id === selectedPlan);

    return (
        <div className="space-y-10 animate-in zoom-in-95 duration-700">
            <AnimatePresence mode="wait">
                {status === 'sold' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center p-16 bg-[hsl(var(--status-good))]/5 border-2 border-[hsl(var(--status-good))]/20 rounded-[40px] text-center gap-8 shadow-2xl"
                    >
                        <div className="w-28 h-28 bg-[hsl(var(--status-good))] rounded-full flex items-center justify-center shadow-[0_0_60px_rgb(var(--status-good-rgb),0.4)] animate-bounce">
                            <Sparkles className="w-14 h-14 text-white" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-[hsl(var(--status-good))] tracking-tight uppercase">Победа!</h2>
                            <p className="text-xl text-muted-foreground max-w-md font-medium">
                                План лечения <span className="text-foreground font-bold">"{activePlanData?.name}"</span> успешно забронирован для пациента <span className="text-foreground font-bold">{patient.name}</span>.
                            </p>
                        </div>
                        <Button
                            onClick={() => setStatus('idle')}
                            variant="outline"
                            className="h-14 px-8 border-[hsl(var(--status-good))]/30 text-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))]/10 rounded-2xl font-bold uppercase tracking-widest text-xs"
                        >
                            К следующему пациенту
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Шаг 1: Выберите стратегию лечения</label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger className="w-full h-18 bg-card border-border text-xl font-bold rounded-2xl focus:ring-primary/20 hover:border-primary/30 transition-all shadow-sm">
                                        <SelectValue placeholder="Выберите курс реабилитации" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground rounded-2xl shadow-2xl p-2">
                                        {treatmentPlans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.id} className="rounded-xl focus:bg-primary/10 py-5 text-lg cursor-pointer font-medium mb-1 last:mb-0 transition-colors">
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card className="bg-card border-border overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/10">
                                <CardContent className="p-0">
                                    <div className="bg-muted/30 px-8 py-5 border-b border-border flex justify-between items-center">
                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em]">Сводка по курсу</span>
                                        <Badge className="bg-primary text-primary-foreground font-black text-sm px-4 py-1.5 rounded-lg shadow-lg shadow-primary/20">
                                            {activePlanData?.price || "---"}
                                        </Badge>
                                    </div>
                                    <div className="p-10 space-y-8">
                                        {selectedPlan ? (
                                            <>
                                                <div className="space-y-3">
                                                    <h3 className="text-3xl font-black tracking-tight">{activePlanData?.name}</h3>
                                                    <p className="text-muted-foreground font-medium leading-relaxed">{activePlanData?.description}</p>
                                                </div>
                                                <ul className="space-y-4">
                                                    {["Гарантия результата", "Полное мед. сопровождение", "Налоговый вычет (13%)"].map(item => (
                                                        <li key={item} className="flex items-center gap-4 text-primary font-bold text-sm">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 opacity-30 gap-4 italic border-2 border-dashed border-border rounded-3xl">
                                                <AlertCircle className="w-10 h-10 text-muted-foreground" />
                                                <p className="text-sm font-bold uppercase tracking-widest">Выберите курс для просмотра деталей</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Шаг 2: Закройте продажу</label>

                                <Button
                                    onClick={handleSale}
                                    className="w-full h-28 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] text-white rounded-[32px] text-3xl font-black gap-5 shadow-[0_15px_40px_rgb(var(--status-good-rgb),0.25)] transition-all active:scale-95 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Check className="w-10 h-10 group-hover:scale-125 transition-transform" />
                                    Пакет продан
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setStatus('thinking')}
                                    className="w-full h-20 border-border bg-card hover:bg-muted/50 text-foreground rounded-[32px] text-xl font-black gap-4 shadow-sm transition-all hover:translate-y-[-2px]"
                                >
                                    <Calendar className="w-7 h-7 text-primary" />
                                    Думает
                                </Button>

                                <div className="space-y-4 pt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStatus('refused')}
                                        className="w-full h-14 text-destructive/60 hover:text-destructive hover:bg-destructive/5 rounded-2xl gap-3 font-bold uppercase tracking-widest text-xs"
                                    >
                                        <X className="w-4 h-4" />
                                        Отказ от пакета
                                    </Button>

                                    {status === 'refused' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 px-2">
                                            <Select value={refusalReason} onValueChange={setRefusalReason}>
                                                <SelectTrigger className="bg-destructive/5 border-destructive/20 text-destructive h-12 rounded-xl focus:ring-destructive/20">
                                                    <SelectValue placeholder="Укажите причину отказа" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border rounded-xl">
                                                    <SelectItem value="price" className="py-3 cursor-pointer">Дорого</SelectItem>
                                                    <SelectItem value="time" className="py-3 cursor-pointer">Нет времени</SelectItem>
                                                    <SelectItem value="competitor" className="py-3 cursor-pointer">Ушел к конкурентам</SelectItem>
                                                    <SelectItem value="other" className="py-3 cursor-pointer">Другое</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                className="w-full bg-destructive/80 hover:bg-destructive h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                                onClick={handleRefusal}
                                            >
                                                Зафиксировать отказ
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {status === 'thinking' && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-8 bg-primary/5 border border-primary/20 rounded-[32px] flex flex-col gap-5 shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-primary text-xs">Назначить follow-up звонок</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">Администратор свяжется с пациентом в указанную дату для уточнения окончательного решения по лечению.</p>
                                    <Button className="bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]" onClick={() => { toast.info("Follow-up назначен"); setStatus('idle'); }}>Назначить на завтра</Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
