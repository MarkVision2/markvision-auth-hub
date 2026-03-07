const N8N_BASE = "https://n8n.zapoinov.com/webhook";

export interface RebuildResult {
  weaknesses: string[];
  improved_headline: string;
  new_script: string;
  cta: string;
  suggested_format: string;
}

// 1. Парсинг рекламы конкурента через Apify (async)
export async function startCompetitorScrape(competitorUrl: string) {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitor_url: competitorUrl }),
  });

  if (!res.ok) throw new Error("Scrape failed");
  return res.json();
  // Данные появятся в таблице competitor_ads через ~60 сек
  // Используй Supabase Realtime для отображения
}

// 2. AI Rebuild текста конкурента (sync — ждём ответ)
export async function rebuildAdText(originalText: string) {
  const res = await fetch(`${N8N_BASE}/ad-library-rebuild`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ original_text: originalText }),
  });

  if (!res.ok) throw new Error("Rebuild failed");
  return res.json() as Promise<{ success: true; data: RebuildResult }>;
}

// 3. Анализ сайта конкурента через Firecrawl (sync)
export async function analyzeCompetitorSite(siteUrl: string) {
  const res = await fetch(`${N8N_BASE}/ad-library-scrape-site`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_url: siteUrl }),
  });

  if (!res.ok) throw new Error("Site analysis failed");
  return res.json();
}
