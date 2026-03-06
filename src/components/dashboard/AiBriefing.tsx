import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function AiBriefing() {
  return (
    <Card className="bg-[#0f0f11] border-orange-500/[0.15] relative overflow-hidden h-full">
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-orange-500/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-orange-500/[0.04] blur-2xl pointer-events-none" />

      <CardHeader className="pb-2 pt-4 px-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ИИ-Директор
          </CardTitle>
          <span className="text-[10px] text-orange-400/60 font-mono ml-auto">10:00</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 relative z-10 space-y-3">
        <p className="text-[13px] text-foreground/80 leading-relaxed">
          <span className="text-orange-400 font-medium">Утренняя сводка:</span>{" "}
          Контент-Завод завершил рендер{" "}
          <span className="text-foreground font-medium">12 видео</span>.
          ИИ-агенты закрыли{" "}
          <span className="text-emerald-400 font-semibold">4 сделки</span>{" "}
          в CRM ночью. MRR вырос на{" "}
          <span className="text-emerald-400 font-semibold">+5%</span>.
        </p>
        <div className="text-[13px] text-foreground/80 leading-relaxed">
          <span className="text-orange-400 font-medium">Рекомендации:</span>
          <ul className="mt-1.5 space-y-1 text-foreground/70">
            <li className="flex items-start gap-1.5">
              <span className="text-orange-400 mt-0.5">→</span>
              Перераспределить бюджет в проекте «Avicenna»
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-rose-400 mt-0.5">→</span>
              Срочно решить вопрос карты в «Технология позвоночника»
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 mt-0.5">→</span>
              Обновить креативы для «Дентал Тайм»
            </li>
          </ul>
        </div>
        <Button
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1.5" />
          Принять рекомендации
        </Button>
      </CardContent>
    </Card>
  );
}
