import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Download, Send, Calendar, TrendingUp, TrendingDown,
  Eye, DollarSign, Users, BarChart3, Trophy, Sparkles,
  CheckCircle2, Target, Image as ImageIcon,
  Zap, Clock, Bell, ShoppingCart, Flame, MapPin,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   MOCK DATA — upgraded
   ══════════════════════════════════════════════ */

const kpis7 = [
  { label: "Расходы", value: "487 320 ₸", trend: -8, good: true, icon: DollarSign, accent: false },
  { label: "Лиды", value: "143", trend: 15, good: true, icon: Users, accent: false },
  { label: "CPL", value: "3 408 ₸", trend: -12, good: true, icon: Target, accent: false },
  { label: "Визиты", value: "89", trend: 9, good: true, icon: Eye, accent: false },
  { label: "CPV", value: "5 476 ₸", trend: -5, good: true, icon: MapPin, accent: false },
  { label: "Продажи", value: "27", trend: 23, good: true, icon: ShoppingCart, accent: false },
  { label: "CAC", value: "18 049 ₸", trend: -6, good: true, icon: Flame, accent: true },
];

const funnel = [
  { label: "Показы", value: 84200, short: "84.2K" },
  { label: "Клики", value: 4218, short: "4 218" },
  { label: "Лиды", value: 143, short: "143" },
  { label: "Визиты", value: 89, short: "89" },
  { label: "Продажи", value: 27, short: "27" },
];

const aiActions = [
  "Отключены 3 убыточные кампании с CPL > 8 000 ₸.",
  "Протестирован новый формат Reels — CTR 4.2% (выше среднего на 67%).",
  "Снижена цена клика на 12% за счёт ротации аудиторий.",
  "Обновлены UTM-метки для корректной атрибуции.",
];

const topCreatives = [
  { badge: "👑", title: "Лучший по стоимости лида", name: "Reels · Брекеты", metric: "CPL: 1 200 ₸", color: "border-primary/30 bg-primary/[0.04]" },
  { badge: "🔥", title: "Больше всего визитов", name: "Stories · Виниры", metric: "Визитов: 48", color: "border-amber-500/30 bg-amber-500/[0.04]" },
  { badge: "💰", title: "Максимум продаж", name: "Карусель · Имплант", metric: "Продаж: 14", color: "border-emerald-500/30 bg-emerald-500/[0.04]" },
];

const revenuePie = [
  { name: "Instagram", value: 60, color: "hsl(var(--primary))" },
  { name: "Google", value: 30, color: "#60a5fa" },
  { name: "TikTok", value: 10, color: "#f472b6" },
];

const ageData = [
  { age: "18–24", pct: 12 },
  { age: "25–34", pct: 65 },
  { age: "35–44", pct: 18 },
  { age: "45+", pct: 5 },
];

const leadQuality = [
  { label: "🔥 Горячие", pct: 45, count: 64, color: "bg-primary", textColor: "text-primary" },
  { label: "🟡 Тёплые", pct: 35, count: 50, color: "bg-amber-500", textColor: "text-amber-400" },
  { label: "🗑 Спам/Отказ", pct: 20, count: 29, color: "bg-destructive", textColor: "text-destructive" },
];

const unitEconomics = [
  { label: "Средний чек", value: "105 185 ₸", sub: "Average Order Value", icon: ShoppingCart },
  { label: "LTV", value: "340 000 ₸", sub: "Lifetime Value", icon: Users },
  { label: "Маржинальность", value: "62%", sub: "Gross Margin", icon: BarChart3 },
  { label: "ROMI", value: "483%", sub: "Return on Marketing", icon: TrendingUp },
];

const aiPlan = [
  "Масштабировать кампанию «Брекеты» — увеличить бюджет на 30%.",
  "Запустить 5 новых креативов из Контент-Завода (формат карусель).",
  "Оптимизировать посадочную страницу — A/B тест нового заголовка.",
  "Увеличить долю автоматизированной обработки (AI-агент 1.9x эффективнее).",
];

/* ── Helpers ── */

function TrendPill({ value, good }: { value: number; good: boolean }) {
  const positive = value > 0;
  const color = good ? "text-primary" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value}%
    </span>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <div className="px-10 py-4 border-t border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground">Сгенерировано <span className="text-foreground font-medium">MarkVision AI</span></span>
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">Страница {page} из 3</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function MiniHeader({ subtitle }: { subtitle: string }) {
  return (
    <>
      <div className="px-10 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏥</span>
          <span className="text-sm font-semibold text-foreground">Клиника AIVA</span>
          <span className="text-xs text-muted-foreground">· 1–7 Марта 2026</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{subtitle}</span>
      </div>
      <div className="mx-10"><Separator className="bg-border/15" /></div>
    </>
  );
}

/* ── Automation Dialog ── */
function AutomationDialog() {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [groupId, setGroupId] = useState("-1003746647686");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground hover:text-foreground">
          <Send className="h-4 w-4" />Авто-отправка
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] border-border/30">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />Автоматизация отчётов
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Настройте регулярную отправку в Telegram</p>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div className="flex items-center justify-between rounded-xl bg-accent/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Включить регулярные отчёты</p>
              <p className="text-xs text-muted-foreground mt-0.5">Автоматическая отправка</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Частота</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Еженедельно</div></SelectItem>
                <SelectItem value="biweekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Раз в 2 недели</div></SelectItem>
                <SelectItem value="monthly"><div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Ежемесячно</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telegram Group ID</label>
            <Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="-100XXXXXXXXXX" className="h-10 font-mono text-sm" />
          </div>
          <div className="rounded-xl bg-accent/20 p-4 flex items-center gap-3">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Следующая: {frequency === "weekly" ? "Пн, 10 Марта 2026, 10:00" : frequency === "monthly" ? "1 Апреля 2026, 10:00" : "17 Марта 2026, 10:00"}
            </p>
          </div>
          <Button className="w-full h-10 text-sm font-semibold gap-2" disabled={!enabled}>
            <Zap className="h-4 w-4" />Сохранить расписание
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function AiReportsPage() {
  const [client, setClient] = useState("clinic-aiva");
  const [compareEnabled, setCompareEnabled] = useState(true);

  return (
    <DashboardLayout breadcrumb="AI Отчётность">
      <div className="space-y-6">
        {/* ─── TOP CONTROLS ─── */}
        <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="w-[200px] h-9 border-border/30 bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic-aiva">🏥 Клиника AIVA</SelectItem>
                <SelectItem value="dentalpro">🦷 DentalPro</SelectItem>
                <SelectItem value="esteticline">💎 EsteticLine</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground">
                <Calendar className="h-4 w-4" />1 – 7 Марта 2026
              </Button>
              <div className="flex items-center gap-2 px-3 h-9">
                <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} className="scale-90" />
                <span className="text-xs text-muted-foreground">Сравнение</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <AutomationDialog />
              <Button className="gap-2 text-sm h-9 font-semibold">
                <Download className="h-4 w-4" />Скачать PDF
              </Button>
            </div>
          </div>
        </div>

        {/* ─── STACKED A4 PAGES ─── */}
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

          {/* ═══════════════════════════════════════
             PAGE 1: MACRO KPI & FUNNEL
             ═══════════════════════════════════════ */}
          <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30" id="report-page-1">
            {/* Report Header */}
            <div className="px-10 pt-10 pb-8 border-b border-border/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-xl">🏥</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Маркетинговый отчёт</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Клиника AIVA · Алматы</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">1 – 7 Марта 2026</p>
                  <p className="text-[11px] text-muted-foreground mt-1">8 марта 2026, 09:00</p>
                  <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary gap-1">
                    <Sparkles className="h-3 w-3" /> AI Generated
                  </Badge>
                </div>
              </div>
            </div>

            {/* 7-Metric KPI Grid */}
            <div className="px-10 py-7">
              <SectionTitle>Ключевые показатели</SectionTitle>
              {/* Top row: 4 metrics */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                {kpis7.slice(0, 4).map(kpi => (
                  <div key={kpi.label} className="rounded-xl bg-accent/20 border border-border/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
                    {compareEnabled && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <TrendPill value={kpi.trend} good={kpi.good} />
                        <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Bottom row: 3 metrics — CAC highlighted */}
              <div className="grid grid-cols-3 gap-3">
                {kpis7.slice(4).map(kpi => (
                  <div
                    key={kpi.label}
                    className={`rounded-xl p-4 border ${
                      kpi.accent
                        ? "bg-primary/[0.06] border-primary/25 ring-1 ring-primary/10"
                        : "bg-accent/20 border-border/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.accent ? "text-primary" : "text-muted-foreground/60"}`} />
                      <span className={`text-[11px] font-medium ${kpi.accent ? "text-primary" : "text-muted-foreground"}`}>{kpi.label}</span>
                      {kpi.accent && (
                        <Badge className="ml-auto text-[8px] h-4 px-1.5 bg-primary/15 text-primary border-primary/20">KEY</Badge>
                      )}
                    </div>
                    <p className={`text-lg font-bold tabular-nums ${kpi.accent ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
                    {compareEnabled && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <TrendPill value={kpi.trend} good={kpi.good} />
                        <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel with drop-offs */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Воронка конверсии</SectionTitle>
              <div className="space-y-0">
                {funnel.map((step, i) => {
                  const nextStep = funnel[i + 1];
                  const convRate = nextStep ? ((nextStep.value / step.value) * 100).toFixed(1) : null;
                  const dropOff = nextStep ? (100 - (nextStep.value / step.value) * 100).toFixed(1) : null;
                  const barWidth = (step.value / funnel[0].value) * 100;

                  return (
                    <div key={step.label}>
                      <div className="flex items-center gap-4 py-2">
                        <span className="text-[11px] text-muted-foreground w-20 text-right shrink-0 font-medium">{step.label}</span>
                        <div className="flex-1 relative">
                          <div
                            className="h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center px-3 transition-all"
                            style={{ width: `${Math.max(barWidth, 8)}%` }}
                          >
                            <span className="text-sm font-bold text-foreground tabular-nums">{step.short}</span>
                          </div>
                        </div>
                      </div>
                      {convRate && (
                        <div className="flex items-center gap-4 py-1 ml-24">
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-primary font-bold tabular-nums">↓ {convRate}% конверсия</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-destructive/70 tabular-nums">−{dropOff}% потери</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Director Summary */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>🧠 Сводка от AI-Директора</SectionTitle>
              <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Что сделано на этой неделе</h3>
                </div>
                <div className="space-y-2 pl-6">
                  {aiActions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary/60 mt-2 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <PageFooter page={1} />
          </div>

          {/* ═══════════════════════════════════════
             PAGE 2: CREATIVES & TRAFFIC
             ═══════════════════════════════════════ */}
          <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30" id="report-page-2">
            <MiniHeader subtitle="Креативы и Трафик" />

            {/* Top-3 Creatives */}
            <div className="px-10 py-7">
              <SectionTitle>Топ-3 креативов</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                {topCreatives.map(c => (
                  <div key={c.title} className={`rounded-xl border p-5 space-y-3 ${c.color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.badge}</span>
                      <span className="text-[11px] font-semibold text-foreground">{c.title}</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg bg-accent/20 border border-border/15 flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <p className="text-[11px] font-medium text-foreground">{c.name}</p>
                    </div>
                    <div className="rounded-lg bg-accent/30 px-3 py-2 text-center">
                      <p className="text-sm font-bold text-foreground tabular-nums">{c.metric}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Channel — Donut */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Источники выручки</SectionTitle>
              <div className="grid grid-cols-[1fr_1fr] gap-6">
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Выручка по каналам</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenuePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {revenuePie.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => `${v}%`}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.3)", borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {revenuePie.map(r => (
                      <div key={r.name} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                        <span className="text-[11px] text-muted-foreground">{r.name} — {r.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel breakdown table */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Детализация по каналам</p>
                  <div className="space-y-0">
                    <div className="grid grid-cols-4 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold py-2 border-b border-border/10">
                      <span>Канал</span><span className="text-right">Доля</span><span className="text-right">CPL</span><span className="text-right">Лиды</span>
                    </div>
                    {[
                      { channel: "Instagram", share: "60%", cpl: "2 840 ₸", leads: 86 },
                      { channel: "Google", share: "30%", cpl: "4 950 ₸", leads: 40 },
                      { channel: "TikTok", share: "10%", cpl: "5 120 ₸", leads: 17 },
                    ].map(c => (
                      <div key={c.channel} className="grid grid-cols-4 py-3 border-b border-border/5 last:border-0">
                        <span className="text-sm text-foreground">{c.channel}</span>
                        <span className="text-sm text-foreground tabular-nums text-right">{c.share}</span>
                        <span className="text-sm text-foreground tabular-nums text-right">{c.cpl}</span>
                        <span className="text-sm text-muted-foreground tabular-nums text-right">{c.leads}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Audience Demographics */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Анализ платящей аудитории</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                {/* Geo */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">География</p>
                  <div className="flex items-center gap-2 rounded-lg bg-primary/[0.06] border border-primary/15 px-3 py-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Астана (+40 км)</p>
                      <p className="text-[10px] text-muted-foreground">Основная зона покрытия</p>
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Возраст</p>
                  <div className="space-y-2.5">
                    {ageData.map(a => (
                      <div key={a.age}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-foreground">{a.age}</span>
                          <span className="text-[11px] font-bold text-foreground tabular-nums">{a.pct}%</span>
                        </div>
                        <Progress value={a.pct} className="h-1.5 bg-accent/30" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Пол покупателей</p>
                  <div className="space-y-4 mt-2">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-foreground">Женщины</span>
                        <span className="text-sm font-bold text-primary tabular-nums">80%</span>
                      </div>
                      <div className="h-3 rounded-full bg-accent/30 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-foreground">Мужчины</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">20%</span>
                      </div>
                      <div className="h-3 rounded-full bg-accent/30 overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: "20%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PageFooter page={2} />
          </div>

          {/* ═══════════════════════════════════════
             PAGE 3: SALES QA & UNIT ECONOMICS
             ═══════════════════════════════════════ */}
          <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30" id="report-page-3">
            <MiniHeader subtitle="Продажи и Юнит-экономика" />

            {/* Lead Quality — stacked bar */}
            <div className="px-10 py-7">
              <SectionTitle>Качество трафика (AI Scoring)</SectionTitle>
              {/* Stacked progress bar */}
              <div className="rounded-xl bg-accent/10 border border-border/15 p-6">
                <div className="h-6 rounded-full overflow-hidden flex mb-5 ring-1 ring-border/10">
                  {leadQuality.map(seg => (
                    <div
                      key={seg.label}
                      className={`${seg.color} h-full transition-all relative group`}
                      style={{ width: `${seg.pct}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {leadQuality.map(seg => (
                    <div key={seg.label} className="text-center">
                      <p className="text-sm font-medium text-foreground">{seg.label}</p>
                      <p className={`text-2xl font-bold tabular-nums mt-1 ${seg.textColor}`}>{seg.pct}%</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{seg.count} лидов</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Unit Economics — receipt style */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Юнит-экономика</SectionTitle>
              <div className="rounded-xl bg-primary/[0.04] border border-primary/15 overflow-hidden">
                {/* Receipt header */}
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Финансовая сводка</p>
                    <p className="text-[10px] text-muted-foreground">Unit Economics · Март 2026</p>
                  </div>
                </div>
                {/* Receipt rows */}
                <div className="divide-y divide-primary/10">
                  {unitEconomics.map(item => (
                    <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>
                {/* Receipt footer — ROMI highlight */}
                <div className="px-6 py-4 bg-primary/[0.06] border-t border-primary/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">LTV / CAC Ratio</span>
                  </div>
                  <span className="text-2xl font-black text-primary tabular-nums">18.8x</span>
                </div>
              </div>
            </div>

            {/* Action Plan */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>📋 План действий на следующий период</SectionTitle>
              <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6">
                <div className="space-y-3">
                  {aiPlan.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[11px] font-bold text-primary tabular-nums">{i + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <PageFooter page={3} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
