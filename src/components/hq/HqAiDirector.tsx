import { useEffect, useState } from "react";
import { Brain, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

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

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">Нет событий</p>
            <p className="text-xs text-muted-foreground mt-1">Задачи AI-директора появятся здесь автоматически</p>
          </div>
        ) : (
          <div className="space-y-0 relative">
            <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border" />
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-2.5 relative">
                <div className="relative z-10 shrink-0 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-[45px] text-right">{formatTime(task.created_at)}</span>
                </div>
                <div className="relative z-10 mt-1 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary/60 ring-2 ring-card" />
                </div>
                <div className="flex-1 min-w-0 -mt-0.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs">{sourceEmoji(task.source)}</span>
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{sourceLabel(task.source)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed truncate">{task.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI-Директор активен</span>
          </div>
        </div>
      </div>
    </div>
  );
}