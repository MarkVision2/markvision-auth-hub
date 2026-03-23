import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Stethoscope, FileText, User, Phone, X, Save, FileDown, Clock, Activity, Loader2, ClipboardList
} from "lucide-react";
import { Lead } from "../crm/KanbanBoard";
import { AdminDiagnosticTab, AdminFormData } from "./tabs/AdminDiagnosticTab";
import { DoctorDiagnosticTab, DoctorFormData } from "./tabs/DoctorDiagnosticTab";
import { PrescriptionTab, PrescriptionFormData } from "./tabs/PrescriptionTab";
import { DiagnosticPdfExport, DiagnosticPdfExportRef } from "./components/DiagnosticPdfExport";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DiagnosticModuleProps {
    lead: Lead;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: (data: any) => void;
    mode?: "admin" | "doctor";
}

export const DiagnosticModule: React.FC<DiagnosticModuleProps> = ({ 
    lead, open, onOpenChange, onComplete, mode = "admin" 
}) => {
    const [activeTab, setActiveTab] = useState("admin");
    const [isSaving, setIsSaving] = useState(false);
    const pdfRef = useRef<DiagnosticPdfExportRef>(null);
    
    // В реальном проекте здесь будет стейт для всех 3 вкладок
    const [adminData, setAdminData] = useState<AdminFormData | null>(null);
    const [doctorData, setDoctorData] = useState<DoctorFormData | null>(null);
    const [prescriptionData, setPrescriptionData] = useState<PrescriptionFormData | null>(null);

    const handleSave = async () => {
        if (!adminData) return;
        setIsSaving(true);
        try {
            // Mapping statuses to CRM stages
            let newStatus = lead.status;
            if (adminData.paymentStatus === "pending") newStatus = "Счет отправлен";
            if (adminData.paymentStatus === "paid") newStatus = "Диагностика";
            if (adminData.paymentStatus === "declined") newStatus = "Отказ";

            const updateData: any = {
                status: newStatus,
                amount: adminData.prepaymentAmount ? Number(adminData.prepaymentAmount) : lead.amount,
                doctor_name: adminData.bookingDoctor || lead.doctor_name,
            };

            if (adminData.bookingDate && adminData.bookingTime) {
                // Combine date and time
                const timeStr = adminData.bookingTime; // e.g. "10:00"
                const [h, m] = timeStr.split(":").map(Number);
                const scheduledAt = new Date(adminData.bookingDate);
                scheduledAt.setHours(h, m, 0, 0);
                updateData.scheduled_at = scheduledAt.toISOString();
            }

            if (adminData.paymentStatus === "declined" && adminData.refusalReason) {
                updateData.ai_summary = (lead.ai_summary || "") + `\n[Отказ от предоплаты: ${adminData.refusalReason}]`;
            }

            const { error } = await (supabase as any)
                .from("leads_crm")
                .update(updateData)
                .eq("id", lead.id);

            if (error) throw error;

            // Trigger analytics webhook (n8n)
            try {
                await fetch("https://n8n.zapoinov.com/webhook/lead-status-changed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        table: "leads_crm",
                        type: "UPDATE",
                        record: {
                            id: lead.id,
                            status: newStatus,
                            project_id: lead.project_id,
                            deal_amount: updateData.amount || 0,
                        },
                        old_record: { status: lead.status },
                    }),
                });
            } catch (e) {
                console.error("Webhook failed", e);
            }

            toast({ title: "Успешно", description: "Данные карточки обновлены и синхронизированы" });
            if (onComplete) onComplete({ adminData, doctorData, prescriptionData });
        } catch (error: any) {
            toast({ title: "Ошибка", description: error.message || "Не удалось сохранить", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!pdfRef.current) return;
        try {
            toast({ title: "Генерация PDF", description: "Подождите, создаем документ..." });
            await pdfRef.current.generatePdf();
            toast({ title: "Готово", description: "PDF успешно скачан" });
        } catch (e) {
            toast({ title: "Ошибка", description: "Не удалось сгенерировать PDF", variant: "destructive" });
        }
    };

    const statusBadgeColors: Record<string, string> = {
        "Новая заявка": "bg-primary/10 text-primary border-primary/20",
        "Записан": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        "Готов к лечению": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };

    const statusColor = statusBadgeColors[lead.status || ""] || "bg-muted text-muted-foreground";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-col bg-background border-none rounded-none overflow-hidden">
                {/* Header: Единый статус пациента */}
                <DialogHeader className="px-6 py-3 border-b border-border shrink-0 bg-background z-10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight">Рабочая форма пациента</DialogTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="outline" className={cn("px-2 py-0 h-5 font-semibold text-[10px] uppercase tracking-wider", statusColor)}>
                                    {lead.status || "Новая заявка"}
                                </Badge>
                                <span>·</span>
                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.name}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleGeneratePdf} className="h-8 gap-2 text-xs font-semibold">
                            <FileDown className="h-3.5 w-3.5" /> PDF
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 gap-2 text-xs font-semibold">
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Сохранить
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-4 pb-0 border-b border-border bg-background shrink-0">
                                <TabsList className="bg-transparent border-none p-0 h-auto gap-6 mb-[-1px]">
                                    <TabsTrigger 
                                        value="admin" 
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 gap-2 font-semibold transition-all"
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        1. Диагностика (Админ)
                                    </TabsTrigger>
                                    {mode === "doctor" && (
                                        <>
                                            <TabsTrigger 
                                                value="doctor" 
                                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 gap-2 font-semibold transition-all"
                                            >
                                                <Stethoscope className="h-4 w-4" />
                                                2. Осмотр (Врач)
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="prescription" 
                                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 gap-2 font-semibold transition-all"
                                            >
                                                <FileText className="h-4 w-4" />
                                                3. Лист назначения
                                            </TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6 min-h-full">
                                    <TabsContent value="admin" className="m-0 focus-visible:outline-none">
                                        <AdminDiagnosticTab 
                                            lead={lead} 
                                            data={adminData} 
                                            onChange={setAdminData} 
                                            onNext={() => mode === "doctor" && setActiveTab("doctor")}
                                            readOnly={mode === "doctor"}
                                            onSave={handleSave}
                                        />
                                    </TabsContent>
                                    {mode === "doctor" && (
                                        <>
                                            <TabsContent value="doctor" className="m-0 focus-visible:outline-none">
                                                <DoctorDiagnosticTab lead={lead} adminData={adminData} data={doctorData} onChange={setDoctorData} onNext={() => setActiveTab("prescription")} />
                                            </TabsContent>
                                            <TabsContent value="prescription" className="m-0 focus-visible:outline-none">
                                                <PrescriptionTab lead={lead} doctorData={doctorData} data={prescriptionData} onChange={setPrescriptionData} />
                                            </TabsContent>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Sidebar: Patient Summary */}
                    <div className="w-[300px] border-l border-border bg-background shrink-0 flex flex-col">
                        <div className="p-4 border-b border-border font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Сводка по пациенту
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 space-y-6">
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">ФИО пациента</p>
                                    <p className="font-semibold text-sm">{lead.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Телефон</p>
                                    <p className="font-semibold text-sm flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> {lead.phone || "Не указан"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Запись</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold bg-secondary/50 p-2 rounded-lg border border-border">
                                        <Clock className="h-4 w-4 text-primary" />
                                        {lead.scheduled_at ? new Date(lead.scheduled_at).toLocaleString("ru-RU", { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' }) : "Нет записи"}
                                    </div>
                                </div>
                                {adminData?.paymentStatus && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Предоплата</p>
                                        <Badge variant="outline" className={cn(
                                            adminData.paymentStatus === 'paid' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-amber-500/30 text-amber-600 bg-amber-500/10"
                                        )}>
                                            {adminData.paymentStatus === 'paid' ? "Оплачено" : "Ожидание"}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            
            {/* Скрытый рендер для PDF */}
            <div className="absolute top-[-9999px] left-[-9999px]">
                <DiagnosticPdfExport 
                    ref={pdfRef}
                    lead={lead}
                    adminData={adminData}
                    doctorData={doctorData}
                    prescriptionData={prescriptionData}
                />
            </div>
        </Dialog>
    );
};
