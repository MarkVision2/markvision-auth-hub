import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, TrendingUp, TrendingDown, Minus, PhoneIncoming, PhoneOutgoing, Clock, Star, MessageCircle, PhoneCall } from "lucide-react";

interface Manager {
  name: string;
  isAi: boolean;
  avgScore: number;
  incomingCalls: number;
  outgoingCalls: number;
  totalChats: number;
  totalTalkTimeMin: number;
  avgCallDurationSec: number;
  conversionRate: number;
  trend: "up" | "down" | "flat";
  weakSpot: string;
  strongSpot: string;
  scriptMatch: number;
}

const MOCK_MANAGERS: Manager[] = [
  {
    name: "AI-Агент",
    isAi: true,
    avgScore: 99,
    incomingCalls: 0,
    outgoingCalls: 0,
    totalChats: 45,
    totalTalkTimeMin: 0,
    avgCallDurationSec: 0,
    conversionRate: 94,
    trend: "up",
    weakSpot: "—",
    strongSpot: "Отработка возражений (29.5/30)",
    scriptMatch: 98,
  },
  {
    name: "Алия Нурланова",
    isAi: false,
    avgScore: 88,
    incomingCalls: 28,
    outgoingCalls: 14,
    totalChats: 22,
    totalTalkTimeMin: 218,
    avgCallDurationSec: 312,
    conversionRate: 72,
    trend: "up",
    weakSpot: "Презентация рассрочки (15/20)",
    strongSpot: "Закрытие на визит (19/20)",
    scriptMatch: 82,
  },
  {
    name: "Айгерим Жумабекова",
    isAi: false,
    avgScore: 72,
    incomingCalls: 18,
    outgoingCalls: 10,
    totalChats: 14,
    totalTalkTimeMin: 145,
    avgCallDurationSec: 256,
    conversionRate: 58,
    trend: "flat",
    weakSpot: "Закрытие на визит (12/20)",
    strongSpot: "Выявление потребности (18/20)",
    scriptMatch: 68,
  },
  {
    name: "Дамир Касымов",
    isAi: false,
    avgScore: 34,
    incomingCalls: 22,
    outgoingCalls: 13,
    totalChats: 18,
    totalTalkTimeMin: 98,
    avgCallDurationSec: 168,
    conversionRate: 22,
    trend: "down",
    weakSpot: "Отработка возражений (4/30)",
    strongSpot: "Приветствие (8/10)",
    scriptMatch: 38,
  },
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-[hsl(var(--status-good))]", bg: "bg-[hsl(var(--status-good))]", badge: "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.3)]" };
  if (score >= 50) return { text: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning))]", badge: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)]" };
  return { text: "text-[hsl(var(--status-critical))]", bg: "bg-[hsl(var(--status-critical))]", badge: "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.3)]" };
}

function formatTalkTime(min: number) {
  if (min === 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function formatAvgDuration(sec: number) {
  if (sec === 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--status-critical))]" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function ManagerRating() {
  return (
    <div className="space-y-3">
      {MOCK_MANAGERS.map((mgr, i) => {
        const color = scoreColor(mgr.avgScore);
        const totalCalls = mgr.incomingCalls + mgr.outgoingCalls;
        return (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            {/* Top row: rank, avatar, name, score */}
            <div className="flex items-start gap-4">
              {/* Rank */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className={`text-2xl font-black tabular-nums ${i === 0 ? "text-primary" : "text-muted-foreground/60"}`}>
                  #{i + 1}
                </span>
                <TrendIcon trend={mgr.trend} />
              </div>

              {/* Avatar & Name */}
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

              {/* Score */}
              <div className="w-28 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Балл</span>
                  <Badge variant="outline" className={`text-xs font-bold tabular-nums border ${color.badge}`}>
                    {mgr.avgScore}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color.bg}`} style={{ width: `${mgr.avgScore}%` }} />
                </div>
              </div>

              {/* Weak / Strong spots */}
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

            {/* Stats row */}
            <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-7 gap-3">
              <StatCell
                icon={<PhoneIncoming className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />}
                label="Входящие"
                value={String(mgr.incomingCalls)}
              />
              <StatCell
                icon={<PhoneOutgoing className="h-3.5 w-3.5 text-primary" />}
                label="Исходящие"
                value={String(mgr.outgoingCalls)}
              />
              <StatCell
                icon={<PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />}
                label="Всего звонков"
                value={String(totalCalls)}
              />
              <StatCell
                icon={<MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />}
                label="Чатов"
                value={String(mgr.totalChats)}
              />
              <StatCell
                icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                label="Общее время"
                value={formatTalkTime(mgr.totalTalkTimeMin)}
              />
              <StatCell
                icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                label="Ср. звонок"
                value={formatAvgDuration(mgr.avgCallDurationSec)}
              />
              <StatCell
                icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--status-warning))]" />}
                label="Конверсия"
                value={`${mgr.conversionRate}%`}
                highlight={mgr.conversionRate >= 60}
              />
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
      <span className={`text-sm font-bold tabular-nums ${highlight ? "text-[hsl(var(--status-good))]" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
    </div>
  );
}
