import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Zap } from "lucide-react";

const mrrData = [
  { month: "Сен", mrr: 2800000, forecast: null },
  { month: "Окт", mrr: 3100000, forecast: null },
  { month: "Ноя", mrr: 3400000, forecast: null },
  { month: "Дек", mrr: 3650000, forecast: null },
  { month: "Янв", mrr: 3900000, forecast: null },
  { month: "Фев", mrr: 4200000, forecast: null },
  { month: "Мар", mrr: null, forecast: 4500000 },
  { month: "Апр", mrr: null, forecast: 4750000 },
];

const leadFlowData = [
  { day: "Пн", incoming: 42, aiHandled: 34 },
  { day: "Вт", incoming: 56, aiHandled: 48 },
  { day: "Ср", incoming: 38, aiHandled: 31 },
  { day: "Чт", incoming: 64, aiHandled: 55 },
  { day: "Пт", incoming: 51, aiHandled: 43 },
  { day: "Сб", incoming: 33, aiHandled: 28 },
  { day: "Вс", incoming: 28, aiHandled: 24 },
];

const tooltipStyle = {
  background: "hsl(0 0% 6%)",
  border: "1px solid hsl(0 0% 100% / 0.08)",
  borderRadius: 6,
  fontSize: 12,
  color: "hsl(0 0% 90%)",
};

const axisTickStyle = { fill: "hsl(0 0% 40%)", fontSize: 11 };

export default function DualCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* MRR Chart */}
      <Card className="bg-[#0f0f11] border-white/[0.08]">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              MRR · Динамика и прогноз
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[200px] px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.03)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTickStyle} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisTickStyle}
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₸`}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gMrr)"
                name="MRR"
                dot={false}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="url(#gForecast)"
                name="Прогноз"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lead Flow Chart */}
      <Card className="bg-[#0f0f11] border-white/[0.08]">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-400" />
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Поток лидов · Все проекты
              </CardTitle>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-white/20" /> Входящие
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-orange-400" /> AI
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[200px] px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadFlowData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.03)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisTickStyle} />
              <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="incoming" fill="hsl(0 0% 100% / 0.1)" name="Входящие" radius={[2, 2, 0, 0]} />
              <Bar dataKey="aiHandled" fill="#f97316" name="Обработано AI" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
