import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ad_copy, advertiser_name } = await req.json();

    if (!ad_copy) {
      return new Response(
        JSON.stringify({ success: false, error: "ad_copy is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Ты — эксперт по маркетингу и копирайтингу для рекламы в Instagram / Facebook. 
Твоя задача: проанализировать рекламный текст конкурента, найти слабые места и создать значительно улучшенную версию.

Правила для улучшенного текста:
- Начинай с сильного хука (боль, выгода или интрига)
- Используй конкретные цифры и социальные доказательства
- Добавляй эмодзи уместно (не перебарщивай)
- Включай чёткий CTA (призыв к действию)
- Текст должен быть для Instagram/Facebook рекламы
- Пиши на русском языке

Верни структурированный анализ через tool call.`,
          },
          {
            role: "user",
            content: `Проанализируй и улучши этот рекламный текст от "${advertiser_name || "конкурента"}":\n\n"${ad_copy}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rebuild_ad",
              description: "Return the ad analysis and improved version",
              parameters: {
                type: "object",
                properties: {
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-5 weaknesses found in the original ad (in Russian, short phrases)",
                  },
                  improved_headline: {
                    type: "string",
                    description: "New powerful headline for the ad",
                  },
                  new_script: {
                    type: "string",
                    description: "Complete improved ad copy with emojis, structure, and CTA",
                  },
                  cta: {
                    type: "string",
                    description: "Specific call-to-action recommendation",
                  },
                  suggested_format: {
                    type: "string",
                    description: "Recommended content format (e.g. Instagram Reels, Stories, Carousel)",
                  },
                },
                required: ["weaknesses", "improved_headline", "new_script", "cta", "suggested_format"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rebuild_ad" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();

    let result = null;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("rebuild-ad-text error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
