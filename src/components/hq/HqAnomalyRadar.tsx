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
  is_agency?: boolean;
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
    <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0b10]/40 backdrop-blur-3xl p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] h-full">
      {/* Premium Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="h-11 w-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
            <div className="text-destructive drop-shadow-[0_0_8px_rgba(var(--destructive),0.5)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Радар Аномалий</h3>
            <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest mt-0.5">На основе реальных данных</p>
          </div>
          {visible.length > 0 && (
            <span className="ml-auto text-[9px] font-black text-destructive bg-destructive/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-destructive/20 tabular-nums">
              {visible.filter((a) => a.severity === "critical").length} крит.
            </span>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-20" />
              <PartyPopper className="h-8 w-8 text-primary relative z-10" />
            </div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">Все проекты работают в плюс</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">Аномалий не обнаружено</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((a) => {
              const isCritical = a.severity === "critical";
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${isCritical
                      ? "border-destructive/20 bg-destructive/[0.03] hover:border-destructive/40 hover:bg-destructive/[0.06]"
                      : "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/40 hover:bg-amber-500/[0.06]"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Left: client + severity */}
                    <div className="min-w-0 flex-shrink-0">
                      <div className="flex items-center gap-2.5">
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">{a.project}</p>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-black px-2 py-0.5 h-auto border uppercase tracking-widest ${isCritical
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}
                        >
                          {isCritical ? "Critical" : "Warning"}
                        </Badge>
                      </div>
                    </div>

                    {/* Center: issue */}
                    <p className="flex-1 text-[11px] text-muted-foreground/80 font-medium truncate min-w-0">{a.issue}</p>

                    {/* Right: actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 bg-black/20 border-white/5 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all rounded-xl px-3"
                        onClick={() => handleAssign(a.id, a.project)}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        Назначить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-all rounded-xl"
                        onClick={() => navigate("/crm")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
          })}
        </div>
      )}
    </div>
  );
}
