import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { Channel, Campaign, Creative, OrganicPost } from "@/components/analytics/analyticsData";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface RawCreative {
  id: string; name: string; format: string; landing: string | null; thumbnail: string | null;
  spend: number; clicks: number; leads: number; visits: number; sales: number; revenue: number; campaign_id: string;
}
interface RawCampaign {
  id: string; name: string; spend: number; clicks: number; leads: number; visits: number; sales: number; revenue: number; channel_id: string;
}
interface RawChannel {
  id: string; name: string; icon: string; color: string; spend: number; clicks: number; leads: number; visits: number; sales: number; revenue: number; project_id: string | null;
}
interface RawOrganicPost {
  id: string; thumbnail: string | null; caption: string; trigger_word: string | null; dms: number; leads: number; sales: number; revenue: number; ltv: number;
}

export function useAnalyticsData() {
  const { toast } = useToast();
  const { active, isAgency } = useWorkspace();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [organicPosts, setOrganicPosts] = useState<OrganicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLeadsFromCrm, setTotalLeadsFromCrm] = useState(0);
  const [dailyAgg, setDailyAgg] = useState({ spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });
  const [prevDailyAgg, setPrevDailyAgg] = useState({ spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });
  const [prevLeadsFromCrm, setPrevLeadsFromCrm] = useState(0);
  const [period, setPeriod] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchRequestRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const requestId = ++fetchRequestRef.current;
    const isCurrent = () => requestId === fetchRequestRef.current;

    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Clear old data immediately to avoid leakage
    setChannels([]);
    setOrganicPosts([]);
    setTotalLeadsFromCrm(0);
    setDailyAgg({ spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });
    
    try {
      const monthStart = format(period.from, 'yyyy-MM-dd');
      const monthEnd = format(period.to, 'yyyy-MM-dd');

      const duration = period.to.getTime() - period.from.getTime();
      const prevFrom = new Date(period.from.getTime() - duration - 86400000);
      const prevTo = new Date(period.to.getTime() - duration - 86400000);
      const prevStart = format(prevFrom, 'yyyy-MM-dd');
      const prevEnd = format(prevTo, 'yyyy-MM-dd');

      let chQ = (supabase as any).from("analytics_channels").select("*").order("created_at");
      let campQ = (supabase as any).from("analytics_campaigns").select("*, analytics_channels!inner(*)").order("created_at");
      let crQ = (supabase as any).from("analytics_creatives").select("*, analytics_campaigns!inner(id, analytics_channels!inner(*))").order("created_at");
      let opQ = (supabase as any).from("analytics_organic_posts").select("*").order("created_at");
      let leadsQ = (supabase as any).from("leads_crm").select("id", { count: "exact", head: true });
      let dailyQ = (supabase as any).from("daily_data").select("spend, clicks, impressions, leads, visits, sales, revenue").gte("date", monthStart).lte("date", monthEnd);

      let prevLeadsQ = (supabase as any).from("leads_crm").select("id", { count: "exact", head: true });
      let prevDailyQ = (supabase as any).from("daily_data").select("spend, clicks, impressions, leads, visits, sales, revenue").gte("date", prevStart).lte("date", prevEnd);

      chQ = chQ.eq("project_id", active.id).gte("period_start", monthStart).lte("period_end", monthEnd);
      campQ = campQ.eq("analytics_channels.project_id", active.id).gte("analytics_channels.period_start", monthStart).lte("analytics_channels.period_end", monthEnd);
      crQ = crQ.eq("analytics_campaigns.analytics_channels.project_id", active.id).gte("analytics_campaigns.analytics_channels.period_start", monthStart).lte("analytics_campaigns.analytics_channels.period_end", monthEnd);
      opQ = opQ.eq("project_id", active.id).gte("created_at", monthStart).lte("created_at", monthEnd);
      leadsQ = leadsQ.eq("project_id", active.id).gte("created_at", monthStart).lte("created_at", monthEnd);

      prevLeadsQ = prevLeadsQ.eq("project_id", active.id).gte("created_at", prevStart).lte("created_at", prevEnd);

      let query = (supabase as any).from("clients_config").select("id");

      if (isAgency) {
        query = query.eq("project_id", active.id);
      } else {
        const { data: shared } = await (supabase as any)
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", active.id);
        
        if (!isCurrent()) return;

        const sharedIds = (shared || []).map((s: any) => s.client_config_id);
        if (sharedIds.length > 0) {
          query = query.or(`project_id.eq.${active.id},id.in.(${sharedIds.join(",")})`);
        } else {
          query = query.eq("project_id", active.id);
        }
      }

      const { data: configs } = await query;
      if (!isCurrent()) return;

      const configIds = (configs || []).map((c: any) => c.id);
      if (configIds.length > 0) {
        dailyQ = dailyQ.in("client_config_id", configIds);
        prevDailyQ = prevDailyQ.in("client_config_id", configIds);
      } else {
        dailyQ = dailyQ.eq("client_config_id", "00000000-0000-0000-0000-000000000000");
        prevDailyQ = prevDailyQ.eq("client_config_id", "00000000-0000-0000-0000-000000000000");
      }

      const [chRes, campRes, crRes, opRes, leadsRes, dailyRes, prevLeadsRes, prevDailyRes] = await Promise.all([
        chQ, campQ, crQ, opQ, leadsQ, dailyQ, prevLeadsQ, prevDailyQ
      ]);

      if (!isCurrent()) return;

      const rawChannels = (chRes.data as RawChannel[]) || [];
      const rawCampaigns = (campRes.data as RawCampaign[]) || [];
      const rawCreatives = (crRes.data as RawCreative[]) || [];
      const rawOrganic = (opRes.data as RawOrganicPost[]) || [];

      setTotalLeadsFromCrm(leadsRes.count || 0);
      setPrevLeadsFromCrm(prevLeadsRes.count || 0);

      const sumAgg = (rows: any[]) => rows.reduce((acc, r) => ({
        spend: acc.spend + (Number(r.spend) || 0),
        clicks: acc.clicks + (Number(r.clicks) || 0),
        impressions: acc.impressions + (Number(r.impressions) || 0),
        leads: acc.leads + (Number(r.leads) || 0),
        visits: acc.visits + (Number(r.visits) || 0),
        sales: acc.sales + (Number(r.sales) || 0),
        revenue: acc.revenue + (Number(r.revenue) || 0),
      }), { spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });

      setDailyAgg(sumAgg(dailyRes.data || []));
      setPrevDailyAgg(sumAgg(prevDailyRes.data || []));

      // Build hierarchy
      const creativesByCampaign = new Map<string, Creative[]>();
      for (const cr of rawCreatives) {
        const list = creativesByCampaign.get(cr.campaign_id) || [];
        list.push({
          id: cr.id, name: cr.name,
          format: (cr.format as Creative["format"]) || "Photo",
          landing: cr.landing || "", thumbnail: cr.thumbnail || undefined,
          spend: Number(cr.spend), clicks: cr.clicks, leads: cr.leads,
          visits: cr.visits, sales: cr.sales, revenue: Number(cr.revenue),
        });
        creativesByCampaign.set(cr.campaign_id, list);
      }

      const campaignsByChannel = new Map<string, Campaign[]>();
      for (const camp of rawCampaigns) {
        const list = campaignsByChannel.get(camp.channel_id) || [];
        list.push({
          id: camp.id, name: camp.name,
          spend: Number(camp.spend), clicks: camp.clicks, leads: camp.leads,
          visits: camp.visits, sales: camp.sales, revenue: Number(camp.revenue),
          creatives: creativesByCampaign.get(camp.id) || [],
        });
        campaignsByChannel.set(camp.channel_id, list);
      }

      setChannels(rawChannels.map(ch => ({
        ...ch,
        campaigns: campaignsByChannel.get(ch.id) || []
      })));
      setOrganicPosts(rawOrganic);

    } catch (e: unknown) {
      if (isCurrent()) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки аналитики";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [active?.id, period, isAgency, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const derived = useMemo(() => {
    const hasDaily = dailyAgg.spend > 0 || dailyAgg.leads > 0;
    const totalSpend = hasDaily ? dailyAgg.spend : channels.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = hasDaily ? dailyAgg.revenue : channels.reduce((s, c) => s + c.revenue, 0);
    const totalLeads = (hasDaily ? dailyAgg.leads : channels.reduce((s, c) => s + c.leads, 0)) || totalLeadsFromCrm;
    const totalClicks = hasDaily ? dailyAgg.clicks : channels.reduce((s, c) => s + c.clicks, 0);
    const totalVisits = hasDaily ? dailyAgg.visits : channels.reduce((s, c) => s + c.visits, 0);
    const totalSales = hasDaily ? dailyAgg.sales : channels.reduce((s, c) => s + c.sales, 0);
    const totalImpressions = hasDaily ? dailyAgg.impressions : 0;
    const globalRomi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const cpv = totalVisits > 0 ? totalSpend / totalVisits : 0;
    const cac = totalSales > 0 ? totalSpend / totalSales : 0;

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const trends = {
      spend: calcTrend(totalSpend, prevDailyAgg.spend),
      revenue: calcTrend(totalRevenue, prevDailyAgg.revenue),
      leads: calcTrend(totalLeads, prevDailyAgg.leads),
      sales: calcTrend(totalSales, prevDailyAgg.sales),
      clicks: calcTrend(totalClicks, prevDailyAgg.clicks),
      visits: calcTrend(totalVisits, prevDailyAgg.visits),
      romi: prevDailyAgg.spend > 0 ? globalRomi - Math.round(((prevDailyAgg.revenue - prevDailyAgg.spend) / prevDailyAgg.spend) * 100) : 0,
    };

    const topChannel = channels.length > 0
      ? channels.reduce((best, c) => {
          const r = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : -Infinity;
          const bestR = best.spend > 0 ? ((best.revenue - best.spend) / best.spend) * 100 : -Infinity;
          return r > bestR ? c : best;
        }, channels[0])
      : null;

    const funnelData = [
      { stage: "Показы", value: totalImpressions, label: "" },
      { stage: "Клики", value: totalClicks, label: "" },
      { stage: "Лиды", value: totalLeads, label: "" },
      { stage: "Диагностики", value: totalVisits, label: "" },
      { stage: "Продажи", value: totalSales, label: "" },
    ].map((d) => ({ ...d, label: new Intl.NumberFormat("ru-RU").format(Math.round(d.value)) }));

    const channelChartData = channels.map((ch) => ({
      name: ch.name, spend: ch.spend, revenue: ch.revenue, color: ch.color,
    }));

    return { totalSpend, totalRevenue, totalSales, totalLeads, totalClicks, totalVisits, totalImpressions, globalRomi, cpl, cpv, cac, topChannel, funnelData, channelChartData, trends };
  }, [channels, dailyAgg, prevDailyAgg, totalLeadsFromCrm]);

  return {
    channels, organicPosts, loading, totalLeadsFromCrm,
    period, setPeriod, refresh: fetchAll,
    ...derived,
  };
}
