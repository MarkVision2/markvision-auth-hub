import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Channel, Campaign, Creative, OrganicPost } from "@/components/analytics/analyticsData";

interface RawCreative {
  id: string;
  name: string;
  format: string;
  landing: string | null;
  thumbnail: string | null;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
  campaign_id: string;
}

interface RawCampaign {
  id: string;
  name: string;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
  channel_id: string;
}

interface RawChannel {
  id: string;
  name: string;
  icon: string;
  color: string;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

interface RawOrganicPost {
  id: string;
  thumbnail: string | null;
  caption: string;
  trigger_word: string | null;
  dms: number;
  leads: number;
  sales: number;
  revenue: number;
  ltv: number;
}

export function useAnalyticsData() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [organicPosts, setOrganicPosts] = useState<OrganicPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [chRes, campRes, crRes, opRes] = await Promise.all([
          supabase.from("analytics_channels").select("*").order("created_at"),
          supabase.from("analytics_campaigns").select("*").order("created_at"),
          supabase.from("analytics_creatives").select("*").order("created_at"),
          supabase.from("analytics_organic_posts").select("*").order("created_at"),
        ]);

        if (chRes.error) throw chRes.error;
        if (campRes.error) throw campRes.error;
        if (crRes.error) throw crRes.error;
        if (opRes.error) throw opRes.error;

        const rawChannels = chRes.data as RawChannel[];
        const rawCampaigns = campRes.data as RawCampaign[];
        const rawCreatives = crRes.data as RawCreative[];
        const rawOrganic = opRes.data as RawOrganicPost[];

        // Group creatives by campaign
        const creativesByCampaign = new Map<string, Creative[]>();
        for (const cr of rawCreatives) {
          const list = creativesByCampaign.get(cr.campaign_id) || [];
          list.push({
            id: cr.id,
            name: cr.name,
            format: (cr.format as Creative["format"]) || "Photo",
            landing: cr.landing || "",
            thumbnail: cr.thumbnail || undefined,
            spend: Number(cr.spend),
            clicks: cr.clicks,
            leads: cr.leads,
            visits: cr.visits,
            sales: cr.sales,
            revenue: Number(cr.revenue),
          });
          creativesByCampaign.set(cr.campaign_id, list);
        }

        // Group campaigns by channel
        const campaignsByChannel = new Map<string, Campaign[]>();
        for (const camp of rawCampaigns) {
          const list = campaignsByChannel.get(camp.channel_id) || [];
          list.push({
            id: camp.id,
            name: camp.name,
            spend: Number(camp.spend),
            clicks: camp.clicks,
            leads: camp.leads,
            visits: camp.visits,
            sales: camp.sales,
            revenue: Number(camp.revenue),
            creatives: creativesByCampaign.get(camp.id) || [],
          });
          campaignsByChannel.set(camp.channel_id, list);
        }

        // Build channels
        const builtChannels: Channel[] = rawChannels.map((ch) => ({
          id: ch.id,
          name: ch.name,
          icon: ch.icon,
          color: ch.color,
          spend: Number(ch.spend),
          clicks: ch.clicks,
          leads: ch.leads,
          visits: ch.visits,
          sales: ch.sales,
          revenue: Number(ch.revenue),
          campaigns: campaignsByChannel.get(ch.id) || [],
        }));

        setChannels(builtChannels);

        setOrganicPosts(
          rawOrganic.map((op) => ({
            id: op.id,
            thumbnail: op.thumbnail || "📝",
            caption: op.caption,
            triggerWord: op.trigger_word || "",
            dms: op.dms,
            leads: op.leads,
            sales: op.sales,
            revenue: Number(op.revenue),
            ltv: Number(op.ltv),
          }))
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки аналитики";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Computed values
  const totalSpend = channels.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalSales = channels.reduce((s, c) => s + c.sales, 0);
  const globalRomi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
  const topChannel = channels.length > 0
    ? channels.reduce((best, c) => {
        const r = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : Infinity;
        const bestR = best.spend > 0 ? ((best.revenue - best.spend) / best.spend) * 100 : Infinity;
        return r > bestR ? c : best;
      }, channels[0])
    : null;

  const funnelData = [
    { stage: "Клики", value: channels.reduce((s, c) => s + c.clicks, 0), label: "" },
    { stage: "Лиды", value: channels.reduce((s, c) => s + c.leads, 0), label: "" },
    { stage: "Визиты", value: channels.reduce((s, c) => s + c.visits, 0), label: "" },
    { stage: "Продажи", value: totalSales, label: "" },
  ].map((d) => ({ ...d, label: d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : String(d.value) }));

  const channelChartData = channels.map((ch) => ({
    name: ch.name,
    spend: ch.spend,
    revenue: ch.revenue,
    color: ch.color,
  }));

  return {
    channels,
    organicPosts,
    loading,
    totalSpend,
    totalRevenue,
    totalSales,
    globalRomi,
    topChannel,
    funnelData,
    channelChartData,
  };
}
