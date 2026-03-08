import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SparklineChart from "@/components/agency/SparklineChart";
import CampaignDetailSheet from "@/components/sheets/CampaignDetailSheet";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, ChevronDown, MoreHorizontal, Copy, Pencil, Megaphone, Search,
  AlertTriangle, TrendingDown, CreditCard, Download, Loader2, RefreshCw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  sparkline: number[];
  cpl: number;
  hasData: boolean;
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

type StatusFilter = "all" | "with-data" | "no-data";

export default function DashboardTarget() {
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch clients
      const { data: clientsData, error: cErr } = await (supabase as any)
        .from("clients_config")
        .select("id, client_name, ad_account_id, daily_budget, is_active")
        .eq("is_active", true)
        .order("client_name");
      if (cErr) throw cErr;

      // Fetch last 30 days of daily_metrics
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().split("T")[0];

      const { data: metricsData, error: mErr } = await (supabase as any)
        .from("daily_metrics")
        .select("client_config_id, date, spend, impressions, clicks, leads, visits, sales, revenue")
        .gte("date", sinceStr)
        .order("date", { ascending: true });
      if (mErr) throw mErr;

      // Group metrics by client_config_id
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

      // Build client objects with aggregated metrics
      const mapped: ClientWithMetrics[] = (clientsData || []).map((c: any) => {
        const metrics = metricsMap.get(c.id) || [];
        const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
        const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
        const totalVisits = metrics.reduce((s, m) => s + m.visits, 0);
        const totalSales = metrics.reduce((s, m) => s + m.sales, 0);
        const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
        const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);

        // Last 7 days sparkline (leads per day)
        const last7 = metrics.slice(-7);
        const sparkline = last7.length > 0
          ? last7.map(m => m.leads)
          : [0, 0, 0, 0, 0, 0, 0];

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
          sparkline,
          cpl: totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0,
          hasData: metrics.length > 0,
        };
      });

      setClients(mapped);
      setExpandedAccounts(new Set(mapped.filter(c => c.hasData).map(c => c.name)));
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription on daily_metrics
  useEffect(() => {
    const ch = supabase
      .channel("target_metrics_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  // Generate alerts dynamically
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

  const totals = useMemo(() => ({
    spend: clients.reduce((s, c) => s + c.totalSpend, 0),
    leads: clients.reduce((s, c) => s + c.totalLeads, 0),
    sales: clients.reduce((s, c) => s + c.totalSales, 0),
    withData: clients.filter(c => c.hasData).length,
  }), [clients]);

  const toggleAccount = (name: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
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
      <StaggerContainer className="space-y-4">
        {/* Header */}
        <FadeUpItem className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Центр управления рекламой
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {clients.length} кабинетов · {totals.withData} с данными · {fmtCurrency(totals.spend)} расход · {totals.leads} лидов
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs border-border gap-1.5" onClick={() => { fetchData(); toast({ title: "Обновлено" }); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={() => setBuilderOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-semibold gap-1.5">
              <Rocket className="h-4 w-4" />
              Создать кампанию
            </Button>
          </div>
        </FadeUpItem>

        {/* Alerts */}
        {alerts.length > 0 && (
          <FadeUpItem>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  Алерты · {alerts.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/10 p-2.5">
                      <a.icon className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === "critical" ? "text-destructive" : "text-[hsl(var(--status-warning))]"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground/90 truncate">{a.account}</p>
                        <p className="text-xs text-muted-foreground">{a.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeUpItem>
        )}

        {/* Filters */}
        <FadeUpItem className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск клиента..." className="pl-8 h-9 text-sm bg-secondary/30 border-border" />
          </div>
          <div className="flex items-center gap-1">
            {([
              { value: "all" as StatusFilter, label: "Все" },
              { value: "with-data" as StatusFilter, label: "С данными" },
              { value: "no-data" as StatusFilter, label: "Без данных" },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-sm font-medium px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === f.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-secondary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs border-border gap-1" onClick={() => toast({ title: "Экспорт данных", description: "CSV файл скачивается" })}>
              <Download className="h-3.5 w-3.5" /> Экспорт
            </Button>
          </div>
        </FadeUpItem>

        {/* Data table */}
        <FadeUpItem>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_80px_60px_60px_60px_64px_36px] items-center px-4 py-2 border-b border-border bg-secondary/20">
              {["Клиент", "Расход", "CPL", "Лиды", "Визиты", "Продажи", "7д", ""].map((h, i) => (
                <span key={i} className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">{h}</span>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Ничего не найдено</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте изменить фильтры</p>
              </div>
            )}

            {filteredClients.map((client) => {
              const isOpen = expandedAccounts.has(client.name);
              const hasAlert = alerts.some(a => a.account === client.name);

              return (
                <Collapsible key={client.id} open={isOpen} onOpenChange={() => toggleAccount(client.name)}>
                  <CollapsibleTrigger asChild>
                    <div className={`grid grid-cols-[1fr_100px_80px_60px_60px_60px_64px_36px] items-center px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer ${hasAlert ? "bg-destructive/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "" : "-rotate-90"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {client.ad_account_id || "Нет ad account"}
                            {!client.hasData && " · Нет данных"}
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
                      <div className="w-14">
                        <SparklineChart
                          data={client.sparkline}
                          color={client.cpl > 10000 ? "hsl(350 89% 60%)" : "hsl(160 84% 39%)"}
                        />
                      </div>
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
                      <div className="px-4 py-3 bg-secondary/5 border-b border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Показы", value: fmt(clients.find(c => c.id === client.id)?.sparkline.reduce((a, b) => a + b, 0) || 0) },
                            { label: "Клики", value: fmt(client.totalClicks) },
                            { label: "CTR", value: client.totalClicks > 0 && client.totalLeads > 0 ? `${((client.totalClicks / (client.totalLeads * 100)) * 100).toFixed(1)}%` : "—" },
                            { label: "Выручка", value: client.totalRevenue > 0 ? fmtCurrency(client.totalRevenue) : "—" },
                          ].map((m) => (
                            <div key={m.label} className="rounded-lg border border-border bg-card p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                              <p className="text-sm font-bold font-mono tabular-nums text-foreground mt-0.5">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-6 bg-secondary/5 border-b border-border text-center">
                        <p className="text-xs text-muted-foreground">Данные появятся после сбора статистики из Meta Ads</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">n8n собирает данные ежедневно в 07:00</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </FadeUpItem>
      </StaggerContainer>

      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
    </DashboardLayout>
  );
}
