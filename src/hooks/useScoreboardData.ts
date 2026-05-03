import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanRow {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
}

interface DailyFact {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
}

const emptyPlan: PlanRow = { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 };

export function useScoreboardData(year: number, monthIndex: number, activeProjectId?: string | null) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanRow>(emptyPlan);
  const [dailyFacts, setDailyFacts] = useState<DailyFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) {
      setPlan(emptyPlan);
      setDailyFacts([]);
      setLoading(false);
      return;
    }

    const pid = activeProjectId as string;
    let cancelled = false;

    // Reset data immediately when project changes to avoid stale data leakage
    setPlan(emptyPlan);
    setDailyFacts([]);

    async function fetch() {
      setLoading(true);
      try {
        const monthYear = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        const startDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
        const endMonth = monthIndex === 11 ? `${year + 1}-01-01` : `${year}-${String(monthIndex + 2).padStart(2, "0")}-01`;

        // 1. Fetch Plan
        const planQuery = supabase
          .from("monthly_plans")
          .select("plan_spend, plan_leads, plan_visits, plan_sales, plan_revenue")
          .eq("month_year", monthYear)
          .eq("project_id", pid)
          .limit(1)
          .maybeSingle();

        // 2. Fetch Shared Visibility
        const sharedQuery = supabase
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", pid);

        const [planRes, sharedRes] = await Promise.all([planQuery, sharedQuery]);
        
        if (planRes.error) throw planRes.error;
        if (sharedRes.error) throw sharedRes.error;
        if (cancelled) return;

        // 3. Fetch Daily Data (with shared cabinets support)
        const sharedIds = (sharedRes.data || []).map((s: any) => s.client_config_id);
        let dailyQuery = supabase
          .from("daily_data")
          .select("date, spend, impressions, clicks, leads, followers, visits, sales, revenue")
          .gte("date", startDate)
          .lt("date", endMonth);

        if (sharedIds.length > 0) {
          dailyQuery = dailyQuery.or(`project_id.eq.${pid},client_config_id.in.(${sharedIds.join(",")})`);
        } else {
          dailyQuery = dailyQuery.eq("project_id", pid);
        }

        const factsRes = await dailyQuery.order("date");
        if (factsRes.error) throw factsRes.error;
        if (cancelled) return;

        setPlan(planRes.data ? {
          spend: Number(planRes.data.plan_spend) || 0,
          impressions: 0,
          clicks: 0,
          leads: Number(planRes.data.plan_leads) || 0,
          followers: 0,
          visits: Number(planRes.data.plan_visits) || 0,
          sales: Number(planRes.data.plan_sales) || 0,
          revenue: Number(planRes.data.plan_revenue) || 0,
        } : emptyPlan);

        setDailyFacts((factsRes.data || []).map((r: Record<string, unknown>) => ({
          date: String(r.date),
          spend: Number(r.spend),
          impressions: Number(r.impressions),
          clicks: Number(r.clicks),
          leads: Number(r.leads),
          followers: Number(r.followers),
          visits: Number(r.visits),
          sales: Number(r.sales),
          revenue: Number(r.revenue),
        })));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки данных";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [year, monthIndex, activeProjectId]);

  const fact = useMemo<PlanRow>(() => {
    return dailyFacts.reduce((acc, d) => ({
      spend: acc.spend + d.spend,
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      leads: acc.leads + d.leads,
      followers: acc.followers + d.followers,
      visits: acc.visits + d.visits,
      sales: acc.sales + d.sales,
      revenue: acc.revenue + d.revenue,
    }), { ...emptyPlan });
  }, [dailyFacts]);

  return { plan, fact, dailyFacts, loading };
}
