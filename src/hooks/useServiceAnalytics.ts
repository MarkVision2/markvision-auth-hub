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
        setData([]); // Clear old data immediately
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

            if (startDate && endDate) {
                query = query.gte("created_at", startDate).lte("created_at", endDate);
            }

            const { data: resData, error } = await query;

            if (error) throw error;

            // Поскольку VIEW теперь возвращает данные по дням, нам нужно агрегировать их по категориям в UI
            const aggregated = (resData || []).reduce((acc: Record<string, any>, item: any) => {
                const cat = item.service_category || "Не определено";
                if (!acc[cat]) {
                    acc[cat] = {
                        service_category: cat,
                        spend: 0,
                        leads: 0,
                        visits: 0,
                        sales: 0,
                        revenue: 0
                    };
                }
                acc[cat].spend += Number(item.spend) || 0;
                acc[cat].leads += Number(item.leads) || 0;
                acc[cat].visits += Number(item.visits) || 0;
                acc[cat].sales += Number(item.sales) || 0;
                acc[cat].revenue += Number(item.revenue) || 0;
                return acc;
            }, {});

            const processedData: ServiceAnalyticsData[] = Object.values(aggregated).map((item: any) => {
                const spend = item.spend;
                const revenue = item.revenue;
                const leads = item.leads;
                const sales = item.sales;

                return {
                    service_category: item.service_category,
                    spend,
                    leads,
                    visits: item.visits,
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
