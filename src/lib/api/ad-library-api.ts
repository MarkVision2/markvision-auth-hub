const N8N_BASE = "https://n8n.zapoinov.com/webhook";

export interface RebuildResult {
  weaknesses: string[];
  new_script: string;
  cta: string;
}

export interface SiteAnalysisResult {
  clinic_name: string;
  prices: string;
  screenshot_url: string;
}

export interface PreviewAd {
  advertiser_name: string;
  ad_copy: string | null;
  media_url: string | null;
  platform: string | null;
  media_type: string | null;
  is_active: boolean;
  active_since: string | null;
  source_url: string | null;
}

// 1. Парсинг рекламы конкурента (async — данные в competitor_ads)
export async function startCompetitorScrape(competitorUrl: string) {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitor_url: competitorUrl }),
  });
  if (!res.ok) throw new Error("Scrape failed");
  return res.json();
}

// 2. AI Rebuild текста конкурента (sync)
export async function rebuildAdText(originalText: string): Promise<RebuildResult> {
  const res = await fetch(`${N8N_BASE}/ad-library-rebuild`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original_text: originalText }),
  });
  if (!res.ok) throw new Error("Rebuild failed");
  return res.json();
}

// 3. Анализ сайта конкурента (sync)
export async function analyzeCompetitorSite(siteUrl: string): Promise<SiteAnalysisResult> {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape-site`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_url: siteUrl }),
  });
  if (!res.ok) throw new Error("Site analysis failed");
  return res.json();
}

// 4. Превью объявлений с media_url (sync)
export async function fetchAdPreviews(competitorUrl: string): Promise<PreviewAd[]> {
  const res = await fetch(`${N8N_BASE}/ad-library-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitor_url: competitorUrl }),
  });
  if (!res.ok) throw new Error("Preview fetch failed");
  return res.json();
}
