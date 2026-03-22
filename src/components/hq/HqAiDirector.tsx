import { useEffect, useState } from "react";
import { Brain, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { PremiumCard } from "./PremiumCard";

interface BridgeTask {
  id: string;
  prompt: string;
  response: string | null;
  source: string | null;
  created_at: string | null;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function sourceEmoji(source: string | null): string {
  switch (source) {
    case "telegram": return "📲";
    case "web": return "🌐";
    case "api": return "⚡";
    default: return "🤖";
  }
}

function sourceLabel(source: string | null): string {
  switch (source) {
    case "telegram": return "Telegram";
    case "web": return "Веб";
    case "api": return "API";
    default: return "Система";
  }
}

export default function HqAiDirector() {
  const [tasks, setTasks] = useState<BridgeTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await supabase
          .from("ai_bridge_tasks")
          .select("id, prompt, response, source, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        setTasks((data as BridgeTask[]) || []);
      } catch {
        // silent — non-critical widget
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <PremiumCard
      className="h-full"
      icon={<Brain className="h-5 w-5" />}
      label="AI-Директор"
      secondaryLabel="Живая лента событий"
    >
      <div className="flex flex-col h-full">
        {loading ? (
          <div className="space-y-4 px-1">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-2xl bg-white/5" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
            <div className="h-16 w-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">Нет событий</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">Задачи появятся автоматически</p>
          </div>
        ) : (
          <div className="space-y-1 relative flex-1">
            <div className="absolute left-[54px] top-4 bottom-4 w-px bg-white/5" />
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 py-3 group/item transition-colors">
                <div className="w-[45px] pt-1 text-right shrink-0">
                  <span className="text-[10px] font-black font-mono text-muted-foreground/40 tabular-nums">{formatTime(task.created_at)}</span>
                </div>
                <div className="relative z-10 mt-1.5 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary/40 ring-4 ring-black shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                </div>
                <div className="flex-1 min-w-0 -mt-0.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs">{sourceEmoji(task.source)}</span>
                    <span className="text-[9px] font-black text-foreground/70 uppercase tracking-widest">{sourceLabel(task.source)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 font-medium">{task.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">AI-Директор активен</span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
        </div>
      </div>
    </PremiumCard>
  );
}