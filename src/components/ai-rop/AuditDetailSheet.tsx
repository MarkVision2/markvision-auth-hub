import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, User, CheckCircle2, XCircle, AlertTriangle, Play, Volume2, PhoneCall, MessageCircle } from "lucide-react";
import type { AuditRecord } from "./types";

interface Props {
  item: AuditRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isAiAgent(name: string) {
  return name.toLowerCase().includes("ai") || name.toLowerCase().includes("аи");
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDuration(seconds: number) {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function overallScoreClass(score: number) {
  if (score >= 80) return "bg-[hsl(var(--status-good)/0.12)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.3)] shadow-[0_0_16px_hsl(var(--status-good)/0.3)]";
  if (score >= 50) return "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)] shadow-[0_0_16px_hsl(var(--status-warning)/0.3)]";
  return "bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.3)] shadow-[0_0_16px_hsl(var(--status-critical)/0.3)]";
}

function verdictText(score: number) {
  if (score >= 90) return "Эталонный";
  if (score >= 80) return "Хорошо";
  if (score >= 50) return "Средне";
  return "Слив лида";
}

export default function AuditDetailSheet({ item, open, onOpenChange }: Props) {
  if (!item) return null;

  const ai = isAiAgent(item.manager_name);
  const initials = getInitials(item.manager_name);
  const passedCount = item.checklist.filter(c => c.passed).length;
  const totalCount = item.checklist.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-5xl !w-[90vw] p-0 bg-background border-border flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className={`text-sm font-bold ${ai ? "bg-primary/15 text-primary" : item.ai_score < 50 ? "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"}`}>
                  {ai ? <Bot className="h-5 w-5" /> : initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">{item.manager_name}</SheetTitle>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {item.interaction_type === "call" ? (
                    <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" /> Звонок · {formatDuration(item.duration_seconds)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[hsl(var(--status-good))]"><MessageCircle className="h-3 w-3" /> WhatsApp</span>
                  )}
                  <span className="text-muted-foreground/30">·</span>
                  <span>Чек-лист: {passedCount}/{totalCount}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={`text-xl font-black px-5 py-2 border-2 tabular-nums ${overallScoreClass(item.ai_score)}`}>
              {item.ai_score}/100
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Verdict & Checklist */}
          <div className="w-[40%] border-r border-border overflow-y-auto">
            {/* AI Verdict */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">AI Вердикт</span>
              </div>
              <p className={`text-lg font-bold ${item.ai_score >= 80 ? "text-[hsl(var(--status-good))]" : item.ai_score >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}`}>
                {verdictText(item.ai_score)}
              </p>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{item.ai_summary}</p>
            </div>

            {/* Script Checklist */}
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-5">Чек-лист скрипта продажи</p>
              <div className="space-y-4">
                {item.checklist.map((check, i) => (
                  <div key={i} className={`rounded-xl border p-4 transition-colors ${
                    check.passed
                      ? "border-[hsl(var(--status-good)/0.2)] bg-[hsl(var(--status-good)/0.03)]"
                      : "border-[hsl(var(--status-critical)/0.2)] bg-[hsl(var(--status-critical)/0.03)]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {check.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-good))]" />
                        ) : (
                          <XCircle className="h-5 w-5 text-[hsl(var(--status-critical))]" />
                        )}
                        <span className="text-sm font-medium text-foreground">{check.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] border ${
                        check.passed
                          ? "border-[hsl(var(--status-good)/0.3)] text-[hsl(var(--status-good))] bg-[hsl(var(--status-good)/0.1)]"
                          : "border-[hsl(var(--status-critical)/0.3)] text-[hsl(var(--status-critical))] bg-[hsl(var(--status-critical)/0.1)]"
                      }`}>
                        {check.passed ? "Пройден" : "Провал"}
                      </Badge>
                    </div>
                    {check.comment && (
                      <p className={`text-xs mt-2.5 pl-[30px] leading-relaxed ${
                        check.passed ? "text-muted-foreground" : "text-[hsl(var(--status-critical)/0.85)]"
                      }`}>
                        {check.passed ? "💡 " : "⚠️ "}{check.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Transcript & Audio */}
          <div className="w-[60%] flex flex-col overflow-hidden">
            {/* Mock Audio Player (calls only) */}
            {item.interaction_type === "call" && (
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3 border border-border">
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-full border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 shrink-0">
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                  {/* Waveform */}
                  <div className="flex-1 flex items-center gap-[2px] h-9">
                    {Array.from({ length: 70 }).map((_, idx) => {
                      // Deterministic pseudo-random based on index
                      const h = 15 + Math.sin(idx * 0.3) * 35 + ((idx * 7 + 13) % 30);
                      const isPlayed = idx < 22;
                      return (
                        <div
                          key={idx}
                          className={`w-[2px] rounded-full transition-colors ${isPlayed ? "bg-primary" : "bg-muted-foreground/20"}`}
                          style={{ height: `${Math.min(100, Math.max(10, h))}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-mono">0:48 / {formatDuration(item.duration_seconds)}</span>
                  <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                {item.interaction_type === "call" ? "📞 Транскрипция звонка" : "💬 Переписка WhatsApp"}
              </p>

              <div className="space-y-3">
                {item.transcript.map((msg, i) => {
                  const isClient = msg.speaker === "client";
                  const isMistake = msg.is_mistake;

                  return (
                    <div key={i} className="relative">
                      <div className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                        <div className="flex items-end gap-2 max-w-[82%]">
                          {isClient && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-secondary text-muted-foreground text-[9px] font-bold">КЛ</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isClient
                                ? "bg-secondary text-foreground rounded-bl-md"
                                : isMistake
                                ? "bg-[hsl(var(--status-critical)/0.1)] text-foreground rounded-br-md border-2 border-[hsl(var(--status-critical)/0.35)] ring-2 ring-[hsl(var(--status-critical)/0.08)]"
                                : ai
                                ? "bg-primary/10 text-foreground rounded-br-md border border-primary/20"
                                : "bg-primary/8 text-foreground rounded-br-md"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1.5 ${isClient ? "text-muted-foreground/40" : isMistake ? "text-[hsl(var(--status-critical)/0.5)]" : "text-primary/40"}`}>
                              {msg.speaker === "manager" && !ai && <User className="h-2.5 w-2.5" />}
                              {ai && msg.speaker !== "client" && <Bot className="h-2.5 w-2.5" />}
                              <span className="text-[10px]">{isClient ? "Клиент" : item.manager_name.split(" ").pop()}</span>
                            </div>
                          </div>
                          {!isClient && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className={`text-[9px] font-bold ${
                                isMistake
                                  ? "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))]"
                                  : ai
                                  ? "bg-primary/15 text-primary"
                                  : "bg-secondary text-muted-foreground"
                              }`}>
                                {ai ? <Bot className="h-3.5 w-3.5" /> : initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>

                      {/* AI Error Comment */}
                      {isMistake && msg.ai_comment && (
                        <div className="flex justify-end mt-2 mr-9">
                          <div className="flex items-start gap-2 bg-[hsl(var(--status-critical)/0.06)] border border-[hsl(var(--status-critical)/0.2)] rounded-xl px-4 py-3 max-w-[78%]">
                            <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-critical))] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-[hsl(var(--status-critical))] uppercase tracking-wider mb-0.5">AI-комментарий</p>
                              <p className="text-xs text-[hsl(var(--status-critical)/0.85)] leading-relaxed">{msg.ai_comment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
