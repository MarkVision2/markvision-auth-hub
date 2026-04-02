import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Normalizes phone numbers to +7 (XXX) XXX-XX-XX format
 */
function formatPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  
  let numbers = digits;
  // If it starts with 8, replace with 7
  if (numbers.startsWith("8") && numbers.length === 11) numbers = "7" + numbers.slice(1);
  // If it doesn't start with 7 and has 10 digits, prepend 7
  if (!numbers.startsWith("7") && numbers.length === 10) numbers = "7" + numbers;
  
  // Truncate to 11 digits
  numbers = numbers.slice(0, 11);
  
  if (numbers.length < 11) return phone; // Fallback if too short

  return `+${numbers[0]} (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. Parse payload
    const body = await req.json();
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") || body.projectId;

    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const { name, phone, source, amount } = body;

    console.log(`[Webhook] New lead for project ${projectId}:`, { name, phone, source, amount });

    // 3. Insert into database (public.leads is the underlying table for leads_crm)
    const { data, error } = await supabase
      .from("leads")
      .insert({
        project_id: projectId,
        name: name || "Anonymous",
        phone: phone ? formatPhone(phone) : null,
        source: source || "Сайт (Lovable)",
        amount: amount ? Number(amount) : 0,
        status: "Новая заявка",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, leadId: data.id }),
      { 
        status: 201, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[Webhook Error]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
