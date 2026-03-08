import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye,
  ArrowRightLeft, Target, TrendingUp, Inbox,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";

/* ── helpers ── */
const fmt = (v: number) => v.toLocaleString("ru-RU");
const pct = (fact: number, plan: number) => (plan > 0 ? Math.round((fact / plan) * 100) : 0);
const cplCalc = (spend: number, leads: number) => (leads > 0 ? Math.round(spend / leads) : 0);

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

interface DailyRow {
  id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
  plan_spend: number;
  plan_leads: number;
  plan_visits: number;
  plan_sales: number;
  plan_revenue: number;
}

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
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { active } = useWorkspace();

  const prev = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(i => i - 1);
  };
  const next = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(i => i + 1);
  };

  // Date range for selected month
  const dateFrom = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const dateTo = `${year}-${String(monthIndex + 1).padStart(2, "0")}-31`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("daily_metrics")
        .select("*")
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      setRows(
        (data || []).map((r: any) => ({
          id: r.id,
          date: r.date,
          spend: Number(r.spend) || 0,
          impressions: Number(r.impressions) || 0,
          clicks: Number(r.clicks) || 0,
          leads: Number(r.leads) || 0,
          followers: 0,
          visits: Number(r.visits) || 0,
          sales: Number(r.sales) || 0,
          revenue: Number(r.revenue) || 0,
          plan_spend: Number(r.plan_spend) || 0,
          plan_leads: Number(r.plan_leads) || 0,
          plan_visits: Number(r.plan_visits) || 0,
          plan_sales: Number(r.plan_sales) || 0,
          plan_revenue: Number(r.plan_revenue) || 0,
        }))
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("scoreboard_daily_metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Aggregations
  const fact = useMemo(() => rows.reduce(
    (acc, d) => ({
      spend: acc.spend + d.spend,
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      leads: acc.leads + d.leads,
      followers: acc.followers + d.followers,
      visits: acc.visits + d.visits,
      sales: acc.sales + d.sales,
      revenue: acc.revenue + d.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
  ), [rows]);

  const plan = useMemo(() => rows.reduce(
    (acc, d) => ({
      spend: acc.spend + d.plan_spend,
      impressions: 0,
      clicks: 0,
      leads: acc.leads + d.plan_leads,
      followers: 0,
      visits: acc.visits + d.plan_visits,
      sales: acc.sales + d.plan_sales,
      revenue: acc.revenue + d.plan_revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
  ), [rows]);

  const getVal = (src: Record<string, number>, key: MetricKey): number => {
    if (key === "cpl") return cplCalc(src.spend, src.leads);
    return src[key] ?? 0;
  };

  const topCards = [
    { label: "Стоимость клиента (CAC)", value: fact.sales > 0 ? `${fmt(Math.round(fact.spend / fact.sales))} ₸` : "—", sub: "Расходы / Продажи", icon: DollarSign },
    { label: "Стоимость визита (CPV)", value: fact.visits > 0 ? `${fmt(Math.round(fact.spend / fact.visits))} ₸` : "—", sub: "Расходы / Визиты", icon: Eye },
    { label: "Стоимость лида (CPL)", value: fact.leads > 0 ? `${fmt(cplCalc(fact.spend, fact.leads))} ₸` : "—", sub: "Расходы / Лиды", icon: Target },
    { label: "CR (Клики → Лиды)", value: fact.clicks > 0 ? `${Math.round((fact.leads / fact.clicks) * 100)}%` : "—", sub: "Лиды / Клики", icon: ArrowRightLeft },
    { label: "CR (Визиты → Продажи)", value: fact.visits > 0 ? `${Math.round((fact.sales / fact.visits) * 100)}%` : "—", sub: "Продажи / Визиты", icon: TrendingUp },
  ];

  const isEmpty = !loading && rows.length === 0;

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : topCards.map(c => <KpiCard key={c.label} {...c} />)
          }
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

        {/* Empty State */}
        {isEmpty && (
          <div className="rounded-xl border border-border bg-card p-16 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">Нет данных за текущий месяц</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Ожидание синхронизации с рекламными кабинетами. Данные появятся автоматически после первой загрузки метрик.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-none" />
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && rows.length > 0 && (
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
                        {col.key === "date" ? `🎯 ПЛАН (${MONTHS[monthIndex]})` : getVal(plan as unknown as Record<string, number>, col.key as MetricKey) > 0 ? fmt(getVal(plan as unknown as Record<string, number>, col.key as MetricKey)) : "—"}
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
                          getVal(plan as unknown as Record<string, number>, col.key as MetricKey) > 0
                            ? <PctCell value={pct(getVal(fact as unknown as Record<string, number>, col.key as MetricKey), getVal(plan as unknown as Record<string, number>, col.key as MetricKey))} />
                            : <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Daily rows */}
                  {rows.map((row, i) => (
                    <TableRow
                      key={row.id}
                      className={`border-b border-border/5 transition-colors hover:bg-accent/30 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/[0.03]"}`}
                    >
                      {columns.map(col => (
                        <TableCell key={col.key} className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "text-left text-muted-foreground font-medium" : "text-right text-foreground/80"}`}>
                          {col.key === "date"
                            ? fmtDate(row.date)
                            : col.key === "cpl"
                              ? (row.leads > 0 ? fmt(cplCalc(row.spend, row.leads)) : "—")
                              : ((row as unknown as Record<string, number>)[col.key] ?? 0) > 0
                                ? fmt((row as unknown as Record<string, number>)[col.key])
                                : "—"
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
