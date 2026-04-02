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
import { DollarSign, Users, BarChart3, TrendingUp, Target, Activity, CalendarDays, LayoutDashboard, Plus, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ClientMetric {
  client_id: string | null;
  project_id: string | null;
  client_name: string | null;
  is_active: boolean | null;
  spend: number | null;
  meta_leads: number | null;
  revenue: number | null;
  visits: number | null;
  sales: number | null;
  cac: number | null;
  romi: number | null;
  cpl: number | null;
  cpv: number | null;
  followers?: number;
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
    { label: "Подписчики", value: (client.followers ?? 0).toLocaleString('ru-RU'), icon: Users },
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
            {client.cpl && client.cpl > 5000
                ? `Стоимость лида (${formatMoney(client.cpl)}) превышает целевые показатели. Рекомендуем протестировать новые аудитории.`
                : `Проект «${client.client_name}» работает в штатном режиме. Конверсия из визита в продажу составляет ${client.visits && client.sales ? ((client.sales / client.visits) * 100).toFixed(1) : 0}%.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ZeroStateOnboarding({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
        <div className="relative h-24 w-24 rounded-3xl bg-card border border-border/50 flex items-center justify-center shadow-2xl">
          <Target className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-foreground tracking-tight mb-4">
        Добро пожаловать в <span className="text-primary">MarkVision AI</span>
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-10">
        Система полностью обнулена и готова к работе. Начните с создания вашего первого проекта, который станет главным узлом управления.
      </p>
      
      <Button 
        size="lg" 
        className="h-14 px-10 rounded-2xl gap-3 font-bold text-base shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
        onClick={onCreate}
      >
        <Plus className="h-5 w-5" />
        Создать первый проект
      </Button>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold">Чистый старт</h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-left">Все старые данные удалены. Вы строите архитектуру с нуля.</p>
        </div>
        <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold">Главный проект</h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-left">Первый созданный проект автоматически станет мастер-профилем.</p>
        </div>
        <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold">Команда и роли</h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-left">Добавляйте сотрудников и распределяйте их по проектам позже.</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { active, isAgency, workspaces, createProject } = useWorkspace();
  const { isSuperadmin } = useRole();
  const [clients, setClients] = useState<ClientMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    async function fetch() {
      setLoading(true);
      try {
        let clientsData: ClientMetric[] = [];

        // In new architecture, we treat isAgency (first project) as the surrogate for "HQ View"
        if (isAgency && active) {
          const { data, error } = await (supabase as any).from("agency_metrics_view").select("*").neq("is_agency", true);
          if (error) throw error;
          clientsData = data || [];
        } else if (active) {
          // Data Isolation Fix: Only get valid client_config_ids for this project
          const { data: shared } = await (supabase as any).from("client_config_visibility").select("client_config_id").eq("project_id", active.id);
          const sharedIds = (shared || []).map((s: any) => s.client_config_id);

          const { data: configs } = await (supabase as any).from("clients_config").select("id").eq("project_id", active.id).neq("is_agency", true);
          const projectIds = (configs || []).map((c: any) => c.id);

          const validIds = [...new Set([...sharedIds, ...projectIds])];

          let query = (supabase as any).from("agency_metrics_view").select("*").neq("is_agency", true);
          if (validIds.length > 0) {
            query = query.in("client_id", validIds);
          } else {
            query = query.eq("client_id", "00000000-0000-0000-0000-000000000000");
          }

          const { data, error } = await query;
          if (error) throw error;
          clientsData = data || [];
        }

        if (!isMounted) return;
        setClients(clientsData);
      } catch (e: any) {
        if (!isMounted) return;
        toast({ title: "Ошибка", description: e.message, variant: "destructive" });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetch();
    return () => { isMounted = false; };
  }, [active?.id]);

  const [agencyFinance, setAgencyFinance] = useState<{ mrr: number; costs: number } | null>(null);

  useEffect(() => {
    if (!isAgency || !active) return;
    const currentActiveId = active.id;
    async function fetchAgencyFinance() {
      const { data: hqCabs } = await (supabase as any)
        .from("clients_config")
        .select("id")
        .eq("project_id", currentActiveId)
        .neq("is_agency", true);
      const hqCabIds = (hqCabs || []).map((c: any) => c.id);

      if (hqCabIds.length === 0) {
        setAgencyFinance({ mrr: 0, costs: 0 });
        return;
      }

      const { data } = await (supabase as any)
        .from("finance_client_services")
        .select("price")
        .in("client_config_id", hqCabIds);
      const mrr = (data || []).reduce((s: number, r: any) => s + (r.price ?? 0), 0);

      const { data: billing } = await (supabase as any)
        .from("finance_client_billing")
        .select("expenses")
        .in("client_config_id", hqCabIds);
      const costs = (billing || []).reduce((s: number, r: any) => s + (r.expenses ?? 0), 0);

      setAgencyFinance({ mrr, costs });
    }
    fetchAgencyFinance();
  }, [isAgency, active?.id]);

  const agencyMetrics: any = loading
    ? null
    : (() => {
      const hqPersonalClients = clients.filter((c: any) =>
        c.project_id === active?.id && c.is_agency === false
      );
      const activeAccounts = clients.filter((c: any) => c.is_active).length;
      const mrr = agencyFinance?.mrr ?? 0;
      const costs = agencyFinance?.costs ?? 0;
      const totalFollowers = hqPersonalClients
        .reduce((s: number, c: any) => s + (c.followers ?? 0), 0);
      return { totalRevenue: mrr, totalSpend: costs, totalFollowers, activeProjects: activeAccounts };
    })();

  const aggregateClientData = (clientList: ClientMetric[], id: string, name: string) => {
    if (!clientList || !Array.isArray(clientList)) {
      return { client_id: id, project_id: id, client_name: name, is_active: true, spend: 0, meta_leads: 0, revenue: 0, visits: 0, sales: 0, impressions: 0, clicks: 0, followers: 0, cpl: 0, cpv: 0, cac: 0 } as any;
    }
    const list = clientList.filter(c => c.is_agency === false);
    const spend = list.reduce((s, c) => s + (c.spend ?? 0), 0);
    const leads = list.reduce((s, c) => s + (c.meta_leads ?? 0), 0);
    const rev = list.reduce((s, c) => s + (c.revenue ?? 0), 0);
    const v = list.reduce((s, c) => s + (c.visits ?? 0), 0);
    const sales = list.reduce((s, c) => s + (c.sales ?? 0), 0);
    const imps = list.reduce((s, c) => s + (c.impressions ?? 0), 0);
    const clks = list.reduce((s, c) => s + (c.clicks ?? 0), 0);

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
      followers: list.reduce((s, c) => s + (c.followers ?? 0), 0),
      cpl: leads > 0 ? spend / leads : 0,
      cpv: v > 0 ? spend / v : 0,
      cac: sales > 0 ? spend / sales : 0,
    } as any;
  };

  const handleCreatePrompt = () => {
    const name = window.prompt("Введите название вашего первого проекта:");
    if (name) {
      createProject(name);
    }
  };

  if (!loading && (workspaces.length === 0 || !active)) {
    return (
      <DashboardLayout breadcrumb="Начало работы">
        <ZeroStateOnboarding onCreate={handleCreatePrompt} />
      </DashboardLayout>
    );
  }

  // Still loading or active is null — show loading state
  if (!active) {
    return (
      <DashboardLayout breadcrumb="Загрузка...">
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const matchedClient = !isAgency ? aggregateClientData(clients, active.id, active.name) : null;
  const hqClients = clients.filter(c => c.project_id === active.id && c.is_agency === false);
  const matchedHqClient = aggregateClientData(hqClients, active.id, active.name);

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
      {active && <HqRevenueChart projectId={active.id} />}
    </>
  );

  return (
    <DashboardLayout breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {!isAgency && active && (
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

        {isAgency && isSuperadmin && active ? (
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="mb-8 bg-secondary/50 border border-border p-1 rounded-xl">
              <TabsTrigger 
                value="global" 
                className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-xs font-medium"
              >
                <LayoutDashboard size={14} className="opacity-70" /> Глобальная сводка
              </TabsTrigger>
              <TabsTrigger 
                value="local" 
                className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-xs font-medium"
              >
                <BarChart3 size={14} className="opacity-70" /> Мои показатели
              </TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="space-y-6 mt-0">
              {renderAgencyView()}
            </TabsContent>
            <TabsContent value="local" className="space-y-6 mt-0">
              {renderClientView(matchedHqClient, active.name)}
            </TabsContent>
          </Tabs>
        ) : isAgency && !isSuperadmin && active ? (
          renderClientView(matchedHqClient, active.name)
        ) : active ? (
          renderClientView(matchedClient, active.name)
        ) : null}
      </div>
    </DashboardLayout>
  );
}
