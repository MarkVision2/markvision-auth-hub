import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const reqBody = await req.json();
    const { url, query } = reqBody;

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Accept optional country filter, default to KZ
    const country = reqBody.country || "KZ";

    let scrapeUrl = url;
    if (!scrapeUrl && query) {
      const cleanQuery = query.replace("@", "").trim();
      scrapeUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(cleanQuery)}&search_type=keyword_unordered&media_type=all`;
    }

    if (!scrapeUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "URL or query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping URL:", scrapeUrl);

    // Use Firecrawl to scrape the Ad Library page
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: scrapeUrl,
        formats: ["markdown"],
        waitFor: 5000,
        onlyMainContent: true,
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error("Firecrawl error:", firecrawlData);
      return new Response(
        JSON.stringify({ success: false, error: firecrawlData.error || "Failed to scrape" }),
        { status: firecrawlResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = firecrawlData.data?.markdown || firecrawlData.markdown || "";

    // Now use Lovable AI to extract structured ad data from the scraped content
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an ad data extractor. Given scraped content from Meta Ad Library, extract individual ads into structured data. Return a JSON array of ad objects. Each ad should have: advertiser_name, ad_copy, platform (Instagram/Facebook), media_type (4:5 or 9:16), is_active (boolean). If no ads are found, return an empty array. Only return valid JSON, nothing else.`,
          },
          {
            role: "user",
            content: `Extract ads from this scraped Meta Ad Library content:\n\n${markdown.slice(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_ads",
              description: "Extract structured ad data from scraped content",
              parameters: {
                type: "object",
                properties: {
                  ads: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        advertiser_name: { type: "string" },
                        ad_copy: { type: "string" },
                        platform: { type: "string", enum: ["Instagram", "Facebook"] },
                        media_type: { type: "string", enum: ["4:5", "9:16"] },
                        is_active: { type: "boolean" },
                      },
                      required: ["advertiser_name", "ad_copy"],
                    },
                  },
                },
                required: ["ads"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_ads" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "AI rate limit exceeded. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please top up." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

    let ads: any[] = [];
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        ads = parsed.ads || [];
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Insert scraped ads into Supabase
    if (ads.length > 0) {
      const rows = ads.map((ad: any) => ({
        advertiser_name: ad.advertiser_name || "Unknown",
        advertiser_avatar: (ad.advertiser_name || "??").slice(0, 2).toUpperCase(),
        ad_copy: ad.ad_copy || "",
        platform: ad.platform || "Instagram",
        media_type: ad.media_type || "4:5",
        is_active: ad.is_active ?? true,
        active_since: new Date().toISOString(),
        source_url: scrapeUrl,
        scrape_status: "completed",
      }));

      const { error: insertError } = await supabase.from("competitor_ads").insert(rows);
      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: ads.length, ads }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-competitor-ads error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
