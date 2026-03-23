import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractiveBodyMap } from "../components/InteractiveBodyMap";
import { Lead } from "../../crm/KanbanBoard";
import { DoctorFormData } from "./DoctorDiagnosticTab";
import { FileText, Map as MapIcon, Package, CalendarDays, Plus, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PrescriptionFormData {
    selectedZones: string[];
    packageId: string;
    startDate: string;
    doctorName: string;
    schedule: Array<{ date: string; time: string; procedure: string; room: string }>;
    confirmed?: boolean;
}

interface Props {
    lead: Lead;
    doctorData: DoctorFormData | null;
    data: PrescriptionFormData | null;
    onChange: (data: PrescriptionFormData) => void;
}

const PACKAGES = [
    { id: "base", name: "Базовый комплекс (УВТ + Массаж)", duration: "10 дней", price: "85 000 ₸" },
    { id: "pro", name: "Про интенсив (УВТ + Иглы + Массаж)", duration: "14 дней", price: "120 000 ₸" },
    { id: "premium", name: "Премиум восстановление", duration: "21 день", price: "180 000 ₸" },
];

export const PrescriptionTab: React.FC<Props> = ({ lead, doctorData, data, onChange }) => {
    
    const [formData, setFormData] = useState<PrescriptionFormData>({
        selectedZones: data?.selectedZones || [],
        packageId: data?.packageId || "",
        startDate: data?.startDate || new Date().toISOString().split('T')[0],
        doctorName: data?.doctorName || lead.doctor_name || "Иванов И.И.",
        schedule: data?.schedule || [
            { date: "2026-03-20", time: "10:00", procedure: "УВТ", room: "2" },
            { date: "2026-03-22", time: "10:00", procedure: "Массаж", room: "3" },
            { date: "2026-03-24", time: "10:00", procedure: "Осмотр врача", room: "1" },
        ],
        confirmed: data?.confirmed || false,
    });

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

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in pb-10 max-w-5xl mx-auto w-full">
            
            {/* Header / Info */}
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold uppercase tracking-tight text-primary flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-6 w-6" /> Лист назначения
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground w-2/3">Официальный документ, который фиксирует план лечения, расписание и зоны воздействия. Пациент ставит подпись после ознакомления.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column: Body Map & Packages */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Блок 1. Карта тела */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                            <MapIcon className="h-4 w-4 text-primary" /> 1. Проблемные зоны
                        </h3>
                        <InteractiveBodyMap 
                            selectedZones={formData.selectedZones} 
                            onToggleZone={handleZoneToggle} 
                        />
                        <p className="text-xs text-muted-foreground text-center">Нажмите на зоны, на которые будет направлено лечение</p>
                    </div>

                    {/* Блок 2. Пакет */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" /> 2. Пакет лечения
                        </h3>
                        <div className="grid gap-3">
                            {PACKAGES.map(pkg => (
                                <div 
                                    key={pkg.id}
                                    onClick={() => setFormData({...formData, packageId: pkg.id})}
                                    className={cn(
                                        "p-4 border-2 rounded-2xl cursor-pointer transition-all bg-card flex flex-col gap-1",
                                        formData.packageId === pkg.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">{pkg.name}</span>
                                        <div className={cn("h-4 w-4 rounded-full border", formData.packageId === pkg.id ? "border-[5px] border-primary" : "border-muted-foreground")} />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                        <span>Длительность: {pkg.duration}</span>
                                        <span className="font-semibold text-foreground">{pkg.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" /> 3. Расписание визитов
                    </h3>
                    
                    <div className="flex items-center gap-4 bg-secondary/10 p-4 rounded-2xl border border-secondary/20">
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Старт курса</Label>
                            <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-10 bg-background" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Лечащий врач</Label>
                            <Input value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} className="h-10 bg-background" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-secondary/20">
                                <TableRow>
                                    <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider">№</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Дата</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Время</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Процедура</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Каб.</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formData.schedule.map((row, idx) => (
                                    <TableRow key={idx} className="group">
                                        <TableCell className="text-center font-semibold text-muted-foreground text-xs">{idx + 1}</TableCell>
                                        <TableCell><Input value={row.date} onChange={e => updateSchedule(idx, "date", e.target.value)} type="date" className="h-8 text-xs font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-32" /></TableCell>
                                        <TableCell><Input value={row.time} onChange={e => updateSchedule(idx, "time", e.target.value)} type="time" className="h-8 text-xs font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-24" /></TableCell>
                                        <TableCell><Input value={row.procedure} onChange={e => updateSchedule(idx, "procedure", e.target.value)} className="h-8 text-xs font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all min-w-[120px]" placeholder="Название..." /></TableCell>
                                        <TableCell><Input value={row.room} onChange={e => updateSchedule(idx, "room", e.target.value)} className="h-8 text-xs font-medium bg-transparent border-transparent group-hover:bg-background group-hover:border-border transition-all w-16 text-center" placeholder="№" /></TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeScheduleRow(idx)} className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-2 border-t border-border/50 bg-secondary/5">
                            <Button variant="ghost" size="sm" onClick={addScheduleRow} className="w-full h-8 text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-border/80">
                                <Plus className="h-3 w-3 mr-2" /> Добавить строку
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="flex justify-end pt-4 mt-8 border-t border-border">
                {/* PDF generation button will be disabled/handled in parent */}
                <p className="text-xs text-muted-foreground mr-6 self-center">Не забудьте сохранить изменения перед генерацией PDF листа</p>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                         onClick={() => setFormData({...formData, confirmed: !formData.confirmed})}>
                        <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            formData.confirmed ? "bg-emerald-500 border-emerald-500" : "bg-background border-muted-foreground"
                        )}>
                            {formData.confirmed && <ShieldCheck className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide select-none">Назначение подтверждено</span>
                    </div>
                    <div className="px-6 py-3 rounded-xl bg-secondary/30 text-sm font-semibold flex items-center gap-2 border border-secondary shrink-0">
                        Итого: {PACKAGES.find(p => p.id === formData.packageId)?.price || "0 ₸"}
                    </div>
                </div>
            </div>

        </div>
    );
};
