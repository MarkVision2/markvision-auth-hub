import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, MessageCircle, Bot, User, Phone, Calendar,
  DollarSign, Clock, FileText, Plus, Copy, Sparkles,
  Globe, Hash, Search, Check, CheckCheck, ChevronRight,
  ArrowRight, Zap, Eye, CreditCard, MapPin, Ban,
  CircleDot, Bell, Paperclip, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, HQ_ID } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  amount: number | null;
  source: string | null;
  utm_campaign: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  created_at: string | null;
}

interface CrmMessage {
  id: string;
  lead_id: string;
  direction: string;
  sender_type: string;
  body: string;
  channel: string | null;
  read: boolean;
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
  { key: "Новая заявка", label: "Новая", icon: Zap, color: "primary" },
  { key: "Без ответа", label: "Без ответа", icon: Bell, color: "warning" },
  { key: "В работе", label: "В работе", icon: MessageCircle, color: "ai" },
  { key: "Счет выставлен", label: "Счёт", icon: CreditCard, color: "warning" },
  { key: "Записан", label: "Записан", icon: Calendar, color: "primary" },
  { key: "Визит совершен", label: "Визит", icon: MapPin, color: "good" },
  { key: "Оплачен", label: "Оплачен", icon: Check, color: "good" },
  { key: "Отказ", label: "Отказ", icon: Ban, color: "critical" },
];

const stageColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  "Новая заявка": { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  "Без ответа": { bg: "bg-[hsl(var(--status-warning)/0.1)]", text: "text-[hsl(var(--status-warning))]", dot: "bg-[hsl(var(--status-warning))]" },
  "В работе": { bg: "bg-[hsl(var(--status-ai)/0.1)]", text: "text-[hsl(var(--status-ai))]", dot: "bg-[hsl(var(--status-ai))]" },
  "Счет выставлен": { bg: "bg-[hsl(var(--status-warning)/0.1)]", text: "text-[hsl(var(--status-warning))]", dot: "bg-[hsl(var(--status-warning))]" },
  "Записан": { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  "Визит совершен": { bg: "bg-[hsl(var(--status-good)/0.1)]", text: "text-[hsl(var(--status-good))]", dot: "bg-[hsl(var(--status-good))]" },
  "Оплачен": { bg: "bg-[hsl(var(--status-good)/0.1)]", text: "text-[hsl(var(--status-good))]", dot: "bg-[hsl(var(--status-good))]" },
  "Отказ": { bg: "bg-[hsl(var(--status-critical)/0.1)]", text: "text-[hsl(var(--status-critical))]", dot: "bg-[hsl(var(--status-critical))]" },
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}м`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч`;
  return `${Math.floor(hours / 24)}д`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ChatsView() {
  const { active } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [message, setMessage] = useState("");
  const [aiMode, setAiMode] = useState(true);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [rightPanel, setRightPanel] = useState<"chat" | "info">("chat");
  const [lastMessages, setLastMessages] = useState<Record<string, CrmMessage>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any).from("leads_crm").select("*");

      if (active.id === HQ_ID) {
        // HQ sees everything
      } else {
        // Client project: own + shared
        const { data: shared } = await (supabase as any)
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", active.id);
        const sharedCabIds = (shared || []).map((s: any) => s.client_config_id);

        if (sharedCabIds.length > 0) {
          query = query.or(`project_id.eq.${active.id},client_config_id.in.(${sharedCabIds.join(",")})`);
        } else {
          query = query.eq("project_id", active.id);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const leadsData = (data as Lead[]) ?? [];
      setLeads(leadsData);

      // Fetch last messages and unread counts for all leads
      if (leadsData.length > 0) {
        const leadIds = leadsData.map(l => l.id);
        const { data: allMsgs } = await (supabase as any)
          .from("crm_messages")
          .select("id, lead_id, sender_type, body, read, created_at, direction, channel")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false })
          .limit(500);

        if (allMsgs) {
          const lastMap: Record<string, CrmMessage> = {};
          const unreadMap: Record<string, number> = {};
          for (const msg of allMsgs) {
            if (!lastMap[msg.lead_id]) lastMap[msg.lead_id] = msg;
            if (!msg.read && msg.sender_type === "client") {
              unreadMap[msg.lead_id] = (unreadMap[msg.lead_id] || 0) + 1;
            }
          }
          setLastMessages(lastMap);
          setUnreadCounts(unreadMap);
        }
      }
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const channel = supabase
      .channel("chats_leads_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_messages" }, (payload: any) => {
        const newMsg = payload.new as CrmMessage;
        // Update messages if viewing this lead
        if (selectedLead && newMsg.lead_id === selectedLead.id) {
          setMessages(prev => [...prev, newMsg]);
        }
        // Update last message and unread
        setLastMessages(prev => ({ ...prev, [newMsg.lead_id]: newMsg }));
        if (!newMsg.read && newMsg.sender_type === "client") {
          setUnreadCounts(prev => ({ ...prev, [newMsg.lead_id]: (prev[newMsg.lead_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads, selectedLead, active.id]);

  // Fetch messages for selected lead
  const fetchMessages = useCallback(async (leadId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("crm_messages").select("*").eq("lead_id", leadId).order("created_at", { ascending: true });
      if (error) throw error;
      setMessages((data as CrmMessage[]) ?? []);
      // Mark as read
      await (supabase as any).from("crm_messages").update({ read: true }).eq("lead_id", leadId).eq("read", false);
      setUnreadCounts(prev => ({ ...prev, [leadId]: 0 }));
    } catch (err: any) {
      toast({ title: "Ошибка загрузки сообщений", description: err.message, variant: "destructive" });
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Fetch notes for selected lead
  const fetchNotes = useCallback(async (leadId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("crm_notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (error) throw error;
      setNotes((data as CrmNote[]) ?? []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки заметок", description: err.message, variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      fetchNotes(selectedLead.id);
    }
  }, [selectedLead, fetchMessages, fetchNotes]);

  useEffect(() => {
    if (selectedLead && rightPanel === "chat") {
      const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      return () => clearTimeout(t);
    }
  }, [selectedLead, rightPanel, messages]);

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  }, [leads]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    STAGES.forEach(s => { counts[s.key] = 0; });
    leads.forEach(l => { const st = l.status || "Новая заявка"; counts[st] = (counts[st] || 0) + 1; });
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let list = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || (l.phone || "").includes(q));
    }
    if (filterStage !== "all") {
      list = list.filter((l) => (l.status || "Новая заявка") === filterStage);
    }
    return list;
  }, [leads, search, filterStage]);

  const handleStageChange = async (leadId: string, newStage: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage } : l));
    const { error } = await (supabase as any)
      .from("leads_crm").update({ status: newStage }).eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      fetchLeads();
      return;
    }
    toast({ title: "Этап обновлён", description: newStage });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedLead) return;
    const body = message.trim();
    setMessage("");
    const { error } = await (supabase as any).from("crm_messages").insert({
      lead_id: selectedLead.id,
      direction: "outbound",
      sender_type: "manager",
      body,
      channel: "web",
      read: true,
    });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
  };

  const addNote = async () => {
    if (!note.trim() || !selectedLead) return;
    const body = note.trim();
    setNote("");
    const { error } = await (supabase as any).from("crm_notes").insert({
      lead_id: selectedLead.id,
      author_name: "Менеджер",
      body,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    fetchNotes(selectedLead.id);
  };

  const currentStageIndex = selectedLead
    ? STAGES.findIndex(s => s.key === (selectedLead.status || "Новая заявка"))
    : -1;

  const handleCopyPhone = () => {
    if (selectedLead?.phone) {
      navigator.clipboard.writeText(selectedLead.phone);
      toast({ title: "Скопировано", description: selectedLead.phone });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-24rem)] min-h-[500px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* TOP — Stage filter bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-secondary/20 overflow-x-auto">
        <button
          onClick={() => setFilterStage("all")}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${filterStage === "all"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:bg-secondary/60"
            }`}
        >
          Все
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filterStage === "all" ? "bg-secondary" : "bg-secondary"}`}>
            {stageCounts.all}
          </span>
        </button>
        {STAGES.map((s) => {
          const count = stageCounts[s.key] || 0;
          const colors = stageColorMap[s.key];
          const isActive = filterStage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilterStage(s.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${isActive
                ? `${colors.bg} ${colors.text} shadow-sm`
                : "text-muted-foreground hover:bg-secondary/60"
                }`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? "bg-secondary" : "bg-secondary"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Chat list */}
        <div className="w-[320px] shrink-0 border-r border-border flex flex-col">
          <div className="p-2.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="pl-8 h-8 text-sm bg-secondary/30 border-border"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Нет чатов</div>
            ) : (
              filteredLeads.map((lead) => {
                const lastMsg = lastMessages[lead.id];
                const unread = unreadCounts[lead.id] || 0;
                const isActive = selectedLead?.id === lead.id;
                const score = lead.ai_score ?? 0;
                const colors = stageColorMap[lead.status || "Новая заявка"];

                return (
                  <div
                    key={lead.id}
                    onClick={() => { setSelectedLead(lead); setRightPanel("chat"); }}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-all ${isActive ? "bg-accent" : "hover:bg-accent/40"
                      }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${colors.dot}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate text-foreground">{lead.name}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {lastMsg ? timeAgo(lastMsg.created_at) : timeAgo(lead.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMsg ? (
                          <>
                            {lastMsg.sender_type === "ai" && <Bot className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                            {lastMsg.sender_type === "manager" && <User className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                            {lastMsg.body}
                          </>
                        ) : (
                          "Нет сообщений"
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-medium px-1.5 py-px rounded ${colors.bg} ${colors.text}`}>
                          {lead.status || "Новая заявка"}
                        </span>
                        {score > 0 && (
                          <span className="text-[9px] text-muted-foreground">{score >= 80 ? "🔥" : score >= 50 ? "🌤" : "❄️"} {score}%</span>
                        )}
                        {unread > 0 && (
                          <span className="ml-auto shrink-0 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* CENTER — Chat area */}
        {selectedLead ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(selectedLead.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedLead.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{selectedLead.phone || "—"}</span>
                    {selectedLead.phone && (
                      <button onClick={handleCopyPhone} className="text-muted-foreground/40 hover:text-muted-foreground">
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                    )}
                    <span className="text-muted-foreground/20">·</span>
                    <span className="text-[11px] text-muted-foreground">{selectedLead.source || "—"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50">
                  {aiMode ? <Bot className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">{aiMode ? "AI" : "Руч."}</span>
                  <Switch checked={aiMode} onCheckedChange={setAiMode} className="scale-[0.6]" />
                </div>
                <Button
                  variant={rightPanel === "info" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setRightPanel(rightPanel === "info" ? "chat" : "info")}
                >
                  <User className="h-3 w-3" /> Досье
                </Button>
              </div>
            </div>

            {/* Stage pipeline */}
            <div className="flex items-center gap-0 px-3 py-1.5 border-b border-border bg-secondary/10 overflow-x-auto">
              {STAGES.map((s, i) => {
                const isCurrent = s.key === (selectedLead.status || "Новая заявка");
                const isPast = i < currentStageIndex;
                const colors = stageColorMap[s.key];
                return (
                  <div key={s.key} className="flex items-center">
                    <button
                      onClick={() => handleStageChange(selectedLead.id, s.key)}
                      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap transition-all ${isCurrent
                        ? `${colors.bg} ${colors.text} ring-1 ring-current/20`
                        : isPast
                          ? "text-muted-foreground/60 line-through"
                          : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/50"
                        }`}
                      title={`Перевести в "${s.key}"`}
                    >
                      {isCurrent && <CircleDot className="h-2.5 w-2.5" />}
                      {s.label}
                    </button>
                    {i < STAGES.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/20 shrink-0 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-2.5">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">Нет сообщений. Начните диалог.</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 py-1">
                          <Separator className="flex-1" />
                          <span className="text-[10px] text-muted-foreground bg-card px-2">Диалог</span>
                          <Separator className="flex-1" />
                        </div>
                        {messages.map((msg) => {
                          const isClient = msg.sender_type === "client";
                          return (
                            <div key={msg.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                              <div className="flex items-end gap-1.5 max-w-[75%]">
                                {isClient && (
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarFallback className="bg-secondary text-muted-foreground text-[9px]">
                                      {getInitials(selectedLead.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isClient
                                    ? "bg-secondary text-foreground rounded-bl-md"
                                    : "bg-primary/10 text-foreground rounded-br-md"
                                    }`}
                                >
                                  <p>{msg.body}</p>
                                  <div className={`flex items-center gap-1 mt-1 justify-end ${isClient ? "text-muted-foreground/40" : "text-primary/40"}`}>
                                    {msg.sender_type === "ai" && <Bot className="h-2.5 w-2.5" />}
                                    {msg.sender_type === "manager" && <User className="h-2.5 w-2.5" />}
                                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                                    {!isClient && (
                                      msg.read ? <CheckCheck className="h-2.5 w-2.5 text-primary/60" /> : <Check className="h-2.5 w-2.5" />
                                    )}
                                  </div>
                                </div>
                                {msg.sender_type === "ai" && (
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                                      <Bot className="h-3 w-3" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="px-4 py-2.5 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder={aiMode ? "AI отвечает автоматически..." : "Написать сообщение..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={aiMode}
                      className="bg-secondary/30 border-border text-sm flex-1 h-9"
                      onKeyDown={(e) => { if (e.key === "Enter" && !aiMode) handleSendMessage(); }}
                    />
                    <Button size="sm" className="shrink-0 h-9 w-9 p-0" disabled={aiMode || !message.trim()} onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {aiMode && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Bot className="h-2.5 w-2.5" /> AI-агент обрабатывает диалоги
                    </p>
                  )}
                </div>
              </div>

              {/* Right info panel */}
              {rightPanel === "info" && (
                <div className="w-[280px] shrink-0 border-l border-border overflow-y-auto bg-background">
                  <div className="p-3 border-b border-border">
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button variant="outline" size="sm" className="text-[10px] border-border h-7 gap-1 px-2">
                        <Phone className="h-3 w-3" /> Звонок
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px] border-border h-7 gap-1 px-2 text-[hsl(var(--status-good))]">
                        <MessageCircle className="h-3 w-3" /> WA
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px] border-border h-7 gap-1 px-2">
                        <Calendar className="h-3 w-3" /> Запись
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 border-b border-border space-y-1.5">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Детали</label>
                    {[
                      { icon: DollarSign, label: "Сумма", value: (Number(selectedLead.amount) || 0) > 0 ? `${new Intl.NumberFormat("ru-RU").format(Number(selectedLead.amount))} ₸` : "—" },
                      { icon: Globe, label: "Источник", value: selectedLead.source || "—" },
                      { icon: Hash, label: "Кампания", value: selectedLead.utm_campaign || "—" },
                      { icon: Clock, label: "Создан", value: selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <item.icon className="h-3 w-3" />
                          <span className="text-[11px]">{item.label}</span>
                        </div>
                        <span className="text-[11px] font-medium text-foreground/80 truncate max-w-[50%] text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-b border-border">
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">AI Анализ</span>
                      </div>
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        {selectedLead.ai_summary || "Анализ появится после диалога."}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-3">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Заметки</label>
                    <div className="flex gap-1.5 mt-2">
                      <Textarea
                        placeholder="Добавить..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-secondary/30 border-border text-[11px] min-h-[40px] resize-none flex-1"
                      />
                      <Button size="sm" className="self-end h-7 w-7 p-0" onClick={addNote} disabled={!note.trim()}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {notes.map((n) => (
                        <div key={n.id} className="rounded border border-border bg-secondary/20 p-2">
                          <p className="text-[11px] text-foreground/90">{n.body}</p>
                          <span className="text-[9px] text-muted-foreground">{n.author_name} · {formatTime(n.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-secondary/20 via-transparent to-primary/[0.02]">
            <div className="text-center space-y-4 max-w-xs">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto">
                <MessageCircle className="h-9 w-9 text-primary/30" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground/80">Выберите диалог</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Выберите лида из списка слева чтобы просмотреть историю переписки и управлять статусом
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-pulse" />
                AI-агент обрабатывает входящие автоматически
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
