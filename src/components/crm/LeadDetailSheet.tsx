import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Brain, Send, MessageCircle, Bot, User } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  amount: number;
  quality: "hot" | "warm" | "cold";
  qualityScore: number;
  source: "whatsapp" | "instagram";
  date: string;
}

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_MESSAGES = [
  { id: 1, from: "client", text: "Здравствуйте! Хочу узнать про брекеты, сколько стоит?", time: "14:20" },
  { id: 2, from: "ai", text: "Добрый день! Стоимость брекет-системы от 150 000 ₸. Подскажите, вас интересуют металлические или керамические?", time: "14:21" },
  { id: 3, from: "client", text: "Керамические. А есть рассрочка?", time: "14:23" },
  { id: 4, from: "ai", text: "Да, у нас есть рассрочка на 12 месяцев без переплат. Хотите записаться на бесплатную консультацию?", time: "14:24" },
  { id: 5, from: "client", text: "Да, давайте на эту неделю", time: "14:26" },
];

const STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

export default function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const [stage, setStage] = useState("В работе");
  const [aiMode, setAiMode] = useState(true);
  const [message, setMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  if (!lead) return null;

  const initials = lead.name.split(" ").map((w) => w[0]).join("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-4xl !w-3/4 p-0 bg-[#0a0a0a] border-white/[0.06] flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/[0.06]">
          <SheetTitle className="text-foreground">Карточка клиента</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN — Dossier */}
          <div className="w-[40%] border-r border-white/[0.06] p-5 overflow-y-auto space-y-5">
            {/* Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Статус</label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="bg-secondary border-white/[0.06] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stage === "Отказ" && (
                <Input
                  placeholder="Укажите причину отказа..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-secondary border-white/[0.06] text-sm mt-2"
                />
              )}
            </div>

            {/* Deal info */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">Детали сделки</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Сумма", value: `${lead.amount.toLocaleString("ru-RU")} ₸` },
                  { label: "Источник", value: lead.source === "whatsapp" ? "WhatsApp" : "Instagram" },
                  { label: "UTM Source", value: "instagram_ads" },
                  { label: "Дата", value: new Date(lead.date).toLocaleDateString("ru-RU") },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/50 rounded-md px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Анализ качества</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Лид заинтересован в брекетах, высокая вероятность визита. Рекомендуется предложить рассрочку на 12 месяцев.
              </p>
              <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]">
                🔥 Горячий ({lead.qualityScore}%)
              </Badge>
            </div>

            {/* Manager */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Ответственный менеджер</label>
              <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-accent">АК</AvatarFallback>
                </Avatar>
                <span className="text-xs text-foreground">Анна Кузнецова</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Chat */}
          <div className="w-[60%] flex flex-col">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">История диалога (WhatsApp)</span>
              </div>
              <div className="flex items-center gap-2">
                {aiMode ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">{aiMode ? "🤖 AI-Агент" : "👤 Ручной"}</span>
                <Switch checked={aiMode} onCheckedChange={setAiMode} className="scale-75" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.from === "client"
                        ? "bg-secondary text-foreground rounded-bl-sm"
                        : "bg-primary/15 text-foreground rounded-br-sm"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.from === "client" ? "text-muted-foreground" : "text-primary/60"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <Input
                  placeholder="Написать сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-secondary border-white/[0.06] text-sm flex-1"
                />
                <Button size="sm" className="shrink-0 gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
