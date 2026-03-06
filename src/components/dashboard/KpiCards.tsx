import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  DollarSign,
  HeartPulse,
  Cpu,
  Pause,
  ArrowUpRight,
  AlertTriangle,
  Clock,
} from "lucide-react";

const kpis = [
  {
    title: "Активные проекты",
    value: "14",
    sub: "2 на паузе",
    icon: FolderKanban,
    accent: "text-foreground",
    subIcon: Pause,
  },
  {
    title: "MRR Агентства",
    value: "4 200 000 ₸",
    sub: "+5% к прошлому мес.",
    icon: DollarSign,
    accent: "text-emerald-400",
    subIcon: ArrowUpRight,
    subColor: "text-emerald-400",
  },
  {
    title: "Health Score",
    value: "85%",
    sub: "3 проекта в жёлтой зоне",
    icon: HeartPulse,
    accent: "text-emerald-400",
    progress: 85,
    subIcon: AlertTriangle,
    subColor: "text-amber-400",
  },
  {
    title: "AI-Операций / 24ч",
    value: "342",
    sub: "Сэкономлено ~28ч",
    icon: Cpu,
    accent: "text-orange-400",
    subIcon: Clock,
    subColor: "text-orange-400",
  },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const SubIcon = kpi.subIcon;
        return (
          <Card
            key={kpi.title}
            className="bg-[#0f0f11] border-white/[0.08] hover:border-white/[0.15] transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                  {kpi.title}
                </span>
                <div className="h-7 w-7 rounded-md bg-white/[0.04] flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </p>
              {kpi.progress !== undefined && (
                <div className="mt-2.5 mb-1">
                  <Progress value={kpi.progress} className="h-1.5 bg-white/[0.06]" />
                </div>
              )}
              <div className={`flex items-center gap-1 mt-1.5 text-xs ${kpi.subColor || "text-muted-foreground"}`}>
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
