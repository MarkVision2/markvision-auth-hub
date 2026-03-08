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

export interface PreviewAd {
  id: string;
  page_name: string;
  ad_archive_id: string;
  ad_status: string;
  start_date: string | null;
  ad_text: string | null;
  media_url: string | null;
  preview: { has_image: boolean; thumbnail: string | null };
}

// 1. Scrape competitor ads via Apify (async — data arrives in competitor_ads table)
export async function startCompetitorScrape(competitorUrl: string) {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitor_url: competitorUrl }),
  });
  if (!res.ok) throw new Error("Scrape failed");
  return res.json();
}

// 2. AI Rebuild ad text (sync — returns improved version)
export async function rebuildAdText(originalText: string): Promise<RebuildResult> {
  const res = await fetch(`${N8N_BASE}/ad-library-rebuild`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original_text: originalText }),
  });
  if (!res.ok) throw new Error("Rebuild failed");
  const json = await res.json();
  // n8n returns { success: true, data: { weaknesses, improved_headline, new_script, cta, format_tip } }
  const data = json.data || json;
  return {
    weaknesses: data.weaknesses || "",
    improved_headline: data.improved_headline || "",
    new_script: data.new_script || "",
    cta: data.cta || "",
    format_tip: data.format_tip || "",
  };
}

// 3. Analyze competitor site (sync)
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

// 4. Get ad previews from DB via n8n (sync)
export async function fetchAdPreviews(query: string): Promise<PreviewAd[]> {
  const res = await fetch(`${N8N_BASE}/ad-library-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_name: query, limit: 50 }),
  });
  if (!res.ok) throw new Error("Preview fetch failed");
  const json = await res.json();
  return json.ads || [];
}
