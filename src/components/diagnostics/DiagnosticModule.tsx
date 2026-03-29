import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Stethoscope, FileText, User, Phone, X, Save, FileDown, Clock, Activity, Loader2, ClipboardList, CheckCircle2, PanelRightClose, PanelRightOpen
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
import { ru } from "date-fns/locale";
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
                    invoicePhone: lead.phone || "",
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
            <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-col bg-background border-none rounded-none overflow-hidden select-none relative !fixed !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 z-[100]">
                {/* Aurora Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[130px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-sky-500/10 blur-[150px] opacity-40 animate-pulse" style={{ animationDuration: '12s' }} />
                    <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[60%] rounded-full bg-indigo-500/10 blur-[140px] opacity-30 animate-pulse" style={{ animationDuration: '10s' }} />
                </div>

                {/* Header: Premium Glassmorphism Effect */}
                <DialogHeader className="px-8 py-5 border-b border-white/5 shrink-0 bg-background/60 backdrop-blur-2xl glass-enabled z-20 flex flex-row items-center justify-between shadow-2xl relative">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center shadow-inner group/icon">
                            <Activity className="h-6 w-6 text-primary group-hover/icon:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-foreground">Диагностический терминал</DialogTitle>
                                <Badge className={cn("px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border-none", statusColor)}>
                                    {lead.status || "Новая заявка"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                                <span className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full border border-border/20">
                                    <User className="h-3 w-3 text-primary" /> {lead.name}
                                </span>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full border border-border/20">
                                    <ClipboardList className="h-3 w-3 text-primary" /> ID: {lead.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1.5 bg-secondary/30 rounded-2xl border border-border/40">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleGeneratePdf} 
                                className="h-10 px-6 gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-background rounded-xl transition-all"
                            >
                                <FileDown className="h-4 w-4" /> Экспорт PDF
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleSave} 
                                disabled={isSaving} 
                                className="h-10 px-8 gap-3 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Сохранить изменения
                            </Button>
                        </div>
                        <div className="w-px h-8 bg-border/40 mx-2" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onOpenChange(false)} 
                            className="rounded-2xl h-11 w-11 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden relative z-10">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-8 pt-6 pb-0 bg-transparent shrink-0 z-10">
                                <TabsList className="bg-secondary/10 p-1.5 h-16 rounded-[24px] border border-border/20 gap-2 flex w-full max-w-3xl">
                                    {mode !== "doctor" && (
                                        <TabsTrigger 
                                            value="admin" 
                                            className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 gap-3 font-black text-[10px] uppercase tracking-widest transition-all"
                                        >
                                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                            </div>
                                            I. Сбор анамнеза
                                        </TabsTrigger>
                                    )}
                                    {mode === "doctor" && (
                                        <>
                                            <TabsTrigger 
                                                value="doctor" 
                                                className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 gap-3 font-black text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Stethoscope className="h-4 w-4 text-primary" />
                                                </div>
                                                II. Врачебный осмотр
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="prescription" 
                                                className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 gap-3 font-black text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                III. Протокол лечения
                                            </TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-8 min-h-full">
                                    {mode !== "doctor" && (
                                        <TabsContent value="admin" className="m-0 focus-visible:outline-none">
                                            <div className="bg-card border border-border/20 rounded-[40px] shadow-2xl shadow-black/20 p-8">
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
                                            </div>
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

                    {/* Right Sidebar: Collapsible Patient Summary */}
                    <div className={cn(
                        "border-l border-white/5 bg-background/60 backdrop-blur-xl glass-enabled shrink-0 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 relative",
                        sidebarCollapsed ? "w-[52px]" : "w-[320px]"
                    )}>
                        <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-secondary/5 shrink-0">
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                            >
                                {sidebarCollapsed ? <PanelRightOpen className="h-4 w-4 text-primary" /> : <PanelRightClose className="h-4 w-4 text-primary" />}
                            </button>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest truncate">Паспорт пациента</h3>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <>
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-5 space-y-6">
                                        <div className="p-4 bg-secondary/5 border border-border/30 rounded-[20px] space-y-3">
                                            <div>
                                                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-1 opacity-50">Полное имя</p>
                                                <p className="font-black text-sm uppercase tracking-tight">{lead.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-1 opacity-50">Контактная связь</p>
                                                <div className="font-black text-sm flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <Phone className="h-3 w-3" />
                                                    </div>
                                                    <span>{lead.phone || "—"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-primary/[0.03] border border-primary/10 rounded-[20px] shadow-inner">
                                            <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2">Запланированный визит</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-card border border-primary/10 flex flex-col items-center justify-center shadow-sm shrink-0">
                                                    {lead.scheduled_at ? (
                                                        <>
                                                            <span className="text-[8px] font-black text-primary uppercase leading-none mb-0.5">{format(new Date(lead.scheduled_at), "MMM", { locale: ru })}</span>
                                                            <span className="text-lg font-black text-foreground leading-none">{format(new Date(lead.scheduled_at), "dd")}</span>
                                                        </>
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground tabular-nums">
                                                        {lead.scheduled_at ? format(new Date(lead.scheduled_at), "HH:mm") : "—"}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        {lead.scheduled_at ? format(new Date(lead.scheduled_at), "EEEE", { locale: ru }) : "Не назначен"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Первичные данные</h4>
                                            </div>

                                            <div className="space-y-3 p-4 bg-secondary/10 rounded-[24px] border border-border/20">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest pl-1">Основная жалоба</p>
                                                    <div className="p-2.5 bg-background border border-border/40 rounded-xl">
                                                        <p className="text-[11px] font-bold text-foreground leading-relaxed">{adminData?.complaints || "Данные отсутствуют"}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest pl-1">Комментарий админа</p>
                                                    <div className="p-2.5 bg-background border border-border/40 rounded-xl">
                                                        <p className="text-[11px] font-bold text-foreground leading-relaxed italic">"{adminData?.adminComment || "Нет комментариев"}"</p>
                                                    </div>
                                                </div>

                                                <div className="pt-1">
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest pl-1 mb-1.5">Статус платежа</p>
                                                    <div className={cn(
                                                        "px-3 py-2 rounded-xl border flex items-center justify-between",
                                                        adminData?.paymentStatus === 'paid'
                                                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                                                            : "border-amber-500/20 bg-amber-500/5 text-amber-600"
                                                    )}>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Предоплата</span>
                                                        {adminData?.paymentStatus === 'paid'
                                                            ? <CheckCircle2 className="h-4 w-4" />
                                                            : <Clock className="h-4 w-4" />
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-secondary/10 border-t border-border/40">
                                    <div className="flex items-center gap-2 text-muted-foreground/40">
                                        <Activity className="h-3.5 w-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Medical Workstation v2.0</span>
                                    </div>
                                </div>
                            </>
                        )}
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
