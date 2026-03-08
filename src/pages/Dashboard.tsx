import { useEffect, useState } from "react"; // refresh
import DashboardLayout from "@/components/DashboardLayout";
import HqKpiCards from "@/components/hq/HqKpiCards";
import HqAnomalyRadar from "@/components/hq/HqAnomalyRadar";
import HqAiDirector from "@/components/hq/HqAiDirector";
import HqRevenueChart from "@/components/hq/HqRevenueChart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { DollarSign, Users, BarChart3, TrendingUp, Target, Activity, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientMetric {
  client_id: string | null;
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
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₸`;
  return `${n.toFixed(0)} ₸`;
}

/* ── Client-specific KPI cards ── */
function ClientKpiCards({ client }: { client: ClientMetric }) {
  const cards = [
    {
      icon: <DollarSign className="h-4 w-4 text-primary" />,
      label: "Расходы на рекламу",
      value: formatMoney(client.spend ?? 0),
      accentClass: "text-foreground",
    },
    {
      icon: <Users className="h-4 w-4 text-primary" />,
      label: "Лиды",
      value: String(client.meta_leads ?? 0),
      accentClass: "text-primary",
    },
    {
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      label: "Выручка",
      value: formatMoney(client.revenue ?? 0),
      accentClass: "text-primary",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      label: "ROMI",
      value: `${(client.romi ?? 0).toFixed(0)}%`,
      accentClass: (client.romi ?? 0) >= 0 ? "text-primary" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">{c.icon}</div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.label}</span>
          </div>
          <p className={`text-2xl font-mono font-semibold tabular-nums tracking-tight ${c.accentClass}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Client detail panels ── */
function ClientDetailPanels({ client }: { client: ClientMetric }) {
  const metrics = [
    { label: "CPL", value: client.cpl ? `${client.cpl.toFixed(0)} ₸` : "—", icon: Target },
    { label: "CPV (визит)", value: client.cpv ? `${client.cpv.toFixed(0)} ₸` : "—", icon: Activity },
    { label: "CAC", value: client.cac ? `${client.cac.toFixed(0)} ₸` : "—", icon: DollarSign },
    { label: "Визиты", value: String(client.visits ?? 0), icon: CalendarDays },
    { label: "Продажи", value: String(client.sales ?? 0), icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      {/* Metrics grid */}
      <div className="grid grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <m.icon size={13} className="text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</span>
            </div>
            <p className="text-lg font-mono font-semibold text-foreground tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel preview */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Воронка клиента</h3>
        </div>
        <div className="flex items-center justify-between">
          {[
            { label: "Показы", value: "—" },
            { label: "Клики", value: "—" },
            { label: "Лиды", value: String(client.meta_leads ?? 0) },
            { label: "Визиты", value: String(client.visits ?? 0) },
            { label: "Продажи", value: String(client.sales ?? 0) },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">{step.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{step.label}</p>
              </div>
              {i < arr.length - 1 && <span className="text-muted-foreground/30 text-lg">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* AI note */}
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 flex gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">AI-Рекомендация</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Данные фильтруются для проекта «{client.client_name}». CRM и Радар конкурентов теперь показывают информацию только по этому клиенту.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════ */

export default function Dashboard() {
  const { toast } = useToast();
  const { active, isAgency } = useWorkspace();
  const [clients, setClients] = useState<ClientMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase.from("agency_metrics_view").select("*");
        if (error) throw error;
        setClients((data as ClientMetric[]) || []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки данных";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  // Agency metrics
  const agencyMetrics = loading
    ? null
    : (() => {
        const totalRevenue = clients.reduce((s, c) => s + (c.revenue ?? 0), 0);
        const totalSpend = clients.reduce((s, c) => s + (c.spend ?? 0), 0);
        const romi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const activeProjects = clients.filter((c) => c.is_active).length;
        return { totalRevenue, totalSpend, romi, activeProjects };
      })();

  // Map workspace ID to a matching client
  const WORKSPACE_CLIENT_MAP: Record<string, string> = {
    "clinic-aiva": "Клиника AIVA",
    "kitarov": "Kitarov Clinic",
    "spine-tech": "Технология позвоночника",
  };

  const matchedClient = !isAgency
    ? clients.find(c => c.client_name === WORKSPACE_CLIENT_MAP[active.id]) || null
    : null;

  const breadcrumb = isAgency ? "Штаб-квартира" : `${active.emoji} ${active.name}`;

  return (
    <DashboardLayout breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {/* Context indicator for client mode */}
        {!isAgency && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent border border-border flex items-center justify-center text-lg">
              {active.emoji}
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

        {isAgency ? (
          /* ── AGENCY VIEW ── */
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
        ) : (
          /* ── CLIENT VIEW ── */
          <>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 h-28 animate-pulse" />
                ))}
              </div>
            ) : matchedClient ? (
              <>
                <ClientKpiCards client={matchedClient} />
                <ClientDetailPanels client={matchedClient} />
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <p className="text-lg font-semibold text-foreground mb-2">Проект не найден</p>
                <p className="text-sm text-muted-foreground">
                  Клиент «{active.name}» не найден в agency_metrics_view. Добавьте его в «Агентские кабинеты».
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
