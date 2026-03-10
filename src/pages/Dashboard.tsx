import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HqKpiCards from "@/components/hq/HqKpiCards";
import HqAnomalyRadar from "@/components/hq/HqAnomalyRadar";
import HqAiDirector from "@/components/hq/HqAiDirector";
import HqRevenueChart from "@/components/hq/HqRevenueChart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";
import { DollarSign, Users, BarChart3, TrendingUp, Target, Activity, CalendarDays, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ClientMetric {
  client_id: string | null;
  project_id: string | null;
  client_name: string | null;
  is_active: boolean | null;
  spend: number | null;
  meta_leads: number | null;
  revenue: number | null;
  romi: number | null;
  cpl: number | null;
  cpv: number | null;
  visits: number | null;
  sales: number | null;
  cac: number | null;
  impressions?: number;
  clicks?: number;
  is_agency?: boolean;
}

function formatMoney(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₸`;
}

/* ── Client-specific KPI cards ── */
function ClientKpiCards({ client }: { client: ClientMetric }) {
  const cards = [
    { icon: <DollarSign className="h-4 w-4 text-primary" />, label: "Расходы на рекламу", value: formatMoney(client.spend ?? 0), accentClass: "text-foreground" },
    { icon: <Users className="h-4 w-4 text-primary" />, label: "Лиды", value: (client.meta_leads ?? 0).toLocaleString('ru-RU'), accentClass: "text-primary" },
    { icon: <BarChart3 className="h-4 w-4 text-primary" />, label: "Выручка", value: formatMoney(client.revenue ?? 0), accentClass: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(c => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">{c.icon}</div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.label}</span>
          </div>
          <p className={`text-xl font-semibold tabular-nums tracking-tight ${c.accentClass}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Client detail panels ── */
function ClientDetailPanels({ client }: { client: ClientMetric }) {
  const metrics = [
    { label: "CPL", value: client.cpl ? formatMoney(client.cpl) : "—", icon: Target },
    { label: "Стоимость визита", value: client.cpv ? formatMoney(client.cpv) : "—", icon: Activity },
    { label: "Стоимость клиента", value: client.cac ? formatMoney(client.cac) : "—", icon: DollarSign },
    { label: "ROMI", value: `${(client.romi ?? 0).toFixed(0)}%`, icon: TrendingUp },
    { label: "Визиты", value: (client.visits ?? 0).toLocaleString('ru-RU'), icon: CalendarDays },
    { label: "Продажи", value: (client.sales ?? 0).toLocaleString('ru-RU'), icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              {m.icon && <m.icon size={13} className="text-muted-foreground" />}
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</span>
            </div>
            <p className="text-base font-semibold text-foreground tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel preview */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Воронка клиента</h3>
        </div>
        <div className="flex items-center justify-between relative">
          {[
            { label: "Показы", value: (client.impressions ?? 0).toLocaleString('ru-RU') },
            { label: "Клики", value: (client.clicks ?? 0).toLocaleString('ru-RU') },
            { label: "Лиды", value: (client.meta_leads ?? 0).toLocaleString('ru-RU') },
            { label: "Визиты", value: (client.visits ?? 0).toLocaleString('ru-RU') },
            { label: "Продажи", value: (client.sales ?? 0).toLocaleString('ru-RU') },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center flex-1 justify-between group">
              <div className="text-center flex-1">
                <p className="text-xl font-bold text-foreground tabular-nums">{step.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{step.label}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="flex flex-col items-center justify-center px-2">
                  <span className="text-muted-foreground/30 text-lg">→</span>
                  <div className="h-4">
                    {(() => {
                      const nextVal = Number(arr[i + 1].value.replace(/\s/g, '')) || 0;
                      const currVal = Number(step.value.replace(/\s/g, '')) || 0;
                      if (currVal > 0 && nextVal > 0) {
                        return <span className="text-[9px] font-bold text-primary/60">{((nextVal / currVal) * 100).toFixed(1)}%</span>;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 flex gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">AI-Рекомендация</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {client.romi && client.romi < 100
              ? `Внимание! ROMI проекта составляет всего ${client.romi.toFixed(0)}%. Рекомендуем пересмотреть рекламные креативы и проверить воронку на этапе перехода Клики -> Лиды.`
              : client.cpl && client.cpl > 5000
                ? `Стоимость лида (${formatMoney(client.cpl)}) превышает целевые показатели. Рекомендуем протестировать новые аудитории.`
                : `Проект «${client.client_name}» работает в штатном режиме. Конверсия из визита в продажу составляет ${client.visits && client.sales ? ((client.sales / client.visits) * 100).toFixed(1) : 0}%.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { active, isAgency } = useWorkspace();
  const { isSuperadmin } = useRole();
  const [clients, setClients] = useState<ClientMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        let clientsData: ClientMetric[] = [];
        let targetIds: string[] = [];

        if (active.id === "hq") {
          const { data, error } = await (supabase as any).from("agency_metrics_view").select("*");
          if (error) throw error;
          clientsData = data || [];
          // For HQ view, we can't easily fetch ALL daily metrics without a specific set of IDs or a date range
          // But we can at least fetch for the clients we found
          targetIds = clientsData.map(c => c.client_id).filter(Boolean) as string[];
        } else {
          const { data: shared } = await (supabase as any).from("client_config_visibility").select("client_config_id").eq("project_id", active.id);
          const sharedIds = (shared || []).map((s: any) => s.client_config_id);

          let query = (supabase as any).from("agency_metrics_view").select("*");
          if (sharedIds.length > 0) {
            query = query.or(`project_id.eq.${active.id},client_id.in.(${sharedIds.join(",")})`);
          } else {
            query = query.eq("project_id", active.id);
          }

          const { data, error } = await query;
          if (error) throw error;
          clientsData = data || [];
          targetIds = sharedIds.length > 0 ? [active.id, ...sharedIds] : [active.id];
        }

        if (targetIds.length > 0) {
          // Fetch base impressions and clicks from clients_config PER client
          const { data: baseData } = await (supabase as any)
            .from("clients_config")
            .select("id, impressions, clicks")
            .in("id", targetIds);

          // Fetch daily impressions and clicks from daily_metrics PER client
          const { data: dailyData } = await (supabase as any)
            .from("daily_metrics")
            .select("impressions, clicks, client_config_id")
            .in("client_config_id", targetIds);

          const finalData = clientsData.map(c => {
            const clientDaily = (dailyData || []).filter((d: any) => d.client_config_id === c.client_id);
            const clientBase = (baseData || []).find((b: any) => b.id === c.client_id);

            return {
              ...c,
              impressions: clientDaily.reduce((s: number, d: any) => s + (d.impressions || 0), 0) + (clientBase?.impressions || 0),
              clicks: clientDaily.reduce((s: number, d: any) => s + (d.clicks || 0), 0) + (clientBase?.clicks || 0)
            };
          });

          setClients(finalData);
        } else {
          setClients(clientsData);
        }
      } catch (e: any) {
        toast({ title: "Ошибка", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [active.id]);

  const [agencyFinance, setAgencyFinance] = useState<{ mrr: number; costs: number } | null>(null);

  useEffect(() => {
    if (!isAgency) return;
    async function fetchAgencyFinance() {
      const { data } = await (supabase as any).from("finance_client_services").select("price");
      const mrr = (data || []).reduce((s: number, r: any) => s + (r.price ?? 0), 0);
      const { data: billing } = await (supabase as any).from("finance_client_billing").select("expenses");
      const costs = (billing || []).reduce((s: number, r: any) => s + (r.expenses ?? 0), 0);
      setAgencyFinance({ mrr, costs });
    }
    fetchAgencyFinance();
  }, [isAgency]);

  const agencyMetrics: any = loading
    ? null
    : (() => {
      const activeAccounts = clients.filter((c: any) => c.is_active).length;
      const mrr = agencyFinance?.mrr ?? 0;
      const costs = agencyFinance?.costs ?? 0;
      const profit = mrr - costs;
      const margin = mrr > 0 ? (profit / mrr) * 100 : 0;
      return { totalRevenue: mrr, totalSpend: costs, romi: margin, activeProjects: activeAccounts };
    })();

  const aggregateClientData = (clientList: ClientMetric[], id: string, name: string) => {
    const spend = clientList.reduce((s, c) => s + (c.spend ?? 0), 0);
    const leads = clientList.reduce((s, c) => s + (c.meta_leads ?? 0), 0);
    const rev = clientList.reduce((s, c) => s + (c.revenue ?? 0), 0);
    const v = clientList.reduce((s, c) => s + (c.visits ?? 0), 0);
    const sales = clientList.reduce((s, c) => s + (c.sales ?? 0), 0);
    const imps = clientList.reduce((s, c) => s + (c.impressions ?? 0), 0);
    const clks = clientList.reduce((s, c) => s + (c.clicks ?? 0), 0);

    return {
      client_id: id,
      project_id: id,
      client_name: name,
      is_active: true,
      spend,
      meta_leads: leads,
      revenue: rev,
      visits: v,
      sales,
      impressions: imps,
      clicks: clks,
      romi: spend > 0 ? ((rev - spend) / spend) * 100 : 0,
      cpl: leads > 0 ? spend / leads : 0,
      cpv: v > 0 ? spend / v : 0,
      cac: sales > 0 ? spend / sales : 0,
    } as any;
  };

  const matchedClient = !isAgency ? aggregateClientData(clients, active.id, active.name) : null;
  const hqClients = clients.filter(c => (c.project_id === "hq" || c.project_id === null) && c.is_agency === false);
  const matchedHqClient = aggregateClientData(hqClients, "hq", active.name);

  const breadcrumb = isAgency ? "Штаб-квартира" : active.name;

  const renderClientView = (targetClient: ClientMetric | null, projName: string) => (
    <>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : targetClient ? (
        <>
          <ClientKpiCards client={targetClient} />
          <ClientDetailPanels client={targetClient} />
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Проект не найден</p>
          <p className="text-sm text-muted-foreground">
            Клиент «{projName}» (или вы сами) не найден в рекламных кабинетах. Добавьте его для отображения воронки.
          </p>
        </div>
      )}
    </>
  );

  const renderAgencyView = () => (
    <>
      <HqKpiCards metrics={agencyMetrics} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <HqAnomalyRadar clients={clients} />
        </div>
        <div className="lg:col-span-2">
          <HqAiDirector />
        </div>
      </div>
      <HqRevenueChart clients={clients} />
    </>
  );

  return (
    <DashboardLayout breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {!isAgency && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent border border-border flex items-center justify-center text-xs font-bold">
              {active.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">{active.name}</h1>
              <p className="text-xs text-muted-foreground">Клиентский дашборд · Данные отфильтрованы</p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
              Client View
            </Badge>
          </div>
        )}

        {isAgency && isSuperadmin ? (
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6 shadow-sm border border-border/50">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <LayoutDashboard size={14} /> Глобальная сводка
              </TabsTrigger>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <BarChart3 size={14} /> Мои показатели
              </TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="space-y-6 mt-0">
              {renderAgencyView()}
            </TabsContent>
            <TabsContent value="local" className="space-y-6 mt-0">
              {renderClientView(matchedHqClient, active.name)}
            </TabsContent>
          </Tabs>
        ) : isAgency && !isSuperadmin ? (
          renderClientView(matchedHqClient, active.name)
        ) : (
          renderClientView(matchedClient, active.name)
        )}
      </div>
    </DashboardLayout>
  );
}
