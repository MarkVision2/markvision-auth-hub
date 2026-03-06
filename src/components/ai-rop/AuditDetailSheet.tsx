import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Bot, User, CheckCircle2, XCircle, AlertTriangle, Play, Volume2 } from "lucide-react";
import type { AuditItem } from "./AuditCallsTable";

interface Props {
  item: AuditItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getScoreColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { text: "text-[hsl(var(--status-good))]", bar: "bg-[hsl(var(--status-good))]", icon: CheckCircle2, iconColor: "text-[hsl(var(--status-good))]" };
  if (pct >= 50) return { text: "text-[hsl(var(--status-warning))]", bar: "bg-[hsl(var(--status-warning))]", icon: AlertTriangle, iconColor: "text-[hsl(var(--status-warning))]" };
  return { text: "text-[hsl(var(--status-critical))]", bar: "bg-[hsl(var(--status-critical))]", icon: XCircle, iconColor: "text-[hsl(var(--status-critical))]" };
}

function overallScoreBadge(score: number) {
  if (score >= 80) return "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.3)] shadow-[0_0_12px_hsl(var(--status-good)/0.25)]";
  if (score >= 50) return "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)] shadow-[0_0_12px_hsl(var(--status-warning)/0.25)]";
  return "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.3)] shadow-[0_0_12px_hsl(var(--status-critical)/0.25)]";
}

export default function AuditDetailSheet({ item, open, onOpenChange }: Props) {
  if (!item) return null;

  const initials = item.managerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-5xl !w-[90vw] p-0 bg-background border-border flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={`text-sm font-bold ${item.isAi ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {item.isAi ? <Bot className="h-5 w-5" /> : initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">{item.managerName} → {item.leadName}</SheetTitle>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{item.date} {item.time}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{item.type === "call" ? "Звонок" : "Чат"} · {item.duration}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={`text-lg font-bold px-4 py-1.5 border ${overallScoreBadge(item.score)}`}>
              {item.score}/100
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Verdict & Checklist */}
          <div className="w-[40%] border-r border-border overflow-y-auto">
            {/* Verdict */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Вердикт</span>
              </div>
              <p className={`text-sm font-semibold ${item.score >= 80 ? "text-[hsl(var(--status-good))]" : item.score >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}`}>
                {item.verdict}
              </p>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{item.summary}</p>
            </div>

            {/* Script Checklist */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-4">Чек-лист скрипта</p>
              <div className="space-y-4">
                {item.checklist.map((check, i) => {
                  const color = getScoreColor(check.score, check.max);
                  const Icon = color.icon;
                  const pct = (check.score / check.max) * 100;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color.iconColor}`} />
                          <span className="text-sm text-foreground">{check.label}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${color.text}`}>{check.score}/{check.max}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${color.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      {check.comment && (
                        <p className={`text-xs ${check.score / check.max < 0.5 ? "text-[hsl(var(--status-critical)/0.8)]" : "text-muted-foreground"} pl-6`}>
                          {check.score / check.max < 0.5 ? "⚠️ " : "💡 "}{check.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Transcript & Audio */}
          <div className="w-[60%] flex flex-col overflow-hidden">
            {/* Mock Audio Player (only for calls) */}
            {item.type === "call" && (
              <div className="px-5 py-3 border-b border-border">
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full border-primary/30 text-primary hover:bg-primary/10">
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                  {/* Waveform mock */}
                  <div className="flex-1 flex items-center gap-[2px] h-8">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const h = Math.random() * 100;
                      const isPlayed = i < 20;
                      return (
                        <div
                          key={i}
                          className={`w-[2px] rounded-full transition-colors ${isPlayed ? "bg-primary" : "bg-muted-foreground/30"}`}
                          style={{ height: `${Math.max(12, h)}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">1:12 / {item.duration}</span>
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                {item.type === "call" ? "Транскрипция звонка" : "Переписка"}
              </p>

              {item.transcript.map((msg, i) => {
                const isClient = msg.from === "client";
                const isError = msg.isError;
                return (
                  <div key={i} className="relative">
                    <div className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                      <div className="flex items-end gap-1.5 max-w-[80%]">
                        {isClient && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="bg-secondary text-muted-foreground text-[9px]">
                              {item.leadName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isClient
                              ? "bg-secondary text-foreground rounded-bl-md"
                              : isError
                              ? "bg-[hsl(var(--status-critical)/0.12)] text-foreground rounded-br-md border border-[hsl(var(--status-critical)/0.3)] ring-1 ring-[hsl(var(--status-critical)/0.15)]"
                              : "bg-primary/10 text-foreground rounded-br-md"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isClient ? "text-muted-foreground/40" : isError ? "text-[hsl(var(--status-critical)/0.5)]" : "text-primary/40"}`}>
                            {msg.from === "ai" && <Bot className="h-2.5 w-2.5" />}
                            {msg.from === "manager" && <User className="h-2.5 w-2.5" />}
                            <span className="text-[10px]">{msg.time}</span>
                          </div>
                        </div>
                        {(msg.from === "ai" || msg.from === "manager") && !isClient && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className={`text-[9px] font-bold ${msg.from === "ai" ? "bg-primary/15 text-primary" : isError ? "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"}`}>
                              {msg.from === "ai" ? <Bot className="h-3 w-3" /> : initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                    {/* Error tooltip */}
                    {isError && msg.errorComment && (
                      <div className="flex justify-end mt-1.5 mr-8">
                        <div className="flex items-start gap-1.5 bg-[hsl(var(--status-critical)/0.08)] border border-[hsl(var(--status-critical)/0.2)] rounded-lg px-3 py-2 max-w-[75%]">
                          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--status-critical))] shrink-0 mt-0.5" />
                          <p className="text-xs text-[hsl(var(--status-critical)/0.9)] leading-relaxed">{msg.errorComment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
