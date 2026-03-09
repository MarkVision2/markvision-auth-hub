/* ── CRM Telephony & AI Task Types ── */

export interface CallRecord {
  id: string;
  lead_id: string;
  lead_name: string;
  duration_seconds: number;
  started_at: string;
  ai_summary: string;
  ai_score: number;
  objections: string[];
  next_action: string;
}

export interface AITask {
  id: string;
  lead_id: string;
  lead_name: string;
  due_date: string;      // ISO string
  due_time: string;      // e.g. "14:30"
  type: "call" | "follow_up" | "meeting";
  status: "pending" | "overdue" | "done";
  ai_hint: string;
  last_call_summary?: string;
}

/* ── Mock generators ── */

const MOCK_SUMMARIES = [
  "Клиент заинтересован в услуге, просит перезвонить после обеда. Обсудили стоимость, есть возражение по цене.",
  "Договорились о визите на следующую неделю. Клиент спрашивал про рассрочку.",
  "Первичная консультация. Клиент сравнивает с конкурентами, нужно отправить КП.",
];

const MOCK_OBJECTIONS_POOL = [
  "Дорого", "Нет времени", "Надо подумать", "Сравниваю с конкурентами",
  "Не уверен в результате", "Нужна рассрочка", "Уже обращался",
];

const MOCK_HINTS = [
  "Предложите скидку 10% как горячему клиенту. Упомяните акцию до конца месяца.",
  "Клиент сравнивает цены — подготовьте сравнительную таблицу преимуществ.",
  "Уточните удобное время визита и предложите бесплатную диагностику.",
];

export function generateMockCallResult(leadId: string, leadName: string, durationSec: number): CallRecord {
  const objCount = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...MOCK_OBJECTIONS_POOL].sort(() => Math.random() - 0.5);

  return {
    id: crypto.randomUUID(),
    lead_id: leadId,
    lead_name: leadName,
    duration_seconds: durationSec,
    started_at: new Date().toISOString(),
    ai_summary: MOCK_SUMMARIES[Math.floor(Math.random() * MOCK_SUMMARIES.length)],
    ai_score: 6 + Math.floor(Math.random() * 4), // 6-9
    objections: shuffled.slice(0, objCount),
    next_action: "Перезвонить через 2 дня",
  };
}

export function generateMockTask(leadId: string, leadName: string, callSummary: string): AITask {
  const now = new Date();
  const dueDate = new Date(now.getTime() + (1 + Math.floor(Math.random() * 3)) * 3600000);
  return {
    id: crypto.randomUUID(),
    lead_id: leadId,
    lead_name: leadName,
    due_date: dueDate.toISOString(),
    due_time: dueDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    type: "call",
    status: "pending",
    ai_hint: MOCK_HINTS[Math.floor(Math.random() * MOCK_HINTS.length)],
    last_call_summary: callSummary,
  };
}

/* ── Initial mock tasks for "Today's Focus" ── */
export const INITIAL_TASKS: AITask[] = [];

/* ── Aggregated objection stats ── */
export const MOCK_OBJECTION_STATS: any[] = [];
