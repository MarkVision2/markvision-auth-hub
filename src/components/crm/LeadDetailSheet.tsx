import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Brain, Send, MessageCircle, Bot, User, Phone, Calendar,
  MapPin, DollarSign, ExternalLink, Clock, FileText, Plus,
  Copy, ChevronRight, Sparkles, Globe, Hash,
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

const MOCK_MESSAGES = [
  { id: 1, from: "client", text: "Здравствуйте! Хочу узнать про имплантацию, сколько стоит?", time: "14:20", date: "Сегодня" },
  { id: 2, from: "ai", text: "Добрый день! Стоимость имплантации зуба от 180 000 ₸. Включает: имплант, абатмент и коронку. Подскажите, какой зуб вас беспокоит?", time: "14:21", date: "Сегодня" },
  { id: 3, from: "client", text: "Жевательный нижний. А есть рассрочка?", time: "14:23", date: "Сегодня" },
  { id: 4, from: "ai", text: "Да, рассрочка до 12 месяцев без %. Для жевательного зуба рекомендуем Osstem или Straumann. Хотите записаться на бесплатную консультацию к хирургу?", time: "14:24", date: "Сегодня" },
  { id: 5, from: "client", text: "Да, давайте на эту неделю, в четверг", time: "14:26", date: "Сегодня" },
  { id: 6, from: "ai", text: "Отлично! Записала вас на четверг 13:00 к доктору Алиеву. Адрес: ул. Абая 150, 2 этаж. Я напомню вам за день до визита 😊", time: "14:27", date: "Сегодня" },
];

const MOCK_ACTIVITY = [
  { time: "14:27", action: "AI записал на приём", detail: "Четверг, 13:00 — доктор Алиев", type: "ai" as const },
  { time: "14:21", action: "AI начал диалог", detail: "Автоответ через 12 сек", type: "ai" as const },
  { time: "14:20", action: "Новая заявка", detail: "WhatsApp → Имплантация_Алматы", type: "system" as const },
  { time: "10:15", action: "Создан лид", detail: "Источник: Meta Ads", type: "system" as const },
];

const MOCK_NOTES = [
  { id: 1, text: "Интересует имплантация жевательного зуба, нижняя челюсть. Хочет рассрочку.", author: "AI", time: "14:27" },
];

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
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export default function LeadDetailSheet({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailSheetProps) {
  const [stage, setStage] = useState("");
  const [aiMode, setAiMode] = useState(true);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [rightTab, setRightTab] = useState<"chat" | "activity" | "notes">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lead) setStage(lead.status || "Новая заявка");
  }, [lead]);

  useEffect(() => {
    if (open && rightTab === "chat") {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, rightTab]);

  if (!lead) return null;

  const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const amount = Number(lead.amount) || 0;
  const score = lead.ai_score ?? 0;
  const scoreBadge = getScoreLabel(score);

  const handleStageChange = async (newStage: string) => {
    setStage(newStage);
    const { error } = await (supabase as any)
      .from("leads").update({ status: newStage }).eq("id", lead.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Статус обновлён", description: `${lead.name} → ${newStage}` });
    onLeadUpdated?.();
  };

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      toast({ title: "Скопировано", description: lead.phone });
    }
  };

  const addNote = () => {
    if (!note.trim()) return;
    setNotes((prev) => [{ id: Date.now(), text: note.trim(), author: "Вы", time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setNote("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-5xl !w-[85vw] p-0 bg-background border-border flex flex-col">
        {/* Top bar with key info */}
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
          {/* LEFT — Досье клиента */}
          <div className="w-[35%] border-r border-border overflow-y-auto">
            {/* Quick actions */}
            <div className="px-5 py-3 border-b border-border">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1" onClick={() => toast({ title: "Звонок", description: lead.phone || "Нет номера" })}>
                  <Phone className="h-3 w-3" /> Звонок
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1 text-[hsl(var(--status-good))]" onClick={() => toast({ title: "WhatsApp", description: "Открыть чат" })}>
                  <MessageCircle className="h-3 w-3" /> WA
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-border h-8 gap-1" onClick={() => toast({ title: "Запись", description: "Открыть календарь" })}>
                  <Calendar className="h-3 w-3" /> Запись
                </Button>
              </div>
            </div>

            {/* Status select */}
            <div className="px-5 py-3 border-b border-border">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Этап воронки</label>
              <Select value={stage} onValueChange={handleStageChange}>
                <SelectTrigger className="mt-1.5 bg-secondary/50 border-border text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deal details */}
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

            {/* AI Analysis block */}
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

          {/* RIGHT — Chat / Activity / Notes */}
          <div className="w-[65%] flex flex-col">
            {/* Tab header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-border">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)}>
                <TabsList className="h-8 bg-secondary/50">
                  <TabsTrigger value="chat" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <MessageCircle className="h-3 w-3" /> Чат
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <Clock className="h-3 w-3" /> Активность
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs h-6 gap-1 data-[state=active]:bg-background">
                    <FileText className="h-3 w-3" /> Заметки
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {rightTab === "chat" && (
                <div className="flex items-center gap-2">
                  {aiMode ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">{aiMode ? "AI-Агент" : "Ручной"}</span>
                  <Switch checked={aiMode} onCheckedChange={setAiMode} className="scale-75" />
                </div>
              )}
            </div>

            {/* CHAT TAB */}
            {rightTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Date separator */}
                  <div className="flex items-center gap-3 py-1">
                    <Separator className="flex-1" />
                    <span className="text-[10px] text-muted-foreground font-medium">Сегодня</span>
                    <Separator className="flex-1" />
                  </div>

                  {MOCK_MESSAGES.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-start" : "justify-end"}`}>
                      <div className="flex items-end gap-1.5 max-w-[78%]">
                        {msg.from === "client" && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="bg-secondary text-muted-foreground text-[9px]">{initials}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.from === "client"
                              ? "bg-secondary text-foreground rounded-bl-md"
                              : "bg-primary/15 text-foreground rounded-br-md"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${msg.from === "client" ? "text-muted-foreground/50" : "text-primary/40"}`}>
                            {msg.from === "ai" && <Bot className="h-2.5 w-2.5" />}
                            <span className="text-[10px]">{msg.time}</span>
                          </div>
                        </div>
                        {msg.from === "ai" && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="bg-primary/15 text-primary text-[9px]"><Bot className="h-3 w-3" /></AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="px-5 py-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder={aiMode ? "AI отвечает автоматически..." : "Написать сообщение..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={aiMode}
                      className="bg-secondary/50 border-border text-sm flex-1 h-9"
                      onKeyDown={(e) => e.key === "Enter" && !aiMode && toast({ title: "Сообщение", description: "Функция в разработке" })}
                    />
                    <Button size="sm" className="shrink-0 gap-1.5 h-9" disabled={aiMode || !message.trim()}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {aiMode && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Bot className="h-2.5 w-2.5" /> AI-агент обрабатывает этот диалог автоматически
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ACTIVITY TAB */}
            {rightTab === "activity" && (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {MOCK_ACTIVITY.map((event, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div className={`h-3.5 w-3.5 rounded-full shrink-0 mt-0.5 z-10 ${event.type === "ai" ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{event.action}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">{event.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {rightTab === "notes" && (
              <div className="flex-1 flex flex-col">
                <div className="px-5 py-3 border-b border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Добавить заметку..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="bg-secondary/50 border-border text-sm min-h-[60px] resize-none flex-1"
                    />
                    <Button size="sm" className="self-end h-8 gap-1" onClick={addNote} disabled={!note.trim()}>
                      <Plus className="h-3.5 w-3.5" /> Добавить
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-sm text-foreground/90 leading-relaxed">{n.text}</p>
                      <div className="flex items-center gap-2 mt-2">
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
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
