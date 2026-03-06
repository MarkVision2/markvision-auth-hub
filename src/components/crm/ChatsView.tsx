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
  CircleDot, Bell, Paperclip,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface ChatMessage {
  id: number;
  from: "client" | "ai" | "manager";
  text: string;
  time: string;
  read: boolean;
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

const MOCK_CHATS: Record<string, ChatMessage[]> = {
  default: [
    { id: 1, from: "client", text: "Здравствуйте! Хочу узнать подробнее", time: "14:20", read: true },
    { id: 2, from: "ai", text: "Добрый день! Подскажите, что именно вас интересует?", time: "14:21", read: true },
    { id: 3, from: "client", text: "Сколько стоит консультация?", time: "14:23", read: true },
    { id: 4, from: "ai", text: "Первичная консультация бесплатная! Хотите записаться на удобное время?", time: "14:24", read: false },
  ],
};

function getLastMessage(leadName: string): ChatMessage {
  const msgs = MOCK_CHATS[leadName] || MOCK_CHATS.default;
  return msgs[msgs.length - 1];
}

function getUnreadCount(leadName: string): number {
  const msgs = MOCK_CHATS[leadName] || MOCK_CHATS.default;
  return msgs.filter((m) => !m.read && m.from === "client").length;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}м`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч`;
  return `${Math.floor(hours / 24)}д`;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ChatsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [message, setMessage] = useState("");
  const [aiMode, setAiMode] = useState(true);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<{ id: number; text: string; author: string; time: string }[]>([]);
  const [rightPanel, setRightPanel] = useState<"chat" | "info">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const channel = supabase
      .channel("chats_leads_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  useEffect(() => {
    if (selectedLead && rightPanel === "chat") {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedLead, rightPanel]);

  // Keep selectedLead in sync with fetched data
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
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage } : l));
    const { error } = await (supabase as any)
      .from("leads").update({ status: newStage }).eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      fetchLeads();
      return;
    }
    toast({ title: "Этап обновлён", description: newStage });
  };

  const currentMessages = selectedLead
    ? (MOCK_CHATS[selectedLead.name] || MOCK_CHATS.default)
    : [];

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [{ id: Date.now(), text: note.trim(), author: "Вы", time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setNote("");
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
    <div className="flex flex-col h-[calc(100vh-10rem)] rounded-xl border border-border bg-card overflow-hidden">
      {/* TOP — Stage filter bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-secondary/20 overflow-x-auto">
        <button
          onClick={() => setFilterStage("all")}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            filterStage === "all"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:bg-secondary/60"
          }`}
        >
          Все
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filterStage === "all" ? "bg-background/20" : "bg-secondary"}`}>
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
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? `${colors.bg} ${colors.text} shadow-sm`
                  : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? "bg-background/20" : "bg-secondary"}`}>
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
          {/* Search */}
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

          {/* Chat list */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Нет чатов</div>
            ) : (
              filteredLeads.map((lead) => {
                const lastMsg = getLastMessage(lead.name);
                const unread = getUnreadCount(lead.name);
                const isActive = selectedLead?.id === lead.id;
                const score = lead.ai_score ?? 0;
                const colors = stageColorMap[lead.status || "Новая заявка"];

                return (
                  <div
                    key={lead.id}
                    onClick={() => { setSelectedLead(lead); setRightPanel("chat"); }}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-all ${
                      isActive ? "bg-accent" : "hover:bg-accent/40"
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
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{timeAgo(lead.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMsg.from === "ai" && <Bot className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                        {lastMsg.text}
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

            {/* Stage pipeline — clickable stages */}
            <div className="flex items-center gap-0 px-3 py-1.5 border-b border-border bg-secondary/10 overflow-x-auto">
              {STAGES.map((s, i) => {
                const isCurrent = s.key === (selectedLead.status || "Новая заявка");
                const isPast = i < currentStageIndex;
                const colors = stageColorMap[s.key];
                return (
                  <div key={s.key} className="flex items-center">
                    <button
                      onClick={() => handleStageChange(selectedLead.id, s.key)}
                      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap transition-all ${
                        isCurrent
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
                    <div className="flex items-center gap-3 py-1">
                      <Separator className="flex-1" />
                      <span className="text-[10px] text-muted-foreground bg-card px-2">Сегодня</span>
                      <Separator className="flex-1" />
                    </div>

                    {currentMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-start" : "justify-end"}`}>
                        <div className="flex items-end gap-1.5 max-w-[75%]">
                          {msg.from === "client" && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="bg-secondary text-muted-foreground text-[9px]">
                                {getInitials(selectedLead.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              msg.from === "client"
                                ? "bg-secondary text-foreground rounded-bl-md"
                                : "bg-primary/10 text-foreground rounded-br-md"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 justify-end ${msg.from === "client" ? "text-muted-foreground/40" : "text-primary/40"}`}>
                              {msg.from === "ai" && <Bot className="h-2.5 w-2.5" />}
                              <span className="text-[10px]">{msg.time}</span>
                              {msg.from !== "client" && (
                                msg.read ? <CheckCheck className="h-2.5 w-2.5 text-primary/60" /> : <Check className="h-2.5 w-2.5" />
                              )}
                            </div>
                          </div>
                          {msg.from === "ai" && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                                <Bot className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
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
                    />
                    <Button size="sm" className="shrink-0 h-9 w-9 p-0" disabled={aiMode || !message.trim()}>
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

              {/* Right info panel (togglable) */}
              {rightPanel === "info" && (
                <div className="w-[280px] shrink-0 border-l border-border overflow-y-auto bg-background">
                  {/* Quick actions */}
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

                  {/* Details */}
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

                  {/* AI Analysis */}
                  <div className="p-3 border-b border-border">
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">AI Анализ</span>
                      </div>
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        {selectedLead.ai_summary || "Анализ появится после диалога."}
                      </p>
                      {(selectedLead.ai_score ?? 0) > 0 && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(selectedLead.ai_score ?? 0) >= 80 ? "bg-[hsl(var(--status-critical))]" : (selectedLead.ai_score ?? 0) >= 50 ? "bg-[hsl(var(--status-warning))]" : "bg-primary"}`}
                              style={{ width: `${selectedLead.ai_score}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground">{selectedLead.ai_score}%</span>
                        </div>
                      )}
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
                          <p className="text-[11px] text-foreground/90">{n.text}</p>
                          <span className="text-[9px] text-muted-foreground">{n.author} · {n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Выберите чат</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Все диалоги с клиентами в одном месте</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
