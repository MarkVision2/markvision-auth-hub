import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye,
  ArrowRightLeft, Target, TrendingUp,
} from "lucide-react";

/* ── helpers ── */
const fmt = (v: number) => v.toLocaleString("ru-RU");
const pct = (fact: number, plan: number) => (plan > 0 ? Math.round((fact / plan) * 100) : 0);
const cpl = (spend: number, leads: number) => (leads > 0 ? Math.round(spend / leads) : 0);

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

/* ══════════════════════════════════════════════
   TEMPORARY MOCK DATA — will be replaced by daily_metrics later
   ══════════════════════════════════════════════ */
const MOCK_PLAN = {
  spend: 200_000, impressions: 100_000, clicks: 5_000, leads: 300,
  followers: 150, visits: 60, sales: 10, revenue: 5_000_000,
};

const MOCK_DAILY = [
  { date: "2026-03-01", spend: 4_692, impressions: 4_137, clicks: 72, leads: 11, followers: 3, visits: 2, sales: 1, revenue: 180_000 },
  { date: "2026-03-02", spend: 34_620, impressions: 17_848, clicks: 772, leads: 140, followers: 31, visits: 5, sales: 2, revenue: 290_000 },
  { date: "2026-03-03", spend: 38_122, impressions: 21_053, clicks: 1_005, leads: 168, followers: 38, visits: 6, sales: 3, revenue: 350_000 },
  { date: "2026-03-04", spend: 35_815, impressions: 19_728, clicks: 892, leads: 148, followers: 28, visits: 4, sales: 2, revenue: 240_000 },
  { date: "2026-03-05", spend: 33_219, impressions: 18_412, clicks: 814, leads: 132, followers: 22, visits: 3, sales: 1, revenue: 120_000 },
  { date: "2026-03-06", spend: 36_880, impressions: 20_140, clicks: 948, leads: 156, followers: 34, visits: 4, sales: 2, revenue: 260_000 },
  { date: "2026-03-07", spend: 38_540, impressions: 19_862, clicks: 920, leads: 152, followers: 30, visits: 4, sales: 2, revenue: 280_000 },
  { date: "2026-03-08", spend: 34_230, impressions: 17_312, clicks: 795, leads: 130, followers: 28, visits: 3, sales: 1, revenue: 200_000 },
];

type MetricKey = "spend" | "impressions" | "clicks" | "leads" | "cpl" | "followers" | "visits" | "sales" | "revenue";

const columns: { key: "date" | MetricKey; label: string; align: "left" | "right" }[] = [
  { key: "date", label: "Дата", align: "left" },
  { key: "spend", label: "Расходы", align: "right" },
  { key: "impressions", label: "Показы", align: "right" },
  { key: "clicks", label: "Клики", align: "right" },
  { key: "leads", label: "Лиды", align: "right" },
  { key: "cpl", label: "CPL", align: "right" },
  { key: "followers", label: "Подписч.", align: "right" },
  { key: "visits", label: "Визиты", align: "right" },
  { key: "sales", label: "Оплаты", align: "right" },
  { key: "revenue", label: "Выручка", align: "right" },
];

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const wd = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][d.getDay()];
  return `${day} ${wd}`;
};

/* ── Components ── */
function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">{label}</span>
      </div>
      <p className="text-xl font-mono font-bold text-foreground tabular-nums tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function PctCell({ value }: { value: number }) {
  const hit = value >= 100;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`text-xs font-bold font-mono tabular-nums ${hit ? "text-emerald-400" : "text-rose-400"}`}>
        {value}%
      </span>
      <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hit ? "bg-emerald-500" : "bg-rose-500"}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function ScoreboardPage() {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const prev = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(i => i - 1);
  };
  const next = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(i => i + 1);
  };

  // Use mock data (temporary)
  const plan = MOCK_PLAN;
  const dailyFacts = MOCK_DAILY;

  const fact = dailyFacts.reduce((acc, d) => ({
    spend: acc.spend + d.spend,
    impressions: acc.impressions + d.impressions,
    clicks: acc.clicks + d.clicks,
    leads: acc.leads + d.leads,
    followers: acc.followers + d.followers,
    visits: acc.visits + d.visits,
    sales: acc.sales + d.sales,
    revenue: acc.revenue + d.revenue,
  }), { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 });

  const factCpl = cpl(fact.spend, fact.leads);

  const getVal = (src: Record<string, number>, key: MetricKey): number => {
    if (key === "cpl") return cpl(src.spend, src.leads);
    return src[key] ?? 0;
  };

  const topCards = [
    { label: "Стоимость клиента (CAC)", value: fact.sales > 0 ? `${fmt(Math.round(fact.spend / fact.sales))} ₸` : "—", sub: "Расходы / Продажи", icon: DollarSign },
    { label: "Стоимость визита (CPV)", value: fact.visits > 0 ? `${fmt(Math.round(fact.spend / fact.visits))} ₸` : "—", sub: "Расходы / Визиты", icon: Eye },
    { label: "Стоимость лида (CPL)", value: fact.leads > 0 ? `${fmt(factCpl)} ₸` : "—", sub: "Расходы / Лиды", icon: Target },
    { label: "CR (Клики → Лиды)", value: fact.clicks > 0 ? `${Math.round((fact.leads / fact.clicks) * 100)}%` : "—", sub: "Лиды / Клики", icon: ArrowRightLeft },
    { label: "CR (Визиты → Продажи)", value: fact.visits > 0 ? `${Math.round((fact.sales / fact.visits) * 100)}%` : "—", sub: "Продажи / Визиты", icon: TrendingUp },
  ];

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {topCards.map(c => <KpiCard key={c.label} {...c} />)}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground px-2 select-none min-w-[120px] text-center">
              {MONTHS[monthIndex]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="gap-2 text-xs h-8 border-border/50">
            <Download className="h-3.5 w-3.5" />Экспорт таблицы
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden [&_tr]:border-b-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/10 bg-muted/30">
                  {columns.map(col => (
                    <TableHead
                      key={col.key}
                      className={`text-[10px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap px-3 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* PLAN */}
                <TableRow className="bg-blue-500/[0.06] border-b border-border/10 hover:bg-blue-500/[0.08]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "font-semibold text-blue-400 text-left" : "text-right text-blue-400/80"}`}>
                      {col.key === "date" ? `🎯 ПЛАН (${MONTHS[monthIndex]})` : fmt(getVal(plan as unknown as Record<string, number>, col.key as MetricKey))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FACT */}
                <TableRow className="bg-primary/[0.04] border-b border-border/10 hover:bg-primary/[0.06]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums font-bold ${col.key === "date" ? "text-foreground text-left" : "text-right text-foreground"}`}>
                      {col.key === "date" ? "📊 ФАКТ" : fmt(getVal(fact as unknown as Record<string, number>, col.key as MetricKey))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* PCT */}
                <TableRow className="border-b border-border/10 bg-muted/10">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.key === "date" ? (
                        <span className="text-xs font-semibold text-amber-400 font-mono">⚡ % ВЫПОЛН.</span>
                      ) : (
                        <PctCell value={pct(getVal(fact as unknown as Record<string, number>, col.key as MetricKey), getVal(plan as unknown as Record<string, number>, col.key as MetricKey))} />
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Daily rows */}
                {dailyFacts.map((row, i) => (
                  <TableRow
                    key={row.date}
                    className={`border-b border-border/5 transition-colors hover:bg-accent/30 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/[0.03]"}`}
                  >
                    {columns.map(col => (
                      <TableCell key={col.key} className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "text-left text-muted-foreground font-medium" : "text-right text-foreground/80"}`}>
                        {col.key === "date" ? fmtDate(row.date) : fmt(col.key === "cpl" ? cpl(row.spend, row.leads) : (row as unknown as Record<string, number>)[col.key] ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
