import { AreaChart, Area, ResponsiveContainer, ReferenceLine } from "recharts";
import { Briefcase, TrendingUp, Heart, Bot } from "lucide-react";

const mrrData = [
  { m: "Сен", v: 2800000 },
  { m: "Окт", v: 3100000 },
  { m: "Ноя", v: 3400000 },
  { m: "Дек", v: 3700000 },
  { m: "Янв", v: 3900000 },
  { m: "Фев", v: 4200000 },
  // forecast
  { m: "Мар", v: 4500000, forecast: true },
  { m: "Апр", v: 4800000, forecast: true },
  { m: "Май", v: 5200000, forecast: true },
];

const pastData = mrrData.map(d => ({ ...d, past: d.forecast ? undefined : d.v }));
const futureData = mrrData.map(d => ({ ...d, future: d.forecast ? d.v : (d.m === "Фев" ? d.v : undefined) }));
const merged = mrrData.map((d, i) => ({
  ...d,
  past: pastData[i].past,
  future: futureData[i].future,
}));

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  chart?: boolean;
  accentClass?: string;
  children?: React.ReactNode;
}

function KpiCard({ icon, label, value, sub, accentClass = "text-primary", children }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 group hover:border-white/[0.12] transition-colors">
      {children}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={`text-2xl font-black tabular-nums tracking-tight ${accentClass}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function HqKpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Projects */}
      <KpiCard
        icon={<Briefcase className="h-4.5 w-4.5 text-primary" />}
        label="Активные проекты"
        value="14"
        sub="+2 за месяц"
      />

      {/* MRR with predictive chart */}
      <KpiCard
        icon={<TrendingUp className="h-4.5 w-4.5 text-primary" />}
        label="MRR Агентства"
        value="4 200 000 ₸"
        sub="Прогноз: 5.2M ₸ →"
      >
        <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={merged} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="futureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(25 95% 53%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(25 95% 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="past" stroke="hsl(160 84% 39%)" strokeWidth={2} fill="url(#pastGrad)" dot={false} />
              <Area type="monotone" dataKey="future" stroke="hsl(25 95% 53%)" strokeWidth={2} strokeDasharray="6 4" fill="url(#futureGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </KpiCard>

      {/* Health Score */}
      <KpiCard
        icon={<Heart className="h-4.5 w-4.5 text-primary" />}
        label="Health Score"
        value="85%"
        sub="3 проекта требуют внимания"
      >
        {/* Circular indicator */}
        <div className="absolute top-4 right-4 h-12 w-12">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(0 0% 100% / 0.05)" strokeWidth="3" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke="hsl(160 84% 39%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${85 * 1.256} ${125.6}`}
              className="drop-shadow-[0_0_6px_hsl(160_84%_39%/0.5)]"
            />
          </svg>
        </div>
      </KpiCard>

      {/* AI Ops */}
      <KpiCard
        icon={<Bot className="h-4.5 w-4.5 text-[hsl(var(--status-ai))]" />}
        label="AI-Операций"
        value="342"
        sub="Сегодня: 28 автодействий"
        accentClass="text-[hsl(var(--status-ai))]"
      >
        {/* Subtle orange glow */}
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[hsl(var(--status-ai))] opacity-[0.06] blur-2xl" />
      </KpiCard>
    </div>
  );
}
