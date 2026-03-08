import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, AlertTriangle, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditRecord } from "./types";

interface Props {
  audits: AuditRecord[];
  loading: boolean;
}

export default function AiRopKpiCards({ audits, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Средний балл отдела", value: "—", icon: TrendingUp },
          { label: "Проанализировано", value: "0", icon: BarChart3 },
          { label: "Главная ошибка", value: "Нет данных", icon: AlertTriangle },
          { label: "AI vs Люди", value: "—", icon: Bot },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{c.label}</p>
              <p className="text-2xl font-bold text-muted-foreground tabular-nums mt-1">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalCalls = audits.filter(a => a.interaction_type === "call").length;
  const totalChats = audits.filter(a => a.interaction_type === "whatsapp").length;
  const avgScore = Math.round(audits.reduce((s, a) => s + a.ai_score, 0) / audits.length);
  const aiAudits = audits.filter(a => a.manager_name.toLowerCase().includes("ai"));
  const aiAvg = aiAudits.length > 0 ? Math.round(aiAudits.reduce((s, a) => s + a.ai_score, 0) / aiAudits.length) : 0;
  const humanAudits = audits.filter(a => !a.manager_name.toLowerCase().includes("ai"));
  const humanAvg = humanAudits.length > 0 ? Math.round(humanAudits.reduce((s, a) => s + a.ai_score, 0) / humanAudits.length) : 0;

  const failCounts: Record<string, number> = {};
  audits.forEach(a => a.checklist.forEach(c => { if (!c.passed) failCounts[c.name] = (failCounts[c.name] || 0) + 1; }));
  const topFail = Object.entries(failCounts).sort((a, b) => b[1] - a[1])[0];
  const failPct = topFail ? Math.round((topFail[1] / audits.length) * 100) : 0;

  const scoreColor = avgScore >= 80 ? "text-[hsl(var(--status-good))]" : avgScore >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]";
  const scoreBg = avgScore >= 80 ? "bg-[hsl(var(--status-good)/0.1)]" : avgScore >= 50 ? "bg-[hsl(var(--status-warning)/0.1)]" : "bg-[hsl(var(--status-critical)/0.1)]";
  const scoreBorder = avgScore >= 80 ? "border-[hsl(var(--status-good)/0.2)]" : avgScore >= 50 ? "border-[hsl(var(--status-warning)/0.2)]" : "border-[hsl(var(--status-critical)/0.2)]";
  const scoreBadgeClass = avgScore >= 80 ? "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]" : avgScore >= 50 ? "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]" : "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)]";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className={`rounded-xl border ${scoreBorder} bg-card p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <div className={`h-8 w-8 rounded-lg ${scoreBg} flex items-center justify-center`}>
            <TrendingUp className={`h-4 w-4 ${scoreColor}`} />
          </div>
          <Badge variant="outline" className={`text-[10px] ${scoreBadgeClass}`}>
            {avgScore >= 80 ? "Хорошо" : avgScore >= 50 ? "Нужно улучшение" : "Критично"}
          </Badge>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Средний балл отдела</p>
          <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {avgScore}<span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/20">За 7 дней</Badge>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Проанализировано</p>
          <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {totalCalls + totalChats}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {totalCalls} звонков · {totalChats} чатов
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--status-critical)/0.2)] bg-card p-4 space-y-3">
        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-critical)/0.1)] flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-critical))]" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Главная ошибка</p>
          <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
            {topFail ? `«${topFail[0]}» провален в ${failPct}% аудитов` : "Нет данных"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">AI vs Люди</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">🤖 AI-Агенты</span>
              <span className="text-sm font-bold text-primary tabular-nums">{aiAvg}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${aiAvg}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">👤 Менеджеры</span>
              <span className={`text-sm font-bold tabular-nums ${humanAvg >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}`}>{humanAvg}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all ${humanAvg >= 50 ? "bg-[hsl(var(--status-warning))]" : "bg-[hsl(var(--status-critical))]"}`} style={{ width: `${humanAvg}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}