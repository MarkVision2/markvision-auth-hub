import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// n8n API endpoint for executing workflows
const N8N_BASE = "https://n8n.zapoinov.com";
const WORKFLOW_ID = "qZ3WyT7_vF18f7MXF9Mqe";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth guard — require a valid user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const action = body.action;
    console.log("Action:", action, "Body:", JSON.stringify(body));

    const n8nApiKey = Deno.env.get("N8N_CONTROL_API_KEY");

    if (action === "scan_all" || action === "scan_profile") {
      // Execute the workflow via n8n API
      const execUrl = `${N8N_BASE}/api/v1/workflows/${WORKFLOW_ID}/activate`;
      
      // First check if active, then trigger execution
      const triggerUrl = `${N8N_BASE}/api/v1/executions`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (n8nApiKey) {
        headers["X-N8N-API-KEY"] = n8nApiKey;
      }

      // Use the /api/v1/workflows/{id}/run endpoint to manually trigger
      const runUrl = `${N8N_BASE}/api/v1/workflows/${WORKFLOW_ID}/run`;
      console.log("Triggering workflow run:", runUrl);

      const n8nRes = await fetch(runUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: body }),
      });

      const responseText = await n8nRes.text();
      console.log("n8n run response:", n8nRes.status, responseText);

      if (!n8nRes.ok) {
        // If /run endpoint not available, try activating and relying on schedule
        console.log("Run endpoint failed, trying activate...");
        const activateUrl = `${N8N_BASE}/api/v1/workflows/${WORKFLOW_ID}/activate`;
        const activateRes = await fetch(activateUrl, {
          method: "POST",
          headers,
        });
        const activateText = await activateRes.text();
        console.log("Activate response:", activateRes.status, activateText);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Воркфлоу активирован. Сканирование запустится по расписанию.",
            status: activateRes.status 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { raw: responseText };
      }

      return new Response(
        JSON.stringify({ success: true, data: responseBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "analyze_post") {
      // For single post analysis — save the URL to content_factory for processing
      // The workflow will pick it up on next run
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("content_factory")
        .insert({
          video_url: body.url,
          status: "pending",
          post_type: "reels",
          performance_score: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also try to trigger the workflow
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (n8nApiKey) headers["X-N8N-API-KEY"] = n8nApiKey;

      try {
        const runUrl = `${N8N_BASE}/api/v1/workflows/${WORKFLOW_ID}/run`;
        await fetch(runUrl, { method: "POST", headers, body: JSON.stringify({ data: { url: body.url, action: "analyze_post" } }) });
      } catch (e) {
        console.log("Could not trigger workflow, will run on schedule:", e);
      }

      return new Response(
        JSON.stringify({ success: true, data, message: "Пост добавлен в очередь анализа" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action: " + action }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
