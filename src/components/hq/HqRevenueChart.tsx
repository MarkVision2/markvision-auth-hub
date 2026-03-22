import { TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ClientMetric {
  client_name: string | null;
  revenue: number | null;
  spend: number | null;
  is_agency?: boolean;
}

interface Props {
  clients: ClientMetric[];
}

// Removed random daily distribution logic until real timeseries data is available
function generateWeeklyData(clients: ClientMetric[]) {
  return [];
}

export default function HqRevenueChart({ clients = [] }: Props) {
  const data = generateWeeklyData(clients);

  if (clients.length === 0 || data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Нет данных для графика по дням</p>
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0b10]/40 backdrop-blur-3xl p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      {/* Premium Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
              <div className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Динамика за неделю</h3>
              <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest mt-0.5">Выручка vs расходы по дням</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
              <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">Выручка</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
              <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">Расходы</span>
            </div>
          </div>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)", fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)", fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: any) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}K` : String(v))}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0b10",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1rem",
                  fontSize: 11,
                  padding: "12px",
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)"
                }}
                itemStyle={{ fontWeight: 700, padding: "2px 0" }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", fontSize: "9px" }}
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
                strokeWidth={3}
                fill="url(#revGrad)"
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#0a0b10" }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 3, stroke: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                name="spend"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="url(#spendGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
