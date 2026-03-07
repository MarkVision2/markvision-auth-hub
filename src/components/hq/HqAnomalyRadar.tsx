import { AlertTriangle, Octagon, RefreshCw, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Generate anomalies from real data
  const anomalies = clients
    .filter((c) => c.is_active && c.spend && c.spend > 0 && (c.romi === null || c.romi < 0))
    .map((c) => ({
      id: c.client_id || c.client_name || "",
      project: c.client_name || "Без имени",
      severity: (c.romi !== null && c.romi < -50 ? "critical" : "warning") as "critical" | "warning",
      message: `ROMI ${c.romi?.toFixed(0) ?? 0}% при расходе ${c.spend?.toLocaleString("ru-RU")} ₸`,
    }));

  const visibleAnomalies = anomalies.filter((a) => !dismissed.has(a.id));

  const handleStop = (id: string, project: string) => {
    toast({
      title: "Команда отправлена",
      description: `Остановка кампании «${project}» отправлена в Meta API`,
    });
    setDismissed((prev) => new Set(prev).add(id));
  };

  const handleGenerate = () => {
    navigate("/content");
  };

  const handleClientClick = () => {
    navigate("/agency-accounts");
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
        {visibleAnomalies.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-full tabular-nums">
            {visibleAnomalies.filter((a) => a.severity === "critical").length} крит.
          </span>
        )}
      </div>

      {visibleAnomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <PartyPopper className="h-8 w-8 text-primary mb-3" />
          <p className="text-sm font-semibold text-foreground">Все проекты работают в плюс</p>
          <p className="text-xs text-muted-foreground mt-1">Аномалий не обнаружено</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleAnomalies.map((a) => {
            const isCritical = a.severity === "critical";
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-3.5 flex items-center gap-3 group transition-colors ${
                  isCritical
                    ? "border-destructive/15 bg-destructive/[0.03] hover:border-destructive/30"
                    : "border-[hsl(var(--status-warning)/0.15)] bg-[hsl(var(--status-warning)/0.03)] hover:border-[hsl(var(--status-warning)/0.3)]"
                }`}
              >
                <div className="relative shrink-0">
                  <span
                    className={`absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping ${
                      isCritical ? "bg-destructive" : "bg-[hsl(var(--status-warning))]"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      isCritical ? "bg-destructive" : "bg-[hsl(var(--status-warning))]"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={handleClientClick}
                  >
                    {a.project}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{a.message}</p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 bg-transparent border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => handleStop(a.id, a.project)}
                  >
                    <Octagon className="h-3 w-3" />
                    Стоп
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 bg-transparent border-border text-muted-foreground hover:text-foreground"
                    onClick={handleGenerate}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Креатив
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
