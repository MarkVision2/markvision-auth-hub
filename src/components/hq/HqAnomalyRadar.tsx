import { AlertTriangle, PartyPopper, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClientMetric {
  client_id: string | null;
  client_name: string | null;
  romi: number | null;
  spend: number | null;
  meta_leads: number | null;
  is_active: boolean | null;
}

interface Props {
  clients: ClientMetric[];
}

export default function HqAnomalyRadar({ clients = [] }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const anomalies = clients
    .filter((c) => c.is_active && c.spend && c.spend > 0 && (c.romi === null || c.romi < 0))
    .map((c) => ({
      id: c.client_id || c.client_name || "",
      project: c.client_name || "Без имени",
      severity: (c.romi !== null && c.romi < -50 ? "critical" : "warning") as "critical" | "warning",
      issue: c.romi !== null && c.romi < -50
        ? `Слив бюджета: ROMI упал до ${c.romi?.toFixed(0)}% при расходе ${c.spend?.toLocaleString("ru-RU")} ₸`
        : `Низкая эффективность: ROMI ${c.romi?.toFixed(0)}% — требуется оптимизация`,
    }));

  const visible = anomalies.filter((a) => !dismissed.has(a.id));

  const handleAssign = (id: string, project: string) => {
    toast({ title: "Задача отправлена менеджеру", description: `Проект: ${project}` });
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Радар Аномалий</h3>
          <p className="text-[10px] text-muted-foreground">На основе реальных данных</p>
        </div>
        {visible.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-full tabular-nums">
            {visible.filter((a) => a.severity === "critical").length} крит.
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <PartyPopper className="h-8 w-8 text-primary mb-3" />
          <p className="text-sm font-semibold text-foreground">Все проекты работают в плюс</p>
          <p className="text-xs text-muted-foreground mt-1">Аномалий не обнаружено</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((a) => {
            const isCritical = a.severity === "critical";
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  isCritical
                    ? "border-destructive/15 bg-destructive/[0.03] hover:border-destructive/30"
                    : "border-amber-500/15 bg-amber-500/[0.03] hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Left: client + severity */}
                  <div className="min-w-0 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{a.project}</p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 h-4 border-none ${
                          isCritical
                            ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {isCritical ? "Critical" : "Warning"}
                      </Badge>
                    </div>
                  </div>

                  {/* Center: issue */}
                  <p className="flex-1 text-[11px] text-muted-foreground truncate min-w-0">{a.issue}</p>

                  {/* Right: actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1 bg-transparent border-border text-foreground hover:bg-accent"
                      onClick={() => handleAssign(a.id, a.project)}
                    >
                      <ClipboardList className="h-3 w-3" />
                      Назначить задачу
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate("/crm")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      CRM
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
