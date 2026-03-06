import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, AlertTriangle, Bot } from "lucide-react";

const kpis = [
  {
    title: "Средний балл отдела",
    value: "78",
    suffix: "/ 100",
    icon: TrendingUp,
    color: "text-[hsl(var(--status-warning))]",
    bg: "bg-[hsl(var(--status-warning)/0.1)]",
    border: "border-[hsl(var(--status-warning)/0.2)]",
    badge: { text: "Нужно улучшение", className: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]" },
  },
  {
    title: "Проанализировано",
    value: "142",
    suffix: " звонка · 89 чатов",
    icon: BarChart3,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    badge: { text: "За 7 дней", className: "bg-primary/15 text-primary border-primary/20" },
  },
  {
    title: "Главная ошибка",
    value: "«Дорого»",
    suffix: "",
    icon: AlertTriangle,
    color: "text-[hsl(var(--status-critical))]",
    bg: "bg-[hsl(var(--status-critical)/0.1)]",
    border: "border-[hsl(var(--status-critical)/0.2)]",
    badge: null,
    description: "Не отработано возражение «Дорого» в 34% диалогов",
  },
  {
    title: "AI vs Люди",
    value: "",
    suffix: "",
    icon: Bot,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    badge: null,
    comparison: { ai: 98, human: 65 },
  },
];

export default function AiRopKpiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => (
        <div key={i} className={`rounded-xl border ${kpi.border} bg-card p-4 space-y-3`}>
          <div className="flex items-center justify-between">
            <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            {kpi.badge && (
              <Badge variant="outline" className={`text-[10px] ${kpi.badge.className}`}>{kpi.badge.text}</Badge>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.title}</p>
            {kpi.comparison ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">🤖 AI-Агенты</span>
                  <span className="text-sm font-bold text-primary tabular-nums">{kpi.comparison.ai}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${kpi.comparison.ai}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">👤 Менеджеры</span>
                  <span className="text-sm font-bold text-[hsl(var(--status-warning))] tabular-nums">{kpi.comparison.human}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(var(--status-warning))]" style={{ width: `${kpi.comparison.human}%` }} />
                </div>
              </div>
            ) : kpi.description ? (
              <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{kpi.description}</p>
            ) : (
              <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                {kpi.value}<span className="text-sm font-normal text-muted-foreground ml-1">{kpi.suffix}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
