import { supabase } from "@/integrations/supabase/client";

const N8N_BASE = "https://n8n.zapoinov.com/webhook";

export interface RebuildResult {
  weaknesses: string;
  improved_headline: string;
  new_script: string;
  cta: string;
  format_tip: string;
}

export interface SiteAnalysisResult {
  clinic_name: string;
  services: string[];
  prices: { service: string; price: string }[];
  offers: string[];
  unique_selling_points: string[];
  tone_of_voice: string;
  weaknesses: string[];
  contact_info: { phone?: string; address?: string; instagram?: string };
  recommendation: string;
  screenshot_url: string | null;
  site_url: string;
}

export interface ScrapedAd {
  advertiser_name: string;
  ad_copy: string;
  platform?: string;
  media_type?: string;
  is_active?: boolean;
}

// 1. Scrape competitor ads via Supabase Edge Function (Firecrawl + AI)
export async function scrapeCompetitorAds(input: { url?: string; query?: string; country?: string }): Promise<{ success: boolean; count: number; ads: ScrapedAd[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("scrape-competitor-ads", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Edge function call failed");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Scraping failed");
  }

  return data;
}

// 2. Search local DB for existing competitor ads
export async function searchLocalAds(query: string) {
  const { data, error } = await supabase
    .from("competitor_ads")
    .select("*")
    .or(`advertiser_name.ilike.%${query}%,page_name.ilike.%${query}%,ad_copy.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

// 3. AI Rebuild ad text via n8n (sync — returns improved version)
export async function rebuildAdText(originalText: string): Promise<RebuildResult> {
  const res = await fetch(`${N8N_BASE}/ad-library-rebuild`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original_text: originalText }),
  });
  if (!res.ok) throw new Error("Rebuild failed");
  const json = await res.json();
  const data = json.data || json;
  return {
    weaknesses: data.weaknesses || "",
    improved_headline: data.improved_headline || "",
    new_script: data.new_script || "",
    cta: data.cta || "",
    format_tip: data.format_tip || "",
  };
}

// 4. Analyze competitor site (sync)
export async function analyzeCompetitorSite(siteUrl: string): Promise<SiteAnalysisResult> {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape-site`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_url: siteUrl }),
  });
  if (!res.ok) throw new Error("Site analysis failed");
  const json = await res.json();
  return json.data || json;
}
