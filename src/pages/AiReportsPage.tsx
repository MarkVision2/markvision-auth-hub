import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Download, Send, Calendar, TrendingUp, TrendingDown,
  Eye, DollarSign, Users, BarChart3, Trophy, Sparkles,
  CheckCircle2, Target, ChevronDown, Image as ImageIcon,
  Zap, Clock, Bell
} from "lucide-react";

/* ── Mock Data ── */
const kpis = [
  {
    label: "Расходы на рекламу",
    value: "487 320 ₸",
    trend: -8,
    trendLabel: "vs прошлая неделя",
    icon: DollarSign,
    good: true, // lower spend is good
  },
  {
    label: "Лиды",
    value: "143",
    trend: 15,
    trendLabel: "vs прошлая неделя",
    icon: Users,
    good: true,
  },
  {
    label: "Визиты на сайт",
    value: "4 218",
    trend: 22,
    trendLabel: "vs прошлая неделя",
    icon: Eye,
    good: true,
  },
  {
    label: "Выручка (CRM)",
    value: "2 840 000 ₸",
    trend: 11,
    trendLabel: "vs прошлая неделя",
    icon: BarChart3,
    good: true,
  },
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

/* ── Trend Pill ── */
function TrendPill({ value, label, isGood }: { value: number; label: string; isGood: boolean }) {
  const isPositive = value > 0;
  // For costs, negative is good. For others, positive is good
  const color = isGood ? "text-primary" : "text-destructive";
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{value}%
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
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
        <Button variant="outline" className="gap-2 text-sm h-10 rounded-xl border-border/50">
          <Send className="h-4 w-4" />
          Настроить авто-отправку
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Автоматизация отчётов
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Настройте регулярную отправку отчётов в Telegram</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Включить регулярные отчёты</p>
              <p className="text-xs text-muted-foreground mt-0.5">Отчёты будут отправляться автоматически</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Частота отправки</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Еженедельно (Понедельник, 10:00)
                  </div>
                </SelectItem>
                <SelectItem value="biweekly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Раз в 2 недели
                  </div>
                </SelectItem>
                <SelectItem value="monthly">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Ежемесячно (1-е число, 10:00)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Telegram Group ID */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telegram Group ID</label>
            <Input value={groupId} onChange={(e) => setGroupId(e.target.value)}
              placeholder="-100XXXXXXXXXX"
              className="h-11 rounded-xl font-mono text-sm" />
            <p className="text-[11px] text-muted-foreground">Добавьте @MarkVisionBot в группу и укажите ID</p>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-foreground">Следующая отправка</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {frequency === "weekly" ? "Понедельник, 10 Марта 2026, 10:00" :
               frequency === "monthly" ? "1 Апреля 2026, 10:00" :
               "17 Марта 2026, 10:00"}
            </p>
          </div>

          <Button className="w-full h-11 rounded-xl text-sm font-semibold gap-2" disabled={!enabled}>
            <Zap className="h-4 w-4" />
            Сохранить расписание
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
        <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
            {/* Left — Client selector */}
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="w-[220px] h-10 rounded-xl border-border/50 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic-aiva">🏥 Клиника AIVA</SelectItem>
                <SelectItem value="dentalpro">🦷 DentalPro Алматы</SelectItem>
                <SelectItem value="esteticline">💎 EsteticLine</SelectItem>
                <SelectItem value="medcity">🏢 MedCity Астана</SelectItem>
              </SelectContent>
            </Select>

            {/* Center — Date + Compare */}
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 text-sm h-10 rounded-xl border-border/50 bg-card tabular-nums">
                <Calendar className="h-4 w-4" />
                1 – 7 Марта 2026
              </Button>
              <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 h-10">
                <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} className="scale-90" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Сравнить с прошлым</span>
              </div>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
              <AutomationDialog />
              <Button className="gap-2 text-sm h-10 rounded-xl font-semibold">
                <Download className="h-4 w-4" />
                Скачать PDF
              </Button>
            </div>
          </div>
        </div>

        {/* ─── REPORT CANVAS ─── */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-card border border-border/40 overflow-hidden shadow-2xl shadow-black/20">

            {/* Report Header */}
            <div className="px-10 pt-10 pb-8 border-b border-border/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Маркетинговый отчёт</h1>
                    <p className="text-sm text-muted-foreground mt-1">Клиника AIVA · Алматы</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">1 – 7 Марта 2026</p>
                  <p className="text-xs text-muted-foreground mt-1">Сформирован: 8 марта 2026, 09:00</p>
                  <Badge variant="outline" className="mt-2 text-[11px] border-primary/30 text-primary gap-1">
                    <Sparkles className="h-3 w-3" /> Сгенерирован AI
                  </Badge>
                </div>
              </div>
            </div>

            {/* Section 1: KPI Grid */}
            <div className="px-10 py-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Ключевые показатели</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-secondary/40 border border-border/30 p-5 hover:border-border/60 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums tracking-tight">{kpi.value}</p>
                    {compareEnabled && (
                      <TrendPill value={kpi.trend} label={kpi.trendLabel} isGood={kpi.good} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-10"><Separator className="opacity-30" /></div>

            {/* Section 2: Best Creative */}
            <div className="px-10 py-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Лучший креатив периода</h2>
              </div>
              <div className="rounded-xl border border-border/30 bg-secondary/20 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                  {/* Ad Preview */}
                  <div className="bg-secondary/60 p-6 flex items-center justify-center border-r border-border/20">
                    <div className="w-full aspect-[4/5] rounded-xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-border/30 flex flex-col items-center justify-center gap-3 p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary/60" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Reels · Брекеты</p>
                        <p className="text-xs text-muted-foreground mt-1">«Улыбка за 6 месяцев»</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">Reels Format</Badge>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <span className="text-sm font-semibold text-foreground">Топ перформер недели</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "CPL", value: "2 340 ₸", sub: "−18% vs средний" },
                        { label: "ROMI", value: "483%", sub: "Лучший за месяц" },
                        { label: "CTR", value: "4.2%", sub: "+67% vs средний" },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg bg-secondary/50 border border-border/20 p-3.5">
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                          <p className="text-lg font-bold text-foreground tabular-nums mt-1">{s.value}</p>
                          <p className="text-[11px] text-primary mt-1">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-4 flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">🏆 Топ конверсия сайта: 8.3%</p>
                        <p className="text-xs text-muted-foreground mt-0.5">47 заявок из 567 переходов на сайт</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs border-border/40">Instagram</Badge>
                      <Badge variant="outline" className="text-xs border-border/40">Reels</Badge>
                      <Badge variant="outline" className="text-xs border-border/40">18–35 лет</Badge>
                      <Badge variant="outline" className="text-xs border-border/40">Алматы</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-10"><Separator className="opacity-30" /></div>

            {/* Section 3: AI Director Summary */}
            <div className="px-10 py-8 pb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">🧠 Сводка от AI-Директора</h2>
              </div>

              {/* Glowing container */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* Glow border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-primary/10 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-card" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 space-y-6">
                  {/* What was done */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Что было сделано</h3>
                    </div>
                    <div className="space-y-3 pl-7">
                      {aiActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="opacity-20" />

                  {/* Action plan */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">План действий на следующий период</h3>
                    </div>
                    <div className="space-y-3 pl-7">
                      {aiPlan.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-xs font-bold text-primary tabular-nums mt-0.5 shrink-0 w-5">{i + 1}.</span>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="px-10 py-5 bg-secondary/20 border-t border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Сгенерировано <span className="text-foreground font-medium">MarkVision AI</span></span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">Страница 1 из 1</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
