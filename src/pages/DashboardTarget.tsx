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

import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, ChevronDown, MoreHorizontal, Copy, Pencil, Megaphone, Search,
  AlertTriangle, TrendingDown, CreditCard, Download, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, DollarSign, Users, Eye, ShoppingCart,
  ExternalLink, TrendingUp,
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
  const { active } = useWorkspace();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlyPlan, setMonthlyPlan] = useState<any>(null);

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
      let clientsQuery = (supabase as any)
        .from("clients_config")
        .select("id, client_name, ad_account_id, daily_budget, is_active, spend, meta_leads, visits, sales, revenue").eq("is_active", true)
        .order("client_name");

      if (active.id === "hq") {
        // MarkVision AI (HQ) sees everything
      } else {
        const { data: shared } = await (supabase as any)
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", active.id);
        const sharedIds = (shared || []).map((s: any) => s.client_config_id);

        if (sharedIds.length > 0) {
          const orClause = `project_id.eq.${active.id},id.in.(${sharedIds.join(",")})`;
          clientsQuery = (clientsQuery as any).or(orClause);
        } else {
          clientsQuery = clientsQuery.eq("project_id", active.id);
        }
      }

      const { data: clientsData, error: cErr } = await (clientsQuery as any);
      if (cErr) throw cErr;

      const { start, end } = getMonthRange(selectedYear, selectedMonth);

      let metricsQuery = (supabase as any)
        .from("daily_data")
        .select("client_config_id, date, spend, impressions, clicks, leads, visits, sales, revenue")
        .gte("date", start)
        .lt("date", end)
        .order("date", { ascending: true });

      const clientIds = (clientsData || []).map((c: any) => c.id);
      if (clientIds.length > 0) {
        metricsQuery = metricsQuery.in("client_config_id", clientIds);
      } else {
        metricsQuery = metricsQuery.eq("client_config_id", "00000000-0000-0000-0000-000000000000");
      }

      const { data: metricsData, error: mErr } = await metricsQuery;
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
        const totalSpend = metrics.reduce((s, m) => s + m.spend, 0) + (Number(c.spend) || 0);
        const totalLeads = metrics.reduce((s, m) => s + m.leads, 0) + (Number(c.meta_leads) || 0);
        const totalVisits = metrics.reduce((s, m) => s + m.visits, 0) + (Number(c.visits) || 0);
        const totalSales = metrics.reduce((s, m) => s + m.sales, 0) + (Number(c.sales) || 0);
        const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0) + (Number(c.revenue) || 0);
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

      // Fetch monthly plan for budget alerts
      const { data: planData } = await (supabase as any)
        .from("monthly_plans")
        .select("plan_spend")
        .eq("project_id", active.id)
        .eq("month_year", `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`)
        .maybeSingle();
      setMonthlyPlan(planData);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, active.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ch = supabase
      .channel("target_metrics_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_data" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const totalSpend = clients.reduce((s, c) => s + c.totalSpend, 0);
    const planSpend = monthlyPlan?.plan_spend ?? 0;

    if (planSpend > 0) {
      const budgetPct = Math.round((totalSpend / planSpend) * 100);
      if (budgetPct >= 90) {
        result.push({
          account: active.name,
          issue: `Бюджет израсходован на ${budgetPct}% (${fmt(totalSpend)} / ${fmt(planSpend)})`,
          icon: CreditCard,
          severity: budgetPct >= 100 ? "critical" : "warning"
        });
      }
    }

    clients.forEach((c) => {
      if (c.cpl > 10000 && c.totalLeads > 0) {
        result.push({ account: c.name, issue: `CPL ${fmtCurrency(c.cpl)} — выше нормы`, icon: TrendingDown, severity: "warning" });
      }
    });
    return result;
  }, [clients, monthlyPlan, active.name]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      return !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [clients, searchQuery]);

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

        {alerts.length > 0 && (
          <FadeUpItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map((a, i) => (
                <div key={i} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg hover:border-primary/20">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${a.severity === "critical" ? "bg-destructive/10 group-hover:bg-destructive/20" : "bg-amber-500/10 group-hover:bg-amber-500/20"}`}>
                    <a.icon className={`h-5 w-5 ${a.severity === "critical" ? "text-destructive" : "text-amber-500"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{a.account}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{a.issue}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${a.severity === "critical" ? "border-destructive/30 text-destructive bg-destructive/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"}`}>
                    {a.severity === "critical" ? "Критично" : "Внимание"}
                  </Badge>
                </div>
              ))}
            </div>
          </FadeUpItem>
        )}

        <FadeUpItem className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по кабинетам..." className="pl-9 h-10 text-sm bg-card border-border rounded-xl focus-visible:ring-primary/20" />
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs border-border gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Экспорт CSV
            </Button>
          </div>
        </FadeUpItem>

        <FadeUpItem>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[700px] scrollbar-thin scrollbar-thumb-muted-foreground/20">
              <div className="grid grid-cols-[1fr_100px_90px_70px_70px_80px_100px_48px] items-center px-6 py-4 border-b border-border/50 bg-card/95 backdrop-blur-md sticky top-0 z-20 min-w-[800px]">
                {["Клиент", "Расход", "CPL", "Лиды", "Визиты", "Продажи", "Выручка", ""].map((h, i) => (
                  <span key={i} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">{h}</span>
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

              <div className="min-w-[800px]">
                {filteredClients.map((client) => {
                  const isOpen = expandedAccounts.has(client.name);
                  const hasAlert = alerts.some(a => a.account === client.name);
                  const budgetPct = monthlyPlan?.plan_spend > 0 ? Math.min(100, Math.round((client.totalSpend / monthlyPlan.plan_spend) * 100)) : 0;

                  return (
                    <Collapsible key={client.id} open={isOpen} onOpenChange={() => toggleAccount(client.name)}>
                      <CollapsibleTrigger asChild>
                        <div className={`grid grid-cols-[1fr_100px_90px_70px_70px_80px_100px_48px] items-center px-6 py-4 border-b border-border/30 hover:bg-accent/30 transition-all duration-200 cursor-pointer ${hasAlert ? "bg-destructive/[0.03]" : ""}`}>
                          <div className="flex items-center gap-4">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground/60 transition-transform shrink-0 ${isOpen ? "" : "-rotate-90"}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground truncate tracking-tight">{client.name}</p>
                                {client.hasData && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-good))] shadow-[0_0_8px_rgba(var(--status-good-rgb),0.5)]" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground/50 font-mono tracking-tight mt-0.5">
                                {client.ad_account_id || "ID не указан"}
                              </p>
                            </div>
                          </div>
                          <span className="text-[14px] font-bold tabular-nums text-foreground/80">{fmtCurrency(client.totalSpend)}</span>
                          <span className={`text-[14px] font-bold tabular-nums ${client.cpl > 10000 ? "text-destructive" : client.cpl > 5000 ? "text-amber-500" : "text-foreground/80"}`}>
                            {client.cpl > 0 ? fmtCurrency(client.cpl) : "—"}
                          </span>
                          <span className="text-[14px] font-bold tabular-nums text-foreground/80">{client.totalLeads || "—"}</span>
                          <span className="text-[14px] font-bold tabular-nums text-foreground/80">{client.totalVisits || "—"}</span>
                          <span className="text-[14px] font-bold tabular-nums text-foreground/80">{client.totalSales || "—"}</span>
                          <span className="text-[14px] font-bold tabular-nums text-primary">{client.totalRevenue > 0 ? fmtCurrency(client.totalRevenue) : "—"}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-border shadow-2xl">
                              <DropdownMenuItem className="text-xs font-semibold gap-2.5 p-2 rounded-lg cursor-pointer" onClick={() => window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${client.ad_account_id}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 text-primary" /> Открыть в Meta Ads
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-semibold gap-2.5 p-2 rounded-lg cursor-pointer" onClick={() => toast({ title: "Настройки", description: client.name })}>
                                <Pencil className="h-4 w-4 text-muted-foreground" /> Настройки
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-semibold gap-2.5 p-2 rounded-lg cursor-pointer" onClick={() => toast({ title: "Дублировано", description: client.name })}>
                                <Copy className="h-4 w-4 text-muted-foreground" /> Дублировать
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 py-4 bg-secondary/5 border-b border-border space-y-4">


                          {client.hasData && (
                            <div className="pt-4 border-t border-border/40 space-y-5">
                              {monthlyPlan?.plan_spend > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground font-medium">Освоение бюджета</span>
                                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                        {fmtCurrency(client.totalSpend)} / {fmtCurrency(monthlyPlan.plan_spend)}
                                      </span>
                                    </div>
                                    <span className={`font-mono font-bold ${budgetPct >= 100 ? "text-destructive" : budgetPct >= 80 ? "text-amber-500" : "text-[hsl(var(--status-good))]"}`}>
                                      {budgetPct}%
                                    </span>
                                  </div>
                                  <div className="relative h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 rounded-full ${budgetPct >= 100 ? "bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]" :
                                        budgetPct >= 80 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                          "bg-[hsl(var(--status-good))] shadow-[0_0_8px_rgba(var(--status-good-rgb),0.5)]"
                                        }`}
                                      style={{ width: `${budgetPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                {[
                                  { label: "Расход", value: fmtCurrency(client.totalSpend), icon: CreditCard, color: "text-blue-500" },
                                  { label: "Лиды", value: client.totalLeads > 0 ? String(client.totalLeads) : "—", icon: Users, color: "text-primary" },
                                  { label: "CPL", value: client.cpl > 0 ? fmtCurrency(client.cpl) : "—", icon: DollarSign, color: "text-amber-500" },
                                  { label: "Визиты", value: client.totalVisits > 0 ? String(client.totalVisits) : "—", icon: Eye, color: "text-purple-500" },
                                  { label: "Продажи", value: client.totalSales > 0 ? String(client.totalSales) : "—", icon: ShoppingCart, color: "text-emerald-500" },
                                  { label: "Выручка", value: client.totalRevenue > 0 ? fmtCurrency(client.totalRevenue) : "—", icon: TrendingUp, color: "text-[hsl(var(--status-good))]" },
                                ].map((m) => (
                                  <div key={m.label} className="group rounded-xl border border-border bg-card p-3 hover:border-primary/20 transition-all hover:shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <m.icon className={`h-3 w-3 ${m.color}`} />
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{m.label}</p>
                                    </div>
                                    <p className="text-sm font-bold font-mono tabular-nums text-foreground group-hover:text-primary transition-colors">{m.value}</p>
                                  </div>
                                ))}
                              </div>
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
                          )}
                        </div>
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
