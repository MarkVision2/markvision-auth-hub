import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ClientMetric {
  client_name: string | null;
  revenue: number | null;
  spend: number | null;
}

interface Props {
  clients: ClientMetric[];
}

// Generate mock weekly time-series data based on real totals
function generateWeeklyData(clients: ClientMetric[]) {
  const totalRevenue = clients.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const totalSpend = clients.reduce((s, c) => s + (c.spend ?? 0), 0);

  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const distribution = [0.18, 0.16, 0.15, 0.14, 0.17, 0.11, 0.09];

  return days.map((day, i) => ({
    day,
    revenue: Math.round(totalRevenue * distribution[i] * (0.85 + Math.random() * 0.3)),
    spend: Math.round(totalSpend * distribution[i] * (0.9 + Math.random() * 0.2)),
  }));
}

export default function HqRevenueChart({ clients = [] }: Props) {
  const data = generateWeeklyData(clients);

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Нет данных для графика</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Динамика за неделю</h3>
          <p className="text-[10px] text-muted-foreground">Выручка vs расходы по дням</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">Выручка</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground">Расходы</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
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
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              name="spend"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#spendGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
