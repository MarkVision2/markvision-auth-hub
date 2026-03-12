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
            className: "bg-emerald-600 text-white border-none",
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
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <AnimatePresence mode="wait">
                {status === 'sold' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center p-12 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-[32px] text-center gap-6"
                    >
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-bounce">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-emerald-400">ПОБЕДА! ПАКЕТ ПРОДАН</h2>
                        <p className="text-xl text-white/60 max-w-md">План лечения "{activePlanData?.name}" успешно забронирован для пациента {patient.name}.</p>
                        <Button onClick={() => setStatus('idle')} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">К следующему пациенту</Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Шаг 1: Выберите стратегию лечения</label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger className="w-full h-16 bg-[#121218] border-white/10 text-xl rounded-2xl focus:ring-emerald-500/50">
                                        <SelectValue placeholder="Выберите курс реабилитации" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                        {treatmentPlans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.id} className="focus:bg-emerald-600/20 py-4 text-lg cursor-pointer">
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card className="bg-[#121218] border-emerald-500/20 overflow-hidden shadow-2xl transition-all duration-500">
                                <CardContent className="p-0">
                                    <div className="bg-emerald-600/10 px-8 py-4 border-b border-emerald-500/10 flex justify-between items-center">
                                        <span className="text-emerald-400 font-bold uppercase text-xs tracking-tighter">Сводка предложения</span>
                                        <Badge className="bg-emerald-500 text-white">{activePlanData?.price || "---"}</Badge>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        {selectedPlan ? (
                                            <>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-bold">{activePlanData?.name}</h3>
                                                    <p className="text-white/40">{activePlanData?.description}</p>
                                                </div>
                                                <ul className="space-y-3">
                                                    <li className="flex items-center gap-3 text-emerald-400/80"><Check className="w-5 h-5" /> Гарантия результата</li>
                                                    <li className="flex items-center gap-3 text-emerald-400/80"><Check className="w-5 h-5" /> Полное мед. сопровождение</li>
                                                    <li className="flex items-center gap-3 text-emerald-400/80"><Check className="w-5 h-5" /> Налоговый вычет</li>
                                                </ul>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-8 opacity-20 gap-2 italic">
                                                <AlertCircle className="w-8 h-8" />
                                                Выберите курс для просмотра деталей
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col justify-between gap-4">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Шаг 2: Закройте продажу</label>

                                <Button
                                    onClick={handleSale}
                                    className="w-full h-24 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] text-2xl font-black gap-4 shadow-[0_10px_40px_rgba(16,185,129,0.2)] transition-transform active:scale-95 group"
                                >
                                    <Check className="w-8 h-8 group-hover:scale-125 transition-transform" />
                                    Пакет продан
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setStatus('thinking')}
                                    className="w-full h-20 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-[24px] text-xl font-bold gap-3"
                                >
                                    <Calendar className="w-6 h-6 text-blue-400" />
                                    Думает
                                </Button>

                                <div className="space-y-3 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStatus('refused')}
                                        className="w-full h-14 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl gap-2 font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Отказ
                                    </Button>

                                    {status === 'refused' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 px-2">
                                            <Select value={refusalReason} onValueChange={setRefusalReason}>
                                                <SelectTrigger className="bg-red-400/5 border-red-400/20 text-red-200">
                                                    <SelectValue placeholder="Причина отказа" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                                    <SelectItem value="price">Дорого</SelectItem>
                                                    <SelectItem value="time">Нет времени</SelectItem>
                                                    <SelectItem value="competitor">Ушел к конкурентам</SelectItem>
                                                    <SelectItem value="other">Другое</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button className="w-full bg-red-600/80 hover:bg-red-600" onClick={handleRefusal}>Зафиксировать отказ</Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {status === 'thinking' && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                        <span className="font-bold text-blue-300">Назначить follow-up звонок</span>
                                    </div>
                                    <p className="text-sm text-white/50 italic">Выберите дату, когда администратор должен связаться с пациентом для уточнения решения.</p>
                                    <Button className="bg-blue-600 hover:bg-blue-500" onClick={() => { toast.info("Follow-up назначен"); setStatus('idle'); }}>Назначить на завтра</Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
