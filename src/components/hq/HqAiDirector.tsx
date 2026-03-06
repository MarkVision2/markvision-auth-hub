import { Brain, CheckCircle, Ban, Handshake } from "lucide-react";

const insights = [
  { icon: <CheckCircle className="h-3.5 w-3.5 text-primary" />, text: "Все системы в норме. 14 проектов работают стабильно." },
  { icon: <Ban className="h-3.5 w-3.5 text-[hsl(var(--status-critical))]" />, text: "Отключено 3 убыточных кампании → сэкономлено 45 000 ₸." },
  { icon: <Handshake className="h-3.5 w-3.5 text-primary" />, text: "ИИ-агенты закрыли 4 сделки ночью на сумму 680 000 ₸." },
  { icon: <Brain className="h-3.5 w-3.5 text-[hsl(var(--status-ai))]" />, text: "Рекомендация: перераспределить бюджет SmileDent → AIVA (ROI выше на 34%)." },
];

export default function HqAiDirector() {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 h-full overflow-hidden">
      {/* Orange radial glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[hsl(var(--status-ai))] opacity-[0.06] blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary opacity-[0.04] blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-ai)/0.12)] flex items-center justify-center">
            <Brain className="h-4 w-4 text-[hsl(var(--status-ai))]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI-Директор</h3>
            <p className="text-[10px] text-muted-foreground">Сводка за сегодня</p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <p className="text-xs text-foreground/80 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI-Директор активен • Обновлено 2 мин назад</span>
          </div>
        </div>
      </div>
    </div>
  );
}
