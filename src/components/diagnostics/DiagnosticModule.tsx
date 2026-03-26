import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Stethoscope, FileText, User, Phone, X, Save, FileDown, Clock, Activity, Loader2, ClipboardList
} from "lucide-react";
import { Lead } from "../crm/KanbanBoard";
import { AdminDiagnosticTab, AdminFormData, Question, DEFAULT_QUESTIONS } from "./tabs/AdminDiagnosticTab";
import { DoctorDiagnosticTab, DoctorFormData, DoctorQuestion, DEFAULT_DOCTOR_QUESTIONS } from "./tabs/DoctorDiagnosticTab";
import { PrescriptionTab, PrescriptionFormData } from "./tabs/PrescriptionTab";
import { DiagnosticPdfExport, DiagnosticPdfExportRef } from "./components/DiagnosticPdfExport";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

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
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(mode === "doctor" ? "doctor" : "admin");
    const [isSaving, setIsSaving] = useState(false);
    const pdfRef = useRef<DiagnosticPdfExportRef>(null);
    
    const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
    const [doctorQuestions, setDoctorQuestions] = useState<DoctorQuestion[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    
    // В реальном проекте здесь будет стейт для всех 3 вкладок
    const [adminData, setAdminData] = useState<AdminFormData | null>(null);
    const [doctorData, setDoctorData] = useState<DoctorFormData | null>(null);
    const [prescriptionData, setPrescriptionData] = useState<PrescriptionFormData | null>(null);

    // Initial data setup — загружаем сохранённые ответы администратора из leads_crm
    useEffect(() => {
        if (open) {
            const loadSavedAnswers = async () => {
                let savedAnswers: Record<string, any> = { complaints: lead.ai_summary || "" };
                let savedAdminComment = (lead as any).comments || "";
                try {
                    const { data: leadRow } = await (supabase as any)
                        .from("leads_crm")
                        .select("diagnostic_admin_answers, diagnostic_admin_comment")
                        .eq("id", lead.id)
                        .single();
                    if (leadRow?.diagnostic_admin_answers) {
                        savedAnswers = typeof leadRow.diagnostic_admin_answers === "string"
                            ? JSON.parse(leadRow.diagnostic_admin_answers)
                            : leadRow.diagnostic_admin_answers;
                    }
                    if (leadRow?.diagnostic_admin_comment) {
                        savedAdminComment = leadRow.diagnostic_admin_comment;
                    }
                } catch (e) {
                    // поля могут не существовать — используем дефолты
                }
                setAdminData({
                    answers: savedAnswers,
                    adminComment: savedAdminComment,
                    paymentMethod: "Kaspi",
                    paymentStatus: "pending",
                    prepaymentAmount: "",
                    refusalReason: "",
                    confirmed: false,
                    finalFio: lead.name,
                    finalPhone: lead.phone || "",
                    complaints: (savedAnswers as any).complaints || lead.ai_summary || "",
                    painLocation: "",
                    painDuration: "",
                    painType: "",
                    painIntensity: "5",
                    previousTreatment: ""
                });
            };
            loadSavedAnswers();
            fetchQuestions();
        }
    }, [open, lead.id]);

    const fetchQuestions = async () => {
        setIsLoadingQuestions(true);
        if (!lead.project_id) {
            setIsLoadingQuestions(false);
            return;
        }
        try {
            const { data, error } = await (supabase
                .from("diagnostic_questions")
                .select("*") as any)
                .eq("project_id", lead.project_id)
                .order("sort_order", { ascending: true });

            if (error) throw error;

            const questionsData = data as any[];
            if (questionsData && questionsData.length > 0) {
                const adminQs: Question[] = questionsData.filter(q => q.category === "admin").map(q => ({
                    id: q.id,
                    label: q.label,
                    type: q.type as any,
                    options: q.options as any,
                    required: q.is_required
                }));
                const doctorQs: DoctorQuestion[] = questionsData.filter(q => q.category === "doctor").map(q => ({
                    id: q.id,
                    label: q.label,
                    section: q.section || "complaints",
                    type: q.type as any,
                    options: q.options as any,
                    required: q.is_required
                }));
                setAdminQuestions(adminQs);
                setDoctorQuestions(doctorQs);
            } else {
                // Fallback to defaults if no questions found for project
                setAdminQuestions(DEFAULT_QUESTIONS);
                setDoctorQuestions(DEFAULT_DOCTOR_QUESTIONS);
            }
        } catch (error: any) {
            console.error("Error fetching questions:", error);
            setAdminQuestions(DEFAULT_QUESTIONS);
            setDoctorQuestions(DEFAULT_DOCTOR_QUESTIONS);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const handleSave = async () => {
        if (!adminData) return;
        setIsSaving(true);
        try {
            // Initial update data
            const updateData: any = {
                status: lead.status,
                pipeline: (lead as any).pipeline || "main",
                amount: adminData.prepaymentAmount ? Number(adminData.prepaymentAmount) : lead.amount,
                doctor_name: adminData.bookingDoctor || lead.doctor_name,
                refusal_reason: null
            };

            let newStatus = lead.status;
            let pipeline = (lead as any).pipeline || "main";

            if (adminData.paymentStatus === "pending") {
                newStatus = "Счет отправлен";
                pipeline = "main";
            }
            if (adminData.paymentStatus === "paid") {
                newStatus = "Записан";
                pipeline = "main";
            }
            if (adminData.paymentStatus === "declined") {
                newStatus = "Отказ";
                pipeline = "main";
                updateData.refusal_reason = adminData.refusalReason === "Другое" 
                    ? adminData.refusalReasonOther 
                    : adminData.refusalReason;
            }

            // Prescription decision overrides everything
            if (prescriptionData) {
                if (prescriptionData.decision === "treatment") {
                    newStatus = "Лечение начато";
                    pipeline = "doctor";
                    // Set amount and package info from selected package with discount
                    const PACKAGE_DATA: Record<string, { price: number; name: string }> = {
                        pain_relief: { price: 110000, name: "Снятие боли" },
                        spine_recovery: { price: 210000, name: "Восстановление позвоночника" },
                        full_rehab: { price: 310000, name: "Полная реабилитация позвоночника" }
                    };
                    if (prescriptionData.packageId && PACKAGE_DATA[prescriptionData.packageId]) {
                        const pkg = PACKAGE_DATA[prescriptionData.packageId];
                        const discount = prescriptionData.discountPercent || 0;
                        updateData.amount = Math.round(pkg.price * (1 - discount / 100));
                        updateData.prescribed_packages = [pkg.name];
                        if (prescriptionData.doctorName) {
                            updateData.doctor_name = prescriptionData.doctorName;
                        }
                        
                        if (prescriptionData.discountReason) {
                            updateData.ai_summary = (updateData.ai_summary || lead.ai_summary || "") + 
                                `\n[Скидка ${discount}%: ${prescriptionData.discountReason}]`;
                        }
                    }
                } else if (prescriptionData.decision === "thinking") {
                    newStatus = "Думает";
                    pipeline = "doctor";
                } else if (prescriptionData.decision === "refused") {
                    newStatus = "Отказ";
                    pipeline = "doctor";
                    updateData.refusal_reason = prescriptionData.refusalReason === "Другое"
                        ? prescriptionData.refusalReasonOther
                        : prescriptionData.refusalReason;
                }
            }

            // Update the object with final values
            updateData.status = newStatus;
            updateData.pipeline = pipeline;

            if (adminData.bookingDate && adminData.bookingTime) {
                // Combine date and time
                const timeStr = adminData.bookingTime; // e.g. "10:00"
                const [h, m] = timeStr.split(":").map(Number);
                const scheduledAt = new Date(adminData.bookingDate);
                scheduledAt.setHours(h, m, 0, 0);
                updateData.scheduled_at = scheduledAt.toISOString();
            }

            if (adminData.paymentStatus === "declined" && updateData.refusal_reason) {
                updateData.ai_summary = (lead.ai_summary || "") + `\n[Отказ от предоплаты: ${updateData.refusal_reason}]`;
            }

            if (prescriptionData?.decision === "refused" && updateData.refusal_reason) {
                updateData.ai_summary = (updateData.ai_summary || lead.ai_summary || "") + `\n[Отказ: ${updateData.refusal_reason}]`;
            }

            // Сохраняем ответы администратора в leads_crm (если режим не doctor)
            if (mode !== "doctor" && adminData?.answers) {
                try {
                    await (supabase as any)
                        .from("leads_crm")
                        .update({
                            diagnostic_admin_answers: adminData.answers,
                            diagnostic_admin_comment: adminData.adminComment || ""
                        })
                        .eq("id", lead.id);
                } catch (e) {
                    // поля могут не существовать в текущей схеме — игнорируем
                    console.warn("diagnostic_admin_answers column missing, skipping save");
                }
            }

            let { error: updateError } = await (supabase as any)
                .from("leads_crm")
                .update(updateData)
                .eq("id", lead.id);

            // Universal fallback: if 'pipeline' or other column is missing, try saving without it
            if (updateError && updateError.code === "42703") {
                console.warn("Column missing, retrying without extended columns...");
                const fallbackData = { 
                    status: updateData.status,
                    amount: updateData.amount,
                    doctor_name: updateData.doctor_name,
                    scheduled_at: updateData.scheduled_at,
                    ai_summary: updateData.ai_summary,
                    refusal_reason: updateData.refusal_reason
                };
                const { error: fallbackError } = await (supabase as any)
                    .from("leads_crm")
                    .update(fallbackData)
                    .eq("id", lead.id);
                updateError = fallbackError;
            }

            if (updateError) {
                console.error("Update error after fallback:", updateError);
                throw new Error("Не удалось обновить данные. Пожалуйста, убедитесь, что в Supabase выполнены все SQL-миграции.");
            }

            // Fire CAPI Webhook for analytics
            const CAPI_STATUS_MAP: Record<string, string> = {
                "Записан": "scheduled",
                "Визит совершен": "diagnostic",
                "Лечение начато": "paid",
                "Думает": "thinking",
                "Отказ": "refused",
            };
            const capiKey = newStatus ? CAPI_STATUS_MAP[newStatus] : undefined;
            if (capiKey) {
                try {
                    await fetch("https://n8n.zapoinov.com/webhook/lead-status-changed", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            table: "leads_crm", 
                            type: "UPDATE",
                            record: { 
                                id: lead.id, 
                                status: capiKey, 
                                project_id: (lead as any).project_id || null, 
                                deal_amount: updateData.amount || 0 
                            },
                            old_record: { status: lead.status },
                        }),
                    });
                } catch (err) {
                    console.error("CAPI webhook error:", err);
                }
            }

            // Save questions for this project
            if (lead.project_id) {
                try {
                    // Delete existing questions for this project, then insert fresh
                    await (supabase as any)
                        .from("diagnostic_questions")
                        .delete()
                        .eq("project_id", lead.project_id);

                    const allQuestions = [
                        ...adminQuestions.map((q, i) => ({
                            project_id: lead.project_id,
                            label: q.label,
                            type: q.type,
                            options: q.options || [],
                            sort_order: i,
                            category: "admin",
                            is_required: !!q.required
                        })),
                        ...doctorQuestions.map((q, i) => ({
                            project_id: lead.project_id,
                            label: q.label,
                            type: q.type,
                            options: q.options || [],
                            sort_order: i,
                            category: "doctor",
                            section: (q as any).section || "complaints",
                            is_required: !!q.required
                        }))
                    ];

                    if (allQuestions.length > 0) {
                        const { error: qError } = await (supabase as any)
                            .from("diagnostic_questions")
                            .insert(allQuestions);
                        
                        if (qError) console.error("Error saving questions:", qError);
                    }
                } catch (qErr) {
                    console.error("Error saving questions:", qErr);
                }
            }

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
            
            if (onComplete) {
                onComplete({ adminData, doctorData, prescriptionData });
            } else if (onOpenChange) {
                onOpenChange(false);
            }
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
                                    {mode !== "doctor" && (
                                        <TabsTrigger 
                                            value="admin" 
                                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 gap-2 font-semibold transition-all"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            1. Диагностика (Админ)
                                        </TabsTrigger>
                                    )}
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
                                    {mode !== "doctor" && (
                                        <TabsContent value="admin" className="m-0 focus-visible:outline-none">
                                            <AdminDiagnosticTab 
                                                lead={lead} 
                                                data={adminData} 
                                                questions={adminQuestions}
                                                onQuestionsChange={setAdminQuestions}
                                                onChange={setAdminData} 
                                                onNext={() => setActiveTab("doctor")}
                                                readOnly={false}
                                                onSave={handleSave}
                                            />
                                        </TabsContent>
                                    )}
                                    {mode === "doctor" && (
                                        <>
                                            <TabsContent value="doctor" className="m-0 focus-visible:outline-none">
                                                <DoctorDiagnosticTab 
                                                    lead={lead} 
                                                    adminData={adminData} 
                                                    adminQuestions={adminQuestions}
                                                    data={doctorData} 
                                                    questions={doctorQuestions}
                                                    onQuestionsChange={setDoctorQuestions}
                                                    onChange={setDoctorData} 
                                                    onComplete={() => setActiveTab("prescription")} 
                                                />
                                            </TabsContent>
                                            <TabsContent value="prescription" className="m-0 focus-visible:outline-none">
                                                <PrescriptionTab lead={lead} doctorData={doctorData} data={prescriptionData} onChange={setPrescriptionData} onComplete={handleSave} />
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
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Информация от регистратуры</p>
                                    <div className="space-y-3 p-3 bg-secondary/50 rounded-lg border border-border">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Жалоба</p>
                                            <p className="text-sm font-medium">{adminData?.complaints || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Комментарий</p>
                                            <p className="text-sm font-medium">{adminData?.adminComment || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Предоплата</p>
                                            <Badge variant="outline" className={cn(
                                                "mt-1 text-[10px]",
                                                adminData?.paymentStatus === 'paid' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-amber-500/30 text-amber-600 bg-amber-500/10"
                                            )}>
                                                {adminData?.paymentStatus === 'paid' ? "✅ Оплачено" : "⏳ Ожидание"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
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
                    adminQuestions={adminQuestions}
                    doctorQuestions={doctorQuestions}
                />
            </div>
        </Dialog>
    );
};
