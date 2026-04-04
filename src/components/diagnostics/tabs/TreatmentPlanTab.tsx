import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Lead } from "../../crm/KanbanBoard";
import { TherapistFormData } from "./TherapistDiagnosticTab";
import { 
    FileText, CalendarDays, CheckCircle2, ArrowRight, UserCheck, CreditCard, Clock, Bell, Zap, FileDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreatmentPlanFormData {
    course: string;
    count: number;
    type: "full" | "partial";
    startDate: string;
    schedule: string;
    specialist: string;
    payment: "full" | "part";
    finalConclusion: string;
    reminderDate: string;
    reminderTime: string;
    confirmed: boolean;
}

interface Props {
    lead: Lead;
    therapistData: TherapistFormData | null;
    data: TreatmentPlanFormData | null;
    onChange: (data: TreatmentPlanFormData) => void;
    onComplete?: () => void;
    onGeneratePdf?: () => void;
    readOnly?: boolean;
}

export const TreatmentPlanTab: React.FC<Props> = ({ 
    lead, therapistData, data, onChange, onComplete, onGeneratePdf, readOnly = false 
}) => {
    const [formData, setFormData] = useState<TreatmentPlanFormData>(data || {
        course: "",
        count: 10,
        type: "full",
        startDate: new Date().toISOString().split('T')[0],
        schedule: "",
        specialist: lead.doctor_name || "",
        payment: "full",
        finalConclusion: "",
        reminderDate: "",
        reminderTime: "",
        confirmed: false,
    });

    useEffect(() => {
        onChange(formData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    const updateField = (field: keyof TreatmentPlanFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col space-y-10 animate-in fade-in pb-16 max-w-5xl mx-auto w-full">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side: Plan details */}
                <div className="space-y-8">
                    <div className="bg-card border border-border/40 rounded-[40px] p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Параметры курса</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Название курса / процедуры</Label>
                                <Input 
                                    className="h-12 bg-secondary/5 border-border/40 rounded-xl font-bold"
                                    placeholder="Напр: Реабилитация позвоночника"
                                    value={formData.course}
                                    onChange={e => updateField("course", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Кол-во занятий</Label>
                                    <Input 
                                        type="number"
                                        className="h-12 bg-secondary/5 border-border/40 rounded-xl font-bold"
                                        value={formData.count}
                                        onChange={e => updateField("count", parseInt(e.target.value) || 0)}
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Тип курса</Label>
                                    <Select 
                                        value={formData.type} 
                                        onValueChange={v => updateField("type", v)}
                                        disabled={readOnly}
                                    >
                                        <SelectTrigger className="h-12 bg-secondary/5 border-border/40 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full" className="font-bold">Полный</SelectItem>
                                            <SelectItem value="partial" className="font-bold">Частичный</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Врач / Специалист</Label>
                                <div className="relative">
                                    <Input 
                                        className="h-12 bg-secondary/5 border-border/40 rounded-xl font-bold pl-10"
                                        placeholder="ФИО специалиста"
                                        value={formData.specialist}
                                        onChange={e => updateField("specialist", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[40px] p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-700">Оплата</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    className={cn(
                                        "h-16 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                        formData.payment === "full" 
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                            : "bg-white/50 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
                                    )}
                                    onClick={() => updateField("payment", "full")}
                                    disabled={readOnly}
                                >
                                    Полная оплата
                                </button>
                                <button
                                    className={cn(
                                        "h-16 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                        formData.payment === "part" 
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                            : "bg-white/50 border-primary/20 text-primary hover:bg-primary/10"
                                    )}
                                    onClick={() => updateField("payment", "part")}
                                    disabled={readOnly}
                                >
                                    Часть (Депозит)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Schedule and Conclusion */}
                <div className="space-y-8">
                    <div className="bg-card border border-border/40 rounded-[40px] p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">График занятий</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Дата первого занятия</Label>
                                <Input 
                                    type="date"
                                    className="h-12 bg-secondary/5 border-border/40 rounded-xl font-bold"
                                    value={formData.startDate}
                                    onChange={e => updateField("startDate", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">График визитов</Label>
                                <Textarea 
                                    placeholder="Пн, Ср, Пт в 18:00..."
                                    className="min-h-[100px] bg-secondary/5 border-border/40 rounded-[20px] p-4 text-sm font-bold"
                                    value={formData.schedule}
                                    onChange={e => updateField("schedule", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-[40px] p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                <Bell className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-amber-700">Напоминание</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Дата</Label>
                                <Input 
                                    type="date"
                                    className="h-12 bg-white/50 border-amber-500/20 rounded-xl text-xs font-bold"
                                    value={formData.reminderDate}
                                    onChange={e => updateField("reminderDate", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Время</Label>
                                <Input 
                                    type="time"
                                    className="h-12 bg-white/50 border-amber-500/20 rounded-xl text-xs font-bold"
                                    value={formData.reminderTime}
                                    onChange={e => updateField("reminderTime", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Conclusion (Full width) */}
            <div className="bg-indigo-600 border border-indigo-600 rounded-[48px] p-10 space-y-6 shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 h-80 w-80 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-[22px] bg-white text-indigo-600 flex items-center justify-center shadow-xl shadow-black/10">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Итоговое заключение консилиума</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">Финальные рекомендации и прогноз</p>
                    </div>
                </div>
                
                <Textarea 
                    placeholder="Напишите итоговое заключение..."
                    className="min-h-[160px] bg-white/10 border-white/10 rounded-[32px] p-8 text-base font-bold text-white placeholder:text-white/20 focus:ring-white/20 relative z-10 shadow-inner"
                    value={formData.finalConclusion}
                    onChange={e => updateField("finalConclusion", e.target.value)}
                    disabled={readOnly}
                />
            </div>

            {!readOnly && (
                <div className="flex justify-end pt-10 gap-4">
                    {onGeneratePdf && (
                        <Button 
                            variant="outline"
                            onClick={onGeneratePdf}
                            className="h-20 px-10 rounded-[32px] border-primary/20 text-primary font-black text-xs uppercase tracking-[0.2em] gap-4 transition-all hover:bg-primary/5 active:scale-[0.98]"
                        >
                            <FileDown className="h-6 w-6" />
                            СКАЧАТЬ ПОЛНЫЙ ЛИСТ
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            const confirmedData = { ...formData, confirmed: true };
                            onChange(confirmedData);
                            if (onComplete) onComplete();
                        }}
                        className="h-20 px-12 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] gap-4 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.05] active:scale-[0.98] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <CheckCircle2 className="h-6 w-6" />
                        Завершить и закрыть сессию
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};
