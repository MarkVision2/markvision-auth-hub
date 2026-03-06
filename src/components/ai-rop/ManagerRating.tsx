import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Manager {
  name: string;
  isAi: boolean;
  avgScore: number;
  totalCalls: number;
  totalChats: number;
  trend: "up" | "down" | "flat";
  weakSpot: string;
  strongSpot: string;
}

const MOCK_MANAGERS: Manager[] = [
  { name: "AI-Агент", isAi: true, avgScore: 97, totalCalls: 58, totalChats: 45, trend: "up", weakSpot: "—", strongSpot: "Отработка возражений (29.5/30)" },
  { name: "Алия Нурланова", isAi: false, avgScore: 84, totalCalls: 42, totalChats: 22, trend: "up", weakSpot: "Презентация услуги (15/20)", strongSpot: "Закрытие на визит (19/20)" },
  { name: "Дамир Касымов", isAi: false, avgScore: 38, totalCalls: 35, totalChats: 18, trend: "down", weakSpot: "Отработка возражений (4/30)", strongSpot: "Приветствие (8/10)" },
  { name: "Айгерим Жумабекова", isAi: false, avgScore: 72, totalCalls: 28, totalChats: 14, trend: "flat", weakSpot: "Закрытие на визит (12/20)", strongSpot: "Выявление потребности (18/20)" },
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-[hsl(var(--status-good))]", bg: "bg-[hsl(var(--status-good))]", badge: "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.3)]" };
  if (score >= 50) return { text: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning))]", badge: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)]" };
  return { text: "text-[hsl(var(--status-critical))]", bg: "bg-[hsl(var(--status-critical))]", badge: "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.3)]" };
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
        return (
          <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
            {/* Rank */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className={`text-2xl font-black tabular-nums ${i === 0 ? "text-primary" : "text-muted-foreground/60"}`}>
                #{i + 1}
              </span>
              <TrendIcon trend={mgr.trend} />
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3 w-48 shrink-0">
              <Avatar className="h-11 w-11">
                <AvatarFallback className={`text-sm font-bold ${mgr.isAi ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {mgr.isAi ? <Bot className="h-5 w-5" /> : getInitials(mgr.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{mgr.name}</p>
                {mgr.isAi && <span className="text-[10px] text-primary font-medium">AI Agent</span>}
                <p className="text-[11px] text-muted-foreground mt-0.5">{mgr.totalCalls} звонков · {mgr.totalChats} чатов</p>
              </div>
            </div>

            {/* Score */}
            <div className="w-32 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Средний балл</span>
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
        );
      })}
    </div>
  );
}
