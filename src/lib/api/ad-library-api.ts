import { supabase } from "@/integrations/supabase/client";

const N8N_BASE = "https://n8n.zapoinov.com/webhook";

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

// 1. Trigger competitor scrape via n8n → Apify → inserts into competitor_ads
// This is ASYNC: data arrives via Supabase Realtime
export async function triggerCompetitorScrape(handle: string): Promise<void> {
  const cleanHandle = handle.replace("@", "").trim();

  const res = await fetch(`${N8N_BASE}/ad-library-scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "spy_competitor",
      competitor_handle: cleanHandle,
      competitor_url: cleanHandle.startsWith("http") ? cleanHandle : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Scrape trigger failed (${res.status}): ${text}`);
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
