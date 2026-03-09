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
  Brain, Send, MessageCircle, Bot, User, Phone, Calendar,
  MapPin, DollarSign, ExternalLink, Clock, FileText, Plus,
  Copy, ChevronRight, Sparkles, Globe, Hash, Loader2, Check, CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Lead } from "./KanbanBoard";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
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

const STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

const stageColorMap: Record<string, string> = {
  "Новая заявка": "bg-primary/15 text-primary border-primary/20",
  "Без ответа": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]",
  "В работе": "bg-[hsl(var(--status-ai)/0.15)] text-[hsl(var(--status-ai))] border-[hsl(var(--status-ai)/0.2)]",
  "Счет выставлен": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]",
  "Записан": "bg-primary/15 text-primary border-primary/20",
  "Визит совершен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]",
  "Оплачен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]",
  "Отказ": "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)]",
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

export default function LeadDetailSheet({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailSheetProps) {
  const [stage, setStage] = useState("");
  const [aiMode, setAiMode] = useState(true);
  const [message, setMessage] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rightTab, setRightTab] = useState<"chat" | "notes">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("fetchNotes error:", err);
    }
  }, []);

  useEffect(() => {
    if (lead && open) {
      setStage(lead.status || "Новая заявка");
      fetchChatMessages(lead.id);
      fetchNotes(lead.id);
    }
  }, [lead, open, fetchChatMessages, fetchNotes]);

  // Realtime for chat_messages and crm_notes
  useEffect(() => {
    if (!lead || !open) return;
    const ch = supabase
      .channel(`lead_chat_${lead.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `lead_id=eq.${lead.id}`,
      }, (payload: any) => {
        setChatMessages(prev => {
          const newMsg = payload.new as ChatMessage;
          // Avoid duplicates (optimistic insert)
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "crm_notes",
        filter: `lead_id=eq.${lead.id}`,
      }, (payload: any) => {
        setNotes(prev => [payload.new as CrmNote, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [lead, open]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && rightTab === "chat") {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, rightTab, chatMessages]);

  if (!lead) return null;

  const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const amount = Number(lead.amount) || 0;
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
          table: "leads",
          type: "UPDATE",
          record: {
            id: lead.id,
            status: capiKey,
            project_id: (lead as any).project_id || null,
            deal_amount: Number(lead.amount) || 0,
          },
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
    const { error } = await (supabase as any)
      .from("leads").update({ status: newStage }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Статус обновлён", description: `${lead.name} → ${newStage}` });
    fireCAPIWebhook(oldStatus, newStage);
    onLeadUpdated?.();
  };

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      toast({ title: "Скопировано", description: lead.phone });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;
    const body = message.trim();
    setMessage("");
    setSending(true);

    try {
      // 1. Insert into chat_messages
      const { error } = await (supabase as any).from("chat_messages").insert({
        lead_id: lead.id,
        message_text: body,
        is_inbound: false,
      });
      if (error) throw error;

      // 2. Fire n8n webhook to send via Green-API
      const webhookUrl = import.meta.env.VITE_N8N_WA_SEND_WEBHOOK;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            phone: lead.phone || "",
            message: body,
          }),
        }).catch(err => console.error("WA send webhook error:", err));
      }
    } catch (err: any) {
      toast({ title: "Ошибка отправки", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const body = noteText.trim();
    setNoteText("");
    const { error } = await (supabase as any).from("crm_notes").insert({
      lead_id: lead.id,
      author_name: "Менеджер",
      body,
    });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
  };

  // Group messages by date for separators
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
        <SheetHeader className="px-6 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">{lead.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{lead.phone || "Нет телефона"}</span>
                  {lead.phone && (
                    <button onClick={handleCopyPhone} className="text-muted-foreground/50 hover:text-muted-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(lead.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {score > 0 && (
                <Badge variant="outline" className={`text-xs font-medium ${scoreBadge.className}`}>
                  {scoreBadge.emoji} {scoreBadge.label} {score}%
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs font-medium ${stageColorMap[stage] || "border-border text-muted-foreground"}`}>
                {stage}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Досье */}
          <div className="w-[35%] border-r border-border overflow-y-auto">
            <div className="px-5 py-3 border-b border-border">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1">
                  <Phone className="h-3 w-3" /> Звонок
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1 text-[hsl(var(--status-good))]">
                  <MessageCircle className="h-3 w-3" /> WA
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1">
                  <Calendar className="h-3 w-3" /> Запись
                </Button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-border">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Этап воронки</label>
              <Select value={stage} onValueChange={handleStageChange}>
                <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="px-5 py-3 border-b border-border space-y-2.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Детали</label>
              <div className="space-y-1.5">
                {[
                  { icon: DollarSign, label: "Сумма", value: amount > 0 ? `${new Intl.NumberFormat("ru-RU").format(amount)} ₸` : "Не указана" },
                  { icon: Globe, label: "Источник", value: lead.source || "—" },
                  { icon: Hash, label: "Кампания", value: lead.utm_campaign || "—" },
                  { icon: Clock, label: "Создан", value: lead.created_at ? new Date(lead.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 group">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground/80 max-w-[55%] truncate text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Анализ</span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {lead.ai_summary || "AI-анализ ещё не выполнен. Он появится автоматически после первого диалога с клиентом."}
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
            </div>
          </div>

          {/* RIGHT — Chat / Notes */}
          <div className="w-[65%] flex flex-col">
            <div className="flex items-center justify-between px-5 py-2 border-b border-border">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)}>
                <TabsList className="h-8 bg-secondary/50">
                  <TabsTrigger value="chat" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <MessageCircle className="h-3 w-3" /> Чат
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
                {/* Messages area — iMessage style */}
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
                          {/* Date separator */}
                          <div className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                              {formatDateSeparator(group.messages[0].created_at)}
                            </span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>

                          {/* Messages */}
                          {group.messages.map((msg, idx) => {
                            const isInbound = msg.is_inbound;
                            const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                            const isConsecutive = prevMsg && prevMsg.is_inbound === msg.is_inbound;

                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isInbound ? "justify-start" : "justify-end"} ${isConsecutive ? "mt-0.5" : "mt-3"}`}
                              >
                                <div className={`flex items-end gap-1.5 max-w-[75%] ${isInbound ? "flex-row" : "flex-row-reverse"}`}>
                                  {/* Avatar — only show on first of consecutive group */}
                                  {isInbound && !isConsecutive && (
                                    <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                                      <AvatarFallback className="bg-secondary text-muted-foreground text-[9px] font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  {isInbound && isConsecutive && <div className="w-6 shrink-0" />}

                                  {/* Bubble */}
                                  <div
                                    className={`px-3.5 py-2 text-[13.5px] leading-relaxed ${
                                      isInbound
                                        ? `bg-secondary text-foreground ${isConsecutive ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-bl-md"}`
                                        : `bg-primary text-primary-foreground ${isConsecutive ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-br-md"}`
                                    }`}
                                  >
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

                {/* Input area */}
                <div className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
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
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </>
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
    </Sheet>
  );
}
