import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useScoreboardData } from "@/hooks/useScoreboardData";
import { exportToCsv } from "@/utils/exportUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar, Download, TrendingUp, DollarSign, Target, Eye, ArrowRightLeft,
  Loader2, MoreHorizontal, ChevronLeft, ChevronRight, LayoutDashboard, Share2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

type MetricKey = "spend" | "impressions" | "clicks" | "leads" | "cpl" | "followers" | "visits" | "sales" | "revenue";

interface Column {
  key: MetricKey | "date";
  label: string;
}

const columns: Column[] = [
  { key: "date", label: "Дата" },
  { key: "spend", label: "Расход" },
  { key: "leads", label: "Лиды" },
  { key: "cpl", label: "CPL" },
  { key: "followers", label: "Подписчики" },
  { key: "visits", label: "Визиты" },
  { key: "sales", label: "Оплаты" },
  { key: "revenue", label: "Выручка" },
];

interface Account {
  id: string;
  name: string;
}

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

const EMPTY_PLAN = {
  spend: 0,
  leads: 0,
  followers: 0,
  visits: 0,
  sales: 0,
  revenue: 0,
};

const fmt = (v: number) => Math.round(v).toLocaleString("ru-RU");
const cplCalc = (s: number, l: number) => (l > 0 ? Math.round(s / l) : 0);

export default function ScoreboardPage() {
  const { active, isAgency } = useWorkspace();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("__none__");
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [planValues, setPlanValues] = useState(EMPTY_PLAN);
  const [loading, setLoading] = useState(true);

  const monthYear = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  // Initial accounts load and project sync
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    console.log("Scoreboard: active.id changed to:", active.id);

    async function fetchAccounts() {
      try {
        let query = (supabase as any)
          .from("clients_config")
          .select("id, client_name")
          .eq("is_active", true);

        const currentActiveId = active?.id;
        if (isAgency) {
          query = query.eq("project_id", currentActiveId);
        } else {
          const { data: shared } = await (supabase as any)
            .from("client_config_visibility")
            .select("client_config_id")
            .eq("project_id", currentActiveId);

          if (cancelled) return;

          const sharedCabIds = (shared || []).map((s: any) => s.client_config_id);
          if (sharedCabIds.length > 0) {
            query = query.or(`project_id.eq.${currentActiveId},id.in.(${sharedCabIds.join(",")})`);
          } else {
            query = query.eq("project_id", currentActiveId);
          }
        }

        const { data, error } = await query.order("client_name");
        if (cancelled) return;
        if (error) {
          console.error("Scoreboard: fetchAccounts DB error:", error);
          throw error;
        }

        const finalAccs: Account[] = (data || []).map((d: any) => ({
          id: d.id,
          name: d.client_name,
        }));

        setAccounts(finalAccs);

        if (finalAccs.length > 0) {
          if (selectedAccountId === "__none__" || !finalAccs.find(a => a.id === selectedAccountId)) {
            setSelectedAccountId("all");
          }
        } else {
          setSelectedAccountId("__none__");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Scoreboard: fetchAccounts error:", err);
        setAccounts([]);
      }
    }

    // Reset before loading new project data
    setRows([]);
    setPlanValues({ ...EMPTY_PLAN });

    fetchAccounts();

    return () => { cancelled = true; };
  }, [active?.id, isAgency]);

  const fetchRequestRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++fetchRequestRef.current;
    const isCurrent = () => requestId === fetchRequestRef.current;

    if (selectedAccountId === "__none__" || !active) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const dateFrom = `${monthYear}-01`;
      const dateTo = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      // 1. Daily Data Query
      let dailyQuery = (supabase as any)
        .from("daily_data")
        .select("id, date, spend, impressions, clicks, leads, followers, visits, sales, revenue")
        .eq("project_id", active.id)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });

      if (selectedAccountId === "all") {
        const allIds = accounts.map(a => a.id);
        if (allIds.length > 0) {
          dailyQuery = dailyQuery.in("client_config_id", allIds);
        } else {
          dailyQuery = dailyQuery.eq("client_config_id", "00000000-0000-0000-0000-000000000000");
        }
      } else {
        dailyQuery = dailyQuery.eq("client_config_id", selectedAccountId);
      }

      // 2. Plan Query
      const planQuery = (supabase as any)
        .from("monthly_plans")
        .select("*")
        .eq("project_id", active.id)
        .eq("month_year", monthYear)
        .maybeSingle();

      const [dailyRes, planRes] = await Promise.all([dailyQuery, planQuery]);

      if (!isCurrent()) return;

      if (dailyRes.error) throw dailyRes.error;
      
      // Group by date if multiple accounts are selected
      const grouped = (dailyRes.data || []).reduce((acc: Record<string, DailyRow>, r: any) => {
        if (!acc[r.date]) {
          acc[r.date] = {
            id: r.date,
            date: r.date,
            spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0
          };
        }
        acc[r.date].spend += Number(r.spend) || 0;
        acc[r.date].impressions += Number(r.impressions) || 0;
        acc[r.date].clicks += Number(r.clicks) || 0;
        acc[r.date].leads += Number(r.leads) || 0;
        acc[r.date].followers += Number(r.followers) || 0;
        acc[r.date].visits += Number(r.visits) || 0;
        acc[r.date].sales += Number(r.sales) || 0;
        acc[r.date].revenue += Number(r.revenue) || 0;
        return acc;
      }, {});

      setRows(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)));

      if (planRes.data) {
        const p = planRes.data;
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
    } catch (err: any) {
      if (isCurrent()) {
        console.error("Scoreboard: loadData error:", err);
        setRows([]);
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [year, monthIndex, selectedAccountId, accounts, active?.id, monthYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime synchronization
  useEffect(() => {
    const ch = supabase.channel("scoreboard_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_data" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "monthly_plans" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  // Global aggregate for comparisons
  const { dailyFacts } = useScoreboardData(year, monthIndex, active?.id);

  // Full month grid construction
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

  // Aggregated fact summary for top row
  const fact = useMemo(() => {
    // If 'all' or no account is selected, use global stats for accuracy
    const source = (selectedAccountId === "all" || selectedAccountId === "__none__") 
      ? dailyFacts 
      : rows;

    return source.reduce(
      (acc, d) => ({
        spend: acc.spend + d.spend,
        leads: acc.leads + d.leads,
        followers: acc.followers + d.followers,
        visits: acc.visits + d.visits,
        sales: acc.sales + d.sales,
        revenue: acc.revenue + d.revenue,
      }),
      { spend: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
    );
  }, [rows, dailyFacts, selectedAccountId]);

  const getVal = (src: Record<string, number>, key: MetricKey): number => {
    if (key === "cpl") return cplCalc(src.spend, src.leads);
    return src[key] ?? 0;
  };

  const hasPlan = Object.values(planValues).some(v => v > 0);

  const topCards = useMemo(() => [
    { label: "CAC", value: fact.sales > 0 ? `${fmt(Math.round(fact.spend / fact.sales))} ₸` : "—", sub: "Расходы / Продажи", icon: DollarSign },
    { label: "CPL", value: fact.leads > 0 ? `${fmt(cplCalc(fact.spend, fact.leads))} ₸` : "—", sub: "Расходы / Лиды", icon: Target },
    { label: "CPD", value: fact.visits > 0 ? `${fmt(Math.round(fact.spend / fact.visits))} ₸` : "—", sub: "Расходы / Диагностики", icon: Eye },
    { label: "CR Лид→Диаг.", value: fact.leads > 0 ? `${Math.round((fact.visits / fact.leads) * 100)}%` : "—", sub: "Диагностики / Лиды", icon: ArrowRightLeft },
    { label: "CR Диаг.→Продажа", value: fact.visits > 0 ? `${Math.round((fact.sales / fact.visits) * 100)}%` : "—", sub: "Продажи / Диагностики", icon: TrendingUp },
  ], [fact]);

  const daysWithData = rows.length;
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayProgress = Math.round((daysWithData / totalDaysInMonth) * 100);

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
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Таблица показателей</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysWithData > 0 ? `${daysWithData} дней с данными из ${totalDaysInMonth}` : "Ежедневная сводка метрик по кабинету"}
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 p-1.5 md:p-2 bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); } else setMonthIndex(m => m - 1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1.5 text-sm font-bold bg-secondary/50 rounded-lg min-w-[140px] text-center">
              {MONTHS[monthIndex]} {year}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); } else setMonthIndex(m => m + 1); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-[1px] bg-border/60 mx-1" />

          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[220px] h-9 text-[13px] border-none bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-xl font-medium">
              <SelectValue placeholder="Выберите кабинет" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="__none__">Нет кабинетов</SelectItem>
              {accounts.length > 0 && (
                <>
                  <SelectItem value="all" className="font-semibold">Все кабинеты ({accounts.length})</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || rows.length === 0} className="h-9 gap-2 rounded-xl border-border hover:bg-secondary/50 transition-colors">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {topCards.map((card, i) => (
            <Card key={i} className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all group">
              <CardContent className="p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</span>
                  <card.icon className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-foreground tabular-nums font-mono">{card.value}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  {columns.map(col => (
                    <TableHead key={col.key} className={`h-12 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider ${col.key === "date" ? "text-left" : "text-right"}`}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Fact Row ── */}
                <TableRow className="bg-primary/[0.03] hover:bg-primary/[0.05] border-b-2 border-primary/20">
                  <TableCell className="px-6 py-4 font-black text-primary uppercase text-[12px] tracking-tight">ФАКТ (ВСЕГО)</TableCell>
                  {columns.slice(1).map(col => (
                    <TableCell key={col.key} className="px-6 py-4 text-right font-black text-foreground tabular-nums text-sm">
                      {fmt(getVal(fact as unknown as Record<string, number>, col.key as MetricKey))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ── Plan Row ── */}
                {hasPlan && (
                  <TableRow className="bg-secondary/20 hover:bg-secondary/30 border-b border-border/50">
                    <TableCell className="px-6 py-4 font-bold text-muted-foreground uppercase text-[11px] tracking-tight">ПЛАН</TableCell>
                    {columns.slice(1).map(col => (
                      <TableCell key={col.key} className="px-6 py-4 text-right font-bold text-muted-foreground/80 tabular-nums text-sm">
                        {col.key === "cpl" ? "—" : fmt(getVal(planValues as unknown as Record<string, number>, col.key as MetricKey))}
                      </TableCell>
                    ))}
                  </TableRow>
                )}

                {/* ── Loading ── */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Загрузка данных…</p>
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Daily rows ── */}
                {!loading && fullMonth.map((row) => {
                  const isToday = row.date === todayIso;
                  const isFuture = row.date > todayIso;
                  const isWeekend = (() => {
                    const d = new Date(row.date + "T00:00:00");
                    return d.getDay() === 0 || d.getDay() === 6;
                  })();

                  return (
                    <TableRow
                      key={row.id}
                      className={`border-b border-border/30 transition-all duration-200 ${isToday
                        ? "bg-primary/[0.04] border-l-[3px] border-l-primary"
                        : isWeekend && !isFuture
                          ? "bg-muted/[0.03]"
                          : ""
                        } ${isFuture ? "opacity-40" : "hover:bg-accent/30"}`}
                    >
                      {columns.map(col => (
                        <TableCell key={col.key} className={`px-6 py-4 whitespace-nowrap font-sans text-[14px] tabular-nums ${col.key === "date"
                          ? `text-left font-semibold ${isToday ? "text-primary" : isWeekend ? "text-muted-foreground/50" : "text-muted-foreground/80"}`
                          : "text-right text-foreground/70"
                          }`}>
                          {col.key === "date" ? (
                            <div className="flex items-center gap-2">
                              <span className="tracking-tight">{row.date.split('-')[2]} {MONTHS[monthIndex].slice(0, 3)}</span>
                              {isToday && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                              )}
                            </div>
                          ) : isFuture ? (
                            <span className="text-muted-foreground/10">—</span>
                          ) : col.key === "cpl" ? (
                            row.leads > 0 ? (
                              <span className="font-medium">{fmt(cplCalc(row.spend, row.leads))}</span>
                            ) : (
                              <span className="text-muted-foreground/20">—</span>
                            )
                          ) : ((row as unknown as Record<string, number>)[col.key] ?? 0) > 0 ? (
                            <span className={col.key === "revenue" && (row as unknown as Record<string, number>)[col.key] > 0 ? "text-primary font-bold" : "font-medium"}>
                              {fmt((row as unknown as Record<string, number>)[col.key])}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/20">—</span>
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
    </DashboardLayout >
  );
}
