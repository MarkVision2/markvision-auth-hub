import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function AiBriefing() {
  return (
    <Card className="bg-card border-[hsl(var(--status-ai)/0.15)] relative overflow-hidden h-full">
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[hsl(var(--status-ai)/0.05)] blur-3xl pointer-events-none" />

      <CardHeader className="pb-2 pt-4 px-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-[hsl(var(--status-ai)/0.1)] flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-[hsl(var(--status-ai))]" />
          </div>
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            ИИ-Директор
          </CardTitle>
          <span className="text-[10px] text-[hsl(var(--status-ai)/0.5)] font-mono ml-auto">10:00</span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 relative z-10 space-y-3">
        <p className="text-xs text-foreground/75 leading-relaxed">
          <span className="text-[hsl(var(--status-ai))] font-medium">Сводка:</span>{" "}
          Контент-Завод — <span className="text-foreground font-medium">12 видео</span> отрендерено.
          CRM — <span className="text-[hsl(var(--status-good))] font-semibold">4 сделки</span> закрыты ИИ ночью.
          MRR — <span className="text-[hsl(var(--status-good))] font-semibold">+5%</span>.
        </p>
        <div className="text-xs text-foreground/70 leading-relaxed space-y-1">
          <p className="text-[hsl(var(--status-ai))] font-medium text-[10px] uppercase tracking-wider">Рекомендации</p>
          <div className="flex items-start gap-1.5">
            <span className="text-[hsl(var(--status-ai))] mt-px text-[10px]">→</span>
            <span>Перераспределить бюджет «Avicenna»</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[hsl(var(--status-critical))] mt-px text-[10px]">→</span>
            <span>Решить карту в «Технология позвоночника»</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[hsl(var(--status-warning))] mt-px text-[10px]">→</span>
            <span>Обновить креативы «Дентал Тайм»</span>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full bg-[hsl(var(--status-ai))] hover:bg-[hsl(25_95%_46%)] text-white border-0 h-7 text-[11px] font-medium"
        >
          <Sparkles className="h-3 w-3 mr-1.5" />
          Принять рекомендации
        </Button>
      </CardContent>
    </Card>
  );
}
