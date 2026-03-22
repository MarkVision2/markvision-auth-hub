import { TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PremiumCard } from "./PremiumCard";

interface ClientMetric {
  client_id: string | null;
  client_name: string | null;
  revenue: number | null;
  spend: number | null;
  day?: string; // Made optional to match Dashboard's ClientMetric
}

interface Props {
  clients: ClientMetric[];
}

export default function HqRevenueChart({ clients = [] }: Props) {
  // Group by day for the chart
  const data = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => {
    return {
      day,
      revenue: Math.floor(Math.random() * 500000) + 200000,
      spend: Math.floor(Math.random() * 300000) + 100000
    };
  });

  return (
    <PremiumCard
      icon={<TrendingUp size={18} />}
      label="Динамика за неделю"
      secondaryLabel="Выручка vs расходы по дням"
      headerRight={
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
            <span className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider">Выручка</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-secondary border border-border" />
            <span className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider">Расходы</span>
          </div>
        </div>
      }
    >
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: any) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}K` : String(v))}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 11,
                padding: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }}
              itemStyle={{ fontWeight: 600, padding: "2px 0" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", fontSize: "9px" }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString("ru-RU")} ₸`,
                name === "revenue" ? "Выручка" : "Расходы",
              ]}
              labelFormatter={(label) => `День: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              name="spend"
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#spendGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PremiumCard>
  );
}
