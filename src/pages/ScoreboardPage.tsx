import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye,
  ArrowRightLeft, Target, TrendingUp, Calculator, Save, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

/* ── helpers ── */
const fmt = (v: number) => Math.round(v).toLocaleString("ru-RU");
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

/* ── Decomposition Plan Editor ── */
interface DecompPlan {
  targetRevenue: number;
  avgCheck: number;
  cpl: number;
  cr1: number; // impressions → leads %
  cr2: number; // leads → visits %
  cr3: number; // visits → sales %
}

const DEFAULT_PLAN: DecompPlan = {
  targetRevenue: 5_000_000,
  avgCheck: 1_000_000,
  cpl: 3_000,
  cr1: 2,
  cr2: 30,
  cr3: 50,
};

const STORAGE_KEY = "scoreboard_decomp_plan";

function loadPlan(): DecompPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PLAN, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PLAN;
}

function calcPlanMetrics(p: DecompPlan) {
  const sales = p.avgCheck > 0 ? Math.ceil(p.targetRevenue / p.avgCheck) : 0;
  const visits = p.cr3 > 0 ? Math.ceil(sales / (p.cr3 / 100)) : 0;
  const leads = p.cr2 > 0 ? Math.ceil(visits / (p.cr2 / 100)) : 0;
  const spend = leads * p.cpl;
  const clicks = leads; // 1:1 proxy if no separate CR
  const impressions = p.cr1 > 0 ? Math.ceil(leads / (p.cr1 / 100)) : 0;
  return { spend, impressions, clicks, leads, followers: 0, visits, sales, revenue: p.targetRevenue };
}

function PlanInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={value || ""}
          onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
          className="h-8 text-xs font-mono tabular-nums bg-secondary/50 border-transparent focus:border-primary/40 transition-colors"
        />
        {suffix && <span className="text-[10px] text-muted-foreground shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function DecompositionPanel({ plan, onChange, planMetrics, onSaveToDB, saving }: {
  plan: DecompPlan;
  onChange: (p: DecompPlan) => void;
  planMetrics: ReturnType<typeof calcPlanMetrics>;
  onSaveToDB: () => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Декомпозиция цели → ПЛАН</p>
            <p className="text-[11px] text-muted-foreground">
              Цель: {fmt(plan.targetRevenue)} ₸ · Чек: {fmt(plan.avgCheck)} ₸ → {planMetrics.sales} продаж · {planMetrics.leads} лидов · {fmt(planMetrics.spend)} ₸ бюджет
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▼" : "▶"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            <PlanInput label="Целевая выручка" value={plan.targetRevenue} onChange={v => onChange({ ...plan, targetRevenue: v })} suffix="₸" />
            <PlanInput label="Средний чек" value={plan.avgCheck} onChange={v => onChange({ ...plan, avgCheck: v })} suffix="₸" />
            <PlanInput label="CPL (стоимость лида)" value={plan.cpl} onChange={v => onChange({ ...plan, cpl: v })} suffix="₸" />
            <PlanInput label="CR: Показ → Лид" value={plan.cr1} onChange={v => onChange({ ...plan, cr1: v })} suffix="%" />
            <PlanInput label="CR: Лид → Визит" value={plan.cr2} onChange={v => onChange({ ...plan, cr2: v })} suffix="%" />
            <PlanInput label="CR: Визит → Продажа" value={plan.cr3} onChange={v => onChange({ ...plan, cr3: v })} suffix="%" />
          </div>

          {/* Calculated funnel preview */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {[
              { label: "Показы", value: fmt(planMetrics.impressions) },
              { label: "Лиды", value: String(planMetrics.leads) },
              { label: "Визиты", value: String(planMetrics.visits) },
              { label: "Продажи", value: String(planMetrics.sales) },
              { label: "Бюджет", value: `${fmt(planMetrics.spend)} ₸` },
              { label: "Выручка", value: `${fmt(planMetrics.revenue)} ₸` },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="bg-secondary/60 rounded-lg px-3 py-1.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                  <p className="text-sm font-bold text-foreground tabular-nums font-mono">{step.value}</p>
                </div>
                {i < arr.length - 1 && <span className="text-muted-foreground/30">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={onSaveToDB} disabled={saving} className="gap-2 text-xs h-8">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Сохранить план в таблицу
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ── */
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
  const [saving, setSaving] = useState(false);
  const { active } = useWorkspace();

  // Decomposition plan state
  const [decompPlan, setDecompPlan] = useState<DecompPlan>(loadPlan);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decompPlan));
  }, [decompPlan]);

  const planMetrics = useMemo(() => calcPlanMetrics(decompPlan), [decompPlan]);

  const prev = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(i => i - 1);
  };
  const next = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(i => i + 1);
  };

  const dateFrom = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const dateTo = `${year}-${String(monthIndex + 1).padStart(2, "0")}-31`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });
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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("scoreboard_daily_metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Save decomposition plan to daily_metrics rows
  const savePlanToDB = async () => {
    setSaving(true);
    try {
      // Get number of days in the month
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      // Distribute plan evenly across days
      const dailyPlan = {
        plan_spend: Math.round(planMetrics.spend / daysInMonth),
        plan_leads: Math.round(planMetrics.leads / daysInMonth),
        plan_visits: Math.round(planMetrics.visits / daysInMonth),
        plan_sales: Math.round(planMetrics.sales / daysInMonth),
        plan_revenue: Math.round(planMetrics.revenue / daysInMonth),
      };

      // Upsert rows for each day
      const upsertRows = Array.from({ length: daysInMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, "0");
        const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day}`;
        return { date, ...dailyPlan };
      });

      // For each day, update plan columns if row exists, or insert new row
      for (const row of upsertRows) {
        const { data: existing } = await supabase
          .from("daily_metrics")
          .select("id")
          .eq("date", row.date)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from("daily_metrics")
            .update({
              plan_spend: row.plan_spend,
              plan_leads: row.plan_leads,
              plan_visits: row.plan_visits,
              plan_sales: row.plan_sales,
              plan_revenue: row.plan_revenue,
            })
            .eq("id", existing[0].id);
        } else {
          await supabase
            .from("daily_metrics")
            .insert({
              date: row.date,
              spend: 0,
              clicks: 0,
              impressions: 0,
              leads: 0,
              visits: 0,
              sales: 0,
              revenue: 0,
              plan_spend: row.plan_spend,
              plan_leads: row.plan_leads,
              plan_visits: row.plan_visits,
              plan_sales: row.plan_sales,
              plan_revenue: row.plan_revenue,
            });
        }
      }

      toast({ title: "План сохранён", description: `Декомпозиция распределена на ${daysInMonth} дней ${MONTHS[monthIndex]}` });
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка сохранения";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Aggregations — use decomposition plan (not DB plan columns) for ПЛАН row
  const plan = planMetrics;

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

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-6">
        {/* Decomposition Panel */}
        <DecompositionPanel
          plan={decompPlan}
          onChange={setDecompPlan}
          planMetrics={planMetrics}
          onSaveToDB={savePlanToDB}
          saving={saving}
        />

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

        {/* Table — ALWAYS visible */}
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
                {/* PLAN — always from decomposition */}
                <TableRow className="bg-blue-500/[0.06] border-b border-border/10 hover:bg-blue-500/[0.08]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "font-semibold text-blue-400 text-left" : "text-right text-blue-400/80"}`}>
                      {col.key === "date"
                        ? `🎯 ПЛАН (${MONTHS[monthIndex]})`
                        : getVal(plan as unknown as Record<string, number>, col.key as MetricKey) > 0
                          ? fmt(getVal(plan as unknown as Record<string, number>, col.key as MetricKey))
                          : "—"
                      }
                    </TableCell>
                  ))}
                </TableRow>

                {/* FACT */}
                <TableRow className="bg-primary/[0.04] border-b border-border/10 hover:bg-primary/[0.06]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums font-bold ${col.key === "date" ? "text-foreground text-left" : "text-right text-foreground"}`}>
                      {col.key === "date"
                        ? "📊 ФАКТ"
                        : getVal(fact as unknown as Record<string, number>, col.key as MetricKey) > 0
                          ? fmt(getVal(fact as unknown as Record<string, number>, col.key as MetricKey))
                          : "0"
                      }
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

                {/* Loading */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}

                {/* Empty state inside table */}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">Нет фактических данных за {MONTHS[monthIndex]} {year}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Данные появятся автоматически после синхронизации с рекламными кабинетами</p>
                    </TableCell>
                  </TableRow>
                )}

                {/* Daily rows */}
                {!loading && rows.map((row, i) => (
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
      </div>
    </DashboardLayout>
  );
}
