import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, BarChart3, AlertTriangle, Bot, PhoneCall, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditRecord } from "./types";

interface Props { audits: AuditRecord[]; loading: boolean; }

function KpiCard({ icon: Icon, iconClass, borderClass, label, children }: {
  icon: React.ElementType; iconClass: string; borderClass?: string; label: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 space-y-3 ${borderClass || "border-border"}`}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function AiRopKpiCards({ audits, loading }: Props) {
  const stats = useMemo(() => {
    if (audits.length === 0) return null;
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

    return { totalCalls, totalChats, avgScore, aiAvg, humanAvg, topFail, failPct };
  }, [audits]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  const scoreColor = (s: number) => s >= 80 ? "text-[hsl(var(--status-good))]" : s >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]";
  const scoreBg = (s: number) => s >= 80 ? "bg-[hsl(var(--status-good))]" : s >= 50 ? "bg-[hsl(var(--status-warning))]" : "bg-[hsl(var(--status-critical))]";
  const scoreBorder = (s: number) => s >= 80 ? "border-[hsl(var(--status-good)/0.2)]" : s >= 50 ? "border-[hsl(var(--status-warning)/0.2)]" : "border-[hsl(var(--status-critical)/0.2)]";
  const scoreLabel = (s: number) => s >= 80 ? "Хорошо" : s >= 50 ? "Средне" : "Критично";
  const scoreBadge = (s: number) => s >= 80
    ? "bg-[hsl(var(--status-good)/0.12)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.25)]"
    : s >= 50
    ? "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]"
    : "bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.25)]";

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Средний балл", value: "—", icon: TrendingUp },
          { label: "Проанализировано", value: "0", icon: BarChart3 },
          { label: "Главная ошибка", value: "Нет данных", icon: AlertTriangle },
          { label: "AI vs Менеджеры", value: "—", icon: Bot },
        ].map(c => (
          <KpiCard key={c.label} icon={c.icon} iconClass="text-muted-foreground" label={c.label}>
            <p className="text-2xl font-bold text-muted-foreground/40 tabular-nums font-mono">{c.value}</p>
          </KpiCard>
        ))}
      </div>
    );
  }

  const { totalCalls, totalChats, avgScore, aiAvg, humanAvg, topFail, failPct } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Avg Score */}
      <KpiCard icon={TrendingUp} iconClass={scoreColor(avgScore)} borderClass={scoreBorder(avgScore)} label="Средний балл отдела">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold tabular-nums font-mono text-foreground">
            {avgScore}<span className="text-sm font-normal text-muted-foreground ml-0.5">/ 100</span>
          </p>
          <Badge variant="outline" className={`text-[10px] font-semibold ${scoreBadge(avgScore)}`}>{scoreLabel(avgScore)}</Badge>
        </div>
        <Progress value={avgScore} className="h-1.5 bg-secondary" />
      </KpiCard>

      {/* Analyzed */}
      <KpiCard icon={BarChart3} iconClass="text-primary" label="Проанализировано">
        <p className="text-2xl font-bold tabular-nums font-mono text-foreground">{totalCalls + totalChats}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" />{totalCalls} звонков</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{totalChats} чатов</span>
        </div>
      </KpiCard>

      {/* Top Fail */}
      <KpiCard icon={AlertTriangle} iconClass="text-[hsl(var(--status-critical))]" borderClass="border-[hsl(var(--status-critical)/0.15)]" label="Главная ошибка">
        {topFail ? (
          <>
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">«{topFail[0]}»</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Провален в</span>
              <span className="font-bold tabular-nums text-[hsl(var(--status-critical))]">{failPct}% аудитов</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        )}
      </KpiCard>

      {/* AI vs Human */}
      <KpiCard icon={Bot} iconClass="text-primary" label="AI vs Менеджеры">
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-medium">🤖 AI-агенты</span>
              <span className="text-xs font-bold tabular-nums text-primary font-mono">{aiAvg}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${aiAvg}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-medium">👤 Менеджеры</span>
              <span className={`text-xs font-bold tabular-nums font-mono ${scoreColor(humanAvg)}`}>{humanAvg}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${scoreBg(humanAvg)}`} style={{ width: `${humanAvg}%` }} />
            </div>
          </div>
        </div>
      </KpiCard>
    </div>
  );
}
