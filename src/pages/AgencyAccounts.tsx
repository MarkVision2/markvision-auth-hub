import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type SortKey = "spend" | "meta_leads" | "visits" | "sales" | "romi";
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

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any).from("agency_metrics_view").select("*");
    // Client mode: filter to only their client
    if (!isSuperadmin && active.clientName) {
      query = query.eq("client_name", active.clientName);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
    setMetrics((data as MetricsRow[]) ?? []);
    setLoading(false);
  }, [isSuperadmin, active.clientName]);

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
      const av = Number((a as any)[sortKey]) || 0;
      const bv = Number((b as any)[sortKey]) || 0;
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
      className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{pageTitle}</h1>
        {isSuperadmin && (
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить кабинет
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">
              Все ({metrics.length})
            </TabsTrigger>
            <TabsTrigger value="attention" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">
              ⚠️ Внимание ({attentionCount})
            </TabsTrigger>
            <TabsTrigger value="effective" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">
              ✅ Эффективные ({effectiveCount})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">
              Неактивные ({inactiveCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="h-8 w-48 pl-8 text-xs bg-secondary border-border"
            />
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>


      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent bg-secondary/50">
              <TableHead className="text-xs font-medium text-muted-foreground w-[180px]">Кабинет</TableHead>
              <SortableHead label="Расходы" sortField="spend" />
              <SortableHead label="Лиды" sortField="meta_leads" />
              <SortableHead label="Визиты" sortField="visits" />
              <SortableHead label="Продажи" sortField="sales" />
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
                  Нет кабинетов
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const active = c.is_active !== false;
                const s = active ? statusCfg.active : statusCfg.paused;
                const spend = Number(c.spend) || 0;
                const leads = Number(c.meta_leads) || 0;
                const cpl = Number(c.cpl) || 0;
                const visits = Number(c.visits) || 0;
                const cpv = Number(c.cpv) || 0;
                const sales = Number(c.sales) || 0;
                const revenue = Number(c.revenue) || 0;
                const romi = Number(c.romi) || 0;
                const cac = Number(c.cac) || 0;

                return (
                  <TableRow key={c.client_id} className={`group/row border-b border-border hover:bg-accent/50 transition-colors ${getRowIndicator(c)}`}>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground">{c.client_name}</p>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] mt-1 ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </TableCell>

                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{spend > 0 ? fmt(spend, " ₸") : "—"}</p>
                    </TableCell>

                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{leads || "—"}</p>
                      {cpl > 0 && <p className="text-[11px] text-muted-foreground tabular-nums">CPL: {fmt(cpl, " ₸")}</p>}
                    </TableCell>

                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{visits || "—"}</p>
                      {cpv > 0 && <p className="text-[11px] text-muted-foreground tabular-nums">CPV: {fmt(cpv, " ₸")}</p>}
                    </TableCell>

                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {sales > 0 ? `${sales} шт.` : "—"}
                        {revenue > 0 && <span className="text-muted-foreground font-normal"> / {fmt(revenue, " ₸")}</span>}
                      </p>
                    </TableCell>

                    <TableCell className="py-4">
                      <p className={`text-sm font-semibold tabular-nums ${romi > 0 ? "text-[hsl(var(--status-good))]" : romi < 0 ? "text-[hsl(var(--status-critical))]" : "text-foreground"}`}>
                        {romi !== 0 ? `${romi > 0 ? "+" : ""}${Math.round(romi)}%` : "—"}
                      </p>
                      {cac > 0 && <p className="text-[11px] text-muted-foreground tabular-nums">CAC: {fmt(cac, " ₸")}</p>}
                    </TableCell>

                    <TableCell className="py-4">
                      <DeleteButton clientName={c.client_name} clientId={c.client_id} onDeleted={fetchMetrics} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={fetchMetrics} />
    </DashboardLayout>
  );
}
