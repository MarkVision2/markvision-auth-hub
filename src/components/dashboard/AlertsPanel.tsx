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
    time: "2ч назад",
  },
  {
    project: "Дентал Тайм",
    severity: "warning" as const,
    badge: "ROMI упал < 100%",
    action: "Обновить креативы",
    time: "5ч назад",
  },
  {
    project: "Kitarov Clinic",
    severity: "warning" as const,
    badge: "Выгорание аудитории",
    action: "Запустить Контент-Завод",
    time: "8ч назад",
  },
  {
    project: "Beauty Lab",
    severity: "info" as const,
    badge: "Бюджет израсходован на 90%",
    action: "Уведомить клиента",
    time: "12ч назад",
  },
];

const severityConfig = {
  critical: { dot: "bg-rose-500", badgeCls: "border-rose-500/30 bg-rose-500/10 text-rose-400" },
  warning: { dot: "bg-amber-500", badgeCls: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  info: { dot: "bg-blue-500", badgeCls: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
};

export default function AlertsPanel() {
  return (
    <Card className="bg-[#0f0f11] border-white/[0.08]">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Красная зона · Требуют внимания
          </CardTitle>
          <Badge variant="outline" className="ml-auto border-rose-500/20 text-rose-400 text-[10px]">
            {alerts.filter((a) => a.severity === "critical").length} критичных
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-0">
          {alerts.map((alert, i) => {
            const cfg = severityConfig[alert.severity];
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0 group"
              >
                <div className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                <span className="text-sm font-medium text-foreground/90 min-w-[140px] truncate">
                  {alert.project}
                </span>
                <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${cfg.badgeCls}`}>
                  {alert.badge}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">{alert.time}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  {alert.action}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
