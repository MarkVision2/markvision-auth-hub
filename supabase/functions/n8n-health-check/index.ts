import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_WEBHOOK_URL = "https://n8n.zapoinov.com/webhook/ai-control";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("N8N_CONTROL_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "N8N_CONTROL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const action = body.action; // ping | list_workflows | last_errors

    if (!action || !["ping", "list_workflows", "last_errors"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: ping, list_workflows, last_errors" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "N8N API Key": apiKey,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`n8n responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, action, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("n8n-health-check error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
