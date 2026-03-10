import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { Channel, Campaign, Creative, OrganicPost } from "@/components/analytics/analyticsData";



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

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // Fetch analytics tables
        let chQ = supabase.from("analytics_channels").select("*").or(`project_id.${active.id === "hq" ? "is.null" : `eq.${active.id}`}`).order("created_at");

        const [chRes, campRes, crRes, opRes] = await Promise.all([
          chQ,
          supabase.from("analytics_campaigns").select("*, analytics_channels!inner(*)").eq("analytics_channels.project_id", active.id).order("created_at"),
          supabase.from("analytics_creatives").select("*, analytics_campaigns!inner(id, analytics_channels!inner(*))").eq("analytics_campaigns.analytics_channels.project_id", active.id).order("created_at"),
          supabase.from("analytics_organic_posts").select("*").or(`project_id.${active.id === "hq" ? "is.null" : `eq.${active.id}`}`).order("created_at"),
        ]);

        if (chRes.error) throw chRes.error;
        if (campRes.error) throw campRes.error;
        if (crRes.error) throw crRes.error;
        if (opRes.error) throw opRes.error;

        const rawChannels = chRes.data as RawChannel[];
        const rawCampaigns = campRes.data as RawCampaign[];
        const rawCreatives = crRes.data as RawCreative[];
        const rawOrganic = opRes.data as RawOrganicPost[];

        // Also fetch leads count and daily_metrics aggregates
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

        const [leadsRes, dailyRes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }).or(`project_id.${active.id === "hq" ? "is.null" : `eq.${active.id}`}`),
          supabase.from("daily_metrics").select("spend, clicks, impressions, leads, visits, sales, revenue")
            .or(`project_id.${active.id === "hq" ? "is.null" : `eq.${active.id}`}`).gte("date", monthStart).lte("date", monthEnd),
        ]);

        setTotalLeadsFromCrm(leadsRes.count || 0);

        if (dailyRes.data && dailyRes.data.length > 0) {
          const agg = dailyRes.data.reduce((acc, r) => ({
            spend: acc.spend + (r.spend ? Number(r.spend) : 0),
            clicks: acc.clicks + (r.clicks ? Number(r.clicks) : 0),
            impressions: acc.impressions + (r.impressions ? Number(r.impressions) : 0),
            leads: acc.leads + (r.leads ? Number(r.leads) : 0),
            visits: acc.visits + (r.visits ? Number(r.visits) : 0),
            sales: acc.sales + (r.sales ? Number(r.sales) : 0),
            revenue: acc.revenue + (r.revenue ? Number(r.revenue) : 0),
          }), { spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 } as { spend: number, clicks: number, impressions: number, leads: number, visits: number, sales: number, revenue: number });
          setDailyAgg(agg);
        }

        // Group creatives by campaign
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

        // Group campaigns by channel
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

        const builtChannels: Channel[] = rawChannels.map((ch) => ({
          id: ch.id, name: ch.name, icon: ch.icon, color: ch.color,
          spend: Number(ch.spend), clicks: ch.clicks, leads: ch.leads,
          visits: ch.visits, sales: ch.sales, revenue: Number(ch.revenue),
          campaigns: campaignsByChannel.get(ch.id) || [],
        }));

        setChannels(builtChannels);
        setOrganicPosts(rawOrganic.map((op) => ({
          id: op.id, thumbnail: op.thumbnail || "📝", caption: op.caption,
          triggerWord: op.trigger_word || "", dms: op.dms, leads: op.leads,
          sales: op.sales, revenue: Number(op.revenue), ltv: Number(op.ltv),
        })));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки аналитики";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [active.id]);

  // Use daily_metrics as primary source, fall back to analytics_channels
  const hasDaily = dailyAgg.spend > 0 || dailyAgg.leads > 0;
  const totalSpend = hasDaily ? dailyAgg.spend : channels.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = hasDaily ? dailyAgg.revenue : channels.reduce((s, c) => s + c.revenue, 0);
  const totalLeads = hasDaily ? dailyAgg.leads : channels.reduce((s, c) => s + c.leads, 0);
  const totalClicks = hasDaily ? dailyAgg.clicks : channels.reduce((s, c) => s + c.clicks, 0);
  const totalVisits = hasDaily ? dailyAgg.visits : channels.reduce((s, c) => s + c.visits, 0);
  const totalSales = hasDaily ? dailyAgg.sales : channels.reduce((s, c) => s + c.sales, 0);
  const totalImpressions = hasDaily ? dailyAgg.impressions : 0;
  const globalRomi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpv = totalVisits > 0 ? totalSpend / totalVisits : 0;
  const cac = totalSales > 0 ? totalSpend / totalSales : 0;

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
    { stage: "Визиты", value: totalVisits, label: "" },
    { stage: "Продажи", value: totalSales, label: "" },
  ].map((d) => ({ ...d, label: d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : String(d.value) }));

  const channelChartData = channels.map((ch) => ({
    name: ch.name, spend: ch.spend, revenue: ch.revenue, color: ch.color,
  }));

  return {
    channels, organicPosts, loading,
    totalSpend, totalRevenue, totalSales, totalLeads, totalClicks, totalVisits, totalImpressions,
    globalRomi, cpl, cpv, cac,
    topChannel, funnelData, channelChartData, totalLeadsFromCrm,
  };
}
