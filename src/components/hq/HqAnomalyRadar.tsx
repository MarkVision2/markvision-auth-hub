import { AlertTriangle, Octagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const anomalies = [
  {
    project: "Клиника AIVA",
    severity: "critical" as const,
    message: "Аномалия: Цена лида выросла в 3 раза (1 200 → 3 600 ₸)",
    action: "Остановить РК",
    actionIcon: <Octagon className="h-3.5 w-3.5" />,
  },
  {
    project: "Дентал Тайм",
    severity: "warning" as const,
    message: "Выгорание креатива: CTR упал с 2.8% до 0.9% за 3 дня",
    action: "Сгенерировать новый",
    actionIcon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  {
    project: "SmileDent Караганда",
    severity: "warning" as const,
    message: "Менеджер не отвечает >30 мин на 4 лида подряд",
    action: "Включить AI-агента",
    actionIcon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  {
    project: "DentalPro Астана",
    severity: "critical" as const,
    message: "Бюджет исчерпан на 94%. Осталось на ~3 часа",
    action: "Пополнить бюджет",
    actionIcon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
];

function severityStyles(severity: "critical" | "warning") {
  if (severity === "critical") return {
    dot: "bg-[hsl(var(--status-critical))]",
    ping: "bg-[hsl(var(--status-critical))]",
    border: "border-[hsl(var(--status-critical)/0.15)]",
    bg: "bg-[hsl(var(--status-critical)/0.03)]",
    btn: "border-[hsl(var(--status-critical)/0.4)] text-[hsl(var(--status-critical))] hover:bg-[hsl(var(--status-critical)/0.1)]",
  };
  return {
    dot: "bg-[hsl(var(--status-warning))]",
    ping: "bg-[hsl(var(--status-warning))]",
    border: "border-[hsl(var(--status-warning)/0.15)]",
    bg: "bg-[hsl(var(--status-warning)/0.03)]",
    btn: "border-[hsl(var(--status-warning)/0.4)] text-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning)/0.1)]",
  };
}

export default function HqAnomalyRadar() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-critical)/0.1)] flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-critical))]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Радар Аномалий</h3>
          <p className="text-[10px] text-muted-foreground">Требуют немедленного внимания</p>
        </div>
        <span className="ml-auto text-[10px] font-mono text-[hsl(var(--status-critical))] bg-[hsl(var(--status-critical)/0.1)] px-2 py-0.5 rounded-full tabular-nums">
          {anomalies.filter(a => a.severity === "critical").length} крит.
        </span>
      </div>

      <div className="space-y-2.5">
        {anomalies.map((a, i) => {
          const s = severityStyles(a.severity);
          return (
            <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-3.5 flex items-center gap-3 group hover:border-white/[0.1] transition-colors`}>
              {/* Pulsing dot */}
              <div className="relative shrink-0">
                <span className={`absolute inline-flex h-3 w-3 rounded-full ${s.ping} opacity-75 animate-ping`} />
                <span className={`relative inline-flex h-3 w-3 rounded-full ${s.dot}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{a.project}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{a.message}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className={`h-7 text-[11px] gap-1.5 shrink-0 bg-transparent ${s.btn} transition-colors`}
              >
                {a.actionIcon}
                {a.action}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
