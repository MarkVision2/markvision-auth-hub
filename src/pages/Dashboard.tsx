import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HqAiSearch from "@/components/hq/HqAiSearch";
import HqKpiCards from "@/components/hq/HqKpiCards";
import HqAnomalyRadar from "@/components/hq/HqAnomalyRadar";
import HqAiDirector from "@/components/hq/HqAiDirector";
import HqRevenueChart from "@/components/hq/HqRevenueChart";
import HqRolePanels from "@/components/hq/HqRolePanels";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export default function Dashboard() {
  const { toast } = useToast();
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

  const metrics = loading
    ? null
    : (() => {
        const totalRevenue = clients.reduce((s, c) => s + (c.revenue ?? 0), 0);
        const totalSpend = clients.reduce((s, c) => s + (c.spend ?? 0), 0);
        const romi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const activeProjects = clients.filter((c) => c.is_active).length;
        return { totalRevenue, totalSpend, romi, activeProjects };
      })();

  return (
    <DashboardLayout breadcrumb="Штаб-квартира">
      <div className="space-y-6">
        <HqAiSearch />
        <HqKpiCards metrics={metrics} />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <HqAnomalyRadar clients={clients} />
          </div>
          <div className="lg:col-span-2">
            <HqAiDirector />
          </div>
        </div>
        <HqRevenueChart clients={clients} />
        <HqRolePanels />
      </div>
    </DashboardLayout>
  );
}
