import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  FolderKanban,
  DollarSign,
  HeartPulse,
  Cpu,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Clock,
} from "lucide-react";

/* ── KPI data ── */
const kpis = [
  {
    title: "Активные проекты",
    value: "14",
    sub: "2 на паузе",
    icon: FolderKanban,
    accent: "text-foreground",
    subIcon: Pause,
  },
  {
    title: "MRR Агентства",
    value: "4 200 000 ₸",
    sub: "+5% к прошлому мес.",
    icon: DollarSign,
    accent: "text-emerald-400",
    subIcon: ArrowUpRight,
    subColor: "text-emerald-400",
  },
  {
    title: "Health Score",
    value: "85%",
    sub: "3 проекта в жёлтой зоне",
    icon: HeartPulse,
    accent: "text-emerald-400",
    progress: 85,
    subIcon: AlertTriangle,
    subColor: "text-amber-400",
  },
  {
    title: "AI-Операций за 24ч",
    value: "342",
    sub: "Сэкономлено ~28ч",
    icon: Cpu,
    accent: "text-orange-400",
    subIcon: Clock,
    subColor: "text-orange-400",
  },
];

/* ── Red zone alerts ── */
const alerts = [
  {
    project: "Технология позвоночника",
    severity: "critical" as const,
    badge: "Отвал карты (Meta)",
    action: "Написать клиенту",
  },
  {
    project: "Дентал Тайм",
    severity: "warning" as const,
    badge: "ROMI упал < 100%",
    action: "Обновить креативы",
  },
  {
    project: "Kitarov Clinic",
    severity: "warning" as const,
    badge: "Выгорание аудитории",
    action: "Запустить Контент-Завод",
  },
];

/* ── Lead flow chart ── */
const leadFlowData = [
  { day: "Пн", leads: 42, aiClosed: 18 },
  { day: "Вт", leads: 56, aiClosed: 24 },
  { day: "Ср", leads: 38, aiClosed: 16 },
  { day: "Чт", leads: 64, aiClosed: 30 },
  { day: "Пт", leads: 51, aiClosed: 22 },
  { day: "Сб", leads: 33, aiClosed: 14 },
  { day: "Вс", leads: 28, aiClosed: 12 },
];

const severityConfig = {
  critical: {
    dot: "bg-rose-500",
    badgeCls: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
  warning: {
    dot: "bg-amber-500",
    badgeCls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

export default function Dashboard() {
  return (
    <DashboardLayout breadcrumb="Штаб-квартира">
      <div className="space-y-5">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Штаб-квартира
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Внутренний контроль проектов и AI-инфраструктуры
          </p>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const SubIcon = kpi.subIcon;
            return (
              <Card
                key={kpi.title}
                className="bg-[#0f0f11] border-white/[0.08] hover:border-white/[0.15] transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                      {kpi.title}
                    </span>
                    <div className="h-7 w-7 rounded-md bg-white/[0.04] flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold tracking-tight ${kpi.accent}`}>
                    {kpi.value}
                  </p>
                  {kpi.progress !== undefined && (
                    <div className="mt-2.5 mb-1">
                      <Progress value={kpi.progress} className="h-1.5 bg-white/[0.06]" />
                    </div>
                  )}
                  <div className={`flex items-center gap-1 mt-1.5 text-xs ${kpi.subColor || "text-muted-foreground"}`}>
                    {SubIcon && <SubIcon className="h-3 w-3" />}
                    <span>{kpi.sub}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Middle Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {/* Red Zone */}
          <Card className="lg:col-span-3 bg-[#0f0f11] border-white/[0.08]">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Красная зона · Требуют внимания
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-0">
                {alerts.map((alert, i) => {
                  const cfg = severityConfig[alert.severity];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 group"
                    >
                      <div className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                      <span className="text-sm font-medium text-foreground/90 min-w-[160px]">
                        {alert.project}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${cfg.badgeCls}`}
                      >
                        {alert.badge}
                      </Badge>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground h-7 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {alert.action}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Director */}
          <Card className="lg:col-span-2 bg-[#0f0f11] border-orange-500/[0.15] relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-orange-500/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-orange-500/[0.04] blur-2xl pointer-events-none" />

            <CardHeader className="pb-2 pt-4 px-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Отчет ИИ-Директора
                </CardTitle>
                <span className="text-[10px] text-orange-400/60 font-mono ml-auto">10:00</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 relative z-10 space-y-3">
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                <span className="text-orange-400 font-medium">Сводка:</span>{" "}
                Контент-Завод завершил рендер{" "}
                <span className="text-foreground font-medium">12 видео</span>.
                ИИ-агенты успешно закрыли{" "}
                <span className="text-emerald-400 font-semibold">4 сделки</span>{" "}
                в CRM ночью. Выручка агентства выросла на{" "}
                <span className="text-emerald-400 font-semibold">+5%</span>{" "}
                с начала месяца. Рекомендую перераспределить бюджеты в проекте{" "}
                <span className="text-foreground font-medium">'Avicenna'</span>.
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                Принять рекомендации
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row: Infrastructure chart ── */}
        <Card className="bg-[#0f0f11] border-white/[0.08]">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Мониторинг · Поток лидов по всем проектам (7д)
              </CardTitle>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-400" /> Входящие
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Обработано AI
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[220px] px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadFlowData}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAiClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(0 0% 100% / 0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 45%)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 40%)", fontSize: 11 }}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 6%)",
                    border: "1px solid hsl(0 0% 100% / 0.08)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "hsl(0 0% 90%)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  fill="url(#gLeads)"
                  name="Входящие лиды"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="aiClosed"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#gAiClosed)"
                  name="Обработано AI"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
