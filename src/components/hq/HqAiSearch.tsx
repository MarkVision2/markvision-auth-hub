import { Sparkles } from "lucide-react";

export default function HqAiSearch() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-[hsl(var(--status-ai))]/20 to-primary/20 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3">
          <Sparkles className="h-5 w-5 text-[hsl(var(--status-ai))] shrink-0" />
          <input
            type="text"
            placeholder="Спросите ИИ: 'Сколько лидов у клиники AIVA за неделю?'"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border bg-secondary/30 px-2 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  );
}
