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
    discountPercent: number;
    discountReason: string;
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
        discountPercent: data?.discountPercent || 0,
        discountReason: data?.discountReason || "",
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
    const discountedPrice = selectedPkg ? Math.round(selectedPkg.price * (1 - formData.discountPercent / 100)) : 0;

    const renderPackageDetails = (pkg: typeof PACKAGES[0]) => {
        const hasWeeks = 'procedures_week1' in pkg;
        return (
            <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                {/* Suitable for */}
                <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-primary/40 tracking-[0.2em] block">Кому подходит</span>
                    <div className="flex flex-wrap gap-2">
                        {pkg.suitableFor.map((item, i) => (
                            <span key={i} className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10 shrink-0">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Procedures */}
                <div className="space-y-4">
                    <span className="text-[10px] uppercase font-black text-primary/40 tracking-[0.2em] block">Программа процедур</span>
                    {hasWeeks ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-background border border-border/20 rounded-2xl relative overflow-hidden group/week">
                                <div className="absolute -right-2 -top-2 h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center opacity-20 group-hover/week:scale-110 transition-transform">
                                    <span className="text-xl font-black">1</span>
                                </div>
                                <span className="text-[10px] uppercase font-black text-primary tracking-widest block mb-3">Неделя 1</span>
                                <ul className="space-y-2">
                                    {(pkg as any).procedures_week1.map((p: string, i: number) => (
                                        <li key={i} className="text-[11px] font-bold text-foreground flex items-start gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-4 bg-background border border-border/20 rounded-2xl relative overflow-hidden group/week">
                                <div className="absolute -right-2 -top-2 h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center opacity-20 group-hover/week:scale-110 transition-transform">
                                    <span className="text-xl font-black">2</span>
                                </div>
                                <span className="text-[10px] uppercase font-black text-primary tracking-widest block mb-3">Неделя 2</span>
                                <ul className="space-y-2">
                                    {(pkg as any).procedures_week2.map((p: string, i: number) => (
                                        <li key={i} className="text-[11px] font-bold text-foreground flex items-start gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-background border border-border/20 rounded-2xl">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(pkg as any).procedures?.map((p: string, i: number) => (
                                    <li key={i} className="text-[11px] font-bold text-foreground flex items-start gap-3">
                                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Extras & Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <span className="text-[10px] uppercase font-black text-emerald-600/40 tracking-[0.2em] block">Дополнительно</span>
                        <div className="flex flex-wrap gap-2">
                            {pkg.extras.map((e, i) => (
                                <span key={i} className="px-3 py-1 bg-emerald-500/5 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-500/10 shrink-0 flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500" /> {e}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] uppercase font-black text-primary/40 tracking-[0.2em] block">Результаты</span>
                        <ul className="space-y-1.5">
                            {pkg.results.map((r, i) => (
                                <li key={i} className="text-[11px] font-black text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Base price info */}
                <div className="flex items-center justify-between p-5 bg-secondary/10 border border-border/20 rounded-2xl shadow-inner">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Базовая стоимость</span>
                    <span className="text-xl font-black text-foreground tabular-nums">
                        {pkg.price.toLocaleString('ru-RU')} ₸
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in pb-16 max-w-6xl mx-auto w-full">
            
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                
                {/* Left Column: Body Map & Packages */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Блок 1. Карта тела */}
                    <div className="bg-card border border-border/40 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div 
                            className="px-6 py-4 flex items-center justify-between bg-secondary/5 border-b border-border/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                    <MapIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">1. Проблемные зоны</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <InteractiveBodyMap 
                                selectedZones={formData.selectedZones} 
                                onToggleZone={handleZoneToggle} 
                            />
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Выберите зоны на карте для визуализации боли</p>
                            </div>
                        </div>
                    </div>

                    {/* Блок 2. Пакеты лечения */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                <Package className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">2. Пакет лечения</h3>
                        </div>
                        <div className="grid gap-4">
                            {PACKAGES.map(pkg => {
                                const isSelected = formData.packageId === pkg.id;
                                const isExpanded = expandedPackage === pkg.id;
                                return (
                                    <div 
                                        key={pkg.id}
                                        className={cn(
                                            "border-[3px] rounded-[32px] transition-all duration-300 overflow-hidden group/pkg",
                                            isSelected ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/10" : "border-border/60 bg-card hover:border-primary/20"
                                        )}
                                    >
                                        {/* Package header - click to select */}
                                        <div 
                                            className="p-6 cursor-pointer relative"
                                            onClick={() => setFormData({...formData, packageId: pkg.id})}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/30 uppercase tracking-[0.2em] transform transition-transform group-hover/pkg:scale-110">
                                                    Выбрано
                                                </div>
                                            )}
                                            
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center text-2xl shadow-sm group-hover/pkg:scale-110 transition-transform">
                                                            {pkg.icon}
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-sm uppercase tracking-widest">{pkg.name}</span>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{pkg.subtitle}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "h-7 w-7 rounded-2xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-500",
                                                    isSelected ? "border-primary bg-primary shadow-lg shadow-primary/30 rotate-0" : "border-border/40 rotate-[45deg]"
                                                )}>
                                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-6 pl-[52px]">
                                                <span className="text-2xl font-black text-foreground tabular-nums group-hover/pkg:text-primary transition-colors">{pkg.priceDisplay}</span>
                                                <Button 
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 flex items-center gap-2"
                                                    onClick={(e) => { e.stopPropagation(); setExpandedPackage(isExpanded ? null : pkg.id); }}
                                                >
                                                    {isExpanded ? "Свернуть" : "Детали"}
                                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expandable details */}
                                        {isExpanded && (
                                            <div className="border-t border-border/20 bg-background/50">
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
                <div className="xl:col-span-3 space-y-6">
                    {/* Schedule */}
                    <div className="bg-card border border-border/40 rounded-[40px] overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="p-8 space-y-8">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-[22px] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                        <CalendarDays className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">3. Расписание визитов</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">График лечебных процедур</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-2 bg-secondary/5 rounded-[30px] border border-border/20">
                                    <div className="px-4 py-2 bg-background border border-border/20 rounded-[22px] shadow-sm group/input">
                                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] block mb-0.5 group-hover/input:text-primary transition-colors">Старт курса</span>
                                        <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-6 bg-transparent border-none text-[11px] font-black uppercase focus:ring-0 outline-none w-28" />
                                    </div>
                                    <div className="px-4 py-2 bg-background border border-border/20 rounded-[22px] shadow-sm group/input flex-1">
                                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] block mb-0.5 group-hover/input:text-primary transition-colors">Лечащий врач</span>
                                        <input value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} className="h-6 bg-transparent border-none text-[11px] font-black uppercase focus:ring-0 outline-none w-full" placeholder="ВВЕДИТЕ ФИО..." />
                                    </div>
                                </div>
                            </div>

                            {/* Redesigned Table */}
                            <div className="bg-background border border-border/30 rounded-[32px] overflow-hidden shadow-inner group/table relative">
                                <Table>
                                    <TableHeader className="bg-secondary/5 border-b border-border/20">
                                        <TableRow>
                                            <TableHead className="w-14 text-center text-[10px] font-black uppercase tracking-widest text-primary/60">№</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Дата</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Время</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Процедура</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 w-24 text-center">Каб.</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.schedule.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-16">
                                                    <div className="flex flex-col items-center gap-3 opacity-30 select-none">
                                                        <Clock className="h-10 w-10 text-muted-foreground" />
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Нет запланированных визитов</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : formData.schedule.map((row, idx) => (
                                            <TableRow key={idx} className="group/row border-b border-border/10 hover:bg-primary/[0.01] transition-colors">
                                                <TableCell className="text-center">
                                                    <span className="text-[11px] font-black text-primary/30 group-hover/row:text-primary transition-colors tabular-nums">{idx + 1}</span>
                                                </TableCell>
                                                <TableCell><Input value={row.date} onChange={e => updateSchedule(idx, "date", e.target.value)} type="date" className="h-10 text-[11px] font-black uppercase bg-transparent border-none shadow-none focus:bg-background focus:shadow-sm focus:border-border transition-all w-32 rounded-xl group-hover/row:bg-background/50" /></TableCell>
                                                <TableCell><Input value={row.time} onChange={e => updateSchedule(idx, "time", e.target.value)} type="time" className="h-10 text-[11px] font-black bg-transparent border-none shadow-none focus:bg-background focus:shadow-sm focus:border-border transition-all w-24 rounded-xl group-hover/row:bg-background/50" /></TableCell>
                                                <TableCell><Input value={row.procedure} onChange={e => updateSchedule(idx, "procedure", e.target.value)} className="h-10 text-[11px] font-black uppercase bg-transparent border-none shadow-none focus:bg-background focus:shadow-sm focus:border-border transition-all min-w-[160px] rounded-xl group-hover/row:bg-background/50 placeholder:text-muted-foreground/30" placeholder="НАЗВАНИЕ..." /></TableCell>
                                                <TableCell><Input value={row.room} onChange={e => updateSchedule(idx, "room", e.target.value)} className="h-10 text-[11px] font-black bg-transparent border-none shadow-none focus:bg-background focus:shadow-sm focus:border-border transition-all w-16 text-center rounded-xl group-hover/row:bg-background/50" placeholder="№" /></TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeScheduleRow(idx)} className="h-8 w-8 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-all">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-3 bg-secondary/5">
                                    <Button variant="ghost" size="sm" onClick={addScheduleRow} className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/5 transition-all border-2 border-dashed border-primary/20 hover:border-primary/40 rounded-2xl flex items-center justify-center gap-3">
                                        <Plus className="h-4 w-4" /> Добавить в расписание курс лечения
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decision Status */}
                    <div className="p-8 bg-card border border-border/40 rounded-[40px] space-y-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-[22px] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">4. Решение пациента</h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Финальный статус консультации</p>
                            </div>
                        </div>
                        
                        <RadioGroup
                            value={formData.decision}
                            onValueChange={(val: any) => setFormData({...formData, decision: val})}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                            {[
                                { id: "treatment", label: "Лечение назначено", color: "text-emerald-500", bg: "bg-emerald-500", borderColor: "border-emerald-500/30", bgLight: "bg-emerald-500/5", icon: CheckCircle2 },
                                { id: "thinking", label: "Пациент думает", color: "text-amber-500", bg: "bg-amber-500", borderColor: "border-amber-500/30", bgLight: "bg-amber-500/5", icon: Clock },
                                { id: "refused", label: "Отказ от курса", color: "text-rose-500", bg: "bg-rose-500", borderColor: "border-rose-500/30", bgLight: "bg-rose-500/5", icon: XCircle },
                            ].map((item) => {
                                const isActive = formData.decision === item.id;
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={item.id}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] border-[3px] transition-all cursor-pointer relative overflow-hidden group/opt",
                                            isActive ? `${item.bgLight} ${item.borderColor} shadow-lg shadow-black/5` : "border-border/40 bg-background hover:border-primary/20 hover:bg-secondary/5"
                                        )}
                                        onClick={() => setFormData({...formData, decision: item.id as any})}
                                    >
                                        {isActive && (
                                            <div className="absolute top-0 right-0 p-4 animate-in zoom-in-95 duration-500">
                                                <div className={cn("h-3 w-3 rounded-full shadow-lg", item.bg)} />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "h-14 w-14 rounded-3xl flex items-center justify-center transition-all duration-300",
                                            isActive ? item.bg + " text-white shadow-lg shadow-black/10 scale-110" : "bg-card text-muted-foreground/30 group-hover/opt:scale-110"
                                        )}>
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <span className={cn(
                                            "font-black text-[11px] uppercase tracking-widest text-center transition-colors px-2",
                                            isActive ? "text-foreground" : "text-muted-foreground/40 group-hover/opt:text-foreground"
                                        )}>
                                            {item.label}
                                        </span>
                                        <RadioGroupItem value={item.id} id={`dec-${item.id}`} className="sr-only" />
                                    </div>
                                );
                            })}
                        </RadioGroup>

                        {/* Refusal reason */}
                        {formData.decision === "refused" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 p-8 bg-rose-500/5 border border-rose-500/10 rounded-[32px]">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-rose-500" />
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-rose-600">Причина отказа</Label>
                                </div>
                                <div className="grid gap-4">
                                    <Select value={formData.refusalReason} onValueChange={(v) => setFormData({...formData, refusalReason: v})}>
                                        <SelectTrigger className="h-14 rounded-[22px] border-rose-500/20 bg-background focus:ring-rose-500/20 font-black text-[11px] uppercase tracking-widest">
                                            <SelectValue placeholder="ВЫБЕРИТЕ ПРИЧИНУ..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-2xl border-border/40">
                                            {REFUSAL_REASONS.map(r => (
                                                <SelectItem key={r} value={r} className="rounded-xl text-[11px] font-black uppercase tracking-widest">{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formData.refusalReason === "Другое" && (
                                        <Input 
                                            placeholder="ОПИШИТЕ ПОДРОБНЕЕ..."
                                            value={formData.refusalReasonOther || ""}
                                            onChange={e => setFormData({...formData, refusalReasonOther: e.target.value})}
                                            className="h-14 rounded-[22px] border-rose-500/20 bg-background text-[11px] font-black uppercase tracking-widest focus:ring-rose-500/20 px-6 shadow-inner"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary & Action */}
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                        {selectedPkg && (
                            <div className="relative overflow-hidden p-1 bg-gradient-to-br from-primary/30 to-emerald-500/30 rounded-[48px] shadow-2xl">
                                <div className="bg-white/95 backdrop-blur-xl rounded-[44px] p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 relative">
                                    <div className="space-y-8 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Percent className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block">Персональное предложение</span>
                                                <h4 className="text-xl font-black uppercase tracking-widest mt-0.5">Скидка и расчет</h4>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            {[0, 5, 10, 15].map((pct) => (
                                                <Button
                                                    key={pct}
                                                    variant={formData.discountPercent === pct ? "default" : "outline"}
                                                    size="lg"
                                                    onClick={() => setFormData({...formData, discountPercent: pct})}
                                                    className={cn(
                                                        "h-14 px-8 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all duration-300",
                                                        formData.discountPercent === pct 
                                                            ? "bg-primary shadow-xl shadow-primary/30 scale-105 border-none" 
                                                            : "hover:bg-primary/5 border-border/40 hover:border-primary/20"
                                                    )}
                                                >
                                                    {pct === 0 ? "БЕЗ СКИДКИ" : `${pct}% СКИДКА`}
                                                </Button>
                                            ))}
                                        </div>

                                        {formData.discountPercent > 0 && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 pl-2">Причина применения скидки</Label>
                                                <Input 
                                                    placeholder="НАПР: КОРПОРАТИВНАЯ КВОТА, ЛЬГОТА..."
                                                    value={formData.discountReason}
                                                    onChange={e => setFormData({...formData, discountReason: e.target.value})}
                                                    className="h-14 bg-secondary/5 border-primary/20 focus:ring-primary/20 shadow-inner rounded-[22px] text-[11px] font-black uppercase tracking-widest px-6"
                                                />
                                            </div>
                                        )}
                                        {formData.discountPercent > 0 && (
                                            <div className="flex flex-col items-end mt-4 animate-in zoom-in-95 duration-500">
                                                <div className="px-4 py-1.5 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest mb-2 shadow-lg shadow-emerald-500/20">
                                                    Выгода { (selectedPkg.price * formData.discountPercent / 100).toLocaleString('ru-RU') } ₸
                                                </div>
                                                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Итого к оплате:</span>
                                                <span className="text-5xl font-black text-emerald-500 tabular-nums tracking-tight">
                                                    {discountedPrice.toLocaleString('ru-RU')} ₸
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end pt-10">
                            {onComplete && formData.decision && (
                                <Button 
                                    onClick={onComplete}
                                    disabled={formData.discountPercent > 0 && !formData.discountReason}
                                    className="h-20 px-12 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] gap-4 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    Завершить и сохранить
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
