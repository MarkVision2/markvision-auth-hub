import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, PhoneCall, Clock, MessageCircle, Inbox, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import type { AuditRecord } from "./types";

interface Props { audits: AuditRecord[]; loading: boolean; }

interface ManagerStats {
  name: string; isAi: boolean; avgScore: number;
  totalCalls: number; totalChats: number; totalDurationSec: number;
  weakSpot: string; strongSpot: string;
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function scoreColor(s: number) { return s >= 80 ? "text-[hsl(var(--status-good))]" : s >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"; }
function scoreBg(s: number) { return s >= 80 ? "bg-[hsl(var(--status-good))]" : s >= 50 ? "bg-[hsl(var(--status-warning))]" : "bg-[hsl(var(--status-critical))]"; }
function scoreBadgeCls(s: number) {
  return s >= 80
    ? "bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.25)]"
    : s >= 50
    ? "bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]"
    : "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.25)]";
}
function formatTime(sec: number) {
  if (sec === 0) return "—";
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}ч ${m % 60}м` : `${m}м`;
}

export default function ManagerRating({ audits, loading }: Props) {
  const managers = useMemo(() => {
    const map = new Map<string, AuditRecord[]>();
    audits.forEach(a => {
      const list = map.get(a.manager_name) || [];
      list.push(a);
      map.set(a.manager_name, list);
    });

    const result: ManagerStats[] = [];
    map.forEach((records, name) => {
      const isAi = name.toLowerCase().includes("ai");
      const avgScore = Math.round(records.reduce((s, r) => s + r.ai_score, 0) / records.length);
      const totalCalls = records.filter(r => r.interaction_type === "call").length;
      const totalChats = records.filter(r => r.interaction_type === "whatsapp").length;
      const totalDurationSec = records.reduce((s, r) => s + r.duration_seconds, 0);

      const failCounts: Record<string, number> = {};
      const passCounts: Record<string, number> = {};
      records.forEach(r => r.checklist.forEach(c => {
        if (!c.passed) failCounts[c.name] = (failCounts[c.name] || 0) + 1;
        else passCounts[c.name] = (passCounts[c.name] || 0) + 1;
      }));
      const topFail = Object.entries(failCounts).sort((a, b) => b[1] - a[1])[0];
      const topPass = Object.entries(passCounts).sort((a, b) => b[1] - a[1])[0];

      result.push({
        name, isAi, avgScore, totalCalls, totalChats, totalDurationSec,
        weakSpot: topFail ? topFail[0] : "—",
        strongSpot: topPass ? topPass[0] : "—",
      });
    });

    return result.sort((a, b) => b.avgScore - a.avgScore);
  }, [audits]);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </div>
  );

  if (managers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-20 text-center">
        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">Нет данных о менеджерах</p>
        <p className="text-xs text-muted-foreground mt-1">Загрузите аудиты для формирования рейтинга</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {managers.map((mgr, i) => {
        const isFirst = i === 0;
        const isCritical = mgr.avgScore < 50;

        return (
          <div
            key={mgr.name}
            className={`rounded-xl border bg-card transition-colors ${
              isFirst ? "border-primary/20" : isCritical ? "border-[hsl(var(--status-critical)/0.15)]" : "border-border"
            }`}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Rank */}
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                isFirst ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {isFirst ? <Trophy className="h-4 w-4" /> : (
                  <span className="text-sm font-black tabular-nums">#{i + 1}</span>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 w-40 shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`text-xs font-bold ${mgr.isAi ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {mgr.isAi ? <Bot className="h-5 w-5" /> : getInitials(mgr.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{mgr.name}</p>
                  {mgr.isAi && <span className="text-[10px] text-primary font-medium">AI Agent</span>}
                </div>
              </div>

              {/* Score bar */}
              <div className="w-32 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Балл</span>
                  <Badge variant="outline" className={`text-xs font-bold tabular-nums font-mono border ${scoreBadgeCls(mgr.avgScore)}`}>{mgr.avgScore}</Badge>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${scoreBg(mgr.avgScore)}`} style={{ width: `${mgr.avgScore}%` }} />
                </div>
              </div>

              {/* Stats chips */}
              <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
                <Chip icon={<PhoneCall className="h-3 w-3" />} label="Звонки" value={String(mgr.totalCalls)} />
                <Chip icon={<MessageCircle className="h-3 w-3" />} label="Чаты" value={String(mgr.totalChats)} />
                <Chip icon={<Clock className="h-3 w-3" />} label="Время" value={formatTime(mgr.totalDurationSec)} />
              </div>

              {/* Weak / Strong spots */}
              <div className="hidden xl:grid grid-cols-2 gap-2 w-64 shrink-0">
                <div className="rounded-lg bg-[hsl(var(--status-critical)/0.04)] border border-[hsl(var(--status-critical)/0.1)] px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingDown className="h-2.5 w-2.5 text-[hsl(var(--status-critical)/0.6)]" />
                    <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--status-critical)/0.6)] font-semibold">Слабое</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 truncate">{mgr.weakSpot}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--status-good)/0.04)] border border-[hsl(var(--status-good)/0.1)] px-2.5 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className="h-2.5 w-2.5 text-[hsl(var(--status-good)/0.6)]" />
                    <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--status-good)/0.6)] font-semibold">Сильное</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 truncate">{mgr.strongSpot}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-secondary/50">
      {icon}
      <span className="text-xs font-bold tabular-nums font-mono text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
