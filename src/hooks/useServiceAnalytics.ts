import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface ServiceAnalyticsData {
    service_category: string;
    spend: number;
    leads: number;
    visits: number;
    sales: number;
    revenue: number;
    cpl: number;
    cac: number;
    romi: number;
}

export function useServiceAnalytics() {
    const { toast } = useToast();
    const { active } = useWorkspace();
    const [data, setData] = useState<ServiceAnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServiceAnalytics() {
            setLoading(true);
            try {
                let query = (supabase as any)
                    .from("service_analytics_view")
                    .select("*");

                query = query.eq("project_id", active.id);

                const { data: resData, error } = await query;

                if (error) throw error;

                const processedData: ServiceAnalyticsData[] = (resData || []).map((item: any) => {
                    const spend = Number(item.spend) || 0;
                    const revenue = Number(item.revenue) || 0;
                    const leads = Number(item.leads) || 0;
                    const sales = Number(item.sales) || 0;

                    return {
                        service_category: item.service_category || "Не определено",
                        spend,
                        leads,
                        visits: Number(item.visits) || 0,
                        sales,
                        revenue,
                        cpl: leads > 0 ? spend / leads : 0,
                        cac: sales > 0 ? spend / sales : 0,
                        romi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
                    };
                }).sort((a, b) => b.revenue - a.revenue);

                setData(processedData);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Ошибка загрузки аналитики по услугам";
                toast({ title: "Ошибка", description: msg, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        if (active?.id) {
            fetchServiceAnalytics();
        }
    }, [active.id, toast]);

    return { data, loading };
}
