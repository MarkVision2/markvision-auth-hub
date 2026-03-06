import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, MessageCircle, Bot, User, Phone, Calendar,
  DollarSign, Clock, FileText, Plus, Copy, Sparkles,
  Globe, Hash, Search, Check, CheckCheck, ArrowLeft,
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
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

const stageColorMap: Record<string, string> = {
  "Новая заявка": "bg-primary/15 text-primary",
  "Без ответа": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  "В работе": "bg-[hsl(var(--status-ai)/0.15)] text-[hsl(var(--status-ai))]",
  "Счет выставлен": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  "Записан": "bg-primary/15 text-primary",
  "Визит совершен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))]",
  "Оплачен": "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))]",
  "Отказ": "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))]",
};

// Mock messages per lead (keyed by lead name for demo)
const MOCK_CHATS: Record<string, ChatMessage[]> = {
  default: [
    { id: 1, from: "client", text: "Здравствуйте! Хочу узнать подробнее", time: "14:20", read: true },
    { id: 2, from: "ai", text: "Добрый день! Подскажите, что именно вас интересует?", time: "14:21", read: true },
    { id: 3, from: "client", text: "Сколько стоит консультация?", time: "14:23", read: true },
    { id: 4, from: "ai", text: "Первичная консультация бесплатная! Хотите записаться?", time: "14:24", read: false },
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
  const days = Math.floor(hours / 24);
  return `${days}д`;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-[hsl(var(--status-critical))]";
  if (score >= 50) return "bg-[hsl(var(--status-warning))]";
  return "bg-primary";
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
  const [rightTab, setRightTab] = useState<"chat" | "info" | "notes">("chat");
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
    if (selectedLead && rightTab === "chat") {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedLead, rightTab]);

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
    const { error } = await (supabase as any)
      .from("leads").update({ status: newStage }).eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Статус обновлён", description: newStage });
    fetchLeads();
  };

  const currentMessages = selectedLead
    ? (MOCK_CHATS[selectedLead.name] || MOCK_CHATS.default)
    : [];

  const addNote = () => {
    if (!note.trim()) return;
    setNotes((prev) => [{ id: Date.now(), text: note.trim(), author: "Вы", time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setNote("");
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-lg border border-border bg-card overflow-hidden">
      {/* LEFT — Chat list */}
      <div className="w-[340px] shrink-0 border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или телефону..."
              className="pl-8 h-8 text-sm bg-secondary/30 border-border"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFilterStage("all")}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                filterStage === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              Все ({leads.length})
            </button>
            {STAGES.slice(0, 5).map((s) => {
              const count = leads.filter((l) => (l.status || "Новая заявка") === s).length;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStage(s)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                    filterStage === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {s.split(" ")[0]} ({count})
                </button>
              );
            })}
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

              return (
                <div
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); setRightTab("chat"); }}
                  className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-border transition-colors ${
                    isActive ? "bg-accent/50" : "hover:bg-accent/20"
                  }`}
                >
                  {/* Avatar with online/score indicator */}
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    {score > 0 && (
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${getScoreColor(score)}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground/90"}`}>
                        {lead.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {timeAgo(lead.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate pr-2">
                        {lastMsg.from === "ai" && <Bot className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                        {lastMsg.from === "ai" && <CheckCheck className="inline h-3 w-3 mr-0.5 -mt-0.5 text-primary" />}
                        {lastMsg.text}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <Badge variant="outline" className={`text-[9px] py-0 h-4 px-1.5 ${stageColorMap[lead.status || "Новая заявка"] || ""}`}>
                        {lead.status || "Новая заявка"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* RIGHT — Chat / Info / Notes */}
      {selectedLead ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(selectedLead.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedLead.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {selectedLead.phone || "—"} · {selectedLead.source || "Неизвестно"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)}>
                <TabsList className="h-7 bg-secondary/50">
                  <TabsTrigger value="chat" className="text-[11px] h-5 px-2 gap-1 data-[state=active]:bg-background">
                    <MessageCircle className="h-3 w-3" /> Чат
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-[11px] h-5 px-2 gap-1 data-[state=active]:bg-background">
                    <User className="h-3 w-3" /> Досье
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-[11px] h-5 px-2 gap-1 data-[state=active]:bg-background">
                    <FileText className="h-3 w-3" /> Заметки
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {rightTab === "chat" && (
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                  {aiMode ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">{aiMode ? "AI" : "Руч."}</span>
                  <Switch checked={aiMode} onCheckedChange={setAiMode} className="scale-[0.65]" />
                </div>
              )}
            </div>
          </div>

          {/* CHAT content */}
          {rightTab === "chat" && (
            <>
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-2.5">
                  {/* Date separator */}
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
                              : "bg-primary/12 text-foreground rounded-br-md"
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
                    <Bot className="h-2.5 w-2.5" /> AI-агент обрабатывает диалоги автоматически
                  </p>
                )}
              </div>
            </>
          )}

          {/* INFO / DOSSIER content */}
          {rightTab === "info" && (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1 border-border">
                    <Phone className="h-3 w-3" /> Звонок
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1 border-border text-[hsl(var(--status-good))]">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1 border-border">
                    <Calendar className="h-3 w-3" /> Запись
                  </Button>
                </div>

                {/* Stage */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Этап воронки</label>
                  <Select value={selectedLead.status || "Новая заявка"} onValueChange={(v) => handleStageChange(selectedLead.id, v)}>
                    <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Детали</label>
                  {[
                    { icon: DollarSign, label: "Сумма", value: (Number(selectedLead.amount) || 0) > 0 ? `${new Intl.NumberFormat("ru-RU").format(Number(selectedLead.amount))} ₸` : "—" },
                    { icon: Globe, label: "Источник", value: selectedLead.source || "—" },
                    { icon: Hash, label: "Кампания", value: selectedLead.utm_campaign || "—" },
                    { icon: Phone, label: "Телефон", value: selectedLead.phone || "—" },
                    { icon: Clock, label: "Создан", value: selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{item.label}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground/80 truncate max-w-[55%] text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* AI Analysis */}
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Анализ</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    {selectedLead.ai_summary || "AI-анализ появится после диалога с клиентом."}
                  </p>
                  {(selectedLead.ai_score ?? 0) > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreColor(selectedLead.ai_score!)}`} style={{ width: `${selectedLead.ai_score}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedLead.ai_score}%</span>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* NOTES content */}
          {rightTab === "notes" && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Добавить заметку..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-secondary/30 border-border text-sm min-h-[50px] resize-none flex-1"
                  />
                  <Button size="sm" className="self-end h-8 gap-1" onClick={addNote} disabled={!note.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-sm text-foreground/90 leading-relaxed">{n.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">{n.author}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Нет заметок</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">Выберите чат слева</p>
            <p className="text-xs text-muted-foreground/60">Все диалоги с клиентами в одном месте</p>
          </div>
        </div>
      )}
    </div>
  );
}
