import { supabase } from "@/integrations/supabase/client";

export interface RebuildResult {
  weaknesses: string[];
  improved_headline: string;
  new_script: string;
  cta: string;
  suggested_format: string;
}

export async function startCompetitorScrape(urlOrQuery: string) {
  const isUrl = urlOrQuery.startsWith("http");

  const { data, error } = await supabase.functions.invoke("scrape-competitor-ads", {
    body: isUrl ? { url: urlOrQuery } : { query: urlOrQuery },
  });

  if (error) throw new Error(error.message || "Scrape failed");
  if (!data?.success) throw new Error(data?.error || "Scrape failed");

  return data;
}

export async function rebuildAdText(adCopy: string, advertiserName?: string) {
  const { data, error } = await supabase.functions.invoke("rebuild-ad-text", {
    body: { ad_copy: adCopy, advertiser_name: advertiserName },
  });

  if (error) throw new Error(error.message || "Rebuild failed");
  if (!data?.success) throw new Error(data?.error || "Rebuild failed");

  return data as { success: true; data: RebuildResult };
}
