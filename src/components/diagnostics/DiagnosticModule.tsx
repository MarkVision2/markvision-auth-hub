import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, FileText, User, Phone, X, Save, FileDown, Clock, Activity, Loader2, ClipboardList, CheckCircle2, PanelRightClose, PanelRightOpen, Zap, CalendarDays
} from "lucide-react";
import { Lead } from "../crm/KanbanBoard";
import { AdminDiagnosticTab, AdminFormData, Question, DEFAULT_QUESTIONS } from "./tabs/AdminDiagnosticTab";
import { TherapistDiagnosticTab, TherapistFormData, TherapistQuestion, DEFAULT_THERAPIST_QUESTIONS } from "./tabs/TherapistDiagnosticTab";
import { RehabDiagnosticTab, RehabFormData } from "./tabs/RehabDiagnosticTab";
import { TreatmentPlanTab, TreatmentPlanFormData } from "./tabs/TreatmentPlanTab";
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
    // Default tab: admin for admin mode, therapist for doctor mode
    const [activeTab, setActiveTab] = useState(mode === "doctor" ? "therapist" : "admin");
    const [isSaving, setIsSaving] = useState(false);
    const pdfRef = useRef<DiagnosticPdfExportRef>(null);
    
    const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
    const [therapistQuestions, setTherapistQuestions] = useState<TherapistQuestion[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    
    const [adminData, setAdminData] = useState<AdminFormData | null>(null);
    const [therapistData, setTherapistData] = useState<TherapistFormData | null>(null);
    const [rehabData, setRehabData] = useState<RehabFormData | null>(null);
    const [treatmentPlanData, setTreatmentPlanData] = useState<TreatmentPlanFormData | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Initial data setup
    useEffect(() => {
        if (open) {
            const loadSavedAnswers = async () => {
                try {
                    const { data: leadRow } = await (supabase as any)
                        .from("leads_crm")
                        .select("*")
                        .eq("id", lead.id)
                        .single();

                    if (leadRow) {
                        // Admin Data
                        const savedAdminAnswers = leadRow.diagnostic_admin_answers || {};
                        setAdminData({
                            answers: typeof savedAdminAnswers === "string" ? JSON.parse(savedAdminAnswers) : savedAdminAnswers,
                            adminComment: leadRow.diagnostic_admin_comment || "",
                            paymentMethod: "Kaspi",
                            paymentStatus: leadRow.status === "Записан" ? "paid" : (leadRow.status === "Отказ" ? "declined" : "pending"),
                            prepaymentAmount: leadRow.amount ? String(leadRow.amount) : "",
                            refusalReason: leadRow.refusal_reason || "",
                            confirmed: !!leadRow.diagnostic_admin_answers,
                            finalFio: leadRow.name || lead.name,
                            finalPhone: leadRow.phone || lead.phone || "",
                            invoicePhone: leadRow.phone || lead.phone || "",
                            complaints: savedAdminAnswers.complaints || leadRow.ai_summary || "",
                            painLocation: "",
                            painDuration: "",
                            painType: "",
                            painIntensity: "5",
                            previousTreatment: ""
                        });

                        // Therapist Data
                        const savedTherapistAnswers = leadRow.diagnostic_therapist_answers || {};
                        setTherapistData({
                            answers: typeof savedTherapistAnswers === "string" ? JSON.parse(savedTherapistAnswers) : savedTherapistAnswers
                        });

                        // Rehab Data
                        const savedRehabAnswers = leadRow.diagnostic_rehab_answers || {};
                        setRehabData(typeof savedRehabAnswers === "string" ? JSON.parse(savedRehabAnswers) : savedRehabAnswers);

                        // Treatment Plan Data
                        const savedPlanAnswers = leadRow.diagnostic_plan_answers || {};
                        setTreatmentPlanData({
                            ...(typeof savedPlanAnswers === "string" ? JSON.parse(savedPlanAnswers) : savedPlanAnswers),
                            finalConclusion: leadRow.diagnostic_plan_comment || ""
                        });
                    }
                } catch (e) {
                    console.error("Error loading saved diagnostic data:", e);
                }
            };
            loadSavedAnswers();
            fetchQuestions();
        }
    }, [open, lead.id]);

    const fetchQuestions = async () => {
        setIsLoadingQuestions(true);
        if (!lead.project_id) {
            setAdminQuestions(DEFAULT_QUESTIONS);
            setTherapistQuestions(DEFAULT_THERAPIST_QUESTIONS);
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
                const therapistQs: TherapistQuestion[] = questionsData.filter(q => q.category === "doctor" || q.category === "therapist").map(q => ({
                    id: q.id,
                    label: q.label,
                    type: q.type as any,
                    options: q.options as any,
                    required: q.is_required
                }));
                
                setAdminQuestions(adminQs.length > 0 ? adminQs : DEFAULT_QUESTIONS);
                setTherapistQuestions(therapistQs.length > 0 ? therapistQs : DEFAULT_THERAPIST_QUESTIONS);
            } else {
                setAdminQuestions(DEFAULT_QUESTIONS);
                setTherapistQuestions(DEFAULT_THERAPIST_QUESTIONS);
            }
        } catch (error: any) {
            console.error("Error fetching questions:", error);
            setAdminQuestions(DEFAULT_QUESTIONS);
            setTherapistQuestions(DEFAULT_THERAPIST_QUESTIONS);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updateData: any = {
                updated_at: new Date().toISOString()
            };

            // Status Logic
            if (adminData) {
                if (adminData.paymentStatus === "paid") {
                    updateData.status = "Записан";
                    updateData.amount = Number(adminData.prepaymentAmount) || lead.amount;
                } else if (adminData.paymentStatus === "declined") {
                    updateData.status = "Отказ";
                    updateData.refusal_reason = adminData.refusalReason;
                }
                
                if (adminData.bookingDate && adminData.bookingTime) {
                    const [h, m] = adminData.bookingTime.split(":").map(Number);
                    const scheduledAt = new Date(adminData.bookingDate);
                    scheduledAt.setHours(h, m, 0, 0);
                    updateData.scheduled_at = scheduledAt.toISOString();
                }
                
                updateData.name = adminData.finalFio || lead.name;
                updateData.phone = adminData.finalPhone || lead.phone;
                updateData.diagnostic_admin_answers = adminData.answers;
                updateData.diagnostic_admin_comment = adminData.adminComment;
            }

            if (therapistData) {
                updateData.diagnostic_therapist_answers = therapistData.answers;
            }

            if (rehabData) {
                updateData.diagnostic_rehab_answers = rehabData;
            }

            if (treatmentPlanData) {
                updateData.diagnostic_plan_answers = treatmentPlanData;
                updateData.diagnostic_plan_comment = treatmentPlanData.finalConclusion;
                updateData.status = "Лечение начато";
                updateData.pipeline = "doctor";
            }

            const { error: updateError } = await (supabase as any)
                .from("leads_crm")
                .update(updateData)
                .eq("id", lead.id);

            if (updateError) throw updateError;

            // Fire Webhook
            try {
                await fetch("https://n8n.zapoinov.com/webhook/lead-status-changed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        table: "leads_crm",
                        type: "UPDATE",
                        record: {
                            id: lead.id,
                            status: updateData.status || lead.status,
                            project_id: lead.project_id,
                            deal_amount: updateData.amount || lead.amount,
                        },
                        old_record: { status: lead.status },
                    }),
                });
            } catch (e) {
                console.warn("Webhook failed", e);
            }

            toast({ title: "Успешно", description: "Все данные сохранены в карточку пациента" });
            
            if (onComplete) {
                onComplete({ adminData, therapistData, rehabData, treatmentPlanData });
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
            toast({ title: "Генерация PDF", description: "Создаем полный отчет (4 этапа)..." });
            await pdfRef.current.generatePdf();
            toast({ title: "Готово", description: "PDF успешно скачан" });
        } catch (e) {
            toast({ title: "Ошибка", description: "Не удалось сгенерировать PDF", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-col bg-background border-none rounded-none overflow-hidden select-none relative !fixed !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 z-40">
                <DialogHeader className="sr-only">
                    <DialogTitle>Диагностический модуль v2.0</DialogTitle>
                    <DialogDescription>4-этапный рабочий процесс: Админ &rarr; Терапевт &rarr; Реабилитолог &rarr; План лечения</DialogDescription>
                </DialogHeader>

                {/* Aurora Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[130px] opacity-60 animate-pulse" />
                    <div className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-sky-500/5 blur-[150px] opacity-40 animate-pulse" />
                </div>

                {/* Header */}
                <DialogHeader className="px-8 py-5 border-b border-white/5 shrink-0 bg-background/60 backdrop-blur-2xl z-20 flex flex-row items-center justify-between shadow-2xl relative">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center shadow-inner group/icon">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-foreground">Diagnostic Hub</DialogTitle>
                                <Badge className="px-3 py-1 rounded-lg font-black text-[9px] uppercase bg-primary/10 text-primary border-none">
                                    {lead.status || "NEW"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                                <span className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full">
                                    <User className="h-3 w-3 text-primary" /> {lead.name}
                                </span>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full">
                                    <ClipboardList className="h-3 w-3 text-primary" /> {lead.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1.5 bg-secondary/30 rounded-2xl border border-border/40">
                            <Button variant="ghost" size="sm" onClick={handleGeneratePdf} className="h-10 px-6 gap-3 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                <FileDown className="h-4 w-4" /> PDF REPORT
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-10 px-8 gap-3 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                SAVE CHANGES
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-2xl h-11 w-11 hover:bg-destructive/10 text-muted-foreground">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden relative z-10">
                    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-8 pt-6 pb-0 shrink-0 z-10">
                                <TabsList className="bg-secondary/10 p-1.5 h-16 rounded-[24px] border border-border/20 gap-2 flex w-full max-w-4xl">
                                    <TabsTrigger value="admin" className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary gap-3 font-black text-[9px] uppercase tracking-widest transition-all">
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <ClipboardList className="h-3.5 w-3.5" />
                                        </div>
                                        1. ЗАПИСЬ
                                    </TabsTrigger>
                                    <TabsTrigger value="therapist" className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary gap-3 font-black text-[9px] uppercase tracking-widest transition-all">
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Stethoscope className="h-3.5 w-3.5" />
                                        </div>
                                        2. ТЕРАПЕВТ
                                    </TabsTrigger>
                                    <TabsTrigger value="rehab" className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary gap-3 font-black text-[9px] uppercase tracking-widest transition-all">
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Activity className="h-3.5 w-3.5" />
                                        </div>
                                        3. РЕАБИЛИТОЛОГ
                                    </TabsTrigger>
                                    <TabsTrigger value="plan" className="flex-1 rounded-2xl h-full data-[state=active]:bg-card data-[state=active]:text-primary gap-3 font-black text-[9px] uppercase tracking-widest transition-all">
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Zap className="h-3.5 w-3.5" />
                                        </div>
                                        4. ПЛАН ЛЕЧЕНИЯ
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-8 min-h-full">
                                    <TabsContent value="admin" className="m-0 focus-visible:outline-none">
                                        <AdminDiagnosticTab 
                                            lead={lead} 
                                            data={adminData} 
                                            questions={adminQuestions}
                                            onQuestionsChange={setAdminQuestions}
                                            onChange={setAdminData} 
                                            onNext={() => setActiveTab("therapist")}
                                            onSave={handleSave}
                                        />
                                    </TabsContent>
                                    <TabsContent value="therapist" className="m-0 focus-visible:outline-none">
                                        <TherapistDiagnosticTab 
                                            lead={lead} 
                                            adminData={adminData} 
                                            adminQuestions={adminQuestions}
                                            data={therapistData} 
                                            questions={therapistQuestions}
                                            onQuestionsChange={setTherapistQuestions}
                                            onChange={setTherapistData} 
                                            onComplete={() => setActiveTab("rehab")} 
                                        />
                                    </TabsContent>
                                    <TabsContent value="rehab" className="m-0 focus-visible:outline-none">
                                        <RehabDiagnosticTab 
                                            lead={lead} 
                                            data={rehabData} 
                                            onChange={setRehabData} 
                                            onComplete={() => setActiveTab("plan")} 
                                        />
                                    </TabsContent>
                                    <TabsContent value="plan" className="m-0 focus-visible:outline-none">
                                        <TreatmentPlanTab 
                                            lead={lead} 
                                            therapistData={therapistData} 
                                            data={treatmentPlanData} 
                                            onChange={setTreatmentPlanData} 
                                            onComplete={handleSave} 
                                            onGeneratePdf={handleGeneratePdf}
                                        />
                                    </TabsContent>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className={cn(
                        "border-l border-white/5 bg-background/60 backdrop-blur-xl shrink-0 flex flex-col z-10 transition-all duration-300",
                        sidebarCollapsed ? "w-[52px]" : "w-[300px]"
                    )}>
                        <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-secondary/5 shrink-0">
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                {sidebarCollapsed ? <PanelRightOpen className="h-4 w-4 text-primary" /> : <PanelRightClose className="h-4 w-4 text-primary" />}
                            </button>
                            {!sidebarCollapsed && <h3 className="text-[10px] font-black uppercase tracking-widest">Пациент</h3>}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                <div className="p-4 bg-secondary/10 rounded-[20px] space-y-3">
                                    <div>
                                        <p className="text-[9px] text-primary/50 font-black uppercase tracking-widest mb-1">Имя</p>
                                        <p className="font-black text-sm uppercase">{lead.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-primary/50 font-black uppercase tracking-widest mb-1">Телефон</p>
                                        <p className="font-black text-sm">{lead.phone || "—"}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-[20px] border border-primary/10">
                                    <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-2">Дата записи</p>
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                        <span className="text-xs font-black uppercase">
                                            {lead.scheduled_at ? format(new Date(lead.scheduled_at), "dd MMMM, HH:mm", { locale: ru }) : "Не назначена"}
                                        </span>
                                    </div>
                                </div>
                                {adminData?.adminComment && (
                                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                        <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-1">Заметка</p>
                                        <p className="text-[11px] font-bold italic leading-relaxed">"{adminData.adminComment}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            <div className="absolute top-[-9999px] left-[-9999px]">
                <DiagnosticPdfExport 
                    ref={pdfRef}
                    lead={lead}
                    adminData={adminData}
                    therapistData={therapistData}
                    rehabData={rehabData}
                    treatmentPlanData={treatmentPlanData}
                    adminQuestions={adminQuestions}
                    therapistQuestions={therapistQuestions}
                />
            </div>
        </Dialog>
    );
};
