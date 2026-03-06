import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface ClientMetric {
  client_name: string | null;
  revenue: number | null;
  spend: number | null;
}

interface Props {
  clients: ClientMetric[];
}

export default function HqRevenueChart({ clients = [] }: Props) {
  const data = clients
    .filter((c) => c.client_name)
    .map((c) => ({
      name: c.client_name!.length > 12 ? c.client_name!.slice(0, 12) + "…" : c.client_name!,
      revenue: c.revenue ?? 0,
      spend: c.spend ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Нет данных для графика</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Динамика прибыли по клиентам</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Выручка vs расходы</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value.toLocaleString("ru-RU")} ₸`]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Выручка"
              stroke="hsl(160 84% 39%)"
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="spend"
              name="Расходы"
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
