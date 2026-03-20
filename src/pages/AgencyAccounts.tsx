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
  const [mainTab, setMainTab] = useState<"personal" | "agency">("personal");
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
          is_agency: c.is_agency,
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

    // Split by tab first
    list = list.filter(m => mainTab === "agency" ? (m as any).is_agency : !(m as any).is_agency);

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
  }, [metrics, search, filter, sortKey, sortDir, needsAttention, mainTab]);

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
        {Icon && <Icon className="h-4 w-4 opacity-60" />}
        {label}
        <SortIcon active={sortKey === sortField} dir={sortDir} />
      </span>
    </TableHead>
  );

  function getRowIndicator(c: MetricsRow) {
    if (c.is_active === false) return "rgba(148,163,184,0.1)";
    const romi = Number(c.romi) || 0;
    if (romi > 0) return "rgba(34,197,94,0.15)";
    if (needsAttention(c)) return "rgba(239,68,68,0.15)";
    return "rgba(var(--primary),0.1)";
  }

  const pageTitle = isSuperadmin ? "Рекламные кабинеты" : "Мои рекламные кабинеты";

  return (
    <DashboardLayout breadcrumb={pageTitle}>
      <div className="relative min-h-[calc(100vh-10rem)]">
        <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-5 border-b border-border/40 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">Мониторинг эффективности в реальном времени</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-muted/50 p-1.5 rounded-xl border border-border flex items-center">
                <button
                  onClick={() => setMainTab("personal")}
                  className={cn(
                    "px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5",
                    mainTab === "personal" 
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  Личные
                </button>
                <button
                  onClick={() => setMainTab("agency")}
                  className={cn(
                    "px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5",
                    mainTab === "agency" 
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Агентские
                </button>
             </div>
             {isSuperadmin && (
                <Button 
                  onClick={() => setSheetOpen(true)} 
                  className="gap-2 h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-bold text-white border border-primary/20"
                >
                  <Plus className="h-5 w-5" />
                  Добавить
                </Button>
             )}
          </div>
        </div>

        <div className="space-y-10">
          <HqKpiCards metrics={summary} />

          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-card border border-border p-3 px-5 rounded-2xl">
            <div className="relative w-full lg:w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию..."
                className="h-11 w-full pl-12 pr-4 text-sm bg-background border-border focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30 font-semibold rounded-xl"
              />
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <PeriodPicker value={period} onChange={setPeriod} />
              <div className="h-8 w-[1px] bg-border/40 hidden lg:block" />
              <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded-xl border border-border/50">
                 {["all", "attention", "effective", "inactive"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        filter === f
                          ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      {f === "all" ? "Все" : f === "attention" ? "Внимание" : f === "effective" ? "Топ" : "Офлайн"}
                    </button>
                 ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-x-auto pb-8">
              <Table className="min-w-[1000px] border-separate border-spacing-y-3">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 w-[240px] px-8 py-2">Кабинет & Статус</TableHead>
                    {active.id === "hq" && (
                      <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 px-4 py-2 text-center">Проект</TableHead>
                    )}
                    <SortableHead label="Расходы" sortField="spend" icon={Wallet} />
                    <SortableHead label="Лиды" sortField="meta_leads" icon={Users} />
                    <SortableHead label="Визиты" sortField="visits" icon={MousePointer2} />
                    <SortableHead label="Продажи" sortField="sales" icon={CreditCard} />
                    <SortableHead label="Выручка" sortField="revenue" icon={TrendingUp} />
                    <SortableHead label="Подписчики" sortField="followers" icon={UserPlus} />
                    <TableHead className="w-16 px-8 py-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell colSpan={active.id === "hq" ? 9 : 8} className="py-24 text-center">
                        <div className="relative inline-block">
                           <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                        </div>
                        <p className="text-xs text-muted-foreground/40 mt-6 font-black tracking-widest uppercase">Загрузка данных...</p>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell colSpan={active.id === "hq" ? 9 : 8} className="py-32 text-center">
                        <div className="bg-secondary/50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                           <Presentation className="h-7 w-7 text-muted-foreground/20" />
                        </div>
                        <p className="text-base font-black text-muted-foreground/40">Записей не найдено</p>
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
                        const indicatorColor = getRowIndicator(c);

                        return (
                          <motion.tr
                            layout
                            key={c.client_id}
                            initial={{ opacity: 0, scale: 0.99, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4, delay: idx * 0.015, ease: [0.23, 1, 0.32, 1] }}
                            className="group bg-card hover:bg-muted/30 transition-all duration-500 rounded-[1.85rem] border border-border hover:border-primary/20 relative shadow-sm"
                          >
                            <TableCell className="py-5 px-8 rounded-l-[1.85rem] relative">
                               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full group-hover:h-14 transition-all duration-500 shadow-[0_0_15px_-2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: indicatorColor }} />
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-muted/30 border border-border group-hover:scale-110 transition-transform duration-500">
                                   <Target className={cn(
                                     "h-6 w-6",
                                     c.is_active === false ? "text-muted-foreground/20" : 
                                     needsAttention(c) ? "text-destructive" : "text-primary/70"
                                   )} />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[14px] font-black text-foreground tracking-tight line-clamp-1">{c.client_name}</p>
                                  <div className="flex items-center gap-1.5">
                                     <span className={cn(
                                       "h-1.5 w-1.5 rounded-full",
                                       isActiveCabinet ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/20"
                                     )} />
                                     <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{s.label}</span>
                                     {needsAttention(c) && (
                                       <span className="text-[8px] font-black text-destructive/60 uppercase tracking-widest ml-1 px-1.5 py-0.5 bg-destructive/5 rounded-md">Critical</span>
                                     )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {active.id === "hq" && (
                              <TableCell className="py-2 text-center">
                                <span className="bg-secondary/40 px-2.5 py-1 rounded-lg text-[9px] font-black text-muted-foreground/60 tracking-wider">
                                  {c.project_name || "HQ"}
                                </span>
                              </TableCell>
                            )}

                            <TableCell className="py-2">
                              <p className="text-[17px] font-black text-foreground tabular-nums tracking-tighter">{spend > 0 ? fmt(spend, " ₸") : "—"}</p>
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[17px] font-black text-foreground tabular-nums tracking-tighter">{leads || "—"}</p>
                              {cpl > 0 && <span className="text-[9px] font-black text-muted-foreground/30 uppercase tabular-nums">CPL: {fmt(cpl)}</span>}
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[17px] font-black text-foreground tabular-nums tracking-tighter">{visits || "—"}</p>
                              <div className="flex items-center gap-1.5">
                                  {cpv > 0 && <span className="text-[9px] font-black text-muted-foreground/30 uppercase">CPV: {fmt(cpv)}</span>}
                                  {leadToVisitCr > 0 && <span className="text-[9px] font-black text-primary/40 leading-none">{leadToVisitCr.toFixed(0)}% CR</span>}
                              </div>
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[17px] font-black text-foreground tabular-nums tracking-tighter">{sales || "—"}</p>
                              <div className="flex items-center gap-1.5">
                                  {cac > 0 && <span className="text-[9px] font-black text-muted-foreground/30 uppercase">CAC: {fmt(cac)}</span>}
                                  {visitToSaleCr > 0 && <span className="text-[9px] font-black text-primary/40 leading-none">{visitToSaleCr.toFixed(0)}% CR</span>}
                              </div>
                            </TableCell>

                            <TableCell className="py-2">
                              <div className="space-y-0">
                                <p className="text-[17px] font-black text-green-600 dark:text-green-400 tabular-nums tracking-tighter">
                                  {revenue > 0 ? fmt(revenue, " ₸") : "—"}
                                </p>
                                <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest block -mt-1">Yield</span>
                              </div>
                            </TableCell>

                            <TableCell className="py-2">
                               <p className="text-[17px] font-black text-foreground tabular-nums tracking-tighter">{fmt(c.followers ?? 0)}</p>
                               <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest block -mt-1">Users</span>
                            </TableCell>

                            <TableCell className="py-2 px-8 rounded-r-[1.85rem]">
                              <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
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
      </div>
    </DashboardLayout>
  );
}
