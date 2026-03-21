import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, ChevronDown, MoreHorizontal, Copy, Pencil, Megaphone, Search,
  AlertTriangle, TrendingDown, CreditCard, Download, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, DollarSign, Users, Eye, ShoppingCart,
  ExternalLink, TrendingUp, Plus, Trash2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  followers?: number;
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
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function fmtCurrency(n: number) {
  return `${fmt(n)} ₸`;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][d.getMonth()];
  return `${day} ${month}`;
};

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
    <div className="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center transition-colors shadow-sm", color)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">{label}</span>
        </div>
        <p className="text-2xl font-bold font-mono tabular-nums text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1.5 font-medium opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardTarget() {
  const now = new Date();
  const { active } = useWorkspace();
  const { isSuperadmin } = useRole();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [rawClients, setRawClients] = useState<any[]>([]);
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
        .select("id, client_name, ad_account_id, daily_budget, is_active, spend, meta_leads, visits, sales, revenue, impressions, clicks").eq("is_active", true)
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
      setRawClients(clientsData || []);

      const { start, end } = getMonthRange(selectedYear, selectedMonth);

      let metricsQuery = (supabase as any)
        .from("daily_data")
        .select("client_config_id, date, spend, impressions, clicks, leads, visits, sales, revenue, followers")
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
        const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0) + (Number(c.clicks) || 0);
        const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0) + (Number(c.impressions) || 0);

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
      return !search || c.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [clients, search]);

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
        {/* ✨ Modern Control Center Header ✨ */}
        <FadeUpItem className="space-y-8">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                 <div className="flex items-center gap-4 mb-2">
                    <div className="h-14 w-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                       <Megaphone className="h-7 w-7 stroke-[2.5px]" />
                    </div>
                    <div>
                       <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight uppercase">Управление рекламой</h1>
                       <p className="text-sm font-bold text-muted-foreground/60">
                          {clients.length} кабинетов · {totals.withData} активных · {MONTH_NAMES[selectedMonth]} {selectedYear}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-sm">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background transition-all" onClick={() => goMonth(-1)}>
                       <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-5 min-w-[140px] text-center">
                       <span className="text-xs font-black uppercase tracking-[0.1em] text-foreground">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background transition-all" onClick={() => goMonth(1)} disabled={isCurrentMonth}>
                       <ChevronRight className="h-5 w-5" />
                    </Button>
                 </div>

                 <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl border-border/50 bg-card/40 hover:bg-accent transition-all duration-300" 
                    onClick={() => { fetchData(); toast({ title: "Данные обновлены" }); }}
                 >
                    <RefreshCw className="h-5 w-5 text-muted-foreground" />
                 </Button>

                 {isSuperadmin && (
                    <Button 
                       onClick={() => setSheetOpen(true)} 
                       className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-[0_12px_24px_rgba(79,70,229,0.25)] border-b-4 border-indigo-900/30 active:border-b-0 active:translate-y-1 transition-all"
                    >
                       <Plus className="h-4 w-4 stroke-[4px]" />
                       <span>Добавить кабинет</span>
                    </Button>
                 )}

                 <Button 
                    onClick={() => setBuilderOpen(true)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-[0_12px_24px_rgba(16,185,129,0.25)] border-b-4 border-emerald-900/30 active:border-b-0 active:translate-y-1 transition-all"
                 >
                    <Rocket className="h-4 w-4 stroke-[4px]" />
                    <span>Создать кампанию</span>
                 </Button>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-3 rounded-[2.5rem] shadow-inner">
              <div className="relative flex-1 group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                 <Input
                    placeholder="Быстрый поиск по названию или ID..."
                    className="pl-14 h-14 bg-background/40 border-none rounded-[2rem] text-sm font-bold placeholder:text-muted-foreground/30 focus:ring-primary/10 transition-all outline-none ring-0 focus-visible:ring-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <Button onClick={handleExport} variant="ghost" className="h-14 px-10 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-background border border-border/20 gap-3">
                 <Download className="h-5 w-5" />
                 Экспорт CSV
              </Button>
           </div>
        </FadeUpItem>

        {alerts.length > 0 && (
          <FadeUpItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
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

        <FadeUpItem>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-6 mb-2">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">Список рекламных кабинетов</span>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">{filteredClients.length} Кабинетов</span>
            </div>

            {filteredClients.length === 0 && (
              <div className="rounded-3xl border border-border border-dashed bg-card/30 p-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <p className="text-sm font-bold text-foreground/60 tracking-tight">Кабинеты не найдены</p>
                <p className="text-xs text-muted-foreground mt-1">Попробуйте изменить поисковый запрос</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {filteredClients.map((client, idx) => {
                const isOpen = expandedAccounts.has(client.name);
                const hasAlert = alerts.some(a => a.account === client.name);
                const planSpend = monthlyPlan?.plan_spend ?? 0;
                const budgetPct = planSpend > 0 ? Math.min(100, Math.round((client.totalSpend / planSpend) * 100)) : 0;

                return (
                  <motion.div
                    layout
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={cn(
                      "group rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden",
                      isOpen ? "border-primary/20 shadow-primary/5 ring-1 ring-primary/5" : "hover:border-primary/10"
                    )}
                  >
                    {/* Header Strip */}
                    <div 
                      className={cn(
                        "flex flex-col md:flex-row md:items-center gap-6 p-6 cursor-pointer",
                        isOpen ? "bg-primary/[0.02]" : "hover:bg-accent/40"
                      )}
                      onClick={() => toggleAccount(client.name)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          client.hasData ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" : "bg-muted text-muted-foreground/50"
                        )}>
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[16px] font-bold text-foreground tracking-tight truncate">{client.name}</h3>
                            {hasAlert && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wider">ID: {client.ad_account_id || "—"}</span>
                            <div className="h-1 w-1 rounded-full bg-border" />
                            {client.hasData && (
                              <Badge variant="outline" className="h-4 text-[9px] font-bold uppercase tracking-widest border-[hsl(var(--status-good))]/30 text-[hsl(var(--status-good))] px-1 bg-[hsl(var(--status-good))]/5">
                                Active
                              </Badge>
                            )}
                            <Badge variant="outline" className={cn(
                              "h-4 text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border",
                              (rawClients.find(rc => rc.id === client.id) as any)?.is_agency 
                                ? "border-purple-500/30 text-purple-600 bg-purple-500/5" 
                                : "border-blue-500/30 text-blue-600 bg-blue-500/5"
                            )}>
                              {(rawClients.find(rc => rc.id === client.id) as any)?.is_agency ? "Агентский" : "Личный"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Main Metrics Overview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 shrink-0 md:border-l border-border/50 md:pl-12">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/50">Расход</p>
                          <p className="text-[15px] font-bold tabular-nums text-foreground">{fmtCurrency(client.totalSpend)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/50">Лиды</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[15px] font-bold tabular-nums text-foreground">{client.totalLeads}</p>
                             {client.cpl > 0 && <span className="text-[10px] font-medium text-muted-foreground">({fmt(client.cpl)}₸)</span>}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/50">Продажи</p>
                          <p className="text-[15px] font-bold tabular-nums text-foreground">{client.totalSales}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/50">Выручка</p>
                          <p className="text-[15px] font-bold tabular-nums text-primary">{fmtCurrency(client.totalRevenue)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 md:ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border shadow-2xl">
                             <DropdownMenuItem className="gap-3 p-2.5 rounded-xl cursor-pointer" onClick={() => window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${client.ad_account_id}`, '_blank')}>
                               <ExternalLink className="h-4 w-4 text-primary" />
                               <span className="text-sm font-semibold">Открыть в Meta Ads</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem className="gap-3 p-2.5 rounded-xl cursor-pointer" onClick={(e) => {
                               e.stopPropagation();
                               setEditingAccount(rawClients.find(rc => rc.id === client.id));
                               setSheetOpen(true);
                             }}>
                               <Pencil className="h-4 w-4 text-muted-foreground" />
                               <span className="text-sm font-semibold">Редактировать</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem className="gap-3 p-2.5 rounded-xl cursor-pointer" onClick={() => toast({ title: "Дублировано", description: client.name })}>
                               <Copy className="h-4 w-4 text-muted-foreground" />
                               <span className="text-sm font-semibold">Дублировать</span>
                             </DropdownMenuItem>

                             {isSuperadmin && (
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <DropdownMenuItem 
                                     className="gap-3 p-2.5 rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                                     onSelect={(e) => e.preventDefault()}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                     <span className="text-sm font-semibold">Удалить кабинет</span>
                                   </DropdownMenuItem>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent className="rounded-[2rem] border-border bg-card/95 backdrop-blur-xl">
                                   <AlertDialogHeader>
                                     <AlertDialogTitle className="text-xl font-black">Удалить кабинет?</AlertDialogTitle>
                                     <AlertDialogDescription className="font-medium">
                                       Кабинет «{client.name}» будет удалён навсегда со всеми настройками.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter className="gap-2">
                                     <AlertDialogCancel className="rounded-xl font-bold">Отмена</AlertDialogCancel>
                                     <AlertDialogAction 
                                       onClick={async () => {
                                         const { error } = await (supabase as any).from("clients_config").delete().eq("id", client.id);
                                         if (!error) {
                                           toast({ title: "Удалено", description: client.name });
                                           fetchData();
                                         } else {
                                           toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                                         }
                                       }}
                                       className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold text-white shadow-lg shadow-destructive/20"
                                     >
                                       Удалить
                                     </AlertDialogAction>
                                    </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <div className={cn("transition-transform duration-300", isOpen && "rotate-180")}>
                           <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar in Strip */}
                    {planSpend > 0 && (
                      <div className="px-6 pb-4">
                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${budgetPct}%` }}
                             className={cn(
                               "h-full rounded-full transition-colors",
                               budgetPct >= 100 ? "bg-destructive" : budgetPct >= 80 ? "bg-amber-500" : "bg-[hsl(var(--status-good))]"
                             )} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-border/30 bg-secondary/10">
                            {/* Detailed Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                               {[
                                 { label: "CPL", value: client.cpl > 0 ? fmtCurrency(client.cpl) : "—", color: "text-amber-500" },
                                 { label: "CPM", value: client.totalImpressions > 0 ? fmtCurrency(Math.round(client.totalSpend / (client.totalImpressions / 1000))) : "—", color: "text-blue-500" },
                                 { label: "CTR", value: client.totalImpressions > 0 ? `${((client.totalClicks / client.totalImpressions) * 100).toFixed(2)}%` : "—", color: "text-purple-500" },
                                 { label: "CPC", value: client.totalClicks > 0 ? fmtCurrency(Math.round(client.totalSpend / client.totalClicks)) : "—", color: "text-pink-500" },
                                 { label: "ROMI", value: `${client.romi}%`, color: client.romi > 0 ? "text-[hsl(var(--status-good))]" : "text-destructive" },
                                 { label: "Подписчики", value: client.dailyMetrics.reduce((s, d) => s + (d.followers || 0), 0) || "—", color: "text-primary" },
                               ].map(stat => (
                                 <div key={stat.label} className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                                   <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                                   <p className={cn("text-[16px] font-bold tabular-nums tracking-tight", stat.color)}>{stat.value}</p>
                                 </div>
                               ))}
                            </div>

                            {/* Daily Statistics Sub-table */}
                            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-inner">
                              <div className="grid grid-cols-[100px_repeat(5,1fr)] items-center px-4 py-2.5 bg-secondary/40 border-b border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                                <span>Дата</span>
                                <span className="text-right">Расход</span>
                                <span className="text-right">Лиды</span>
                                <span className="text-right">CPL</span>
                                <span className="text-right">Визиты</span>
                                <span className="text-right">Продажи</span>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto divide-y divide-border/30">
                                {client.dailyMetrics.length === 0 ? (
                                  <div className="py-12 text-center text-xs text-muted-foreground font-medium italic">Дневная статистика отсутствует для этого периода</div>
                                ) : (
                                  client.dailyMetrics.slice().reverse().map(day => (
                                    <div key={day.date} className="grid grid-cols-[100px_repeat(5,1fr)] items-center px-4 py-3 hover:bg-accent/20 transition-colors">
                                      <span className="text-[12px] font-medium text-muted-foreground/80">{fmtDate(day.date)}</span>
                                      <span className="text-right text-[13px] font-bold tabular-nums text-foreground/80">{fmtCurrency(day.spend)}</span>
                                      <span className="text-right text-[13px] font-bold tabular-nums text-foreground/80">{day.leads}</span>
                                      <span className="text-right text-[13px] font-bold tabular-nums text-muted-foreground/60">{day.leads > 0 ? fmtCurrency(Math.round(day.spend / day.leads)) : "—"}</span>
                                      <span className="text-right text-[13px] font-bold tabular-nums text-foreground/80">{day.visits}</span>
                                      <span className="text-right text-[13px] font-bold tabular-nums text-[hsl(var(--status-good))]">{day.sales > 0 ? day.sales : "—"}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </FadeUpItem>
      </StaggerContainer>
      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
      <AddAccountSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSaved={fetchData}
        account={editingAccount}
      />
    </DashboardLayout>
  );
}
