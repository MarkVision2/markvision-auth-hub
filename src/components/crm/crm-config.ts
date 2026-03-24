import { Zap, Bell, MessageCircle, CreditCard, Calendar, MapPin, Check, Ban, LucideIcon } from "lucide-react";

export interface CrmStage {
  key: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
  accent: "primary" | "warning" | "ai" | "good" | "critical";
  dotClass: string;
}

export const DEFAULT_STAGES: CrmStage[] = [
  { key: "Новая заявка", label: "Новая", icon: Zap, gradient: "from-primary/20 to-primary/5", accent: "primary", dotClass: "bg-primary" },
  { key: "Без ответа", label: "Без ответа", icon: Bell, gradient: "from-[hsl(var(--status-warning)/0.2)] to-[hsl(var(--status-warning)/0.05)]", accent: "warning", dotClass: "bg-[hsl(var(--status-warning))]" },
  { key: "В работе", label: "В работе", icon: MessageCircle, gradient: "from-[hsl(var(--status-ai)/0.2)] to-[hsl(var(--status-ai)/0.05)]", accent: "ai", dotClass: "bg-[hsl(var(--status-ai))]" },
  { key: "Счет отправлен", label: "Счёт", icon: CreditCard, gradient: "from-[hsl(var(--status-warning)/0.2)] to-[hsl(var(--status-warning)/0.05)]", accent: "warning", dotClass: "bg-[hsl(var(--status-warning))]" },
  { key: "Записан", label: "Записан", icon: Check, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Диагностика", label: "Диагностика", icon: Calendar, gradient: "from-primary/20 to-primary/5", accent: "primary", dotClass: "bg-primary" },
  { key: "Визит совершен", label: "Визит", icon: MapPin, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Оплачен", label: "Оплачен", icon: Check, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Отказ", label: "Отказ", icon: Ban, gradient: "from-[hsl(var(--status-critical)/0.2)] to-[hsl(var(--status-critical)/0.05)]", accent: "critical", dotClass: "bg-[hsl(var(--status-critical))]" },
];

export const DOCTOR_STAGES: CrmStage[] = [
  { key: "Лечение начато", label: "Лечение начато", icon: Check, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Думает", label: "Думает", icon: Bell, gradient: "from-[hsl(var(--status-warning)/0.2)] to-[hsl(var(--status-warning)/0.05)]", accent: "warning", dotClass: "bg-[hsl(var(--status-warning))]" },
  { key: "Отказ", label: "Отказ", icon: Ban, gradient: "from-[hsl(var(--status-critical)/0.2)] to-[hsl(var(--status-critical)/0.05)]", accent: "critical", dotClass: "bg-[hsl(var(--status-critical))]" },
];

export const PIPELINES = {
  main: { id: "main", label: "Основная", stages: DEFAULT_STAGES },
  doctor: { id: "doctor", label: "Воронка врача", stages: DOCTOR_STAGES },
};

const STORAGE_KEY_PREFIX = "crm_stages_labels_";

export function loadStages(projectId: string, pipelineId: string = "main"): CrmStage[] {
  try {
    const pipeline = PIPELINES[pipelineId as keyof typeof PIPELINES] || PIPELINES.main;
    const defaultStages = pipeline.stages;
    
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}_${pipelineId}`);
    if (!saved) return defaultStages;
    const labelsMap = JSON.parse(saved);
    return defaultStages.map(s => ({
      ...s,
      label: labelsMap[s.key] || s.label
    }));
  } catch (e) {
    console.error("Error loading CRM stages:", e);
    return DEFAULT_STAGES;
  }
}

export function saveStageLabel(projectId: string, stageKey: string, newLabel: string, pipelineId: string = "main") {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${projectId}_${pipelineId}`;
    const saved = localStorage.getItem(storageKey);
    const labelsMap = saved ? JSON.parse(saved) : {};
    labelsMap[stageKey] = newLabel;
    localStorage.setItem(storageKey, JSON.stringify(labelsMap));
  } catch (e) {
    console.error("Error saving CRM stage label:", e);
  }
}
