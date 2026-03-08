import { DollarSign, TrendingUp, Briefcase, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AgencyMetrics {
  totalRevenue: number;
  totalSpend: number;
  romi: number;
  activeProjects: number;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₸`;
  return `${n.toFixed(0)} ₸`;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  target?: string;
  targetPct?: number;
  accentClass?: string;
}

function KpiCard({ icon, label, value, target, targetPct, accentClass = "text-foreground" }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
      {target && targetPct !== undefined && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Цель: {target}</span>
            <span className={`text-[10px] font-semibold tabular-nums ${targetPct >= 80 ? "text-primary" : targetPct >= 50 ? "text-amber-500" : "text-destructive"}`}>
              {targetPct}%
            </span>
          </div>
          <Progress value={targetPct} className="h-1.5 bg-secondary" />
        </div>
      )}
    </div>
  );
}

export default function HqKpiCards({ metrics }: { metrics: AgencyMetrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const revTarget = 5_000_000;
  const spendTarget = 1_200_000;
  const romiTarget = 300;
  const projTarget = 10;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        label="Выручка"
        value={formatMoney(metrics.totalRevenue)}
        target={formatMoney(revTarget)}
        targetPct={Math.min(100, Math.round((metrics.totalRevenue / revTarget) * 100))}
        accentClass="text-primary"
      />
      <KpiCard
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        label="Расходы"
        value={formatMoney(metrics.totalSpend)}
        target={formatMoney(spendTarget)}
        targetPct={Math.min(100, Math.round((metrics.totalSpend / spendTarget) * 100))}
      />
      <KpiCard
        icon={<BarChart3 className="h-4 w-4 text-primary" />}
        label="ROMI"
        value={`${metrics.romi.toFixed(0)}%`}
        target={`${romiTarget}%`}
        targetPct={Math.min(100, Math.round((Math.max(0, metrics.romi) / romiTarget) * 100))}
        accentClass={metrics.romi >= 0 ? "text-primary" : "text-destructive"}
      />
      <KpiCard
        icon={<Briefcase className="h-4 w-4 text-primary" />}
        label="Активные кабинеты"
        value={String(metrics.activeProjects)}
        target={String(projTarget)}
        targetPct={Math.min(100, Math.round((metrics.activeProjects / projTarget) * 100))}
      />
    </div>
  );
}
