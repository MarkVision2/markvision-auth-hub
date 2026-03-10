import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AuditRecord, AuditChecklist, TranscriptLine } from "@/components/ai-rop/types";

interface RawAudit {
  id: string;
  manager_name: string;
  interaction_type: string;
  duration_seconds: number | null;
  ai_score: number | null;
  ai_summary: string | null;
  checklist: unknown;
  transcript: unknown;
}

function parseChecklist(raw: unknown): AuditChecklist[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) {
    return raw.map((c: Record<string, unknown>) => ({
      name: String(c.name ?? ""),
      passed: Boolean(c.passed),
      comment: String(c.comment ?? ""),
    }));
  }
  return [];
}

function parseTranscript(raw: unknown): TranscriptLine[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((t: Record<string, unknown>) => ({
    speaker: (t.speaker === "client" ? "client" : t.speaker === "ai" ? "ai" : "manager") as TranscriptLine["speaker"],
    text: String(t.text ?? ""),
    is_mistake: Boolean(t.is_mistake),
    ai_comment: t.ai_comment ? String(t.ai_comment) : undefined,
  }));
}

function mapAudit(raw: RawAudit): AuditRecord {
  return {
    id: raw.id,
    manager_name: raw.manager_name,
    interaction_type: (raw.interaction_type === "whatsapp" ? "whatsapp" : "call") as AuditRecord["interaction_type"],
    duration_seconds: raw.duration_seconds ?? 0,
    ai_score: raw.ai_score ?? 0,
    ai_summary: raw.ai_summary ?? "",
    checklist: parseChecklist(raw.checklist),
    transcript: parseTranscript(raw.transcript),
  };
}

import { useWorkspace } from "@/hooks/useWorkspace";

export function useAiRopAudits() {
  const { active } = useWorkspace();
  const { toast } = useToast();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetch() {
      try {
        setLoading(true);
        let query = (supabase as any).from("ai_rop_audits").select("*");
        if (active.id !== "hq") {
          query = query.eq("project_id", active.id);
        }
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        setAudits((data as RawAudit[]).map(mapAudit));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки аудитов";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [active.id]);

  return { audits, loading };
}