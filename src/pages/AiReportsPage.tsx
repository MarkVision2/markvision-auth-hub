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
  Zap, Clock, Bell,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════ */

const kpis = [
  { label: "Расходы на рекламу", value: "487 320 ₸", trend: -8, trendLabel: "vs прошлая неделя", icon: DollarSign, good: true },
  { label: "Лиды", value: "143", trend: 15, trendLabel: "vs прошлая неделя", icon: Users, good: true },
  { label: "Выручка (CRM)", value: "2 840 000 ₸", trend: 11, trendLabel: "vs прошлая неделя", icon: BarChart3, good: true },
  { label: "ROMI", value: "483%", trend: 22, trendLabel: "vs прошлая неделя", icon: TrendingUp, good: true },
];

const funnel = [
  { label: "Показы", value: 84200, short: "84.2K" },
  { label: "Клики", value: 4218, short: "4 218" },
  { label: "Лиды", value: 143, short: "143" },
  { label: "Визиты", value: 89, short: "89" },
  { label: "Оплаты", value: 27, short: "27" },
];

const aiActions = [
  "Отключены 3 убыточные кампании с CPL > 8 000 ₸.",
  "Протестирован новый формат Reels — CTR 4.2% (выше среднего на 67%).",
  "Снижена цена клика на 12% за счёт ротации аудиторий.",
  "Обновлены UTM-метки для корректной атрибуции.",
];

const aiPlan = [
  "Масштабируем кампанию «Брекеты» — увеличить бюджет на 30%.",
  "Запускаем 5 новых креативов из Контент-Завода (формат карусель).",
  "Оптимизируем посадочную страницу — A/B тест нового заголовка.",
  "Подключить WhatsApp-бот для мгновенного ответа на заявки.",
];

const revenuePie = [
  { name: "Meta Ads", value: 1840000, color: "hsl(var(--primary))" },
  { name: "Google Ads", value: 620000, color: "#60a5fa" },
  { name: "Органика", value: 380000, color: "#a78bfa" },
];

const cplByChannel = [
  { channel: "Meta Ads", cpl: "3 410 ₸", leads: 94 },
  { channel: "Google Ads", cpl: "4 820 ₸", leads: 32 },
  { channel: "Органика", cpl: "—", leads: 17 },
];

const audienceAge = [
  { age: "18–24", sales: 4, pct: 15 },
  { age: "25–34", sales: 12, pct: 44 },
  { age: "35–44", sales: 8, pct: 30 },
  { age: "45+", sales: 3, pct: 11 },
];

const audienceGeo = [
  { city: "Алматы", sales: 18, pct: 67 },
  { city: "Астана", sales: 5, pct: 19 },
  { city: "Шымкент", sales: 3, pct: 11 },
  { city: "Другие", sales: 1, pct: 3 },
];

/* ── Components ── */

function TrendPill({ value, isGood }: { value: number; isGood: boolean }) {
  const isPositive = value > 0;
  const color = isGood ? "text-primary" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value}%
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

/* ── Automation Dialog ── */
function AutomationDialog() {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [groupId, setGroupId] = useState("-1003746647686");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2 text-sm h-10 text-muted-foreground hover:text-foreground">
          <Send className="h-4 w-4" />
          Авто-отправка
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] border-border/30">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Автоматизация отчётов
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
             PAGE 1: EXECUTIVE SUMMARY
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

            {/* KPI Grid */}
            <div className="px-10 py-7">
              <SectionTitle>Ключевые показатели</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                {kpis.map(kpi => (
                  <div key={kpi.label} className="rounded-xl bg-accent/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
                    {compareEnabled && <div className="mt-1.5"><TrendPill value={kpi.trend} isGood={kpi.good} /></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Воронка конверсии</SectionTitle>
              <div className="flex items-center gap-0">
                {funnel.map((step, i) => {
                  const nextStep = funnel[i + 1];
                  const convRate = nextStep ? ((nextStep.value / step.value) * 100).toFixed(1) : null;
                  const widthPct = 20 + (80 * (step.value / funnel[0].value));
                  return (
                    <div key={step.label} className="flex-1 flex items-center">
                      <div className="flex-1">
                        <div
                          className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-3 text-center mx-auto transition-all"
                          style={{ width: `${Math.max(widthPct, 60)}%` }}
                        >
                          <p className="text-lg font-bold text-foreground tabular-nums">{step.short}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{step.label}</p>
                        </div>
                      </div>
                      {convRate && (
                        <div className="shrink-0 px-1 text-center">
                          <p className="text-[10px] font-bold text-primary tabular-nums">{convRate}%</p>
                          <div className="text-muted-foreground/40 text-[10px]">→</div>
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
              <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Что сделано</h3>
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
                <Separator className="bg-border/10" />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">План на следующий период</h3>
                  </div>
                  <div className="space-y-2 pl-6">
                    {aiPlan.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary tabular-nums mt-0.5 shrink-0 w-4">{i + 1}.</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <PageFooter page={1} />
          </div>

          {/* ═══════════════════════════════════════
             PAGE 2: TRAFFIC & CREATIVE
             ═══════════════════════════════════════ */}
          <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30" id="report-page-2">
            {/* Mini header */}
            <div className="px-10 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🏥</span>
                <span className="text-sm font-semibold text-foreground">Клиника AIVA</span>
                <span className="text-xs text-muted-foreground">· 1–7 Марта 2026</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Трафик и Креативы</span>
            </div>

            <div className="mx-10"><Separator className="bg-border/15" /></div>

            {/* Best Creative */}
            <div className="px-10 py-7">
              <SectionTitle>Топ перформер</SectionTitle>
              <div className="rounded-xl border border-border/20 bg-accent/10 overflow-hidden">
                <div className="grid grid-cols-[240px_1fr]">
                  <div className="bg-accent/20 p-5 flex items-center justify-center border-r border-border/10">
                    <div className="w-full aspect-[4/5] rounded-lg bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-border/20 flex flex-col items-center justify-center gap-2 p-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-primary/60" />
                      </div>
                      <p className="text-xs font-semibold text-foreground text-center">Reels · Брекеты</p>
                      <p className="text-[10px] text-muted-foreground">«Улыбка за 6 месяцев»</p>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Reels</Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold text-foreground">Лучший креатив недели</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "CPL", value: "2 340 ₸", sub: "−18% vs средний" },
                        { label: "ROMI", value: "483%", sub: "Лучший за месяц" },
                        { label: "CTR", value: "4.2%", sub: "+67% vs средний" },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg bg-accent/30 p-3">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                          <p className="text-base font-bold text-foreground tabular-nums mt-0.5">{s.value}</p>
                          <p className="text-[10px] text-primary mt-0.5">{s.sub}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["Instagram", "Reels", "18–35 лет", "Алматы"].map(t => (
                        <Badge key={t} variant="outline" className="text-[10px] border-border/30">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Sources */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Источники выручки</SectionTitle>
              <div className="grid grid-cols-[1fr_1fr] gap-6">
                {/* Donut */}
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
                          formatter={(v: number) => `${(v / 1000).toFixed(0)}K ₸`}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.3)", borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {revenuePie.map(r => (
                      <div key={r.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                        <span className="text-[10px] text-muted-foreground">{r.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CPL Table */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">CPL по каналам</p>
                  <div className="space-y-0">
                    <div className="grid grid-cols-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold py-2 border-b border-border/10">
                      <span>Канал</span><span className="text-right">CPL</span><span className="text-right">Лиды</span>
                    </div>
                    {cplByChannel.map(c => (
                      <div key={c.channel} className="grid grid-cols-3 py-3 border-b border-border/5 last:border-0">
                        <span className="text-sm text-foreground">{c.channel}</span>
                        <span className="text-sm text-foreground tabular-nums text-right">{c.cpl}</span>
                        <span className="text-sm text-muted-foreground tabular-nums text-right">{c.leads}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Audience Analysis */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Анализ аудитории (по продажам)</SectionTitle>
              <div className="grid grid-cols-2 gap-6">
                {/* Age */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-4 font-medium">Возраст покупателей</p>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={audienceAge} barSize={28}>
                        <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(v: number) => [`${v} продаж`]}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.3)", borderRadius: 8, fontSize: 12 }}
                        />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Geo */}
                <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                  <p className="text-xs text-muted-foreground mb-4 font-medium">География продаж</p>
                  <div className="space-y-3">
                    {audienceGeo.map(g => (
                      <div key={g.city}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{g.city}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{g.sales} продаж · {g.pct}%</span>
                        </div>
                        <Progress value={g.pct} className="h-1.5 bg-accent/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <PageFooter page={2} />
          </div>

          {/* ═══════════════════════════════════════
             PAGE 3: SALES & CRM QA
             ═══════════════════════════════════════ */}
          <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30" id="report-page-3">
            {/* Mini header */}
            <div className="px-10 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🏥</span>
                <span className="text-sm font-semibold text-foreground">Клиника AIVA</span>
                <span className="text-xs text-muted-foreground">· 1–7 Марта 2026</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Продажи и Качество</span>
            </div>

            <div className="mx-10"><Separator className="bg-border/15" /></div>

            {/* Lead Quality */}
            <div className="px-10 py-7">
              <SectionTitle>Качество трафика (AI Scoring)</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "🔥 Горячие", count: 38, pct: 27, color: "bg-primary" },
                  { label: "🟡 Тёплые", count: 67, pct: 47, color: "bg-amber-500" },
                  { label: "🗑 Спам / Нецелевые", count: 38, pct: 26, color: "bg-destructive" },
                ].map(seg => (
                  <div key={seg.label} className="rounded-xl bg-accent/10 border border-border/15 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-foreground">{seg.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{seg.count} лидов</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={seg.pct} className="h-2 flex-1 bg-accent/30" />
                      <span className="text-lg font-bold text-foreground tabular-nums">{seg.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Efficiency */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Эффективность обработки</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Среднее время ответа", value: "2 мин", sub: "Цель: < 5 мин", ok: true },
                  { label: "Конверсия AI-Агента", value: "15%", sub: "Лид → Визит", ok: true },
                  { label: "Конверсия менеджеров", value: "8%", sub: "Лид → Визит", ok: false },
                  { label: "Необработанные", value: "4", sub: "из 143 лидов", ok: false },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-accent/10 border border-border/15 p-5 space-y-2">
                    <p className="text-[11px] text-muted-foreground font-medium">{m.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${m.ok ? "text-primary" : "text-amber-400"}`}>{m.value}</p>
                    <p className="text-[11px] text-muted-foreground">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Unit Economics */}
            <div className="px-10 py-7 border-t border-border/10">
              <SectionTitle>Юнит-экономика</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Средний чек (AOV)", value: "105 185 ₸", icon: DollarSign, sub: "+12% vs прошлый месяц", trend: 12 },
                  { label: "Стоимость привлечения (CAC)", value: "18 049 ₸", icon: Target, sub: "−6% vs прошлый месяц", trend: -6 },
                  { label: "LTV клиента", value: "340 000 ₸", icon: Users, sub: "LTV / CAC = 18.8x", trend: 8 },
                ].map(card => (
                  <div key={card.label} className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <card.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendPill value={card.trend} isGood={card.trend > 0 ? card.label !== "Стоимость привлечения (CAC)" : card.label === "Стоимость привлечения (CAC)"} />
                      <span className="text-[10px] text-muted-foreground">{card.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final summary */}
            <div className="px-10 py-7 border-t border-border/10">
              <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Резюме AI-Директора</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Юнит-экономика здоровая: LTV/CAC = 18.8x. Основной рост идёт от Meta Ads (65% выручки).
                    Рекомендую масштабировать бюджет на 30% при сохранении текущего CPL. Конверсия AI-агента в 1.9x выше менеджеров —
                    стоит увеличить долю автоматизированной обработки.
                  </p>
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
