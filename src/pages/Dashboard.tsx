import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MessageSquare,
  Target,
  Video,
  Activity,
} from "lucide-react";
import SparklineChart from "@/components/agency/SparklineChart";

/* ── mock data ── */
const kpiCards = [
  {
    title: "Выручка",
    value: "3 450 000 ₸",
    trend: "+15%",
    trendDir: "up" as const,
    spark: [20, 35, 28, 45, 52, 60, 72],
  },
  {
    title: "Расходы (Ads)",
    value: "450 000 ₸",
    trend: "+2%",
    trendDir: "neutral" as const,
    spark: [30, 32, 31, 34, 33, 35, 36],
  },
  {
    title: "ROMI",
    value: "766%",
    trend: "+120%",
    trendDir: "up" as const,
    spark: [200, 350, 400, 500, 620, 700, 766],
  },
  {
    title: "Средний CAC",
    value: "12 500 ₸",
    trend: "-5%",
    trendDir: "down_good" as const,
    spark: [18, 16, 15, 14, 13.5, 13, 12.5],
  },
];

const revenueChartData = [
  { day: "Пн", revenue: 420000, spend: 58000 },
  { day: "Вт", revenue: 510000, spend: 62000 },
  { day: "Ср", revenue: 480000, spend: 55000 },
  { day: "Чт", revenue: 620000, spend: 70000 },
  { day: "Пт", revenue: 550000, spend: 65000 },
  { day: "Сб", revenue: 470000, spend: 60000 },
  { day: "Вс", revenue: 400000, spend: 80000 },
];

const activityFeed = [
  {
    time: "08:15",
    color: "bg-emerald-500",
    icon: MessageSquare,
    text: "AI-Агент (WhatsApp): Успешно записан пациент Иван на 15:00.",
  },
  {
    time: "04:30",
    color: "bg-blue-500",
    icon: Target,
    text: "AI-Таргетолог: Бюджет кампании 'Брекеты' увеличен на 20% из-за высокого CTR.",
  },
  {
    time: "02:10",
    color: "bg-purple-500",
    icon: Video,
    text: "Контент-Завод: Сгенерировано 3 новых видео-креатива.",
  },
  {
    time: "00:45",
    color: "bg-emerald-500",
    icon: Activity,
    text: "AI-Агент: Отправлено 8 follow-up сообщений по неотвеченным лидам.",
  },
];

function TrendBadge({ trend, dir }: { trend: string; dir: string }) {
  const isPositive = dir === "up" || dir === "down_good";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-muted-foreground"
      }`}
    >
      {dir === "down_good" ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <TrendingUp className="h-3 w-3" />
      )}
      {trend}
    </span>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");

  return (
    <DashboardLayout breadcrumb="Командный центр">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Командный центр
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Сводка по всем системам MarkVision
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-card border-white/10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="7d">Последние 7 дней</SelectItem>
                <SelectItem value="30d">Месяц</SelectItem>
                <SelectItem value="90d">Квартал</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="border-white/10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.title}
              className="bg-[#0a0a0a] border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors"
            >
              <div className="absolute bottom-0 left-0 right-0 opacity-30 group-hover:opacity-50 transition-opacity">
                <SparklineChart
                  data={kpi.spark}
                  color={
                    kpi.trendDir === "neutral"
                      ? "hsl(0 0% 50%)"
                      : "hsl(160 84% 39%)"
                  }
                />
              </div>
              <CardContent className="p-5 relative z-10">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {kpi.title}
                </p>
                <div className="flex items-end justify-between mt-2">
                  <span
                    className={`text-2xl font-bold tracking-tight ${
                      kpi.title === "ROMI"
                        ? "text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {kpi.value}
                  </span>
                  <TrendBadge trend={kpi.trend} dir={kpi.trendDir} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Middle Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Financial Chart */}
          <Card className="lg:col-span-2 bg-[#0a0a0a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Динамика прибыли
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(160 84% 39%)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(160 84% 39%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(0 0% 50%)"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(0 0% 50%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0 0% 100% / 0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0 0% 6%)",
                      border: "1px solid hsl(0 0% 100% / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(0 0% 95%)",
                    }}
                    formatter={(value: number) =>
                      `${value.toLocaleString("ru-RU")} ₸`
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(160 84% 39%)"
                    strokeWidth={2}
                    fill="url(#gRevenue)"
                    name="Выручка"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(0 0% 45%)"
                    strokeWidth={1.5}
                    fill="url(#gSpend)"
                    name="Расходы"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Director Card */}
          <Card className="bg-[#0a0a0a] border-white/10 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  AI-Директор · Утренняя сводка
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-sm text-foreground/85 leading-relaxed">
                Доброе утро! За последние 24 часа{" "}
                <span className="text-emerald-400 font-semibold">
                  ROMI вырос на 15%
                </span>
                . Я автоматически отключил{" "}
                <span className="text-foreground font-medium">
                  2 убыточных объявления
                </span>{" "}
                в Meta, сэкономив{" "}
                <span className="text-emerald-400 font-semibold">
                  14 500 ₸
                </span>
                . ИИ-агенты обработали 12 новых лидов и назначили{" "}
                <span className="text-foreground font-medium">4 визита</span>.
                Рекомендую запустить новые креативы из Контент-Завода.
              </p>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Принять рекомендации
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row: Activity Feed ── */}
        <Card className="bg-[#0a0a0a] border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Живая лента · Действия системы
              </CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 text-[10px] gap-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {activityFeed.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div
                      className={`h-2 w-2 rounded-full ${event.color} shrink-0`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground/90">{event.text}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {event.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
