import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye,
  ArrowRightLeft, Target, TrendingUp, Loader2, BarChart3, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

/* ── helpers ── */
const fmt = (v: number) => Math.round(v).toLocaleString("ru-RU");
const pct = (fact: number, plan: number) => (plan > 0 ? Math.round((fact / plan) * 100) : 0);
const cplCalc = (spend: number, leads: number) => (leads > 0 ? Math.round(spend / leads) : 0);

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

interface DailyRow {
  id: string; date: string;
  spend: number; impressions: number; clicks: number; leads: number;
  followers: number; visits: number; sales: number; revenue: number;
}

interface ClientAccount { id: string; client_name: string; }

type PlanKey = "spend" | "leads" | "followers" | "visits" | "sales" | "revenue";
type MetricKey = "spend" | "leads" | "cpl" | "followers" | "visits" | "sales" | "revenue";

const columns: { key: "date" | MetricKey; label: string; align: "left" | "right" }[] = [
  { key: "date", label: "Дата", align: "left" },
  { key: "spend", label: "Расходы", align: "right" },
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
  const warn = value >= 70;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`text-xs font-bold font-mono tabular-nums ${
        hit ? "text-[hsl(var(--status-good))]" : warn ? "text-[hsl(var(--status-warning))]" : "text-destructive"
      }`}>
        {value}%
      </span>
      <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden max-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${
            hit ? "bg-[hsl(var(--status-good))]" : warn ? "bg-[hsl(var(--status-warning))]" : "bg-destructive"
          }`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── CSV Export ── */
function exportToCsv(
  monthLabel: string,
  columns: { key: string; label: string }[],
  planValues: Record<string, number>,
  fact: Record<string, number>,
  fullMonth: (DailyRow & { hasData: boolean })[],
  getVal: (src: Record<string, number>, key: MetricKey) => number,
) {
  const sep = ";";
  const lines: string[] = [];

  // Header
  lines.push(columns.map(c => c.label).join(sep));

  // Plan row
  lines.push(columns.map(c => {
    if (c.key === "date") return "ПЛАН";
    const v = getVal(planValues, c.key as MetricKey);
    return v > 0 ? String(Math.round(v)) : "";
  }).join(sep));

  // Fact row
  lines.push(columns.map(c => {
    if (c.key === "date") return "ФАКТ";
    const v = getVal(fact, c.key as MetricKey);
    return String(Math.round(v));
  }).join(sep));

  // % row
  lines.push(columns.map(c => {
    if (c.key === "date") return "% ВЫПОЛН.";
    const planVal = getVal(planValues, c.key as MetricKey);
    const factVal = getVal(fact, c.key as MetricKey);
    return planVal > 0 ? `${pct(factVal, planVal)}%` : "";
  }).join(sep));

  // Empty separator
  lines.push("");

  // Daily rows
  fullMonth.forEach(row => {
    lines.push(columns.map(c => {
      if (c.key === "date") return row.date;
      if (c.key === "cpl") return row.leads > 0 ? String(cplCalc(row.spend, row.leads)) : "";
      const v = (row as unknown as Record<string, number>)[c.key] ?? 0;
      return v > 0 ? String(Math.round(v)) : "";
    }).join(sep));
  });

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scoreboard_${monthLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  toast({ title: "✅ Экспорт готов", description: `Файл scoreboard_${monthLabel}.csv скачан` });
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

type PlanValues = Record<PlanKey, number>;
const EMPTY_PLAN: PlanValues = { spend: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 };

export default function ScoreboardPage() {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planValues, setPlanValues] = useState<PlanValues>({ ...EMPTY_PLAN });
  const { active } = useWorkspace();

  // Ad Account filter
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("__none__");

  const monthYear = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const prev = () => { if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); } else setMonthIndex(i => i - 1); };
  const next = () => { if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); } else setMonthIndex(i => i + 1); };

  const dateFrom = `${monthYear}-01`;
  const dateTo = `${monthYear}-31`;

  // Fetch accounts, auto-select first
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data, error } = await supabase
          .from("clients_config")
          .select("id, client_name")
          .eq("is_active", true)
          .order("client_name");
        if (error) throw error;
        const accs = (data || []) as ClientAccount[];
        setAccounts(accs);
        if (accs.length > 0 && selectedAccountId === "__none__") {
          setSelectedAccountId(accs[0].id);
        }
      } catch {
        setAccounts([]);
      }
    }
    fetchAccounts();
  }, []);

  // Fetch daily facts — filtered by account
  const fetchDaily = useCallback(async () => {
    if (selectedAccountId === "__none__") { setRows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const query = supabase.from("daily_metrics").select("*")
        .gte("date", dateFrom).lte("date", dateTo)
        .eq("client_config_id", selectedAccountId)
        .order("date", { ascending: true });

      const { data, error } = await query;
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
  }, [dateFrom, dateTo, selectedAccountId]);

  // Fetch monthly plan
  const fetchPlan = useCallback(async () => {
    try {
      const { data } = await (supabase as any).from("monthly_plans").select("*")
        .eq("month_year", monthYear).limit(1);
      if (data && data.length > 0) {
        const p = data[0];
        setPlanValues({
          spend: Number(p.plan_spend) || 0,
          leads: Number(p.plan_leads) || 0,
          followers: Number(p.plan_followers) || 0,
          visits: Number(p.plan_visits) || 0,
          sales: Number(p.plan_sales) || 0,
          revenue: Number(p.plan_revenue) || 0,
        });
      } else {
        setPlanValues({ ...EMPTY_PLAN });
      }
    } catch { setPlanValues({ ...EMPTY_PLAN }); }
  }, [monthYear]);

  useEffect(() => { fetchDaily(); fetchPlan(); }, [fetchDaily, fetchPlan]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("scoreboard_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => fetchDaily())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDaily]);

  useEffect(() => {
    const ch = supabase.channel("scoreboard_plan_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "monthly_plans" }, () => fetchPlan())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchPlan]);

  // Full month grid
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const fullMonth = useMemo(() => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const rowMap = new Map(rows.map(r => [r.date, r]));
    const result: (DailyRow & { hasData: boolean })[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const existing = rowMap.get(iso);
      result.push(existing
        ? { ...existing, hasData: true }
        : { id: iso, date: iso, spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0, hasData: false }
      );
    }
    return result;
  }, [rows, year, monthIndex]);

  // Aggregated fact
  const fact = useMemo(() => rows.reduce(
    (acc, d) => ({
      spend: acc.spend + d.spend, leads: acc.leads + d.leads,
      followers: acc.followers + d.followers, visits: acc.visits + d.visits,
      sales: acc.sales + d.sales, revenue: acc.revenue + d.revenue,
    }),
    { spend: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
  ), [rows]);

  const getVal = (src: Record<string, number>, key: MetricKey): number => {
    if (key === "cpl") return cplCalc(src.spend, src.leads);
    return src[key] ?? 0;
  };

  const hasPlan = Object.values(planValues).some(v => v > 0);

  const topCards = useMemo(() => [
    { label: "CAC", value: fact.sales > 0 ? `${fmt(Math.round(fact.spend / fact.sales))} ₸` : "—", sub: "Расходы / Продажи", icon: DollarSign },
    { label: "CPV", value: fact.visits > 0 ? `${fmt(Math.round(fact.spend / fact.visits))} ₸` : "—", sub: "Расходы / Визиты", icon: Eye },
    { label: "CPL", value: fact.leads > 0 ? `${fmt(cplCalc(fact.spend, fact.leads))} ₸` : "—", sub: "Расходы / Лиды", icon: Target },
    { label: "CR Лид→Визит", value: fact.leads > 0 ? `${Math.round((fact.visits / fact.leads) * 100)}%` : "—", sub: "Визиты / Лиды", icon: ArrowRightLeft },
    { label: "CR Визит→Продажа", value: fact.visits > 0 ? `${Math.round((fact.sales / fact.visits) * 100)}%` : "—", sub: "Продажи / Визиты", icon: TrendingUp },
  ], [fact]);

  const daysWithData = rows.length;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayProgress = Math.round((daysWithData / daysInMonth) * 100);

  const handleExport = () => {
    exportToCsv(
      `${MONTHS[monthIndex]}_${year}`,
      columns,
      planValues as unknown as Record<string, number>,
      fact as unknown as Record<string, number>,
      fullMonth,
      getVal,
    );
  };

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-4 md:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Таблица показателей</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysWithData > 0 ? `${daysWithData} дней с данными из ${daysInMonth}` : "Ежедневная сводка метрик по кабинету"}
              </p>
            </div>
          </div>
          {daysWithData > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20">
                <Progress value={dayProgress} className="h-1.5 bg-secondary" />
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold tabular-nums bg-primary/5 text-primary border-primary/15">
                {dayProgress}% месяца
              </Badge>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : topCards.map(c => <KpiCard key={c.label} {...c} />)
          }
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground px-3 select-none min-w-[130px] text-center tabular-nums">
                {MONTHS[monthIndex]} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Ad Account Selector */}
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="h-9 w-[220px] text-xs bg-card border-border rounded-xl">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Выберите кабинет" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 ? (
                  <SelectItem value="__none__" disabled>Нет кабинетов</SelectItem>
                ) : (
                  accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.client_name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {!hasPlan && (
              <p className="text-[11px] text-muted-foreground/50 mr-2">План не задан — Финансы → Декомпозиция</p>
            )}
            <Button
              variant="outline"
              className="gap-2 text-xs h-9 border-border rounded-xl hover:border-primary/20"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              Экспорт CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/20">
                  {columns.map(col => (
                    <TableHead
                      key={col.key}
                      className={`text-[10px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap px-3 py-3 ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── PLAN ROW ── */}
                <TableRow className="bg-primary/[0.03] border-b border-border hover:bg-primary/[0.06]">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.key === "date" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                            <Target className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-semibold text-primary text-xs">ПЛАН</span>
                        </div>
                      ) : (
                        <span className="text-primary/80 font-semibold">
                          {getVal(planValues as unknown as Record<string, number>, col.key as MetricKey) > 0
                            ? fmt(getVal(planValues as unknown as Record<string, number>, col.key as MetricKey))
                            : "—"
                          }
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── FACT ROW ── */}
                <TableRow className="bg-secondary/20 border-b border-border hover:bg-secondary/30">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums font-bold ${col.key === "date" ? "text-foreground text-left" : "text-right text-foreground"}`}>
                      {col.key === "date" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-md bg-secondary flex items-center justify-center">
                            <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="font-semibold text-foreground text-xs">ФАКТ</span>
                        </div>
                      ) : (
                        getVal(fact as unknown as Record<string, number>, col.key as MetricKey) > 0
                          ? fmt(getVal(fact as unknown as Record<string, number>, col.key as MetricKey))
                          : "0"
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── PCT ROW ── */}
                <TableRow className="border-b-2 border-border bg-muted/10 hover:bg-muted/20">
                  {columns.map(col => (
                    <TableCell key={col.key} className={`px-3 py-3 whitespace-nowrap ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.key === "date" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-md bg-[hsl(var(--status-warning)/0.1)] flex items-center justify-center">
                            <TrendingUp className="h-3 w-3 text-[hsl(var(--status-warning))]" />
                          </div>
                          <span className="text-xs font-semibold text-[hsl(var(--status-warning))]">% ВЫПОЛН.</span>
                        </div>
                      ) : (
                        getVal(planValues as unknown as Record<string, number>, col.key as MetricKey) > 0
                          ? <PctCell value={pct(getVal(fact as unknown as Record<string, number>, col.key as MetricKey), getVal(planValues as unknown as Record<string, number>, col.key as MetricKey))} />
                          : <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── Loading ── */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Загрузка данных…</p>
                    </TableCell>
                  </TableRow>
                )}

                {/* No account selected */}
                {!loading && selectedAccountId === "__none__" && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-semibold text-foreground">Выберите рекламный кабинет</p>
                      <p className="text-xs text-muted-foreground mt-1">Данные отображаются по конкретному кабинету</p>
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Daily rows ── */}
                {!loading && selectedAccountId !== "__none__" && fullMonth.map((row, i) => {
                  const isToday = row.date === todayIso;
                  const isFuture = row.date > todayIso;
                  const isWeekend = (() => {
                    const d = new Date(row.date + "T00:00:00");
                    return d.getDay() === 0 || d.getDay() === 6;
                  })();

                  return (
                    <TableRow
                      key={row.id}
                      className={`border-b border-border/40 transition-colors ${
                        isToday
                          ? "bg-primary/[0.06] border-l-2 border-l-primary"
                          : isWeekend && !isFuture
                          ? "bg-muted/[0.06]"
                          : ""
                      } ${isFuture ? "opacity-30" : "hover:bg-accent/20"}`}
                    >
                      {columns.map(col => (
                        <TableCell key={col.key} className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums ${
                          col.key === "date"
                            ? `text-left font-medium ${isToday ? "text-primary font-bold" : isWeekend ? "text-muted-foreground/60" : "text-muted-foreground"}`
                            : "text-right text-foreground/80"
                        }`}>
                          {col.key === "date" ? (
                            <div className="flex items-center gap-1.5">
                              <span>{fmtDate(row.date)}</span>
                              {isToday && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                          ) : isFuture ? (
                            <span className="text-muted-foreground/20">—</span>
                          ) : col.key === "cpl" ? (
                            row.leads > 0 ? (
                              <span>{fmt(cplCalc(row.spend, row.leads))}</span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )
                          ) : ((row as unknown as Record<string, number>)[col.key] ?? 0) > 0 ? (
                            <span className={col.key === "revenue" && (row as unknown as Record<string, number>)[col.key] > 0 ? "text-primary font-semibold" : ""}>
                              {fmt((row as unknown as Record<string, number>)[col.key])}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
