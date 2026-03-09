import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_BASE_URL = "https://n8n.zapoinov.com";
const N8N_WEBHOOK_URL = `${N8N_BASE_URL}/webhook/ai-control`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action;

    if (!action || !["ping", "list_workflows", "last_errors", "activate_workflow", "check_integrations"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: ping, list_workflows, last_errors, activate_workflow" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const N8N_API_KEY = Deno.env.get("N8N_CONTROL_API_KEY");
    const apiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (N8N_API_KEY) {
      apiHeaders["X-N8N-API-KEY"] = N8N_API_KEY;
    }

    let data: unknown = null;

    if (action === "ping") {
      // Simple webhook ping
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ping" }),
        });
        const text = await response.text();
        if (response.ok) {
          try { data = JSON.parse(text); } catch { data = { status: "ok", raw: text }; }
        } else {
          data = { status: "error", code: response.status };
        }
      } catch (e) {
        data = { status: "unreachable", error: e instanceof Error ? e.message : "unknown" };
      }
    }

    if (action === "list_workflows") {
      // Call n8n REST API directly to avoid webhook truncation
      try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=100&active=true`, {
          method: "GET",
          headers: apiHeaders,
        });
        const text = await response.text();
        if (response.ok) {
          try {
            const parsed = JSON.parse(text);
            // n8n API returns { data: [...] }
            const workflows = parsed.data || parsed;
            data = (Array.isArray(workflows) ? workflows : []).map((wf: Record<string, unknown>) => ({
              id: wf.id,
              name: wf.name,
              active: wf.active,
              createdAt: wf.createdAt,
              updatedAt: wf.updatedAt,
              nodes: Array.isArray(wf.nodes) ? (wf.nodes as Record<string, unknown>[]).length : 0,
            }));
          } catch {
            data = [];
          }
        } else {
          // Fallback: try webhook
          const wh = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "list_workflows" }),
          });
          const whText = await wh.text();
          try { data = JSON.parse(whText); } catch { data = []; }
        }
      } catch {
        data = [];
      }
    }

    if (action === "activate_workflow") {
      const workflowId = body.workflowId;
      if (!workflowId) {
        return new Response(
          JSON.stringify({ error: "workflowId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        // Deactivate then activate to force restart
        await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/deactivate`, {
          method: "POST",
          headers: apiHeaders,
        });
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
          method: "POST",
          headers: apiHeaders,
        });
        const text = await response.text();
        if (response.ok) {
          try { data = JSON.parse(text); } catch { data = { status: "restarted" }; }
        } else {
          data = { status: "error", code: response.status };
        }
      } catch (e) {
        data = { status: "error", error: e instanceof Error ? e.message : "unknown" };
      }
    }

    if (action === "last_errors") {
      // Call n8n REST API for recent failed executions
      try {
        const response = await fetch(
          `${N8N_BASE_URL}/api/v1/executions?status=error&limit=15`,
          { method: "GET", headers: apiHeaders }
        );
        const text = await response.text();
        if (response.ok) {
          try {
            const parsed = JSON.parse(text);
            const executions = parsed.data || parsed;
            data = (Array.isArray(executions) ? executions : []).map((ex: Record<string, unknown>) => ({
              id: ex.id,
              workflowId: ex.workflowId,
              workflowName: (ex.workflowData as Record<string, unknown>)?.name || `Workflow ${ex.workflowId}`,
              status: ex.status,
              startedAt: ex.startedAt,
              stoppedAt: ex.stoppedAt,
            }));
          } catch {
            data = [];
          }
        } else {
          data = [];
        }
      } catch {
        data = [];
      }
    }

    if (action === "check_integrations") {
      const checkService = async (url: string, name: string) => {
        const start = performance.now();
        try {
          const res = await fetch(url, { method: "GET" });
          const latency = Math.round(performance.now() - start);
          return { name, status: res.ok || res.status === 405 || res.status === 401 ? "operational" : "degraded", metric: `${latency}ms`, code: res.status };
        } catch (e) {
          return { name, status: "outage", metric: "Unreachable", error: e instanceof Error ? e.message : "unknown" };
        }
      };

      const results = await Promise.all([
        checkService("https://graph.facebook.com/v19.0/", "Meta"),
        checkService("https://api.firecrawl.dev/v2/scrape", "Firecrawl"),
        checkService("https://ai.gateway.lovable.dev/v1/chat/completions", "AI Gateway"),
        checkService("https://api.telegram.org/", "Telegram"),
      ]);
      data = results;
    }

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
