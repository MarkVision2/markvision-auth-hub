import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Wallet, Users, Target, BarChart3, TrendingUp, AlertCircle, CheckCircle2, PauseCircle, Eye, MousePointer2, CreditCard, UserPlus, Presentation, Download, Filter, MoreVertical, LayoutGrid, List, Share2, ExternalLink } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import PeriodPicker from "@/components/agency/PeriodPicker";
import SparklineChart from "@/components/agency/SparklineChart";
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
    const { error } = await supabase.from("clients_config").delete().eq("id", clientId as any);
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [period, setPeriod] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const exportData = () => {
    try {
      const headers = ["Название", "Статус", "Проект", "Расходы", "Лиды", "Визиты", "Продажи", "Выручка", "Подписчики"];
      const rows = filtered.map(c => [
        c.client_name,
        c.is_active ? "Активен" : "Остановлен",
        c.project_name || "HQ",
        c.spend || 0,
        c.meta_leads || 0,
        c.visits || 0,
        c.sales || 0,
        c.revenue || 0,
        c.followers || 0
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `accounts_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Экспорт завершен", description: "Данные выгружены в CSV" });
    } catch (err) {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    }
  };

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

  const AccountCard = ({ c, idx }: { c: MetricsRow; idx: number }) => {
    const isActiveCabinet = c.is_active !== false;
    const s = isActiveCabinet ? statusCfg.active : statusCfg.paused;
    const indicatorColor = getRowIndicator(c);
    const romi = Number(c.romi) || 0;
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, delay: idx * 0.02 }}
        className="group relative"
      >
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/30 transition-all duration-500 rounded-[2rem] shadow-sm hover:shadow-xl group">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: indicatorColor }} />
          
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-secondary/30 border border-border group-hover:scale-110 transition-transform duration-500">
                  <Target className={cn(
                    "h-7 w-7",
                    !isActiveCabinet ? "text-muted-foreground/20" : 
                    needsAttention(c) ? "text-destructive" : "text-primary/70"
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-1">{c.client_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                      isActiveCabinet ? "bg-green-500/10 text-green-600" : "bg-muted/10 text-muted-foreground"
                    )}>
                      {s.label}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border text-foreground",
                      (c as any).is_agency ? "border-purple-500/30 text-purple-600 bg-purple-500/5" : "border-blue-500/30 text-blue-600 bg-blue-500/5"
                    )}>
                      {(c as any).is_agency ? "Агентский" : "Личный"}
                    </Badge>
                    {needsAttention(c) && (
                      <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                        Внимание
                      </Badge>
                    )}
                    {c.project_name && (
                       <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider ml-1">
                         {c.project_name}
                       </span>
                    )}
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-border">
                  <DropdownMenuItem onClick={() => {
                    setEditingAccount(rawConfigs.find(cfg => cfg.id === c.client_id));
                    setSheetOpen(true);
                  }} className="gap-2 cursor-pointer font-medium">
                    <Pencil className="h-4 w-4" /> Изменить
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                    <ExternalLink className="h-4 w-4" /> В кабинет
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                    <Share2 className="h-4 w-4" /> Поделиться
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full text-left px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2 font-medium">
                        <Trash2 className="h-4 w-4" /> Удалить
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-border bg-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить кабинет?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Кабинет «{c.client_name}» будет удалён навсегда.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                          const { error } = await supabase.from("clients_config").delete().eq("id", c.client_id as any);
                          if (!error) {
                            toast({ title: "Удалено", description: c.client_name });
                            fetchMetrics();
                          }
                        }} className="bg-destructive hover:bg-destructive/90">
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest block">Расходы</span>
                <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">
                  {c.spend ? fmt(c.spend, " ₸") : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest block">Выручка</span>
                <p className="text-xl font-black text-green-600 dark:text-green-400 tabular-nums tracking-tighter">
                  {c.revenue ? fmt(c.revenue, " ₸") : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest block">Лиды</span>
                <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">{c.meta_leads || "—"}</p>
                {c.cpl ? <span className="text-[9px] font-bold text-muted-foreground/30 uppercase">CPL: {fmt(c.cpl)}</span> : null}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest block">ROMI</span>
                <p className={cn(
                  "text-xl font-black tabular-nums tracking-tighter",
                  romi > 0 ? "text-primary" : romi < 0 ? "text-destructive" : "text-muted-foreground/40"
                )}>
                  {romi ? `${romi.toFixed(0)}%` : "—"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Тренд эффективности</span>
                <TrendingUp className="h-3 w-3 text-primary/30" />
              </div>
              <SparklineChart data={[10, 20, 15, 25, 30, 22, 40]} color={indicatorColor} />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <DashboardLayout breadcrumb={pageTitle}>
      <div className="relative min-h-[calc(100vh-10rem)] space-y-10">
        <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-8 border-b border-border/40">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-black text-foreground tracking-tight">{pageTitle}</h1>
               <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] px-3 py-1 uppercase tracking-widest">Live</Badge>
            </div>
            <p className="text-muted-foreground text-base font-medium max-w-2xl">
              Управляйте рекламными кабинетами, отслеживайте KPI и оптимизируйте бюджет в едином интерфейсе.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {isSuperadmin && (
                <Button 
                  onClick={() => setSheetOpen(true)} 
                  className="gap-2.5 h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-black text-[11px] uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/20 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1"
                >
                  <Plus className="h-5 w-5" />
                  Добавить
                </Button>
             )}
          </div>
        </div>

        <HqKpiCards metrics={summary} />

        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-md border border-border/60 p-4 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по названию или ID..."
                  className="h-12 w-full pl-12 pr-4 text-sm bg-background/50 border-border/40 focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 font-bold rounded-2xl"
                />
              </div>
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode("table")}
                  className={cn("h-10 w-10 rounded-lg", viewMode === "table" ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}
                >
                  <List className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode("grid")}
                  className={cn("h-10 w-10 rounded-lg", viewMode === "grid" ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/40 overflow-x-auto no-scrollbar">
                 {["all", "attention", "effective", "inactive"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        filter === f
                          ? "bg-card text-primary shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "Все" : f === "attention" ? "Внимание" : f === "effective" ? "Топ" : "Офлайн"}
                    </button>
                 ))}
              </div>
              
              <div className="h-8 w-[1px] bg-border/40 hidden lg:block mx-2" />
              
              <div className="flex items-center gap-2">
                <PeriodPicker value={period} onChange={setPeriod} />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={exportData}
                  className="h-11 w-11 rounded-2xl border-border/40 bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                 <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Target className="h-6 w-6 text-primary/40 animate-pulse" />
                    </div>
                 </div>
                 <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.3em] animate-pulse">Загрузка данных...</p>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner">
                   <Search className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Ничего не найдено</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">Попробуйте изменить параметры поиска или фильтрации.</p>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                <AnimatePresence mode="popLayout">
                  {filtered.map((c, idx) => (
                    <AccountCard key={c.client_id} c={c} idx={idx} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-x-auto pb-12 rounded-[2rem]">
                <Table className="min-w-[1200px] border-separate border-spacing-y-3 px-1">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 w-[300px] px-8 py-4">Кабинет & Статус</TableHead>
                      {active.id === "hq" && (
                        <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 px-4 py-4 text-center">Проект</TableHead>
                      )}
                      <SortableHead label="Расходы" sortField="spend" icon={Wallet} />
                      <SortableHead label="Лиды" sortField="meta_leads" icon={Users} />
                      <SortableHead label="Визиты" sortField="visits" icon={MousePointer2} />
                      <SortableHead label="Продажи" sortField="sales" icon={CreditCard} />
                      <SortableHead label="Выручка" sortField="revenue" icon={TrendingUp} />
                      <SortableHead label="ROMI" sortField="revenue" icon={BarChart3} />
                      <TableHead className="w-16 px-8 py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filtered.map((c, idx) => {
                        const isActiveCabinet = c.is_active !== false;
                        const s = isActiveCabinet ? statusCfg.active : statusCfg.paused;
                        const indicatorColor = getRowIndicator(c);
                        const romi = Number(c.romi) || 0;

                        return (
                          <motion.tr
                            layout
                            key={c.client_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4, delay: idx * 0.01 }}
                            className="group bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-500 rounded-[2rem] border border-border/50 hover:border-primary/30 relative shadow-sm"
                          >
                            <TableCell className="py-6 px-8 rounded-l-[2rem] relative">
                               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full group-hover:h-16 transition-all duration-500 shadow-lg" style={{ backgroundColor: indicatorColor }} />
                              <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-secondary/30 border border-border group-hover:scale-110 transition-transform duration-500">
                                   <Target className={cn(
                                     "h-6 w-6",
                                     !isActiveCabinet ? "text-muted-foreground/20" : 
                                     needsAttention(c) ? "text-destructive" : "text-primary/70"
                                   )} />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[15px] font-black text-foreground tracking-tight line-clamp-1">{c.client_name}</p>
                                  <div className="flex items-center gap-2">
                                     <Badge variant="outline" className={cn(
                                       "text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-md border-none h-4",
                                       isActiveCabinet ? "bg-green-500/10 text-green-600" : "bg-muted/10 text-muted-foreground"
                                     )}>
                                       {s.label}
                                     </Badge>
                                     <Badge variant="outline" className={cn(
                                       "text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-md border h-4",
                                       (c as any).is_agency ? "border-purple-500/30 text-purple-600 bg-purple-500/5" : "border-blue-500/30 text-blue-600 bg-blue-500/5"
                                     )}>
                                       {(c as any).is_agency ? "Агентский" : "Личный"}
                                     </Badge>
                                     {needsAttention(c) && (
                                       <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-md h-4">Critical</Badge>
                                     )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {active.id === "hq" && (
                              <TableCell className="py-2 text-center">
                                <span className="bg-secondary/40 px-3 py-1 rounded-xl text-[9px] font-black text-muted-foreground/60 tracking-wider uppercase">
                                  {c.project_name || "HQ"}
                                </span>
                              </TableCell>
                            )}

                            <TableCell className="py-2">
                              <p className="text-[18px] font-black text-foreground tabular-nums tracking-tighter">{c.spend ? fmt(c.spend, " ₸") : "—"}</p>
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[18px] font-black text-foreground tabular-nums tracking-tighter">{c.meta_leads || "—"}</p>
                              {c.cpl ? <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tabular-nums">CPL: {fmt(c.cpl)}</span> : null}
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[18px] font-black text-foreground tabular-nums tracking-tighter">{c.visits || "—"}</p>
                              {c.cpv ? <span className="text-[9px] font-bold text-muted-foreground/30 uppercase">CPV: {fmt(c.cpv)}</span> : null}
                            </TableCell>

                            <TableCell className="py-2">
                              <p className="text-[18px] font-black text-foreground tabular-nums tracking-tighter">{c.sales || "—"}</p>
                              {c.cac ? <span className="text-[9px] font-bold text-muted-foreground/30 uppercase">CAC: {fmt(c.cac)}</span> : null}
                            </TableCell>

                            <TableCell className="py-2">
                                <p className="text-[18px] font-black text-green-600 dark:text-green-400 tabular-nums tracking-tighter">
                                  {c.revenue ? fmt(c.revenue, " ₸") : "—"}
                                </p>
                            </TableCell>

                            <TableCell className="py-2">
                               <p className={cn(
                                 "text-[18px] font-black tabular-nums tracking-tighter",
                                 romi > 0 ? "text-primary" : romi < 0 ? "text-destructive" : "text-muted-foreground/20"
                               )}>
                                 {romi ? `${romi.toFixed(0)}%` : "—"}
                               </p>
                            </TableCell>

                            <TableCell className="py-2 px-8 rounded-r-[2rem]">
                              <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
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
                  </TableBody>
                </Table>
              </div>
            )}
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
