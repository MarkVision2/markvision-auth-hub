import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, RefreshCw } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

// ─── Facebook Campaign Drill-Down ────────────────────────────────────────────

const FB_API = "https://graph.facebook.com/v22.0";
const LEAD_TYPES = ["onsite_conversion.lead_grouped", "onsite_conversion.messaging_conversation_started_7d"];

interface FbCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: {
    data: Array<{
      spend: string;
      impressions: string;
      clicks: string;
      ctr: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  };
}

function AccountCampaigns({ adAccountId, fbToken }: { adAccountId: string; fbToken: string }) {
  const [campaigns, setCampaigns] = useState<FbCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${FB_API}/act_${adAccountId}/campaigns?fields=id,name,status,effective_status,daily_budget,lifetime_budget,insights.date_preset(today){spend,impressions,clicks,ctr,actions}&limit=50&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&access_token=${fbToken}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.error) throw new Error(json.error.message);
      setCampaigns(json.data || []);
    } catch (e: unknown) {
      toast({ title: "Ошибка загрузки кампаний", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [adAccountId, fbToken]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const toggleCampaign = async (campaign: FbCampaign) => {
    const newStatus = campaign.effective_status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setToggling(prev => ({ ...prev, [campaign.id]: true }));
    try {
      const resp = await fetch(`${FB_API}/${campaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, access_token: fbToken }),
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error.message);
      toast({ title: `${campaign.name}`, description: newStatus === "ACTIVE" ? "Запущена" : "На паузе" });
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus, effective_status: newStatus } : c));
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" });
    } finally {
      setToggling(prev => ({ ...prev, [campaign.id]: false }));
    }
  };

  const getLeads = (c: FbCampaign) =>
    (c.insights?.data?.[0]?.actions || [])
      .filter(a => LEAD_TYPES.includes(a.action_type))
      .reduce((s, a) => s + Number(a.value), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Загрузка кампаний из Meta...</span>
    </div>
  );

  if (!campaigns.length) return (
    <div className="py-5 text-center text-muted-foreground text-sm">Нет активных или приостановленных кампаний</div>
  );

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Кампании ({campaigns.length})</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={fetchCampaigns}>
          <RefreshCw className="h-3 w-3" /> Обновить
        </Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-xs py-2 pl-3">Кампания</TableHead>
              <TableHead className="text-xs py-2 text-right">Бюджет/день</TableHead>
              <TableHead className="text-xs py-2 text-right">Расход сег.</TableHead>
              <TableHead className="text-xs py-2 text-right">Показы</TableHead>
              <TableHead className="text-xs py-2 text-right">Клики</TableHead>
              <TableHead className="text-xs py-2 text-right">CTR</TableHead>
              <TableHead className="text-xs py-2 text-right">Лиды</TableHead>
              <TableHead className="text-xs py-2 text-right">CPL</TableHead>
              <TableHead className="text-xs py-2 text-center w-16">Стат.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map(c => {
              const ins = c.insights?.data?.[0];
              const spend = Number(ins?.spend || 0);
              const impressions = Number(ins?.impressions || 0);
              const clicks = Number(ins?.clicks || 0);
              const ctr = Number(ins?.ctr || 0);
              const leads = getLeads(c);
              const cpl = leads > 0 ? spend / leads : 0;
              const budget = c.daily_budget ? Number(c.daily_budget) / 100 : null;
              const isActive = c.effective_status === "ACTIVE";
              return (
                <TableRow key={c.id} className="border-b border-border hover:bg-accent/30 text-sm">
                  <TableCell className="pl-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-[hsl(var(--status-good))]" : "bg-muted-foreground"}`} />
                      <span className="text-foreground font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {budget != null ? `$${budget.toFixed(0)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {spend > 0 ? `$${spend.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {impressions > 0 ? impressions.toLocaleString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {clicks > 0 ? clicks : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {ctr > 0 ? `${ctr.toFixed(2)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-bold">
                    {leads > 0
                      ? <span className="text-[hsl(var(--status-good))]">{leads}</span>
                      : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cpl > 0 ? (
                      <span className={`font-bold ${cpl < 2 ? "text-[hsl(var(--status-good))]" : cpl > 3 ? "text-[hsl(var(--status-critical))]" : "text-yellow-500"}`}>
                        ${cpl.toFixed(2)}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {toggling[c.id]
                      ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                      : <Switch checked={isActive} onCheckedChange={() => toggleCampaign(c)} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
  romi: number | null;
  project_name?: string | null;
}

function fmt(n: number, suffix = ""): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M" + suffix;
  if (n >= 1000) return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + suffix;
  return Math.round(n).toString() + suffix;
}

const statusCfg = {
  active: { label: "Активен", dot: "bg-[hsl(var(--status-good))]", text: "text-[hsl(var(--status-good))]" },
  paused: { label: "Остановлен", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

type SortKey = "spend" | "meta_leads" | "visits" | "sales" | "revenue" | "romi";
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
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [period, setPeriod] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Campaign drill-down state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accountMeta, setAccountMeta] = useState<Record<string, { adAccountId: string; fbToken: string }>>({});
  const [metaLoading, setMetaLoading] = useState<Record<string, boolean>>({});

  const handleRowClick = useCallback(async (clientId: string) => {
    if (expandedId === clientId) { setExpandedId(null); return; }
    setExpandedId(clientId);
    if (accountMeta[clientId]) return;
    setMetaLoading(prev => ({ ...prev, [clientId]: true }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("clients_config")
        .select("ad_account_id, fb_token")
        .eq("id", clientId)
        .maybeSingle();
      if (data?.ad_account_id && data?.fb_token) {
        setAccountMeta(prev => ({ ...prev, [clientId]: { adAccountId: data.ad_account_id, fbToken: data.fb_token } }));
      } else {
        toast({ title: "Нет токена", description: "fb_token не найден для этого кабинета", variant: "destructive" });
        setExpandedId(null);
      }
    } catch {
      toast({ title: "Ошибка загрузки токена", variant: "destructive" });
      setExpandedId(null);
    } finally {
      setMetaLoading(prev => ({ ...prev, [clientId]: false }));
    }
  }, [expandedId, accountMeta]);

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

      const cabIds = (configs || []).map(c => c.id);

      // 2. Get Daily Metrics for the period
      const { data: daily, error: dailyError } = await supabase
        .from("daily_data")
        .select("*")
        .in("client_config_id", cabIds)
        .gte("date", format(period.from, "yyyy-MM-dd"))
        .lte("date", format(period.to || period.from, "yyyy-MM-dd"));
      if (dailyError) throw dailyError;

      // 3. Aggregate metrics in JS to show period-specific totals
      const aggregated = (configs || []).map(c => {
        const cDaily = (daily || []).filter(d => d.client_config_id === c.id);
        const sums = cDaily.reduce((acc, cur) => ({
          spend: acc.spend + (Number(cur.spend) || 0),
          leads: acc.leads + (Number(cur.leads) || 0),
          visits: acc.visits + (Number(cur.visits) || 0),
          sales: acc.sales + (Number(cur.sales) || 0),
          revenue: acc.revenue + (Number(cur.revenue) || 0),
        }), { spend: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });

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
        const romi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

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
          romi,
          project_name: (c as unknown).projects?.name
        };
      });

      setMetrics(aggregated);
    } catch (err: unknown) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
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
    list = [...list].sort((a, b) => {
      const av = Number((a as unknown)[sortKey]) || 0;
      const bv = Number((b as unknown)[sortKey]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [metrics, search, filter, sortKey, sortDir, needsAttention]);

  const attentionCount = useMemo(() => metrics.filter(needsAttention).length, [metrics, needsAttention]);
  const effectiveCount = useMemo(() => metrics.filter(c => c.is_active !== false && (c.romi ?? 0) > 0 && (c.meta_leads ?? 0) > 0).length, [metrics]);
  const inactiveCount = useMemo(() => metrics.filter(c => c.is_active === false).length, [metrics]);

  // Summary KPIs for filtered set
  const summary = useMemo(() => {
    const totalSpend = filtered.reduce((s, c) => s + (Number(c.spend) || 0), 0);
    const totalLeads = filtered.reduce((s, c) => s + (Number(c.meta_leads) || 0), 0);
    const avgCplFiltered = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const romiValues = filtered.filter(c => (c.romi ?? 0) !== 0);
    const avgRomi = romiValues.length > 0 ? romiValues.reduce((s, c) => s + (Number(c.romi) || 0), 0) / romiValues.length : 0;
    return { totalSpend, totalLeads, avgCpl: avgCplFiltered, avgRomi };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortableHead = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <TableHead
      className="text-sm font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors py-4 px-4"
      onClick={() => toggleSort(sortField)}
    >
      <span className="flex items-center">
        {label}
        <SortIcon active={sortKey === sortField} dir={sortDir} />
      </span>
    </TableHead>
  );

  function getRowIndicator(c: MetricsRow) {
    const spend = Number(c.spend) || 0;
    const leads = Number(c.meta_leads) || 0;
    const romi = Number(c.romi) || 0;
    if (romi > 0) return "border-l-2 border-l-[hsl(var(--status-good))]";
    if (romi < 0 || (spend > 0 && leads === 0)) return "border-l-2 border-l-[hsl(var(--status-critical))]";
    return "border-l-2 border-l-transparent";
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

      <div className="flex flex-col gap-4 mb-4 md:mb-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-secondary border border-border w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs min-h-[44px] flex-1 gap-1.5">
              Все ({metrics.length})
            </TabsTrigger>
            <TabsTrigger value="attention" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs min-h-[44px] flex-1 gap-1.5">
              ⚠️ <span className="hidden sm:inline">Внимание</span> ({attentionCount})
            </TabsTrigger>
            <TabsTrigger value="effective" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs min-h-[44px] flex-1 gap-1.5">
              ✅ <span className="hidden sm:inline">Эффективные</span> ({effectiveCount})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs min-h-[44px] flex-1 gap-1.5">
              ⏸ <span className="hidden sm:inline">Отключенные</span> ({inactiveCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="h-10 min-h-[44px] w-full pl-8 text-xs bg-secondary border-border"
            />
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>


      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent bg-secondary/50">
                <TableHead className="text-sm font-bold text-muted-foreground w-[180px] px-4 py-4">Кабинет</TableHead>
                {active.id === "hq" && (
                  <TableHead className="text-sm font-bold text-muted-foreground px-4 py-4">Проект</TableHead>
                )}
                <SortableHead label="Расходы" sortField="spend" />
                <SortableHead label="Лиды" sortField="meta_leads" />
                <SortableHead label="Визиты" sortField="visits" />
                <SortableHead label="Продажи" sortField="sales" />
                <SortableHead label="Сумма продаж" sortField="revenue" />
                <SortableHead label="ROMI" sortField="romi" />
                <TableHead className="text-xs font-medium text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {active.id === "hq" ? "Выберите или создайте проект в боковой панели" : "Нет рекламных кабинетов в этом проекте"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const isActiveCabinet = c.is_active !== false;
                  const s = isActiveCabinet ? statusCfg.active : statusCfg.paused;
                  const spend = Number(c.spend) || 0;
                  const leads = Number(c.meta_leads) || 0;
                  const cpl = Number(c.cpl) || 0;
                  const visits = Number(c.visits) || 0;
                  const cpv = Number(c.cpv) || 0;
                  const sales = Number(c.sales) || 0;
                  const revenue = Number(c.revenue) || 0;
                  const romi = Number(c.romi) || 0;
                  const cac = Number(c.cac) || 0;

                  const leadToVisitCr = leads > 0 ? (visits / leads) * 100 : 0;
                  const visitToSaleCr = visits > 0 ? (sales / visits) * 100 : 0;

                  const isExpanded = expandedId === c.client_id;
                  const isMetaLoading = metaLoading[c.client_id];
                  return (
                    <>
                    <TableRow key={c.client_id} className={`group/row border-b border-border hover:bg-accent/50 transition-colors ${getRowIndicator(c)}`}>
                      <TableCell className="py-4">
                        <button
                          onClick={() => handleRowClick(c.client_id)}
                          className="flex items-start gap-2 text-left w-full"
                        >
                          {isMetaLoading
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mt-0.5 flex-shrink-0" />
                            : <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                          <div>
                            <p className="text-[15px] font-bold text-foreground tabular-nums">{c.client_name}</p>
                            <span className={`inline-flex items-center gap-1.5 text-xs mt-1.5 ${s.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </div>
                        </button>
                      </TableCell>

                      {active.id === "hq" && (
                        <TableCell className="py-4">
                          <p className="text-sm text-foreground">{c.project_name || "HQ / MarkVision"}</p>
                        </TableCell>
                      )}

                      <TableCell className="py-4">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{spend > 0 ? fmt(spend, " ₸") : "—"}</p>
                      </TableCell>

                      <TableCell className="py-4">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{leads || "—"}</p>
                        {cpl > 0 && <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">CPL: {fmt(cpl, " ₸")}</p>}
                      </TableCell>

                      <TableCell className="py-4">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{visits || "—"}</p>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {cpv > 0 && <span className="text-[11px] text-muted-foreground tabular-nums">CPV: {fmt(cpv, " ₸")}</span>}
                          {leadToVisitCr > 0 && <span className="text-[11px] text-muted-foreground/70 tabular-nums">CR: {leadToVisitCr.toFixed(1)}%</span>}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{sales || "—"}</p>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {cac > 0 && <span className="text-[11px] text-muted-foreground tabular-nums">CAC: {fmt(cac, " ₸")}</span>}
                          {visitToSaleCr > 0 && <span className="text-[11px] text-muted-foreground/70 tabular-nums">CR: {visitToSaleCr.toFixed(1)}%</span>}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{revenue > 0 ? fmt(revenue, " ₸") : "—"}</p>
                      </TableCell>

                      <TableCell className="py-4">
                        <p className={`text-sm font-semibold tabular-nums ${romi > 0 ? "text-[hsl(var(--status-good))]" : romi < 0 ? "text-[hsl(var(--status-critical))]" : "text-foreground"}`}>
                          {romi !== 0 ? `${romi > 0 ? "+" : ""}${Math.round(romi)}%` : "—"}
                        </p>
                      </TableCell>

                      <TableCell className="py-4">
                        <DeleteButton clientName={c.client_name} clientId={c.client_id} onDeleted={fetchMetrics} />
                      </TableCell>
                    </TableRow>
                    {isExpanded && accountMeta[c.client_id] && (
                      <TableRow key={`${c.client_id}-campaigns`} className="border-b border-border bg-secondary/20">
                        <TableCell colSpan={active.id === "hq" ? 9 : 8} className="p-0">
                          <AccountCampaigns
                            adAccountId={accountMeta[c.client_id].adAccountId}
                            fbToken={accountMeta[c.client_id].fbToken}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={fetchMetrics} />
    </DashboardLayout>
  );
}
