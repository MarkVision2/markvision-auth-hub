export interface AuditChecklist {
  name: string;
  passed: boolean;
  comment: string;
}

export interface TranscriptLine {
  speaker: "manager" | "client" | "ai";
  text: string;
  is_mistake?: boolean;
  ai_comment?: string;
}

export interface AuditRecord {
  id: string;
  manager_name: string;
  interaction_type: "call" | "whatsapp";
  duration_seconds: number;
  ai_score: number;
  ai_summary: string;
  checklist: AuditChecklist[];
  transcript: TranscriptLine[];
}
