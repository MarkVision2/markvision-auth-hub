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

export function useScoreboardData(year: number, monthIndex: number) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanRow>(emptyPlan);
  const [dailyFacts, setDailyFacts] = useState<DailyFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const startDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
        const endMonth = monthIndex === 11 ? `${year + 1}-01-01` : `${year}-${String(monthIndex + 2).padStart(2, "0")}-01`;

        const [planRes, factsRes] = await Promise.all([
          supabase
            .from("scoreboard_plans")
            .select("spend, impressions, clicks, leads, followers, visits, sales, revenue")
            .eq("year", year)
            .eq("month_index", monthIndex)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("scoreboard_daily_facts")
            .select("date, spend, impressions, clicks, leads, followers, visits, sales, revenue")
            .gte("date", startDate)
            .lt("date", endMonth)
            .order("date"),
        ]);

        if (planRes.error) throw planRes.error;
        if (factsRes.error) throw factsRes.error;
        if (cancelled) return;

        setPlan(planRes.data ? {
          spend: Number(planRes.data.spend),
          impressions: planRes.data.impressions,
          clicks: planRes.data.clicks,
          leads: planRes.data.leads,
          followers: planRes.data.followers,
          visits: planRes.data.visits,
          sales: planRes.data.sales,
          revenue: Number(planRes.data.revenue),
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
  }, [year, monthIndex]);

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
