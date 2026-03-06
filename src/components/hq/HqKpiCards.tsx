import { DollarSign, TrendingUp, Briefcase, BarChart3 } from "lucide-react";

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
  sub?: string;
  accentClass?: string;
}

function KpiCard({ icon, label, value, sub, accentClass = "text-foreground" }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function HqKpiCards({ metrics }: { metrics: AgencyMetrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        label="Выручка"
        value={formatMoney(metrics.totalRevenue)}
        accentClass="text-primary"
      />
      <KpiCard
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        label="Расходы"
        value={formatMoney(metrics.totalSpend)}
      />
      <KpiCard
        icon={<BarChart3 className="h-4 w-4 text-[hsl(var(--status-ai))]" />}
        label="ROMI"
        value={`${metrics.romi.toFixed(0)}%`}
        accentClass={metrics.romi >= 0 ? "text-primary" : "text-destructive"}
      />
      <KpiCard
        icon={<Briefcase className="h-4 w-4 text-primary" />}
        label="Активные проекты"
        value={String(metrics.activeProjects)}
      />
    </div>
  );
}
