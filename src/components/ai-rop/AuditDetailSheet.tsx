import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bot, User, CheckCircle2, XCircle, AlertTriangle, Play, Volume2, PhoneCall, MessageCircle, Shield } from "lucide-react";
import type { AuditRecord } from "./types";

interface Props {
  item: AuditRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isAiAgent(name: string) { return name.toLowerCase().includes("ai") || name.toLowerCase().includes("аи"); }
function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function formatDuration(seconds: number) {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreStyle(score: number) {
  if (score >= 80) return { color: "text-[hsl(var(--status-good))]", bg: "bg-[hsl(var(--status-good)/0.08)]", border: "border-[hsl(var(--status-good)/0.2)]", glow: "shadow-[0_0_20px_hsl(var(--status-good)/0.15)]" };
  if (score >= 50) return { color: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning)/0.08)]", border: "border-[hsl(var(--status-warning)/0.2)]", glow: "shadow-[0_0_20px_hsl(var(--status-warning)/0.15)]" };
  return { color: "text-[hsl(var(--status-critical))]", bg: "bg-[hsl(var(--status-critical)/0.08)]", border: "border-[hsl(var(--status-critical)/0.2)]", glow: "shadow-[0_0_20px_hsl(var(--status-critical)/0.15)]" };
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
  const passPct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const ss = scoreStyle(item.ai_score);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-5xl !w-[90vw] p-0 bg-background border-border flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className={`text-sm font-bold ${
                  ai ? "bg-primary/10 text-primary" : item.ai_score < 50 ? "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"
                }`}>
                  {ai ? <Bot className="h-5 w-5" /> : initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">{item.manager_name}</SheetTitle>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {item.interaction_type === "call" ? (
                    <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" />Звонок · {formatDuration(item.duration_seconds)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[hsl(var(--status-good))]"><MessageCircle className="h-3 w-3" />WhatsApp · {item.transcript.length} сообщ.</span>
                  )}
                  <span className="text-border">·</span>
                  <span>Чек-лист: {passedCount}/{totalCount}</span>
                </div>
              </div>
            </div>
            <div className={`rounded-xl border-2 px-5 py-2.5 ${ss.bg} ${ss.border} ${ss.glow}`}>
              <span className={`text-2xl font-black tabular-nums font-mono ${ss.color}`}>{item.ai_score}</span>
              <span className="text-sm text-muted-foreground ml-0.5">/ 100</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Verdict & Checklist */}
          <div className="w-[40%] border-r border-border overflow-y-auto">
            {/* AI Verdict */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.12em]">AI Вердикт</span>
              </div>
              <p className={`text-lg font-bold ${ss.color}`}>{verdictText(item.ai_score)}</p>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{item.ai_summary}</p>

              {/* Pass rate mini bar */}
              <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Пройдено этапов</span>
                  <span className="text-xs font-bold tabular-nums font-mono text-foreground">{passedCount}/{totalCount}</span>
                </div>
                <Progress value={passPct} className="h-1.5 bg-secondary" />
              </div>
            </div>

            {/* Script Checklist */}
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-4">Чек-лист скрипта продажи</p>
              <div className="space-y-2.5">
                {item.checklist.map((check, i) => (
                  <div key={i} className={`rounded-xl border p-3.5 transition-colors ${
                    check.passed
                      ? "border-[hsl(var(--status-good)/0.15)] bg-[hsl(var(--status-good)/0.02)]"
                      : "border-[hsl(var(--status-critical)/0.15)] bg-[hsl(var(--status-critical)/0.02)]"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {check.passed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-[hsl(var(--status-good))] shrink-0" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-[hsl(var(--status-critical))] shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground flex-1">{check.name}</span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${
                        check.passed
                          ? "border-[hsl(var(--status-good)/0.2)] text-[hsl(var(--status-good))] bg-[hsl(var(--status-good)/0.08)]"
                          : "border-[hsl(var(--status-critical)/0.2)] text-[hsl(var(--status-critical))] bg-[hsl(var(--status-critical)/0.08)]"
                      }`}>
                        {check.passed ? "✓" : "✗"}
                      </Badge>
                    </div>
                    {check.comment && (
                      <p className={`text-xs mt-2 pl-7 leading-relaxed ${
                        check.passed ? "text-muted-foreground" : "text-[hsl(var(--status-critical)/0.8)]"
                      }`}>
                        {check.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Transcript & Audio */}
          <div className="w-[60%] flex flex-col overflow-hidden">
            {/* Audio Player (calls only) */}
            {item.interaction_type === "call" && (
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3 border border-border">
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full border-primary/25 text-primary hover:bg-primary/10 shrink-0">
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                  <div className="flex-1 flex items-center gap-[2px] h-8">
                    {Array.from({ length: 60 }).map((_, idx) => {
                      const h = 15 + Math.sin(idx * 0.3) * 35 + ((idx * 7 + 13) % 30);
                      const isPlayed = idx < 18;
                      return (
                        <div
                          key={idx}
                          className={`w-[2px] rounded-full transition-colors ${isPlayed ? "bg-primary" : "bg-muted-foreground/15"}`}
                          style={{ height: `${Math.min(100, Math.max(12, h))}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums font-mono shrink-0">0:00 / {formatDuration(item.duration_seconds)}</span>
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-4">
                {item.interaction_type === "call" ? "📞 Транскрипция звонка" : "💬 Переписка WhatsApp"}
              </p>
              <div className="space-y-2.5">
                {item.transcript.map((msg, i) => {
                  const isClient = msg.speaker === "client";
                  const isMistake = msg.is_mistake;

                  return (
                    <div key={i} className="relative">
                      <div className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                        <div className="flex items-end gap-2 max-w-[80%]">
                          {isClient && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="bg-secondary text-muted-foreground text-[8px] font-bold">КЛ</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isClient
                              ? "bg-secondary text-foreground rounded-bl-md"
                              : isMistake
                              ? "bg-[hsl(var(--status-critical)/0.08)] text-foreground rounded-br-md border border-[hsl(var(--status-critical)/0.25)]"
                              : ai
                              ? "bg-primary/8 text-foreground rounded-br-md border border-primary/15"
                              : "bg-primary/6 text-foreground rounded-br-md"
                          }`}>
                            <p>{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${
                              isClient ? "text-muted-foreground/30" : isMistake ? "text-[hsl(var(--status-critical)/0.4)]" : "text-primary/30"
                            }`}>
                              {msg.speaker === "manager" && !ai && <User className="h-2.5 w-2.5" />}
                              {ai && msg.speaker !== "client" && <Bot className="h-2.5 w-2.5" />}
                              <span className="text-[10px]">{isClient ? "Клиент" : item.manager_name.split(" ").pop()}</span>
                            </div>
                          </div>
                          {!isClient && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className={`text-[8px] font-bold ${
                                isMistake ? "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]"
                                : ai ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                              }`}>
                                {ai ? <Bot className="h-3 w-3" /> : initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>

                      {/* AI Error */}
                      {isMistake && msg.ai_comment && (
                        <div className="flex justify-end mt-1.5 mr-8">
                          <div className="flex items-start gap-2 bg-[hsl(var(--status-critical)/0.04)] border border-[hsl(var(--status-critical)/0.15)] rounded-xl px-3.5 py-2.5 max-w-[76%]">
                            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--status-critical))] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] font-bold text-[hsl(var(--status-critical))] uppercase tracking-wider mb-0.5">AI-комментарий</p>
                              <p className="text-xs text-[hsl(var(--status-critical)/0.8)] leading-relaxed">{msg.ai_comment}</p>
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
