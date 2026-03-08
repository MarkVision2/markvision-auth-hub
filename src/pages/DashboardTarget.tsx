import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, ChevronDown, MoreHorizontal, Copy, Pencil, Megaphone, Search,
  AlertTriangle, TrendingDown, CreditCard, Download, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, DollarSign, Users, Eye, ShoppingCart,
  BarChart3, Target, Zap,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

/* ── Types ── */
interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

interface ClientWithMetrics {
  id: string;
  name: string;
  ad_account_id: string | null;
  daily_budget: number;
  totalSpend: number;
  totalLeads: number;
  totalVisits: number;
  totalSales: number;
  totalRevenue: number;
  totalClicks: number;
  totalImpressions: number;
  cpl: number;
  romi: number;
  hasData: boolean;
  dailyMetrics: DailyMetric[];
}

interface Alert {
  account: string;
  issue: string;
  icon: typeof CreditCard;
  severity: "critical" | "warning";
}

/* ── Helpers ── */
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function fmtCurrency(n: number) {
  return `${fmt(n)} ₸`;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;
  return { start, end };
}

type StatusFilter = "all" | "with-data" | "no-data";

/* ── KPI Card component ── */
function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card className="bg-card border-border hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xl font-bold font-mono tabular-nums text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardTarget() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const goMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: clientsData, error: cErr } = await (supabase as any)
        .from("clients_config")
        .select("id, client_name, ad_account_id, daily_budget, is_active")
        .eq("is_active", true)
        .order("client_name");
      if (cErr) throw cErr;

      const { start, end } = getMonthRange(selectedYear, selectedMonth);

      const { data: metricsData, error: mErr } = await (supabase as any)
        .from("daily_metrics")
        .select("client_config_id, date, spend, impressions, clicks, leads, visits, sales, revenue")
        .gte("date", start)
        .lt("date", end)
        .order("date", { ascending: true });
      if (mErr) throw mErr;

      const metricsMap = new Map<string, DailyMetric[]>();
      (metricsData || []).forEach((m: any) => {
        if (!m.client_config_id) return;
        if (!metricsMap.has(m.client_config_id)) metricsMap.set(m.client_config_id, []);
        metricsMap.get(m.client_config_id)!.push({
          date: m.date,
          spend: Number(m.spend) || 0,
          impressions: Number(m.impressions) || 0,
          clicks: Number(m.clicks) || 0,
          leads: Number(m.leads) || 0,
          visits: Number(m.visits) || 0,
          sales: Number(m.sales) || 0,
          revenue: Number(m.revenue) || 0,
        });
      });

      const mapped: ClientWithMetrics[] = (clientsData || []).map((c: any) => {
        const metrics = metricsMap.get(c.id) || [];
        const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
        const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
        const totalVisits = metrics.reduce((s, m) => s + m.visits, 0);
        const totalSales = metrics.reduce((s, m) => s + m.sales, 0);
        const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
        const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
        const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);

        return {
          id: c.id,
          name: c.client_name,
          ad_account_id: c.ad_account_id,
          daily_budget: Number(c.daily_budget) || 0,
          totalSpend,
          totalLeads,
          totalVisits,
          totalSales,
          totalRevenue,
          totalClicks,
          totalImpressions,
          cpl: totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0,
          romi: totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0,
          hasData: metrics.length > 0,
          dailyMetrics: metrics,
        };
      });

      setClients(mapped);
      setExpandedAccounts(new Set(mapped.filter(c => c.hasData).map(c => c.name)));
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ch = supabase
      .channel("target_metrics_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    clients.forEach((c) => {
      if (c.daily_budget > 0 && c.totalSpend >= c.daily_budget * 30) {
        result.push({ account: c.name, issue: "Бюджет исчерпан на 100%", icon: CreditCard, severity: "critical" });
      }
      if (c.cpl > 10000 && c.totalLeads > 0) {
        result.push({ account: c.name, issue: `CPL ${fmtCurrency(c.cpl)} — выше нормы`, icon: TrendingDown, severity: "warning" });
      }
    });
    return result;
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = statusFilter === "all" || (statusFilter === "with-data" ? c.hasData : !c.hasData);
      const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [clients, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    const spend = clients.reduce((s, c) => s + c.totalSpend, 0);
    const leads = clients.reduce((s, c) => s + c.totalLeads, 0);
    const sales = clients.reduce((s, c) => s + c.totalSales, 0);
    const revenue = clients.reduce((s, c) => s + c.totalRevenue, 0);
    const withData = clients.filter(c => c.hasData).length;
    const cpl = leads > 0 ? Math.round(spend / leads) : 0;
    const romi = spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : 0;
    return { spend, leads, sales, revenue, withData, cpl, romi };
  }, [clients]);

  const toggleAccount = (name: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleExport = () => {
    const headers = ["Клиент", "Расход", "CPL", "Лиды", "Визиты", "Продажи", "Выручка", "ROMI"];
    const rows = filteredClients.map(c => [
      c.name, c.totalSpend, c.cpl, c.totalLeads, c.totalVisits, c.totalSales, c.totalRevenue, `${c.romi}%`
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ads_report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV экспортирован" });
  };

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Таргетолог">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Таргетолог">
      <StaggerContainer className="space-y-5">
        {/* Header */}
        <FadeUpItem className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-4.5 w-4.5 text-primary" />
              </div>
              Центр управления рекламой
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {clients.length} кабинетов · {totals.withData} активных · {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary/30 border border-border rounded-lg px-1 h-10 min-h-[44px]">
              <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => goMonth(-1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center gap-1.5 px-2 min-w-[120px] justify-center">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => goMonth(1)} disabled={isCurrentMonth}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 min-h-[44px] border-border" onClick={() => { fetchData(); toast({ title: "Обновлено" }); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={() => setBuilderOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 min-h-[44px] text-sm font-semibold gap-1.5">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Создать кампанию</span>
              <span className="sm:hidden">Создать</span>
            </Button>
          </div>
        </FadeUpItem>


        {/* Alerts */}
        {alerts.length > 0 && (
          <FadeUpItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${a.severity === "critical" ? "bg-destructive/10" : "bg-[hsl(var(--status-warning))]/10"}`}>
                    <a.icon className={`h-4 w-4 ${a.severity === "critical" ? "text-destructive" : "text-[hsl(var(--status-warning))]"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.account}</p>
                    <p className="text-xs text-muted-foreground">{a.issue}</p>
                  </div>
                  <Badge variant="outline" className={`ml-auto shrink-0 text-[10px] ${a.severity === "critical" ? "border-destructive/30 text-destructive" : "border-[hsl(var(--status-warning))]/30 text-[hsl(var(--status-warning))]"}`}>
                    {a.severity === "critical" ? "Критично" : "Внимание"}
                  </Badge>
                </div>
              ))}
            </div>
          </FadeUpItem>
        )}

        {/* Filters */}
        <FadeUpItem className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск клиента..." className="pl-8 h-9 text-sm bg-secondary/30 border-border" />
          </div>
          <div className="flex items-center gap-1 bg-secondary/20 border border-border rounded-lg p-0.5">
            {([
              { value: "all" as StatusFilter, label: "Все" },
              { value: "with-data" as StatusFilter, label: "С данными" },
              { value: "no-data" as StatusFilter, label: "Без данных" },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === f.value
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs border-border gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Экспорт CSV
            </Button>
          </div>
        </FadeUpItem>

        {/* Data table */}
        <FadeUpItem>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_90px_80px_65px_65px_70px_80px_60px_36px] items-center px-4 py-2.5 border-b border-border bg-secondary/20 min-w-[700px]">
              {["Клиент", "Расход", "CPL", "Лиды", "Визиты", "Продажи", "Выручка", "ROMI", ""].map((h, i) => (
                <span key={i} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">{h}</span>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="px-4 py-16 text-center">
                <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground/60">Данных пока нет</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Попробуйте изменить фильтры</p>
              </div>
            )}

            <div className="min-w-[700px]">
            {filteredClients.map((client) => {
              const isOpen = expandedAccounts.has(client.name);
              const hasAlert = alerts.some(a => a.account === client.name);
              const budgetPct = client.daily_budget > 0 ? Math.min(100, Math.round((client.totalSpend / (client.daily_budget * 30)) * 100)) : 0;

              return (
                <Collapsible key={client.id} open={isOpen} onOpenChange={() => toggleAccount(client.name)}>
                  <CollapsibleTrigger asChild>
                    <div className={`grid grid-cols-[1fr_90px_80px_65px_65px_70px_80px_60px_36px] items-center px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer ${hasAlert ? "bg-destructive/5" : ""}`}>
                      <div className="flex items-center gap-2.5">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "" : "-rotate-90"}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                            {client.hasData && <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-good))]" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {client.ad_account_id || "Нет ad account"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-mono tabular-nums text-foreground/80">{fmtCurrency(client.totalSpend)}</span>
                      <span className={`text-sm font-mono tabular-nums ${client.cpl > 10000 ? "text-destructive" : client.cpl > 5000 ? "text-[hsl(var(--status-warning))]" : "text-foreground/80"}`}>
                        {client.cpl > 0 ? fmtCurrency(client.cpl) : "—"}
                      </span>
                      <span className="text-sm font-mono tabular-nums text-foreground/80">{client.totalLeads || "—"}</span>
                      <span className="text-sm font-mono tabular-nums text-foreground/80">{client.totalVisits || "—"}</span>
                      <span className="text-sm font-mono tabular-nums text-foreground/80">{client.totalSales || "—"}</span>
                      <span className="text-sm font-mono tabular-nums text-foreground/80">{client.totalRevenue > 0 ? fmtCurrency(client.totalRevenue) : "—"}</span>
                      <span className={`text-sm font-mono tabular-nums font-semibold ${client.romi > 0 ? "text-[hsl(var(--status-good))]" : client.romi < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {client.hasData ? `${client.romi}%` : "—"}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-sm gap-2" onClick={() => toast({ title: "Настройки", description: client.name })}>
                            <Pencil className="h-3.5 w-3.5" /> Настройки
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm gap-2" onClick={() => toast({ title: "Дублировано", description: client.name })}>
                            <Copy className="h-3.5 w-3.5" /> Дублировать
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {client.hasData ? (
                      <div className="px-4 py-4 bg-secondary/5 border-b border-border space-y-4">
                        {/* Budget progress */}
                        {client.daily_budget > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Бюджет ({fmtCurrency(client.totalSpend)} / {fmtCurrency(client.daily_budget * 30)})</span>
                              <span className={`font-mono font-semibold ${budgetPct >= 90 ? "text-destructive" : budgetPct >= 70 ? "text-[hsl(var(--status-warning))]" : "text-muted-foreground"}`}>{budgetPct}%</span>
                            </div>
                            <Progress value={budgetPct} className="h-1.5 bg-secondary" />
                          </div>
                        )}

                        {/* Detail metrics grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {[
                            { label: "Показы", value: fmt(client.totalImpressions) },
                            { label: "Клики", value: fmt(client.totalClicks) },
                            { label: "CTR", value: client.totalImpressions > 0 ? `${((client.totalClicks / client.totalImpressions) * 100).toFixed(2)}%` : "—" },
                            { label: "CR Лид→Продажа", value: client.totalLeads > 0 ? `${((client.totalSales / client.totalLeads) * 100).toFixed(1)}%` : "—" },
                            { label: "CAC", value: client.totalSales > 0 ? fmtCurrency(Math.round(client.totalSpend / client.totalSales)) : "—" },
                          ].map((m) => (
                            <div key={m.label} className="rounded-lg border border-border bg-card p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                              <p className="text-sm font-bold font-mono tabular-nums text-foreground mt-0.5">{m.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Daily metrics mini-table */}
                        {client.dailyMetrics.length > 0 && (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] items-center px-3 py-1.5 bg-secondary/30 border-b border-border">
                              {["Дата", "Расход", "Лиды", "CPL", "Визиты", "Продажи"].map(h => (
                                <span key={h} className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
                              ))}
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {client.dailyMetrics.slice(-10).reverse().map(dm => (
                                <div key={dm.date} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] items-center px-3 py-1.5 border-b border-border/50 hover:bg-accent/20 transition-colors">
                                  <span className="text-[11px] text-muted-foreground font-mono">{dm.date.slice(5)}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-foreground/80">{fmtCurrency(dm.spend)}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-foreground/80">{dm.leads || "—"}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-foreground/80">{dm.leads > 0 ? fmtCurrency(Math.round(dm.spend / dm.leads)) : "—"}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-foreground/80">{dm.visits || "—"}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-foreground/80">{dm.sales || "—"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-8 bg-secondary/5 border-b border-border text-center">
                        <Zap className="h-5 w-5 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">Данные появятся после сбора статистики из Meta Ads</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">n8n синхронизирует данные ежедневно</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            </div>
            </div>
          </div>
        </FadeUpItem>
      </StaggerContainer>

      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
    </DashboardLayout>
  );
}
