import { toast } from "@/hooks/use-toast";

const N8N_BASE = "https://n8n.zapoinov.com";

/**
 * Trigger AI agent when a CRM lead changes status.
 */
export async function triggerAiAgent(leadId: string, newStatus: string) {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-status-change`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        new_status: newStatus,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      toast({ title: "🤖 ИИ принял в обработку", description: `Статус: ${newStatus}` });
    } else {
      console.warn(`[AI Agent] Server responded with ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    // Only log if it's not a generic network error to avoid console clutter when offline/server down
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      console.warn("[AI Agent] n8n server is currently unreachable (possible CORS or network error)");
    } else {
      console.error("[AI Agent] trigger failed:", err);
    }
  }
}

/**
 * Log uncaught frontend errors to AI auto-healing webhook.
 */
export function logSystemErrorToAI(errorInfo: {
  message: string;
  stack?: string;
  component?: string;
  url?: string;
}) {
  try {
    fetch(`${N8N_BASE}/webhook/system-errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {}); // fire-and-forget
  } catch {
    // silently fail — we don't want error logging to cause more errors
  }
}

/**
 * Install global error handlers that forward to AI auto-healing.
 */
export function installGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    logSystemErrorToAI({
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logSystemErrorToAI({
      message: String(event.reason?.message || event.reason),
      stack: event.reason?.stack,
    });
  });
}
