import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone, Clock, ChevronDown, ChevronUp, Sparkles,
  Calendar, PhoneCall, Users, AlertTriangle,
} from "lucide-react";
import type { AITask } from "./types";

const typeIcons: Record<string, React.ElementType> = {
  call: PhoneCall,
  follow_up: Phone,
  meeting: Calendar,
};

const typeLabels: Record<string, string> = {
  call: "Звонок",
  follow_up: "Фоллоу-ап",
  meeting: "Встреча",
};

interface TodayTasksPanelProps {
  tasks: AITask[];
  onTaskClick?: (task: AITask) => void;
  onMarkDone?: (taskId: string) => void;
}

export default function TodayTasksPanel({ tasks, onTaskClick, onMarkDone }: TodayTasksPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const overdue = tasks.filter(t => t.status === "overdue").length;
  const pending = tasks.filter(t => t.status === "pending").length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Задачи на сегодня</p>
          <p className="text-[10px] text-muted-foreground">{tasks.length} задач · {overdue} просрочено</p>
        </div>
        {overdue > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
            {overdue} просрочено
          </Badge>
        )}
      </div>

      {/* Task List */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {tasks.map((task) => {
          const expanded = expandedId === task.id;
          const Icon = typeIcons[task.type] || Phone;
          const isOverdue = task.status === "overdue";
          const isDone = task.status === "done";

          return (
            <div key={task.id} className={cn(
              "transition-colors",
              isDone && "opacity-50",
            )}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
                  isOverdue && "bg-destructive/[0.03]"
                )}
                onClick={() => setExpandedId(expanded ? null : task.id)}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                  isOverdue
                    ? "bg-destructive/10 border-destructive/20"
                    : isDone
                    ? "bg-primary/10 border-primary/20"
                    : "bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.2)]"
                )}>
                  <Icon className={cn(
                    "h-3.5 w-3.5",
                    isOverdue ? "text-destructive" : isDone ? "text-primary" : "text-[hsl(var(--status-warning))]"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
                    {task.lead_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{typeLabels[task.type] || task.type}</p>
                </div>

                <span className={cn(
                  "text-xs font-mono tabular-nums shrink-0",
                  isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
                )}>
                  {task.due_time}
                </span>

                <Badge variant="outline" className={cn(
                  "text-[9px] shrink-0",
                  isOverdue
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : isDone
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]"
                )}>
                  {isOverdue ? "Просрочено" : isDone ? "Готово" : "Ожидает"}
                </Badge>

                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Expanded: AI Hint */}
              {expanded && (
                <div className="px-4 pb-3 space-y-2">
                  <div className="ml-11 rounded-xl border border-primary/15 bg-primary/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Подсказка ИИ перед звонком</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{task.ai_hint}</p>
                    {task.last_call_summary && (
                      <div className="pt-1 border-t border-primary/10">
                        <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Итог прошлого звонка:</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">{task.last_call_summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-11 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={(e) => { e.stopPropagation(); onTaskClick?.(task); }}
                    >
                      <Users className="h-3 w-3" /> Открыть лида
                    </Button>
                    {!isDone && (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] gap-1"
                        onClick={(e) => { e.stopPropagation(); onMarkDone?.(task.id); }}
                      >
                        ✓ Выполнено
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Нет задач на сегодня 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
