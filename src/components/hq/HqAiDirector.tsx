import { Brain } from "lucide-react";

const feed = [
  { time: "10:05", emoji: "💰", category: "Финансы", text: "Списана оплата за серверы (15 000 ₸)." },
  { time: "09:30", emoji: "🚀", category: "Реклама", text: "Автоматически запущены 5 новых креативов для Kitarov Clinic." },
  { time: "08:15", emoji: "⚠️", category: "Внимание", text: "Конверсия сайта AIVA упала на 4%. Рекомендация: обновить оффер." },
  { time: "07:40", emoji: "🤖", category: "AI-агент", text: "Закрыты 3 сделки ночью на сумму 480 000 ₸." },
  { time: "00:10", emoji: "🛡", category: "Мониторинг", text: "Все системы стабильны. 14 проектов без аномалий." },
];

export default function HqAiDirector() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-5 h-full overflow-hidden">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary opacity-[0.04] blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI-Директор</h3>
            <p className="text-[10px] text-muted-foreground">Живая лента событий</p>
          </div>
        </div>

        <div className="space-y-0 relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border" />

          {feed.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 relative">
              {/* Timeline dot */}
              <div className="relative z-10 shrink-0 flex flex-col items-center">
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-[45px] text-right">{item.time}</span>
              </div>

              {/* Dot on the line */}
              <div className="relative z-10 mt-1 shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary/60 ring-2 ring-card" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs">{item.emoji}</span>
                  <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{item.category}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI-Директор активен • Обновлено 2 мин назад</span>
          </div>
        </div>
      </div>
    </div>
  );
}
