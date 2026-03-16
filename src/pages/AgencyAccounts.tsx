import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Wallet, Users, Target, BarChart3, TrendingUp, AlertCircle, CheckCircle2, PauseCircle, Eye, MousePointer2, CreditCard, UserPlus, Presentation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { startOfMonth, endOfMonth, format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import PeriodPicker from "@/components/agency/PeriodPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import HqKpiCards from "@/components/hq/HqKpiCards";


interface MetricsRow {
  client_id: string;
  client_name: string;
  is_active: boolean | null;
  spend: number | null;
  meta_leads: number | null;
  visits: number | null;
  sales: number | null;
  revenue: number | null;
  cpl: number | null;
  cpv: number | null;
  cac: number | null;
  followers: number | null;
  romi: number | null;
  project_name?: string | null;
}

function fmt(n: number, suffix = ""): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + suffix;
}

const statusCfg = {
  active: { label: "Активен", dot: "bg-[hsl(var(--status-good))]", text: "text-[hsl(var(--status-good))]" },
  paused: { label: "Остановлен", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

type SortKey = "spend" | "meta_leads" | "visits" | "sales" | "revenue" | "followers";
type SortDir = "asc" | "desc";

function DeleteButton({ clientName, clientId, onDeleted }: { clientName: string; clientId: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("clients_config").delete().eq("id", clientId);
    setDeleting(false);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено", description: clientName });
    onDeleted();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/row:opacity-100">
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Удалить кабинет?</AlertDialogTitle>
          <AlertDialogDescription>
            Кабинет «{clientName}» будет удалён навсегда. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
  return dir === "desc"
    ? <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    : <ArrowUp className="h-3 w-3 ml-1 text-primary" />;
}

export default function AgencyAccounts() {
  const { isSuperadmin } = useRole();
  const { active } = useWorkspace();
  const [metrics, setMetrics] = useState<MetricsRow[]>([]);
  const [rawConfigs, setRawConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [period, setPeriod] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchMetrics = useCallback(async () => {
    if (!period.from) return;
    setLoading(true);

    try {
      // 1. Get Cabinets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cabQuery = (supabase as any).from("clients_config").select("*, projects(name)");
      if (active.id === "hq") {
        // MarkVision AI (HQ) = main project → sees ALL cabinets
        // No filter needed
      } else {
        // Client project → own cabinets + shared via visibility table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: shared } = await (supabase as any)
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", active.id);
        const sharedIds = (shared || []).map((s: Record<string, string>) => s.client_config_id);

        if (sharedIds.length > 0) {
          cabQuery = cabQuery.or(`project_id.eq.${active.id},id.in.(${sharedIds.join(",")})`);
        } else {
          cabQuery = cabQuery.eq("project_id", active.id);
        }
      }
      const { data: configs, error: cabError } = await cabQuery;
      if (cabError) throw cabError;
      setRawConfigs(configs || []);

      const cabIds = (configs || []).map(c => c.id);

      // 2. Get Daily Metrics for the period
      const { data: daily, error: dailyError } = await supabase
        .from("daily_data")
        .select("*, followers")
        .in("client_config_id", cabIds)
        .gte("date", format(period.from, "yyyy-MM-dd"))
        .lte("date", format(period.to || period.from, "yyyy-MM-dd"));
      if (dailyError) throw dailyError;

      const dailyData = (daily || []) as any[];

      // 3. Aggregate metrics in JS to show period-specific totals
      const aggregated = (configs || []).map((c: any) => {
        const cDaily = dailyData.filter(d => d.client_config_id === c.id);
        const sums = cDaily.reduce((acc, cur) => ({
          spend: acc.spend + (Number(cur.spend) || 0),
          leads: acc.leads + (Number(cur.leads) || 0),
          visits: acc.visits + (Number(cur.visits) || 0),
          sales: acc.sales + (Number(cur.sales) || 0),
          revenue: acc.revenue + (Number(cur.revenue) || 0),
          followers: acc.followers + (Number(cur.followers) || 0),
        }), { spend: 0, leads: 0, visits: 0, sales: 0, revenue: 0, followers: 0 });

        // Merge with base values from clients_config if applicable
        const totalSpend = sums.spend + (Number(c.spend) || 0);
        const totalLeads = sums.leads + (Number(c.meta_leads) || 0);
        const totalVisits = sums.visits + (Number(c.visits) || 0);
        const totalSales = sums.sales + (Number(c.sales) || 0);
        const totalRevenue = sums.revenue + (Number(c.revenue) || 0);

        // Calculate derived KPIs for this period
        const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const cpv = totalVisits > 0 ? totalSpend / totalVisits : 0;
        const cac = totalSales > 0 ? totalSpend / totalSales : 0;
        const totalFollowers = sums.followers;

        return {
          client_id: c.id,
          client_name: c.client_name,
          is_active: c.is_active,
          spend: totalSpend,
          meta_leads: totalLeads,
          visits: totalVisits,
          sales: totalSales,
          revenue: totalRevenue,
          cpl,
          cpv,
          cac,
          followers: totalFollowers,
          romi: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
          project_name: (c as unknown as any).projects?.name
        };
      });

      setMetrics(aggregated);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [active.id, period]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  useEffect(() => {
    const channel = supabase
      .channel("agency_metrics_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients_config" }, () => { fetchMetrics(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => { fetchMetrics(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMetrics]);

  const avgCpl = useMemo(() => {
    const withLeads = metrics.filter(m => (m.meta_leads ?? 0) > 0 && (m.cpl ?? 0) > 0);
    if (!withLeads.length) return 0;
    return withLeads.reduce((s, m) => s + (m.cpl ?? 0), 0) / withLeads.length;
  }, [metrics]);

  const needsAttention = useCallback((c: MetricsRow) => {
    if (c.is_active === false) return false;
    const spend = Number(c.spend) || 0;
    const leads = Number(c.meta_leads) || 0;
    const romi = Number(c.romi) || 0;
    const cpl = Number(c.cpl) || 0;
    if (spend > 0 && leads === 0) return true;
    if (romi < 0) return true;
    if (avgCpl > 0 && cpl > avgCpl * 2) return true;
    return false;
  }, [avgCpl]);

  const filtered = useMemo(() => {
    let list = metrics;

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.client_name.toLowerCase().includes(q));
    }

    // tab filter
    if (filter === "attention") {
      list = list.filter(needsAttention);
    } else if (filter === "effective") {
      list = list.filter(c => c.is_active !== false && (c.romi ?? 0) > 0 && (c.meta_leads ?? 0) > 0);
    } else if (filter === "inactive") {
      list = list.filter(c => c.is_active === false);
    }

    // sort
    list = [...list].sort((a: any, b: any) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [metrics, search, filter, sortKey, sortDir, needsAttention]);

  // Summary KPIs for filtered set
  const summary = useMemo(() => {
    const totalRevenue = filtered.reduce((s, c) => s + (Number(c.revenue) || 0), 0);
    const totalSpend = filtered.reduce((s, c) => s + (Number(c.spend) || 0), 0);
    const totalLeads = filtered.reduce((s, c) => s + (Number(c.meta_leads) || 0), 0);
    const totalFollowers = filtered.reduce((s, c) => s + (Number(c.followers) || 0), 0);
    const romi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const activeProjects = filtered.filter(c => c.is_active !== false).length;

    return { totalRevenue, totalSpend, romi, activeProjects, totalFollowers };
  }, [filtered]);

  const attentionCount = useMemo(() => metrics.filter(needsAttention).length, [metrics, needsAttention]);
  const effectiveCount = useMemo(() => metrics.filter(c => c.is_active !== false && (c.romi ?? 0) > 0 && (c.meta_leads ?? 0) > 0).length, [metrics]);
  const inactiveCount = useMemo(() => metrics.filter(c => c.is_active === false).length, [metrics]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortableHead = ({ label, sortField, icon: Icon }: { label: string; sortField: SortKey; icon?: any }) => (
    <TableHead
      className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 cursor-pointer select-none hover:text-foreground transition-colors py-4 px-4"
      onClick={() => toggleSort(sortField)}
    >
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        {Icon && <Icon className="h-3 w-3 opacity-60" />}
        {label}
        <SortIcon active={sortKey === sortField} dir={sortDir} />
      </span>
    </TableHead>
  );

  function getRowIndicator(c: MetricsRow) {
    if (c.is_active === false) return "bg-muted-foreground/10";
    const romi = Number(c.romi) || 0;
    if (romi > 0) return "bg-[hsl(var(--status-good))]/10";
    if (needsAttention(c)) return "bg-destructive/10";
    return "bg-primary/5";
  }

  const pageTitle = isSuperadmin ? "Агентские кабинеты" : "Мои рекламные кабинеты";

  return (
    <DashboardLayout breadcrumb={pageTitle}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{pageTitle}</h1>
        {isSuperadmin && (
          <Button onClick={() => setSheetOpen(true)} className="gap-2 h-11 min-h-[44px]">
            <Plus className="h-4 w-4" />
            Добавить кабинет
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <HqKpiCards metrics={summary} />

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
          <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
            <TabsList className="bg-secondary/40 border border-border p-1 h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] h-9 px-4 rounded-md gap-2"
              >
                Все
                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-bold opacity-70">{metrics.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="attention" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] h-9 px-4 rounded-md gap-2 data-[state=active]:text-destructive"
              >
                <AlertCircle className="h-3 w-3" />
                Внимание
                <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-[10px] font-bold">{attentionCount}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="effective" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] h-9 px-4 rounded-md gap-2 data-[state=active]:text-[hsl(var(--status-good))]"
              >
                <CheckCircle2 className="h-3 w-3" />
                Эффективные
                <span className="bg-[hsl(var(--status-good))]/10 text-[hsl(var(--status-good))] px-1.5 py-0.5 rounded text-[10px] font-bold">{effectiveCount}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inactive" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] h-9 px-4 rounded-md gap-2"
              >
                <PauseCircle className="h-3 w-3" />
                Отключенные
                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-bold opacity-70">{inactiveCount}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по кабинетам..."
                className="h-10 w-full pl-9 text-[13px] bg-secondary/30 border-border focus:bg-background transition-all"
              />
            </div>
            <PeriodPicker value={period} onChange={setPeriod} />
          </div>
        </div>
      </div>


      <div className="mt-8">
        <div className="overflow-x-auto pb-4">
          <Table className="min-w-[900px] border-separate border-spacing-y-2.5">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 w-[240px] px-6 py-4">Кабинет</TableHead>
                {active.id === "hq" && (
                  <TableHead className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-4 py-4">Проект</TableHead>
                )}
                <SortableHead label="Расходы" sortField="spend" icon={Wallet} />
                <SortableHead label="Лиды" sortField="meta_leads" icon={Users} />
                <SortableHead label="Визиты" sortField="visits" icon={MousePointer2} />
                <SortableHead label="Продажи" sortField="sales" icon={CreditCard} />
                <SortableHead label="Выручка" sortField="revenue" icon={TrendingUp} />
                <SortableHead label="Подписчики" sortField="followers" icon={UserPlus} />
                <TableHead className="w-10 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="before:block before:h-1">
              {loading ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={active.id === "hq" ? 9 : 8} className="text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border/50">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Обновляем показатели...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={active.id === "hq" ? 9 : 8} className="text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border/50">
                    <Presentation className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                      {active.id === "hq" ? "Выберите или создайте проект в боковой панели, чтобы увидеть данные" : "В этом проекте пока нет рекламных кабинетов"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((c, idx) => {
                    const isActiveCabinet = c.is_active !== false;
                    const s = isActiveCabinet ? statusCfg.active : statusCfg.paused;
                    const spend = Number(c.spend) || 0;
                    const leads = Number(c.meta_leads) || 0;
                    const cpl = Number(c.cpl) || 0;
                    const visits = Number(c.visits) || 0;
                    const cpv = Number(c.cpv) || 0;
                    const sales = Number(c.sales) || 0;
                    const revenue = Number(c.revenue) || 0;
                    const cac = Number(c.cac) || 0;
                    const leadToVisitCr = leads > 0 ? (visits / leads) * 100 : 0;
                    const visitToSaleCr = visits > 0 ? (sales / visits) * 100 : 0;
                    const indicatorClass = getRowIndicator(c);

                    return (
                      <motion.tr
                        layout
                        key={c.client_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="group/row bg-card hover:bg-card/80 border border-border/50 hover:border-primary/20 transition-all cursor-default shadow-sm hover:shadow-md h-24"
                      >
                        <TableCell className="py-4 px-6 rounded-l-2xl border-l border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${indicatorClass}`}>
                               <Target className={cn(
                                 "h-5 w-5",
                                 c.is_active === false ? "text-muted-foreground/40" : 
                                 needsAttention(c) ? "text-destructive" : "text-primary"
                               )} />
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-foreground leading-tight">{c.client_name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase",
                                  isActiveCabinet ? "bg-[hsl(var(--status-good))]/10 text-[hsl(var(--status-good))]" : "bg-muted text-muted-foreground"
                                )}>
                                  {s.label}
                                </span>
                                {needsAttention(c) && (
                                  <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                                    Требует внимания
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {active.id === "hq" && (
                          <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                            <p className="text-[12px] text-muted-foreground font-medium">{c.project_name || "HQ / Admin"}</p>
                          </TableCell>
                        )}

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-foreground tabular-nums">{spend > 0 ? fmt(spend, " ₸") : "—"}</p>
                        </TableCell>

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-foreground tabular-nums">{leads || "—"}</p>
                          {cpl > 0 && <p className="text-[10px] font-bold text-muted-foreground/60 tabular-nums tracking-tighter uppercase mt-0.5">CPL: {fmt(cpl, " ₸")}</p>}
                        </TableCell>

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-foreground tabular-nums">{visits || "—"}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {cpv > 0 && <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase">CPV: {fmt(cpv, " ₸")}</span>}
                            {leadToVisitCr > 0 && <span className="text-[10px] font-bold text-primary/60 tabular-nums uppercase">CR: {leadToVisitCr.toFixed(1)}%</span>}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-foreground tabular-nums">{sales || "—"}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {cac > 0 && <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase">CAC: {fmt(cac, " ₸")}</span>}
                            {visitToSaleCr > 0 && <span className="text-[10px] font-bold text-primary/60 tabular-nums uppercase">CR: {visitToSaleCr.toFixed(1)}%</span>}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-[hsl(var(--status-good))] tabular-nums">{revenue > 0 ? fmt(revenue, " ₸") : "—"}</p>
                        </TableCell>

                        <TableCell className="py-4 border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <p className="text-[15px] font-bold text-foreground tabular-nums">{fmt(c.followers ?? 0)}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 tabular-nums tracking-tighter uppercase mt-0.5">Всего</p>
                        </TableCell>

                        <TableCell className="py-4 px-6 rounded-r-2xl border-r border-t border-b border-border/50 group-hover/row:border-primary/20">
                          <div className="flex items-center gap-2">
                            <button
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/row:opacity-100"
                              onClick={() => {
                                setEditingAccount(rawConfigs.find(cfg => cfg.id === c.client_id));
                                setSheetOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <DeleteButton clientName={c.client_name} clientId={c.client_id} onDeleted={fetchMetrics} />
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddAccountSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSaved={fetchMetrics}
        account={editingAccount}
      />
    </DashboardLayout>
  );
}
