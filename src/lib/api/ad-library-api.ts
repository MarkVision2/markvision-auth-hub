import { supabase } from "@/integrations/supabase/client";

export interface RebuildResult {
  weaknesses: string;
  improved_headline: string;
  new_script: string;
  cta: string;
  format_tip: string;
}

export interface ScrapedAd {
  advertiser_name: string;
  ad_copy: string;
  platform?: string;
  media_type?: string;
  is_active?: boolean;
}

// 1. Trigger competitor scrape via Edge Function (authenticated)
export async function triggerCompetitorScrape(handle: string): Promise<void> {
  const cleanHandle = handle.replace("@", "").trim();

  const { data, error } = await supabase.functions.invoke("scrape-competitor-ads", {
    body: { query: cleanHandle },
  });

  if (error) {
    throw new Error(`Scrape trigger failed: ${error.message}`);
  }

  if (data && !data.success) {
    throw new Error(data.error || "Scrape failed");
  }
}

// 2. Search local DB for existing competitor ads
export async function searchLocalAds(query: string) {
  const clean = query.replace("@", "").trim();
  const { data, error } = await supabase
    .from("competitor_ads")
    .select("*")
    .or(`advertiser_name.ilike.%${clean}%,page_name.ilike.%${clean}%,ad_copy.ilike.%${clean}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

// 3. AI Rebuild ad text via Edge Function (authenticated)
export async function rebuildAdText(originalText: string, advertiserName?: string): Promise<RebuildResult> {
  const { data, error } = await supabase.functions.invoke("rebuild-ad-text", {
    body: { ad_copy: originalText, advertiser_name: advertiserName },
  });

  if (error) throw new Error(`Rebuild failed: ${error.message}`);
  if (!data?.success) throw new Error(data?.error || "Rebuild failed");

  const result = data.data;
  return {
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.join("; ") : (result.weaknesses || ""),
    improved_headline: result.improved_headline || "",
    new_script: result.new_script || "",
    cta: result.cta || "",
    format_tip: result.suggested_format || "",
  };
}
