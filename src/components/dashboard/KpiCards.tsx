import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban, DollarSign, HeartPulse, Cpu, Pause, TrendingUp, AlertTriangle, Clock,
} from "lucide-react";

const kpis = [
  { title: "Активные проекты", value: "14", sub: "2 на паузе", icon: FolderKanban, valueColor: "text-foreground", subIcon: Pause },
  { title: "MRR Агентства", value: "4.2M ₸", sub: "+5% к пред. мес.", icon: DollarSign, valueColor: "text-[hsl(var(--status-good))]", subIcon: TrendingUp, subColor: "text-[hsl(var(--status-good))]" },
  { title: "Health Score", value: "85%", sub: "3 в жёлтой зоне", icon: HeartPulse, valueColor: "text-[hsl(var(--status-good))]", progress: 85, subIcon: AlertTriangle, subColor: "text-[hsl(var(--status-warning))]" },
  { title: "AI-Операций / 24ч", value: "342", sub: "≈ 28ч сэкономлено", icon: Cpu, valueColor: "text-[hsl(var(--status-ai))]", subIcon: Clock, subColor: "text-[hsl(var(--status-ai))]" },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const SubIcon = kpi.subIcon;
        return (
          <Card key={kpi.title} className="bg-card border-border hover:border-muted transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-[0.08em]">{kpi.title}</span>
                <div className="h-6 w-6 rounded bg-secondary/60 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight leading-none ${kpi.valueColor}`}>{kpi.value}</p>
              {kpi.progress !== undefined && (
                <div className="mt-2"><Progress value={kpi.progress} className="h-1 bg-secondary" /></div>
              )}
              <div className={`flex items-center gap-1 mt-2 text-xs ${kpi.subColor || "text-muted-foreground"}`}>
                {SubIcon && <SubIcon className="h-3 w-3" />}
                <span>{kpi.sub}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
