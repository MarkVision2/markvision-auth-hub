import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye,
  ArrowRightLeft, Target, TrendingUp, Calculator, Save, Loader2, Pencil,
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
}

/* Editable plan keys that map to monthly_plans columns */
type PlanKey = "spend" | "impressions" | "clicks" | "leads" | "followers" | "visits" | "sales" | "revenue";
const PLAN_DB_MAP: Record<PlanKey, string> = {
  spend: "plan_spend",
  impressions: "plan_impressions",
  clicks: "plan_clicks",
  leads: "plan_leads",
  followers: "plan_followers",
  visits: "plan_visits",
  sales: "plan_sales",
  revenue: "plan_revenue",
};

type MetricKey = "spend" | "impressions" | "clicks" | "leads" | "cpl" | "followers" | "visits" | "sales" | "revenue";

const columns: { key: "date" | MetricKey; label: string; align: "left" | "right"; editable: boolean }[] = [
  { key: "date", label: "Дата", align: "left", editable: false },
  { key: "spend", label: "Расходы", align: "right", editable: true },
  { key: "impressions", label: "Показы", align: "right", editable: true },
  { key: "clicks", label: "Клики", align: "right", editable: true },
  { key: "leads", label: "Лиды", align: "right", editable: true },
  { key: "cpl", label: "CPL", align: "right", editable: false }, // calculated
  { key: "followers", label: "Подписч.", align: "right", editable: true },
  { key: "visits", label: "Визиты", align: "right", editable: true },
  { key: "sales", label: "Оплаты", align: "right", editable: true },
  { key: "revenue", label: "Выручка", align: "right", editable: true },
];

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const wd = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][d.getDay()];
  return `${day} ${wd}`;
};

/* ── Inline Editable Cell ── */
function EditableCell({ value, onChange, onCommit }: {
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-right font-mono text-xs tabular-nums text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 rounded px-1.5 py-1 transition-colors cursor-text group"
      >
        {value > 0 ? fmt(value) : <span className="text-blue-400/30">0</span>}
        <Pencil className="inline-block h-2.5 w-2.5 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type="number"
      value={value || ""}
      onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
      onBlur={() => { setEditing(false); onCommit(); }}
      onKeyDown={e => { if (e.key === "Enter") { setEditing(false); onCommit(); } }}
      className="h-7 w-[100px] text-xs font-mono tabular-nums text-right bg-blue-500/10 border-blue-500/30 text-blue-300 rounded px-2 focus:border-blue-400"
    />
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

/* ── Decomposition Panel ── */
interface DecompPlan {
  targetRevenue: number;
  avgCheck: number;
  cpl: number;
  cr1: number;
  cr2: number;
  cr3: number;
}

const DEFAULT_DECOMP: DecompPlan = { targetRevenue: 5_000_000, avgCheck: 1_000_000, cpl: 3_000, cr1: 2, cr2: 30, cr3: 50 };
const DECOMP_KEY = "scoreboard_decomp_plan";

function loadDecomp(): DecompPlan {
  try { const r = localStorage.getItem(DECOMP_KEY); if (r) return { ...DEFAULT_DECOMP, ...JSON.parse(r) }; } catch { /* */ }
  return DEFAULT_DECOMP;
}

function calcDecomp(p: DecompPlan) {
  const sales = p.avgCheck > 0 ? Math.ceil(p.targetRevenue / p.avgCheck) : 0;
  const visits = p.cr3 > 0 ? Math.ceil(sales / (p.cr3 / 100)) : 0;
  const leads = p.cr2 > 0 ? Math.ceil(visits / (p.cr2 / 100)) : 0;
  const spend = leads * p.cpl;
  const impressions = p.cr1 > 0 ? Math.ceil(leads / (p.cr1 / 100)) : 0;
  return { spend, impressions, clicks: leads, leads, followers: 0, visits, sales, revenue: p.targetRevenue };
}

function DecompInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        <Input type="number" value={value || ""} onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
          className="h-8 text-xs font-mono tabular-nums bg-secondary/50 border-transparent focus:border-primary/40 transition-colors" />
        {suffix && <span className="text-[10px] text-muted-foreground shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function DecompositionPanel({ decomp, onChange, decompMetrics, onApplyToPlan }: {
  decomp: DecompPlan; onChange: (d: DecompPlan) => void; decompMetrics: ReturnType<typeof calcDecomp>; onApplyToPlan: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Декомпозиция цели</p>
            <p className="text-[11px] text-muted-foreground">
              {fmt(decomp.targetRevenue)} ₸ / чек {fmt(decomp.avgCheck)} ₸ → {decompMetrics.sales} продаж · {decompMetrics.leads} лидов · {fmt(decompMetrics.spend)} ₸ бюджет
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▼" : "▶"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            <DecompInput label="Целевая выручка" value={decomp.targetRevenue} onChange={v => onChange({ ...decomp, targetRevenue: v })} suffix="₸" />
            <DecompInput label="Средний чек" value={decomp.avgCheck} onChange={v => onChange({ ...decomp, avgCheck: v })} suffix="₸" />
            <DecompInput label="CPL" value={decomp.cpl} onChange={v => onChange({ ...decomp, cpl: v })} suffix="₸" />
            <DecompInput label="CR: Показ→Лид" value={decomp.cr1} onChange={v => onChange({ ...decomp, cr1: v })} suffix="%" />
            <DecompInput label="CR: Лид→Визит" value={decomp.cr2} onChange={v => onChange({ ...decomp, cr2: v })} suffix="%" />
            <DecompInput label="CR: Визит→Продажа" value={decomp.cr3} onChange={v => onChange({ ...decomp, cr3: v })} suffix="%" />
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {[
              { label: "Показы", value: fmt(decompMetrics.impressions) },
              { label: "Лиды", value: String(decompMetrics.leads) },
              { label: "Визиты", value: String(decompMetrics.visits) },
              { label: "Продажи", value: String(decompMetrics.sales) },
              { label: "Бюджет", value: `${fmt(decompMetrics.spend)} ₸` },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="bg-secondary/60 rounded-lg px-3 py-1.5 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-bold text-foreground tabular-nums font-mono">{s.value}</p>
                </div>
                {i < arr.length - 1 && <span className="text-muted-foreground/30">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={onApplyToPlan} className="gap-2 text-xs h-8">
              <Target className="h-3.5 w-3.5" />Применить к ПЛАНУ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

type PlanValues = Record<PlanKey, number>;
const EMPTY_PLAN: PlanValues = { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 };

export default function ScoreboardPage() {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planValues, setPlanValues] = useState<PlanValues>({ ...EMPTY_PLAN });
  const [planDirty, setPlanDirty] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const { active } = useWorkspace();

  // Decomposition
  const [decomp, setDecomp] = useState<DecompPlan>(loadDecomp);
  useEffect(() => { localStorage.setItem(DECOMP_KEY, JSON.stringify(decomp)); }, [decomp]);
  const decompMetrics = useMemo(() => calcDecomp(decomp), [decomp]);

  const monthYear = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const prev = () => { if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); } else setMonthIndex(i => i - 1); };
  const next = () => { if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); } else setMonthIndex(i => i + 1); };

  const dateFrom = `${monthYear}-01`;
  const dateTo = `${monthYear}-31`;

  // Fetch daily facts
  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("daily_metrics").select("*")
        .gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: true });
      if (error) throw error;
      setRows((data || []).map((r: any) => ({
        id: r.id, date: r.date,
        spend: Number(r.spend) || 0, impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0, leads: Number(r.leads) || 0,
        followers: 0, visits: Number(r.visits) || 0,
        sales: Number(r.sales) || 0, revenue: Number(r.revenue) || 0,
      })));
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  // Fetch monthly plan
  const fetchPlan = useCallback(async () => {
    try {
      const { data } = await (supabase as any).from("monthly_plans").select("*")
        .eq("month_year", monthYear).limit(1);
      if (data && data.length > 0) {
        const p = data[0];
        setPlanValues({
          spend: Number(p.plan_spend) || 0,
          impressions: Number(p.plan_impressions) || 0,
          clicks: Number(p.plan_clicks) || 0,
          leads: Number(p.plan_leads) || 0,
          followers: Number(p.plan_followers) || 0,
          visits: Number(p.plan_visits) || 0,
          sales: Number(p.plan_sales) || 0,
          revenue: Number(p.plan_revenue) || 0,
        });
      } else {
        setPlanValues({ ...EMPTY_PLAN });
      }
      setPlanDirty(false);
    } catch { setPlanValues({ ...EMPTY_PLAN }); }
  }, [monthYear]);

  useEffect(() => { fetchDaily(); fetchPlan(); }, [fetchDaily, fetchPlan]);

  // Realtime for daily_metrics
  useEffect(() => {
    const ch = supabase.channel("scoreboard_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => fetchDaily())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDaily]);

  // Update a single plan field
  const updatePlanField = (key: PlanKey, value: number) => {
    setPlanValues(prev => ({ ...prev, [key]: value }));
    setPlanDirty(true);
  };

  // Save plan to monthly_plans via upsert
  const savePlan = async () => {
    setSavingPlan(true);
    try {
      const payload: Record<string, any> = { month_year: monthYear };
      for (const [k, dbCol] of Object.entries(PLAN_DB_MAP)) {
        payload[dbCol] = planValues[k as PlanKey];
      }

      // Check if exists
      const { data: existing } = await (supabase as any).from("monthly_plans")
        .select("id").eq("month_year", monthYear).limit(1);

      if (existing && existing.length > 0) {
        const { error } = await (supabase as any).from("monthly_plans")
          .update(payload).eq("id", existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("monthly_plans").insert(payload);
        if (error) throw error;
      }

      setPlanDirty(false);
      toast({ title: "План сохранён", description: `${MONTHS[monthIndex]} ${year}` });
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось сохранить", variant: "destructive" });
    } finally { setSavingPlan(false); }
  };

  // Apply decomposition → plan
  const applyDecompToPlan = () => {
    setPlanValues({
      spend: decompMetrics.spend,
      impressions: decompMetrics.impressions,
      clicks: decompMetrics.clicks,
      leads: decompMetrics.leads,
      followers: decompMetrics.followers,
      visits: decompMetrics.visits,
      sales: decompMetrics.sales,
      revenue: decompMetrics.revenue,
    });
    setPlanDirty(true);
  };

  // Aggregated fact
  const fact = useMemo(() => rows.reduce(
    (acc, d) => ({
      spend: acc.spend + d.spend, impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks, leads: acc.leads + d.leads,
      followers: acc.followers + d.followers, visits: acc.visits + d.visits,
      sales: acc.sales + d.sales, revenue: acc.revenue + d.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
  ), [rows]);

  const getVal = (src: Record<string, number>, key: MetricKey): number => {
    if (key === "cpl") return cplCalc(src.spend, src.leads);
    return src[key] ?? 0;
  };

  const topCards = [
    { label: "CAC", value: fact.sales > 0 ? `${fmt(Math.round(fact.spend / fact.sales))} ₸` : "—", sub: "Расходы / Продажи", icon: DollarSign },
    { label: "CPV", value: fact.visits > 0 ? `${fmt(Math.round(fact.spend / fact.visits))} ₸` : "—", sub: "Расходы / Визиты", icon: Eye },
    { label: "CPL", value: fact.leads > 0 ? `${fmt(cplCalc(fact.spend, fact.leads))} ₸` : "—", sub: "Расходы / Лиды", icon: Target },
    { label: "CR Клик→Лид", value: fact.clicks > 0 ? `${Math.round((fact.leads / fact.clicks) * 100)}%` : "—", sub: "Лиды / Клики", icon: ArrowRightLeft },
    { label: "CR Визит→Продажа", value: fact.visits > 0 ? `${Math.round((fact.sales / fact.visits) * 100)}%` : "—", sub: "Продажи / Визиты", icon: TrendingUp },
  ];

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-6">
        {/* Decomposition */}
        <DecompositionPanel decomp={decomp} onChange={setDecomp} decompMetrics={decompMetrics} onApplyToPlan={applyDecompToPlan} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : topCards.map(c => <KpiCard key={c.label} {...c} />)
          }
        </div>

        {/* Month Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold text-foreground px-2 select-none min-w-[120px] text-center">{MONTHS[monthIndex]} {year}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            {planDirty && (
              <Button onClick={savePlan} disabled={savingPlan} className="gap-2 text-xs h-8 animate-in fade-in">
                {savingPlan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                💾 Сохранить план
              </Button>
            )}
            <Button variant="outline" className="gap-2 text-xs h-8 border-border/50">
              <Download className="h-3.5 w-3.5" />Экспорт
            </Button>
          </div>
        </div>

        {/* Table — always visible */}
        <div className="rounded-xl border border-border bg-card overflow-hidden [&_tr]:border-b-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/10 bg-muted/30">
                  {columns.map(col => (
                    <TableHead key={col.key} className={`text-[10px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap px-3 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── PLAN ROW (editable) ── */}
                <TableRow className="bg-blue-500/[0.06] border-b border-border/10 hover:bg-blue-500/[0.08]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.key === "date" ? (
                        <span className="font-semibold text-blue-400 font-mono text-xs">🎯 ПЛАН ({MONTHS[monthIndex]})</span>
                      ) : col.editable ? (
                        <EditableCell
                          value={planValues[col.key as PlanKey] ?? 0}
                          onChange={v => updatePlanField(col.key as PlanKey, v)}
                          onCommit={() => { /* auto-save on dirty indicator */ }}
                        />
                      ) : col.key === "cpl" ? (
                        <span className="font-mono text-xs tabular-nums text-blue-400/80">
                          {planValues.leads > 0 ? fmt(cplCalc(planValues.spend, planValues.leads)) : "—"}
                        </span>
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── FACT ROW ── */}
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

                {/* ── PCT ROW ── */}
                <TableRow className="border-b border-border/10 bg-muted/10">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.key === "date" ? (
                        <span className="text-xs font-semibold text-amber-400 font-mono">⚡ % ВЫПОЛН.</span>
                      ) : (
                        getVal(planValues as unknown as Record<string, number>, col.key as MetricKey) > 0
                          ? <PctCell value={pct(getVal(fact as unknown as Record<string, number>, col.key as MetricKey), getVal(planValues as unknown as Record<string, number>, col.key as MetricKey))} />
                          : <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── Loading ── */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Empty daily data ── */}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10">
                      <p className="text-sm text-muted-foreground">Нет фактических данных за {MONTHS[monthIndex]} {year}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Данные появятся автоматически после синхронизации</p>
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Daily rows ── */}
                {!loading && rows.map((row, i) => (
                  <TableRow key={row.id} className={`border-b border-border/5 transition-colors hover:bg-accent/30 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/[0.03]"}`}>
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
