import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lead } from "../../crm/KanbanBoard";
import { 
    Activity, Zap, UserCheck, ShieldAlert, ArrowRight, Gauge, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export interface RehabFormData {
    answers: Record<string, any>;
    trialResults: string;
    jointMobility: number;
    muscleBalance: string;
    spineStabilization: string;
    triggerPoints: string;
    restrictions: string;
    painOnLoad: number;
    recommendations: string;
}

interface Props {
    lead: Lead;
    data: RehabFormData | null;
    onChange: (data: RehabFormData) => void;
    onComplete: () => void;
    readOnly?: boolean;
}

export const RehabDiagnosticTab: React.FC<Props> = ({ 
    lead, data, onChange, onComplete, readOnly = false 
}) => {
    const [formData, setFormData] = useState<RehabFormData>(data || {
        answers: {},
        trialResults: "",
        jointMobility: 5,
        muscleBalance: "",
        spineStabilization: "",
        triggerPoints: "",
        restrictions: "",
        painOnLoad: 0,
        recommendations: ""
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const updateField = (field: keyof RehabFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto w-full">
            {/* Header section with icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Пробная процедура</h3>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Результаты первой процедуры</Label>
                        <Textarea 
                            placeholder="Опишите реакцию организма..."
                            className="bg-secondary/5 border-border/40 min-h-[120px] rounded-[20px] text-sm font-medium focus:ring-primary/10"
                            value={formData.trialResults}
                            onChange={e => updateField("trialResults", e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                </div>

                <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <Gauge className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Функциональные показатели</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Подвижность суставов (1-10)</Label>
                                <Badge variant="secondary" className="font-mono text-xs">{formData.jointMobility}</Badge>
                            </div>
                            <Slider 
                                value={[formData.jointMobility]} 
                                max={10} 
                                step={1} 
                                onValueChange={([v]) => updateField("jointMobility", v)}
                                disabled={readOnly}
                                className="py-4"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Боль при нагрузке (1-10)</Label>
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none font-mono text-xs">{formData.painOnLoad}</Badge>
                            </div>
                            <Slider 
                                value={[formData.painOnLoad]} 
                                max={10} 
                                step={1} 
                                onValueChange={([v]) => updateField("painOnLoad", v)}
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stabilization & Trigger points */}
            <div className="bg-card border border-border/40 rounded-[40px] overflow-hidden shadow-sm">
                <div className="px-8 py-6 bg-secondary/10 flex items-center gap-4 border-b border-border/20">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <Brain className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Диагностика реабилитолога</h3>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Мышечный баланс</Label>
                            <Input 
                                placeholder="Дисбаланс мышц, гипертонус..."
                                className="h-12 bg-secondary/5 border-border/40 rounded-xl"
                                value={formData.muscleBalance}
                                onChange={e => updateField("muscleBalance", e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Стабилизация позвоночника</Label>
                            <Input 
                                placeholder="Оценка корсета..."
                                className="h-12 bg-secondary/5 border-border/40 rounded-xl"
                                value={formData.spineStabilization}
                                onChange={e => updateField("spineStabilization", e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Разметка триггерных точек</Label>
                            <Input 
                                placeholder="Локализация триггеров..."
                                className="h-12 bg-secondary/5 border-border/40 rounded-xl"
                                value={formData.triggerPoints}
                                onChange={e => updateField("triggerPoints", e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Противопоказания к упражнениям</Label>
                            <div className="relative">
                                <Input 
                                    placeholder="Ограничения по движениям..."
                                    className="h-12 bg-rose-500/5 border-rose-500/20 text-rose-700 placeholder:text-rose-400 rounded-xl pl-10"
                                    value={formData.restrictions}
                                    onChange={e => updateField("restrictions", e.target.value)}
                                    disabled={readOnly}
                                />
                                <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Итоговые рекомендации реабилитолога</h3>
                </div>
                <Textarea 
                    placeholder="Напишите план ЛФК или рекомендации по нагрузке..."
                    className="bg-white/50 border-emerald-500/20 min-h-[140px] rounded-[24px] text-sm font-bold p-6 focus:ring-emerald-500/20"
                    value={formData.recommendations}
                    onChange={e => updateField("recommendations", e.target.value)}
                    disabled={readOnly}
                />
            </div>

            {!readOnly && (
                <div className="flex justify-end pt-8">
                    <Button 
                        onClick={onComplete}
                        className="h-16 px-10 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase gap-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group shadow-primary/30"
                    >
                        Перейти к листу назначения
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};
