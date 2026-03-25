import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Brain, Send, MessageCircle, Bot, User, Phone, Calendar,
  MapPin, DollarSign, ExternalLink, Clock, FileText, Plus,
  Globe, Hash, Loader2, Check, CheckCheck, Trash2, Copy, Sparkles,
  Timer, PhoneCall, PhoneOff, MicOff, Mic, Star, AlertTriangle,
  Stethoscope, Edit2, Ban
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Lead } from "./KanbanBoard";
import type { CallRecord, AITask } from "./types";
import { DiagnosticModule } from "../diagnostics/DiagnosticModule";
import { loadTeam } from "@/pages/settings/types";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
  onTaskGenerated?: (task: AITask) => void;
}

interface ChatMessage {
  id: string;
  lead_id: string;
  message_text: string;
  is_inbound: boolean;
  created_at: string;
}

interface CrmNote {
  id: string;
  lead_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const MAIN_STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

const DOCTOR_STAGES = [
  "Лечение начато", "Думает", "Отказ",
];

const stageColorMap: Record<string, string> = {
  "Новая заявка": "bg-primary/15 text-primary border-primary/20",
  "Без ответа": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]",
  "В работе": "bg-[hsl(var(--status-ai)/0.15)] text-[hsl(var(--status-ai))] border-[hsl(var(--status-ai)/0.2)]",
  "Счет выставлен": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]",
  "Записан": "bg-primary/15 text-primary border-primary/20",
  "Визит совершен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]",
  "Оплачен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]",
  "Лечение начато": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]",
  "Думает": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]",
};

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Горячий", emoji: "🔥", className: "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)]" };
  if (score >= 50) return { label: "Тёплый", emoji: "🌤", className: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]" };
  return { label: "Холодный", emoji: "❄️", className: "bg-primary/15 text-primary border-primary/20" };
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Active Call Overlay ── */
function ActiveCallOverlay({ leadName, onEndCall }: { leadName: string; onEndCall: (duration: number) => void }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-background backdrop-blur-md flex flex-col items-center justify-center gap-6">
      <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse">
        <PhoneCall className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{leadName}</p>
        <p className="text-sm text-muted-foreground">Активный звонок</p>
      </div>
      <p className="text-4xl font-mono font-bold tabular-nums text-foreground">{fmtDuration(seconds)}</p>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className={cn("h-12 w-12 rounded-full", muted && "bg-destructive/10 border-destructive/20")}
          onClick={() => setMuted(!muted)}
        >
          {muted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          onClick={() => onEndCall(seconds)}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

/* ── AI Analysis Result Card ── */
function AiCallResultCard({ record }: { record: CallRecord }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Анализ ИИ-РОП</span>
        <Badge variant="outline" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
          ⭐ {record.ai_score}/10
        </Badge>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">📝 Резюме</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{record.ai_summary}</p>
        </div>

        {record.objections.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">⚠️ Возражения</p>
            <div className="flex flex-wrap gap-1">
              {record.objections.map((obj, i) => (
                <Badge key={i} variant="outline" className="text-[10px] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]">
                  {obj}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
          <span className="font-mono tabular-nums">⏱ {fmtDuration(record.duration_seconds)}</span>
          <span>·</span>
          <span>Следующее: {record.next_action}</span>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailSheet({ lead, open, onOpenChange, onLeadUpdated, onTaskGenerated }: LeadDetailSheetProps) {
  const { isSuperadmin } = useRole();
  const [stage, setStage] = useState("");
  const [pipeline, setPipeline] = useState("main");
  const [aiMode, setAiMode] = useState(true);
  const [message, setMessage] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rightTab, setRightTab] = useState<"chat" | "notes" | "calls">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const [doctorName, setDoctorName] = useState<string>("");
  const [officeName, setOfficeName] = useState<string>("");
  const [busySlots, setBusySlots] = useState<{ date: string; time: string; doctor: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [amountValue, setAmountValue] = useState(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [tempAmount, setTempAmount] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  const DOCTORS = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Смирнова А.В."];
  const OFFICES = ["Кабинет 101", "Кабинет 102", "Кабинет 203", "Кабинет 205"];
  const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${min}`;
  });

  useEffect(() => {
    if (lead?.scheduled_at) {
      const d = new Date(lead.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    } else {
      setScheduledDate(undefined);
      setScheduledTime("10:00");
    }
    setDoctorName(lead?.doctor_name || "");
    setOfficeName(lead?.office_name || "");
  }, [lead]);

  const fetchBusySlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("leads_crm")
        .select("scheduled_at, doctor_name")
        .not("scheduled_at", "is", null)
        .filter("scheduled_at", "gte", `${dateStr}T00:00:00Z`)
        .filter("scheduled_at", "lte", `${dateStr}T23:59:59Z`);

      if (error) throw error;
      const slots = (data as any).map((l: any) => {
        const d = new Date(l.scheduled_at);
        return {
          date: dateStr,
          time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          doctor: l.doctor_name,
        };
      });
      setBusySlots(slots);
    } catch (err) {
      console.error("fetchBusySlots error:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (scheduledDate) fetchBusySlots(scheduledDate);
  }, [scheduledDate, fetchBusySlots]);

  const fetchChatMessages = useCallback(async (leadId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setChatMessages((data as ChatMessage[]) ?? []);
    } catch (err: unknown) {
      console.error("fetchChatMessages error:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const fetchNotes = useCallback(async (leadId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("crm_notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (error) throw error;
      setNotes((data as CrmNote[]) ?? []);
    } catch (err: unknown) {
      console.error("fetchNotes error:", err);
    }
  }, []);

  useEffect(() => {
    if (lead && open) {
      setPipeline(lead.pipeline || "main");
      setStage(lead.status || (lead.pipeline === "doctor" ? "Лечение начато" : "Новая заявка"));
      fetchChatMessages(lead.id);
      fetchNotes(lead.id);
      setCallHistory([]);
      setIsCallActive(false);
      setIsAnalyzing(false);
      setAmountValue(Number(lead.amount) || 0);
      setTempAmount(String(lead.amount || "0"));
    }
  }, [lead, open, fetchChatMessages, fetchNotes]);

  useEffect(() => {
    if (!lead || !open) return;
    const ch = supabase
      .channel(`lead_chat_${lead.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `lead_id=eq.${lead.id}` }, (payload: any) => {
        setChatMessages(prev => {
          const newMsg = payload.new as ChatMessage;
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_notes", filter: `lead_id=eq.${lead.id}` }, (payload: any) => {
        setNotes(prev => [payload.new as CrmNote, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [lead, open]);

  useEffect(() => {
    if (open && rightTab === "chat") {
      const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      return () => clearTimeout(t);
    }
  }, [open, rightTab, chatMessages]);

  if (!lead) return null;

  const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const score = lead.ai_score ?? 0;
  const scoreBadge = getScoreLabel(score);

  const CAPI_STATUS_MAP: Record<string, string> = {
    "Записан": "scheduled",
    "Визит совершен": "diagnostic",
    "Оплачен": "paid",
  };

  const fireCAPIWebhook = async (oldStatus: string, newStatus: string) => {
    const capiKey = CAPI_STATUS_MAP[newStatus];
    if (!capiKey) return;
    try {
      const res = await fetch("https://n8n.zapoinov.com/webhook/lead-status-changed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "leads_crm", type: "UPDATE",
          record: { id: lead.id, status: capiKey, project_id: (lead as any).project_id || null, deal_amount: Number(lead.amount) || 0 },
          old_record: { status: oldStatus },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && !data.skipped) {
          toast({ title: "📡 CAPI событие отправлено", description: `${data.event_name || capiKey} → Facebook Pixel` });
        }
      }
    } catch (err) {
      console.error("CAPI webhook error:", err);
    }
  };

  const handleStageChange = async (newStage: string) => {
    const oldStatus = stage;
    setStage(newStage);
    const { error } = await (supabase as any).from("leads_crm").update({ status: newStage }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Статус обновлён", description: `${lead.name} → ${newStage}` });
    
    // Automatic Navigation: Open Diagnostic Form if visit is completed
    if (newStage === "Визит совершен") {
      setDiagnosticOpen(true);
    }
    
    fireCAPIWebhook(oldStatus, newStage);
    onLeadUpdated?.();
  };

  const handleDeleteLead = async () => {
    const { error } = await (supabase as any).from("leads_crm").delete().eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Сделка удалена", description: lead.name });
    onOpenChange(false);
    onLeadUpdated?.();
  };

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      toast({ title: "Скопировано", description: lead.phone });
    }
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    toast({ title: "📞 Звонок начат", description: lead.name });
  };

  const handleScheduleConfirm = async () => {
    if (!scheduledDate || !scheduledTime || !doctorName || !officeName) {
      toast({ title: "Внимание", description: "Выберите дату, время, врача и кабинет" });
      return;
    }

    const [hours, mins] = scheduledTime.split(":").map(Number);
    const fullDate = new Date(scheduledDate);
    fullDate.setHours(hours, mins, 0, 0);

    // Conflict check
    const isBusy = busySlots.some(s => s.time === scheduledTime && s.doctor === doctorName);
    if (isBusy) {
      toast({ title: "Ошибка", description: `Врач ${doctorName} уже занят на ${scheduledTime}`, variant: "destructive" });
      return;
    }

    const { error } = await (supabase as any)
      .from("leads_crm")
      .update({
        scheduled_at: fullDate.toISOString(),
        doctor_name: doctorName,
        office_name: officeName,
        status: "Записан" // Auto-move to "Scheduled" stage
      })
      .eq("id", lead.id);

    if (error) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } else {
      setStage("Записан");
      toast({ title: "Запись подтверждена", description: `${fullDate.toLocaleDateString("ru-RU")} в ${scheduledTime}` });
      onLeadUpdated?.();
    }
  };

  const handleAmountSave = async () => {
    const newAmount = Number(tempAmount);
    if (isNaN(newAmount)) return;

    setAmountValue(newAmount);
    setIsEditingAmount(false);
    
    if (!lead) return;
    const { error } = await (supabase as any).from("leads_crm").update({ amount: newAmount }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      setAmountValue(Number(lead.amount) || 0);
    } else {
      toast({ title: "Сумма обновлена", description: `${newAmount} ₸` });
      onLeadUpdated?.();
    }
  };

  const handleNameSave = async () => {
    if (!tempName.trim()) return;
    setIsEditingName(false);
    if (!lead) return;
    const { error } = await (supabase as any).from("leads_crm").update({ name: tempName.trim() }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Имя обновлено", description: tempName.trim() });
      onLeadUpdated?.();
    }
  };

  const handlePhoneSave = async () => {
    if (!tempPhone.trim()) return;
    setIsEditingPhone(false);
    if (!lead) return;
    const { error } = await (supabase as any).from("leads_crm").update({ phone: tempPhone.trim() }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Телефон обновлен", description: tempPhone.trim() });
      onLeadUpdated?.();
    }
  };

  const handleEndCall = (duration: number) => {
    setIsCallActive(false);
    setRightTab("calls");
    toast({ title: "Звонок завершён", description: "Запись добавлена в очередь на AI анализ" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;
    const body = message.trim();
    setMessage("");
    setSending(true);
    try {
      if (!lead) return;
      const { error } = await (supabase as any).from("chat_messages").insert({
        lead_id: lead.id, message_text: body, is_inbound: false,
      });
      if (error) throw error;
      const webhookUrl = import.meta.env.VITE_N8N_WA_SEND_WEBHOOK;
      if (webhookUrl) {
        fetch(webhookUrl as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: lead.id, phone: lead.phone || "", message: body }),
        }).catch(err => console.error("WA send webhook error:", err));
      }
    } catch (err: any) {
      toast({ title: "Ошибка отправки", description: err.message || String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const body = noteText.trim();
    setNoteText("");
    const { error } = await (supabase as any).from("crm_notes").insert({
      lead_id: lead.id, author_name: "Менеджер", body,
    });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
  };

  const groupedMessages = chatMessages.reduce<{ date: string; messages: ChatMessage[] }[]>((acc, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    const last = acc[acc.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      acc.push({ date: dateKey, messages: [msg] });
    }
    return acc;
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-5xl !w-[85vw] p-0 bg-background border-border flex flex-col">
        {/* Active Call Overlay */}
        {isCallActive && <ActiveCallOverlay leadName={lead.name} onEndCall={handleEndCall} />}

        <SheetHeader className="px-6 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-1 mb-1">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-8 w-64 text-sm font-semibold bg-secondary/50 border-primary/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNameSave();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                    />
                    <button onClick={handleNameSave} className="text-emerald-500 hover:text-emerald-600 p-1">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="text-muted-foreground hover:text-foreground p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2 group/name cursor-pointer"
                    onClick={() => {
                      setTempName(lead.name);
                      setIsEditingName(true);
                    }}
                  >
                    <SheetTitle className="text-base font-semibold text-foreground">{lead.name}</SheetTitle>
                    <Edit2 className="h-3 w-3 opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-0.5">
                  {isEditingPhone ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className="h-7 w-48 text-xs bg-secondary/50 border-primary/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePhoneSave();
                          if (e.key === "Escape") setIsEditingPhone(false);
                        }}
                      />
                      <button onClick={handlePhoneSave} className="text-emerald-500 hover:text-emerald-600 p-1">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 group/phone cursor-pointer"
                      onClick={() => {
                        setTempPhone(lead.phone || "");
                        setIsEditingPhone(true);
                      }}
                    >
                      <span className="text-xs text-muted-foreground">{lead.phone || "Нет телефона"}</span>
                      <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover/phone:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  )}
                  
                  {!isEditingPhone && lead.phone && (
                    <button onClick={handleCopyPhone} className="text-muted-foreground/50 hover:text-muted-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(lead.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-10">
              {score > 0 && (
                <Badge variant="outline" className={`text-xs font-medium ${scoreBadge.className}`}>
                  {scoreBadge.emoji} {scoreBadge.label} {score}%
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs font-medium ${stageColorMap[stage] || "border-border text-muted-foreground"}`}>
                {stage}
              </Badge>
              {isSuperadmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие необратимо. Сделка и вся история взаимодействия будут удалены навсегда.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Досье */}
          <div className="w-[35%] border-r border-border overflow-y-auto">
            <div className="px-5 py-3 border-b border-border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-border h-9 gap-1.5 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 font-medium"
                  onClick={handleStartCall}
                  disabled={isCallActive}
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Позвонить
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border h-9 gap-1.5 text-[hsl(var(--status-good))]">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] border-border h-9 gap-1.5 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest"
                onClick={() => setDiagnosticOpen(true)}
              >
                <Stethoscope className="h-4 w-4" /> Запись на диагностику
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("text-xs border-border h-8 gap-1", scheduledDate && "text-primary border-primary/20 bg-primary/5")}>
                      <Calendar className="h-3 w-3" />
                      {scheduledDate ? `${scheduledDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} ${scheduledTime}` : "Запись"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-4 border-border space-y-4" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Дата и время</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <CalendarUI
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              initialFocus
                              className="rounded-md border border-border"
                            />
                          </div>
                          <div className="w-24 border border-border rounded-md overflow-y-auto h-[280px] py-1 bg-secondary/20">
                            {TIME_SLOTS.map(t => {
                              const isBusy = busySlots.some(s => s.time === t && s.doctor === doctorName);
                              return (
                                <button
                                  key={t}
                                  disabled={isBusy}
                                  onClick={() => setScheduledTime(t)}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs transition-colors",
                                    scheduledTime === t ? "bg-primary text-primary-foreground font-bold" : "hover:bg-primary/10",
                                    isBusy && "opacity-30 cursor-not-allowed line-through"
                                  )}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground uppercase font-medium">Врач</label>
                          <Select value={doctorName} onValueChange={setDoctorName}>
                            <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
                              <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCTORS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground uppercase font-medium">Кабинет</label>
                          <Select value={officeName} onValueChange={setOfficeName}>
                            <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
                              <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                              {OFFICES.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={handleScheduleConfirm} className="w-full h-9 text-sm font-semibold" disabled={loadingSlots}>
                        {loadingSlots ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подтвердить запись"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-border h-8 gap-1 text-muted-foreground hover:text-primary"
                  onClick={async () => {
                    try {
                      const { error } = await (supabase as any).from("retention_tasks").insert({
                        lead_id: lead.id,
                        project_id: (lead as any).project_id || null,
                        trigger_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
                        status: "pending",
                      });
                      if (error) throw error;
                      toast({ title: "⏰ Запланировано", description: "Касание добавлено в Генератор LTV" });
                    } catch (err: unknown) {
                      toast({ title: "Ошибка", description: (err as any).message, variant: "destructive" });
                    }
                  }}
                >
                  <Timer className="h-3 w-3" /> LTV
                </Button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-border">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Воронка</label>
              <Tabs value={pipeline} onValueChange={async (v) => {
                setPipeline(v);
                const defaultStage = v === "doctor" ? "Лечение начато" : "Новая заявка";
                setStage(defaultStage);
                await (supabase as any).from("leads_crm").update({ status: defaultStage }).eq("id", lead.id);
                onLeadUpdated?.();
              }} className="mt-1.5">
                <TabsList className="h-8 bg-secondary/50 w-full">
                  <TabsTrigger value="main" className="text-[10px] flex-1">Основная</TabsTrigger>
                  <TabsTrigger value="doctor" className="text-[10px] flex-1">Врача</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="px-5 py-3 border-b border-border">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Этап воронки</label>
              <Select value={stage} onValueChange={handleStageChange}>
                <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(pipeline === "doctor" ? DOCTOR_STAGES : MAIN_STAGES).map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="px-5 py-3 border-b border-border space-y-2.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Детали</label>
              <div className="space-y-1.5">
                {/* Сумма — Editable */}
                <div className="flex items-center justify-between py-1.5 group">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-xs">Сумма</span>
                  </div>
                  {isEditingAmount ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={tempAmount}
                        onChange={(e) => setTempAmount(e.target.value)}
                        className="h-7 w-24 text-right text-xs bg-secondary/50 border-primary/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAmountSave();
                          if (e.key === "Escape") setIsEditingAmount(false);
                        }}
                      />
                      <button onClick={handleAmountSave} className="text-emerald-500 hover:text-emerald-600 p-1">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors group/amount"
                      onClick={() => {
                        setTempAmount(String(amountValue));
                        setIsEditingAmount(true);
                      }}
                    >
                      <span className="text-xs font-bold text-foreground/80">
                        {amountValue > 0 ? `${new Intl.NumberFormat("ru-RU").format(amountValue)} ₸` : "0 ₸"}
                      </span>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover/amount:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  )}
                </div>

                {[
                  { 
                    icon: Globe, 
                    label: "Источник", 
                    value: (lead.source || "—").replace(/^Popup АҚ СИСА\s*\|\s*/, ''),
                    isPrimary: true 
                  },
                  { icon: Hash, label: "Кампания", value: lead.utm_campaign || "—" },
                  { icon: Calendar, label: "Запись", value: lead.scheduled_at ? `${new Date(lead.scheduled_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${new Date(lead.scheduled_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Не назначена" },
                  { icon: User, label: "Врач", value: lead.doctor_name || "—" },
                  { icon: MapPin, label: "Кабинет", value: (() => {
                    if (lead.office_name) return lead.office_name;
                    if (lead.doctor_name) {
                      const team = loadTeam();
                      const doc = team.find(m => m.name === lead.doctor_name);
                      if (doc?.office) return `Кабинет ${doc.office}`;
                    }
                    return "—";
                  })() },
                  { icon: Ban, label: "Причина отказа", value: (lead as any).refusal_reason || "—" },
                  { icon: Clock, label: "Создан", value: lead.created_at ? new Date(lead.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 group">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className={cn(
                      "text-xs truncate text-right",
                      item.isPrimary ? "font-bold text-primary max-w-[70%]" : "font-medium text-foreground/80 max-w-[55%]"
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-2 bg-border/40" />

              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">UTM Метки</p>
                {[
                  { label: "Источник (utm_source)", value: (lead as any).utm_source },
                  { label: "Кампания (utm_campaign)", value: lead.utm_campaign },
                  { label: "Тип трафика (utm_medium)", value: (lead as any).utm_medium },
                  { label: "Контент (utm_content)", value: (lead as any).utm_content },
                  { label: "Ключевое слово (utm_term)", value: (lead as any).utm_term },
                ].map((utm) => utm.value && (
                  <div key={utm.label} className="flex flex-col py-1">
                    <span className="text-[9px] text-muted-foreground">{utm.label}</span>
                    <span className="text-xs font-medium text-foreground/70 truncate">{utm.value}</span>
                  </div>
                ))}
                {!(lead as any).utm_source && !(lead as any).utm_medium && !(lead as any).utm_content && !(lead as any).utm_term && (
                  <p className="text-[10px] text-muted-foreground italic">UTM-метки отсутствуют</p>
                )}
              </div>
            </div>

            {/* AI Analysis / Last Call Result */}
            <div className="px-5 py-3">
              {callHistory.length > 0 ? (
                <AiCallResultCard record={callHistory[0]} />
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Анализ</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    {lead.ai_summary || "AI-анализ ещё не выполнен. Нажмите «Позвонить» для запуска анализа."}
                  </p>
                  {score > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-[hsl(var(--status-critical))]" : score >= 50 ? "bg-[hsl(var(--status-warning))]" : "bg-primary"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{score}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Chat / Notes / Calls */}
          <div className="w-[65%] flex flex-col">
            <div className="flex items-center justify-between px-5 py-2 border-b border-border">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)}>
                <TabsList className="h-8 bg-secondary/50">
                  <TabsTrigger value="chat" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <MessageCircle className="h-3 w-3" /> Чат
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <Phone className="h-3 w-3" /> История
                    {callHistory.length > 0 && (
                      <Badge variant="outline" className="ml-0.5 text-[8px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                        {callHistory.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <FileText className="h-3 w-3" /> Заметки
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {rightTab === "chat" && (
                <div className="flex items-center gap-2">
                  {aiMode ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">{aiMode ? "🤖 AI-Агент" : "Ручной"}</span>
                  <Switch checked={aiMode} onCheckedChange={setAiMode} className="scale-75" />
                </div>
              )}
            </div>

            {/* CHAT TAB */}
            {rightTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-background">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-14 w-14 rounded-full bg-[hsl(142,70%,45%)]/10 flex items-center justify-center mb-4">
                        <MessageCircle className="h-6 w-6 text-[hsl(142,70%,45%)]" />
                      </div>
                      <p className="text-sm font-medium text-foreground/60">Начните диалог</p>
                      <p className="text-xs text-muted-foreground mt-1">Сообщения из WhatsApp появятся здесь</p>
                    </div>
                  ) : (
                    <>
                      {groupedMessages.map((group) => (
                        <div key={group.date}>
                          <div className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                              {formatDateSeparator(group.messages[0].created_at)}
                            </span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>
                          {group.messages.map((msg, idx) => {
                            const isInbound = msg.is_inbound;
                            const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                            const isConsecutive = prevMsg && prevMsg.is_inbound === msg.is_inbound;
                            return (
                              <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"} ${isConsecutive ? "mt-0.5" : "mt-3"}`}>
                                <div className={`flex items-end gap-1.5 max-w-[75%] ${isInbound ? "flex-row" : "flex-row-reverse"}`}>
                                  {isInbound && !isConsecutive && (
                                    <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                                      <AvatarFallback className="bg-secondary text-muted-foreground text-[9px] font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  {isInbound && isConsecutive && <div className="w-6 shrink-0" />}
                                  <div className={`px-3.5 py-2 text-[13.5px] leading-relaxed ${isInbound
                                    ? `bg-secondary text-foreground ${isConsecutive ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-bl-md"}`
                                    : `bg-primary text-primary-foreground ${isConsecutive ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-br-md"}`
                                    }`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                                    <div className={`flex items-center gap-1 mt-0.5 ${isInbound ? "text-muted-foreground/40" : "text-primary-foreground/50"}`}>
                                      <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                                      {!isInbound && <CheckCheck className="h-2.5 w-2.5" />}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="px-4 py-3 border-t border-border bg-background backdrop-blur-sm">
                  {aiMode ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/60 border border-border/30">
                      <Bot className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        ИИ ведет диалог. Переключите в ручной режим для ответа.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Написать сообщение..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="bg-secondary/50 border-border/30 text-sm h-10 rounded-full px-4 pr-12"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full shrink-0"
                        disabled={!message.trim() || sending}
                        onClick={handleSendMessage}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* CALLS TAB — History */}
            {rightTab === "calls" && (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isAnalyzing && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-foreground">🤖 ИИ-РОП анализирует звонок...</p>
                    <div className="w-full space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                )}

                {callHistory.map((record) => (
                  <AiCallResultCard key={record.id} record={record} />
                ))}

                {!isAnalyzing && callHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground/60">Нет звонков</p>
                    <p className="text-xs text-muted-foreground mt-1">Нажмите «Позвонить» чтобы начать</p>
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {rightTab === "notes" && (
              <div className="flex-1 flex flex-col">
                <div className="px-5 py-3 border-b border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Добавить заметку..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="bg-secondary/50 border-border text-sm min-h-[60px] resize-none flex-1"
                    />
                    <Button size="sm" className="self-end h-8 gap-1" onClick={addNote} disabled={!noteText.trim()}>
                      <Plus className="h-3.5 w-3.5" /> Добавить
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-sm text-foreground/90 leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground font-medium">{n.author_name}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[10px] text-muted-foreground">{formatTime(n.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Нет заметок</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      <DiagnosticModule
        lead={lead}
        open={diagnosticOpen}
        onOpenChange={setDiagnosticOpen}
        onComplete={(data) => {
          setDiagnosticOpen(false);
          onOpenChange(false);
          onLeadUpdated?.();
        }}
      />
    </Sheet>
  );
}
