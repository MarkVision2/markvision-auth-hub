import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, TrendingUp, Minus, PhoneCall, Clock, Star, MessageCircle, Inbox } from "lucide-react";
import type { AuditRecord } from "./types";

interface Props { audits: AuditRecord[]; loading: boolean; }

interface ManagerStats {
  name: string;
  isAi: boolean;
  avgScore: number;
  totalCalls: number;
  totalChats: number;
  totalDurationSec: number;
  weakSpot: string;
  strongSpot: string;
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function scoreColor(score: number) {
  if (score >= 80) return { text: "text-[hsl(var(--status-good))]", bg: "bg-[hsl(var(--status-good))]", badge: "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.3)]" };
  if (score >= 50) return { text: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning))]", badge: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)]" };
  return { text: "text-[hsl(var(--status-critical))]", bg: "bg-[hsl(var(--status-critical))]", badge: "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.3)]" };
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

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  if (managers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-semibold text-foreground">Нет данных о менеджерах</p>
        <p className="text-xs text-muted-foreground mt-1">Загрузите аудиты для формирования рейтинга</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {managers.map((mgr, i) => {
        const color = scoreColor(mgr.avgScore);
        return (
          <div key={mgr.name} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <span className={`text-2xl font-black tabular-nums shrink-0 ${i === 0 ? "text-primary" : "text-muted-foreground/60"}`}>#{i + 1}</span>
              <div className="flex items-center gap-3 w-44 shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className={`text-sm font-bold ${mgr.isAi ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {mgr.isAi ? <Bot className="h-5 w-5" /> : getInitials(mgr.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{mgr.name}</p>
                  {mgr.isAi && <span className="text-[10px] text-primary font-medium">AI Agent</span>}
                </div>
              </div>
              <div className="w-28 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Балл</span>
                  <Badge variant="outline" className={`text-xs font-bold tabular-nums border ${color.badge}`}>{mgr.avgScore}</Badge>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color.bg}`} style={{ width: `${mgr.avgScore}%` }} />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <div className="rounded-lg bg-[hsl(var(--status-critical)/0.05)] border border-[hsl(var(--status-critical)/0.1)] px-3 py-2">
                  <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--status-critical)/0.7)] font-medium">Слабое место</span>
                  <p className="text-xs text-foreground/80 mt-0.5 truncate">{mgr.weakSpot}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--status-good)/0.05)] border border-[hsl(var(--status-good)/0.1)] px-3 py-2">
                  <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--status-good)/0.7)] font-medium">Сильная сторона</span>
                  <p className="text-xs text-foreground/80 mt-0.5 truncate">{mgr.strongSpot}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-4 gap-3">
              <StatCell icon={<PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />} label="Звонков" value={String(mgr.totalCalls)} />
              <StatCell icon={<MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />} label="Чатов" value={String(mgr.totalChats)} />
              <StatCell icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />} label="Время" value={formatTime(mgr.totalDurationSec)} />
              <StatCell icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--status-warning))]" />} label="Балл" value={`${mgr.avgScore}%`} highlight={mgr.avgScore >= 60} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {icon}
      <span className={`text-sm font-bold tabular-nums ${highlight ? "text-[hsl(var(--status-good))]" : "text-foreground"}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
    </div>
  );
}