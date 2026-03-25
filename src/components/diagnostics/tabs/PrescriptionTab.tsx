import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractiveBodyMap } from "../components/InteractiveBodyMap";
import { Lead } from "../../crm/KanbanBoard";
import { DoctorFormData } from "./DoctorDiagnosticTab";
import { 
    FileText, Map as MapIcon, Package, CalendarDays, Plus, Trash2, ShieldCheck,
    ChevronDown, ChevronUp, Check, Clock, XCircle, CheckCircle2, ArrowRight, Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface PrescriptionFormData {
    selectedZones: string[];
    packageId: string;
    startDate: string;
    doctorName: string;
    schedule: Array<{ date: string; time: string; procedure: string; room: string }>;
    confirmed?: boolean;
    decision: "treatment" | "thinking" | "refused" | "";
    refusalReason?: string;
    refusalReasonOther?: string;
}

interface Props {
    lead: Lead;
    doctorData: DoctorFormData | null;
    data: PrescriptionFormData | null;
    onChange: (data: PrescriptionFormData) => void;
    onComplete?: () => void;
}

const REFUSAL_REASONS = [
    "Дорого",
    "Другой город",
    "Подумает",
    "Не сейчас",
    "Другое"
];

const PACKAGES = [
    { 
        id: "pain_relief", 
        name: "Снятие боли", 
        subtitle: "Экспресс-программа восстановления",
        price: 110000,
        priceDisplay: "110 000 ₸",
        discount: 15,
        suitableFor: [
            "острая боль",
            "сильное мышечное напряжение",
            "нужно быстро облегчить состояние"
        ],
        procedures: [
            "противовоспалительная терапия",
            "электрофорез для снятия боли",
            "светотерапия Bioptron",
            "вихревые ванны для улучшения кровообращения"
        ],
        extras: ["питание (обед)"],
        results: [
            "уменьшение боли",
            "расслабление мышц",
            "улучшение подвижности позвоночника"
        ],
        color: "emerald",
        icon: "💚"
    },
    { 
        id: "spine_recovery", 
        name: "Восстановление позвоночника", 
        subtitle: "Комплексная программа лечения",
        price: 210000,
        priceDisplay: "210 000 ₸",
        discount: 15,
        suitableFor: [
            "хроническая боль",
            "защемление нерва",
            "ограничение движения"
        ],
        procedures_week1: [
            "противовоспалительная терапия",
            "СМТ терапия",
            "электрофорез",
            "плазмотерапия (восстановление тканей)"
        ],
        procedures_week2: [
            "восстановительная медикаментозная терапия",
            "лечебный массаж",
            "парафинотерапия",
            "прессотерапия"
        ],
        extras: ["питание (обед)"],
        results: [
            "снятие воспаления",
            "восстановление подвижности позвоночника",
            "уменьшение давления на нерв",
            "возвращение нормальной активности"
        ],
        color: "blue",
        icon: "💙"
    },
    { 
        id: "full_rehab", 
        name: "Полная реабилитация позвоночника", 
        subtitle: "Максимальная программа восстановления",
        price: 310000,
        priceDisplay: "310 000 ₸",
        discount: 15,
        suitableFor: [
            "длительная хроническая боль",
            "грыжи или протрузии",
            "серьёзные ограничения движения"
        ],
        procedures_week1: [
            "противовоспалительная терапия",
            "СМТ терапия",
            "магнитотерапия",
            "вихревые лечебные ванны",
            "плазмотерапия"
        ],
        procedures_week2: [
            "восстановительная терапия",
            "лечебный массаж",
            "лазерная терапия",
            "парафинотерапия",
            "прессотерапия",
            "углекислая ванна",
            "ударно-волновая терапия"
        ],
        extras: ["питание (обед)"],
        results: [
            "глубокое восстановление позвоночника",
            "снятие мышечных спазмов",
            "улучшение кровообращения",
            "значительное уменьшение боли"
        ],
        color: "violet",
        icon: "💜"
    },
];

export const PrescriptionTab: React.FC<Props> = ({ lead, doctorData, data, onChange, onComplete }) => {
    
    const [formData, setFormData] = useState<PrescriptionFormData>({
        selectedZones: data?.selectedZones || [],
        packageId: data?.packageId || "",
        startDate: data?.startDate || new Date().toISOString().split('T')[0],
        doctorName: data?.doctorName || lead.doctor_name || "",
        schedule: data?.schedule || [],
        confirmed: data?.confirmed || false,
        decision: data?.decision || "",
        refusalReason: data?.refusalReason || "",
        refusalReasonOther: data?.refusalReasonOther || "",
    });

    const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleZoneToggle = (zoneId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedZones: prev.selectedZones.includes(zoneId)
                ? prev.selectedZones.filter(id => id !== zoneId)
                : [...prev.selectedZones, zoneId]
        }));
    };

    const addScheduleRow = () => {
        setFormData(prev => ({
            ...prev,
            schedule: [...prev.schedule, { date: "", time: "", procedure: "", room: "" }]
        }));
    };

    const updateSchedule = (index: number, field: string, value: string) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setFormData({ ...formData, schedule: newSchedule });
    };

    const removeScheduleRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            schedule: prev.schedule.filter((_, i) => i !== index)
        }));
    };

    const selectedPkg = PACKAGES.find(p => p.id === formData.packageId);
    const discountedPrice = selectedPkg ? Math.round(selectedPkg.price * (1 - selectedPkg.discount / 100)) : 0;

    const renderPackageDetails = (pkg: typeof PACKAGES[0]) => {
        const hasWeeks = 'procedures_week1' in pkg;
        return (
            <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                {/* Suitable for */}
                <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Подходит пациентам</span>
                    <ul className="mt-1.5 space-y-1">
                        {pkg.suitableFor.map((item, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>{item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Procedures */}
                <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Процедуры</span>
                    {hasWeeks ? (
                        <div className="mt-1.5 space-y-3">
                            <div>
                                <span className="text-[9px] uppercase font-bold text-primary/60 tracking-wider">Первая неделя</span>
                                <ul className="mt-1 space-y-0.5">
                                    {(pkg as any).procedures_week1.map((p: string, i: number) => (
                                        <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                            <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-bold text-primary/60 tracking-wider">Вторая неделя</span>
                                <ul className="mt-1 space-y-0.5">
                                    {(pkg as any).procedures_week2.map((p: string, i: number) => (
                                        <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                            <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <ul className="mt-1.5 space-y-0.5">
                            {(pkg as any).procedures?.map((p: string, i: number) => (
                                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Extras */}
                <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Дополнительно</span>
                    <ul className="mt-1 space-y-0.5">
                        {pkg.extras.map((e, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />{e}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Results */}
                <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Результат программы</span>
                    <ul className="mt-1.5 space-y-0.5">
                        {pkg.results.map((r, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />{r}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Discount info */}
                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <Percent className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">При полной оплате скидка {pkg.discount}%</span>
                    <span className="text-xs font-bold text-foreground ml-auto">
                        {Math.round(pkg.price * (1 - pkg.discount / 100)).toLocaleString('ru-RU')} ₸
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-4 animate-in fade-in pb-10 max-w-5xl mx-auto w-full">
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* Left Column: Body Map & Packages */}
                <div className="xl:col-span-1 space-y-4">
                    {/* Блок 1. Карта тела */}
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger asChild>
                            <div className="px-4 py-3 bg-secondary/5 border border-border/50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <MapIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest">1. Проблемные зоны</h3>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-1 p-4 border border-border/30 rounded-2xl">
                                <InteractiveBodyMap 
                                    selectedZones={formData.selectedZones} 
                                    onToggleZone={handleZoneToggle} 
                                />
                                <p className="text-[10px] text-muted-foreground text-center mt-2">Нажмите на зоны лечения</p>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Блок 2. Пакеты лечения */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-1">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Package className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest">2. Пакет лечения</h3>
                        </div>
                        <div className="space-y-2">
                            {PACKAGES.map(pkg => {
                                const isSelected = formData.packageId === pkg.id;
                                const isExpanded = expandedPackage === pkg.id;
                                return (
                                    <div 
                                        key={pkg.id}
                                        className={cn(
                                            "border-2 rounded-2xl transition-all overflow-hidden",
                                            isSelected ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10" : "border-border/60 bg-card hover:border-primary/30"
                                        )}
                                    >
                                        {/* Package header - click to select */}
                                        <div 
                                            className="p-4 cursor-pointer"
                                            onClick={() => setFormData({...formData, packageId: pkg.id})}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{pkg.icon}</span>
                                                        <span className="font-bold text-sm">{pkg.name}</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-7">{pkg.subtitle}</p>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                )}>
                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 ml-7">
                                                <span className="text-lg font-black text-foreground">{pkg.priceDisplay}</span>
                                                <button 
                                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                                    onClick={(e) => { e.stopPropagation(); setExpandedPackage(isExpanded ? null : pkg.id); }}
                                                >
                                                    {isExpanded ? "Свернуть" : "Подробнее"}
                                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable details */}
                                        {isExpanded && (
                                            <div className="border-t border-border/30">
                                                {renderPackageDetails(pkg)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule + Decision */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Schedule */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 px-1">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <CalendarDays className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest">3. Расписание визитов</h3>
                        </div>
                    
                        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/5 rounded-2xl border border-border/40">
                            <div className="flex-1 space-y-1">
                                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Старт курса</Label>
                                <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-8 text-xs bg-background rounded-lg" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Лечащий врач</Label>
                                <Input value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} className="h-8 text-xs bg-background rounded-lg" />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-secondary/10">
                                    <TableRow>
                                        <TableHead className="w-10 text-center text-[10px] font-bold uppercase tracking-wider">№</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Дата</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Время</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Процедура</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Каб.</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.schedule.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                                Нет записей в расписании. Нажмите «Добавить» ниже.
                                            </TableCell>
                                        </TableRow>
                                    ) : formData.schedule.map((row, idx) => (
                                        <TableRow key={idx} className="group">
                                            <TableCell className="text-center font-bold text-muted-foreground text-[10px]">{idx + 1}</TableCell>
                                            <TableCell><Input value={row.date} onChange={e => updateSchedule(idx, "date", e.target.value)} type="date" className="h-7 text-[11px] font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-32 rounded-lg" /></TableCell>
                                            <TableCell><Input value={row.time} onChange={e => updateSchedule(idx, "time", e.target.value)} type="time" className="h-7 text-[11px] font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-24 rounded-lg" /></TableCell>
                                            <TableCell><Input value={row.procedure} onChange={e => updateSchedule(idx, "procedure", e.target.value)} className="h-7 text-[11px] font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all min-w-[120px] rounded-lg" placeholder="Название..." /></TableCell>
                                            <TableCell><Input value={row.room} onChange={e => updateSchedule(idx, "room", e.target.value)} className="h-7 text-[11px] font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-16 text-center rounded-lg" placeholder="№" /></TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeScheduleRow(idx)} className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-1.5 border-t border-border/40">
                                <Button variant="ghost" size="sm" onClick={addScheduleRow} className="w-full h-7 text-[10px] font-bold text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-border rounded-lg">
                                    <Plus className="h-3 w-3 mr-1.5" /> Добавить визит
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Decision Status */}
                    <div className="p-5 border border-border/50 rounded-2xl bg-secondary/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest">4. Решение пациента</h3>
                        </div>
                        
                        <RadioGroup
                            value={formData.decision}
                            onValueChange={(val: any) => setFormData({...formData, decision: val})}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2"
                        >
                            {[
                                { id: "treatment", label: "Лечение назначено", color: "text-emerald-500", bg: "bg-emerald-500", borderColor: "border-emerald-500/30", bgLight: "bg-emerald-500/10", icon: CheckCircle2 },
                                { id: "thinking", label: "Думает", color: "text-amber-500", bg: "bg-amber-500", borderColor: "border-amber-500/30", bgLight: "bg-amber-500/10", icon: Clock },
                                { id: "refused", label: "Отказ", color: "text-rose-500", bg: "bg-rose-500", borderColor: "border-rose-500/30", bgLight: "bg-rose-500/10", icon: XCircle },
                            ].map((item) => {
                                const isActive = formData.decision === item.id;
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={item.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer",
                                            isActive ? `${item.bgLight} ${item.borderColor} shadow-inner` : "border-transparent bg-background hover:bg-secondary/5"
                                        )}
                                        onClick={() => setFormData({...formData, decision: item.id as any})}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className={cn("h-4 w-4", isActive ? item.color : "text-muted-foreground/40")} />
                                            <span className={cn("font-bold text-xs", isActive ? item.color : "text-muted-foreground/60")}>{item.label}</span>
                                        </div>
                                        <RadioGroupItem value={item.id} id={`dec-${item.id}`} className="sr-only" />
                                        {isActive && (
                                            <div className="flex h-2 w-2">
                                                <span className={cn("animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-40", item.bg)}></span>
                                                <span className={cn("relative inline-flex rounded-full h-2 w-2", item.bg)}></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </RadioGroup>

                        {/* Refusal reason */}
                        {formData.decision === "refused" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label className="text-[9px] uppercase font-bold tracking-wider text-rose-600">Причина отказа</Label>
                                <Select value={formData.refusalReason} onValueChange={(v) => setFormData({...formData, refusalReason: v})}>
                                    <SelectTrigger className="h-9 rounded-xl border-rose-500/20 bg-rose-500/5 focus:ring-rose-500 font-bold text-xs">
                                        <SelectValue placeholder="Выберите причину..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {REFUSAL_REASONS.map(r => (
                                            <SelectItem key={r} value={r} className="rounded-lg text-xs">{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.refusalReason === "Другое" && (
                                    <Input 
                                        placeholder="Укажите причину..."
                                        value={formData.refusalReasonOther || ""}
                                        onChange={e => setFormData({...formData, refusalReasonOther: e.target.value})}
                                        className="h-9 rounded-xl border-rose-500/20 bg-background text-xs font-medium"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Summary & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <div className="flex items-center gap-4">
                            {selectedPkg && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs text-muted-foreground font-bold uppercase">Итого:</span>
                                    <span className="text-lg font-black text-foreground">{selectedPkg.priceDisplay}</span>
                                    <span className="text-xs text-emerald-500 font-bold line-through opacity-60"></span>
                                </div>
                            )}
                            {selectedPkg && (
                                <div className="text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    со скидкой {discountedPrice.toLocaleString('ru-RU')} ₸
                                </div>
                            )}
                        </div>
                        
                        {onComplete && formData.decision && (
                            <Button 
                                onClick={onComplete}
                                className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Завершить диагностику
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
