import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

const alerts = [
  {
    project: "Технология позвоночника",
    severity: "critical" as const,
    badge: "Отвал карты (Meta)",
    action: "Написать клиенту",
    time: "2ч",
  },
  {
    project: "Дентал Тайм",
    severity: "warning" as const,
    badge: "ROMI < 100%",
    action: "Обновить креативы",
    time: "5ч",
  },
  {
    project: "Kitarov Clinic",
    severity: "warning" as const,
    badge: "Выгорание аудитории",
    action: "Контент-Завод",
    time: "8ч",
  },
  {
    project: "Beauty Lab",
    severity: "info" as const,
    badge: "Бюджет 90%",
    action: "Уведомить",
    time: "12ч",
  },
];

const severityConfig = {
  critical: { dot: "bg-[hsl(var(--status-critical))]", badgeCls: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" },
  warning: { dot: "bg-[hsl(var(--status-warning))]", badgeCls: "border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]" },
  info: { dot: "bg-blue-500", badgeCls: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
};

export default function AlertsPanel() {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--status-critical))]" />
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Красная зона
          </CardTitle>
          <Badge variant="outline" className="ml-auto border-[hsl(var(--status-critical)/0.2)] text-[hsl(var(--status-critical))] text-[10px] font-mono">
            {alerts.filter((a) => a.severity === "critical").length} крит
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-0">
          {alerts.map((alert, i) => {
            const cfg = severityConfig[alert.severity];
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 group"
              >
                <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot} shrink-0`} />
                <span className="text-xs font-medium text-foreground/90 min-w-[120px] truncate">
                  {alert.project}
                </span>
                <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${cfg.badgeCls}`}>
                  {alert.badge}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">{alert.time}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] text-muted-foreground hover:text-foreground h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  {alert.action}
                  <ExternalLink className="h-2.5 w-2.5 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
