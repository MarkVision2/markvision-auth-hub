import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { TrendingUp, Zap } from "lucide-react";

const mrrData = [
  { month: "Сен", mrr: 2800000, forecast: null },
  { month: "Окт", mrr: 3100000, forecast: null },
  { month: "Ноя", mrr: 3400000, forecast: null },
  { month: "Дек", mrr: 3650000, forecast: null },
  { month: "Янв", mrr: 3900000, forecast: null },
  { month: "Фев", mrr: 4200000, forecast: 4200000 },
  { month: "Мар", mrr: null, forecast: 4500000 },
  { month: "Апр", mrr: null, forecast: 4750000 },
];

const leadFlowData = [
  { day: "Пн", incoming: 42, ai: 34 },
  { day: "Вт", incoming: 56, ai: 48 },
  { day: "Ср", incoming: 38, ai: 31 },
  { day: "Чт", incoming: 64, ai: 55 },
  { day: "Пт", incoming: 51, ai: 43 },
  { day: "Сб", incoming: 33, ai: 28 },
  { day: "Вс", incoming: 28, ai: 24 },
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 4,
  fontSize: 12,
  color: "hsl(var(--foreground))",
  padding: "6px 10px",
};

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

export default function DualCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-4 px-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              MRR · Динамика
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[180px] px-3 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={tick} />
              <YAxis axisLine={false} tickLine={false} tick={tick} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${(value / 1000000).toFixed(2)}M ₸`} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(160 84% 39%)" strokeWidth={1.5} fill="url(#gMrr)" name="MRR" dot={false} connectNulls={false} />
              <Area type="monotone" dataKey="forecast" stroke="hsl(160 84% 39%)" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Прогноз" dot={false} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[hsl(var(--status-ai))]" />
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Лиды · 7 дней
              </CardTitle>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted" /> Все</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--status-ai))]" /> AI</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[180px] px-3 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadFlowData} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tick} />
              <YAxis axisLine={false} tickLine={false} tick={tick} width={24} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="incoming" fill="hsl(var(--muted))" name="Входящие" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ai" fill="hsl(25 95% 53%)" name="AI" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
