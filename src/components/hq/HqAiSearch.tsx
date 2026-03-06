import { Sparkles, Zap } from "lucide-react";

export default function HqAiSearch() {
  return (
    <div className="flex items-center gap-4">
      {/* AI Search */}
      <div className="flex-1 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-[hsl(var(--status-ai))]/20 to-primary/20 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3">
          <Sparkles className="h-5 w-5 text-[hsl(var(--status-ai))] shrink-0" />
          <input
            type="text"
            placeholder="Спросите ИИ: 'Сколько лидов у клиники AIVA за неделю?'"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Value Counter */}
      <div className="shrink-0 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-[hsl(var(--status-ai))]/30 rounded-full blur-sm opacity-70" />
        <div className="relative flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5">
          <Zap className="h-4 w-4 text-[hsl(var(--status-ai))]" />
          <span className="text-xs font-bold bg-gradient-to-r from-primary to-[hsl(var(--status-ai))] bg-clip-text text-transparent whitespace-nowrap">
            AI сэкономил: 124 500 ₸ / 48 часов
          </span>
        </div>
      </div>
    </div>
  );
}
