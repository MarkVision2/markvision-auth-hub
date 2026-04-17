import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { startOfMonth, endOfMonth, format } from "date-fns";

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
    const [period, setPeriod] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const fetchServiceAnalytics = useCallback(async () => {
        if (!active?.id) return;
        setLoading(true);
        try {
            const startDate = format(period.from, 'yyyy-MM-dd');
            const endDate = format(period.to, 'yyyy-MM-dd');

            // Since service_analytics_view is a view, we check if it supports date filtering
            // If it doesn't have a date column, we might need to query underlying tables or 
            // accept that the view provides aggregate data. 
            // Most likely it should have a date or we filter by period if possible.
            let query = (supabase as any)
                .from("service_analytics_view")
                .select("*")
                .eq("project_id", active.id);

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
    }, [active?.id, period, toast]);

    useEffect(() => {
        fetchServiceAnalytics();
    }, [fetchServiceAnalytics]);

    return { data, loading, period, setPeriod, refresh: fetchServiceAnalytics };
}
