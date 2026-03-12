import React, { useState } from "react";
import { Patient } from "@/types/doctor";
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
            className: "bg-[hsl(var(--status-good))] text-white border-none text-[8px] font-bold uppercase",
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
        <div className="space-y-4 animate-in zoom-in-95 duration-500">
            <AnimatePresence mode="wait">
                {status === 'sold' ? (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl text-center gap-4 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                        <div className="w-12 h-12 bg-[hsl(var(--status-good))] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgb(var(--status-good-rgb),0.2)] animate-in fade-in zoom-in duration-700">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Sales Complete</h2>
                            <p className="text-[11px] text-muted-foreground max-w-sm font-medium leading-relaxed">
                                Plan <span className="text-primary font-bold">"{activePlanData?.name}"</span> has been booked for <span className="text-foreground font-bold">{patient.name}</span>.
                            </p>
                        </div>
                        <Button
                            onClick={() => setStatus('idle')}
                            variant="secondary"
                            className="h-8 px-4 rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-sm hover:translate-y-[-1px] transition-all"
                        >
                            Next Patient
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Step 1: Clinical Strategy</label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger className="w-full h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-primary/20 hover:border-primary/30 transition-all shadow-sm">
                                        <SelectValue placeholder="Select rehabilitation course" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground rounded-xl shadow-2xl p-0.5">
                                        {treatmentPlans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.id} className="rounded-lg focus:bg-primary/10 py-2 text-[11px] cursor-pointer font-bold mb-0.5 last:mb-0 transition-colors">
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card className="bg-card/50 border-border overflow-hidden shadow-sm transition-all duration-500 hover:border-primary/10">
                                <CardContent className="p-0">
                                    <div className="bg-muted/30 px-4 py-2 border-b border-border flex justify-between items-center">
                                        <span className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-[0.15em]">Proposal Summary</span>
                                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 py-0.5 rounded-md">
                                            {activePlanData?.price || "---"}
                                        </Badge>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {selectedPlan ? (
                                            <>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black tracking-tight uppercase">{activePlanData?.name}</h3>
                                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{activePlanData?.description}</p>
                                                </div>
                                                <ul className="grid grid-cols-1 gap-1.5">
                                                    {["Result Guarantee", "Full Medical Support", "Tax Deduction (13%)"].map(item => (
                                                        <li key={item} className="flex items-center gap-2 text-foreground/70 font-bold text-[9px] uppercase tracking-wide">
                                                            <div className="h-4 w-4 rounded-md bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                                <Check className="w-2.5 h-2.5" />
                                                            </div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 opacity-30 gap-2 italic border border-dashed border-border rounded-xl bg-muted/5">
                                                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                                                <p className="text-[8px] font-black uppercase tracking-widest text-center px-4">Select course to view configuration</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Step 2: Conversion</label>

                                <div className="grid grid-cols-1 gap-2">
                                    <Button
                                        onClick={handleSale}
                                        className="w-full h-11 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9] text-white rounded-xl text-xs font-black gap-2 shadow-[0_4px_15px_rgb(var(--status-good-rgb),0.1)] transition-all active:scale-95 group relative overflow-hidden uppercase tracking-wider"
                                    >
                                        <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Confirm Sale
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStatus('thinking')}
                                            className="h-10 border-border bg-card hover:bg-muted/50 text-foreground rounded-lg text-[9px] font-black gap-1.5 uppercase tracking-widest shadow-sm transition-all hover:translate-y-[-1px]"
                                        >
                                            <Calendar className="w-3 h-3 text-primary" />
                                            Thinking
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={() => setStatus('refused')}
                                            className="h-10 text-destructive/60 hover:text-destructive hover:bg-destructive/5 rounded-lg gap-1.5 font-black uppercase tracking-widest text-[9px]"
                                        >
                                            <X className="w-3 h-3" />
                                            Rejection
                                        </Button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {status === 'refused' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 pt-1 overflow-hidden">
                                            <Select value={refusalReason} onValueChange={setRefusalReason}>
                                                <SelectTrigger className="bg-destructive/[0.02] border-destructive/20 text-destructive h-8 rounded-lg text-[9px] font-bold uppercase focus:ring-destructive/10">
                                                    <SelectValue placeholder="Reason for refusal" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border rounded-lg p-0.5">
                                                    <SelectItem value="price" className="py-1.5 text-[9px] font-bold uppercase cursor-pointer">Price sensitive</SelectItem>
                                                    <SelectItem value="time" className="py-1.5 text-[9px] font-bold uppercase cursor-pointer">Time constraints</SelectItem>
                                                    <SelectItem value="competitor" className="py-1.5 text-[9px] font-bold uppercase cursor-pointer">Went to competitor</SelectItem>
                                                    <SelectItem value="other" className="py-1.5 text-[9px] font-bold uppercase cursor-pointer">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                className="w-full bg-destructive/80 hover:bg-destructive h-8 rounded-lg font-black uppercase tracking-widest text-[8px]"
                                                onClick={handleRefusal}
                                            >
                                                Log Rejection
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {status === 'thinking' && (
                                <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-4 bg-primary/[0.02] border border-primary/10 rounded-xl flex flex-col gap-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Calendar className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="font-black uppercase tracking-[0.1em] text-primary text-[8px]">Follow-up Schedule</span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase opacity-60">Admin will follow up tomorrow.</p>
                                    <Button
                                        className="bg-primary hover:bg-primary/90 h-8 rounded-lg font-black text-primary-foreground text-[9px] uppercase tracking-widest shadow-md shadow-primary/10 transition-all hover:translate-y-[-1px]"
                                        onClick={() => { toast.info("Follow-up scheduled"); setStatus('idle'); }}
                                    >
                                        Set for Tomorrow
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
