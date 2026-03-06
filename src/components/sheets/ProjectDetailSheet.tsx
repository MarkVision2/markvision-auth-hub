import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FolderKanban, Eye, ShoppingCart, Users, FileText } from "lucide-react";

type Health = "green" | "yellow" | "red";

interface Project {
  name: string;
  health: Health;
  visits: number;
  sales: number;
  tasks: { done: number; total: number };
  manager: string;
  initials: string;
}

const healthMap: Record<Health, { dot: string; label: string; badge: string }> = {
  green: { dot: "bg-[hsl(var(--status-good))]", label: "OK", badge: "border-[hsl(var(--status-good)/0.3)] bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))]" },
  yellow: { dot: "bg-[hsl(var(--status-warning))]", label: "Риск", badge: "border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]" },
  red: { dot: "bg-[hsl(var(--status-critical))]", label: "SOS", badge: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" },
};

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailSheet({ project, open, onOpenChange }: Props) {
  if (!project) return null;
  const h = healthMap[project.health];
  const taskPct = Math.round(project.tasks.done / project.tasks.total * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] font-mono ${h.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${h.dot} mr-1.5`} />
              {h.label}
            </Badge>
          </div>
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            {project.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            PM: {project.manager}
          </SheetDescription>
        </SheetHeader>

        <Separator className="bg-border" />

        {/* Metrics */}
        <div className="py-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Показатели</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-3 w-3 text-[hsl(var(--status-ai))]" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Визиты</span>
              </div>
              <p className="text-lg font-bold font-mono tabular-nums">{project.visits}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingCart className="h-3 w-3 text-[hsl(var(--status-good))]" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Продажи</span>
              </div>
              <p className="text-lg font-bold font-mono tabular-nums text-[hsl(var(--status-good))]">{project.sales}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Tasks */}
        <div className="py-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Задачи</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Выполнено</span>
            <span className="text-sm font-mono font-semibold tabular-nums">{project.tasks.done} / {project.tasks.total}</span>
          </div>
          <Progress value={taskPct} className="h-2 bg-secondary" />
          <p className={`text-right text-[10px] font-mono ${taskPct >= 80 ? "text-[hsl(var(--status-good))]" : taskPct >= 50 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}`}>
            {taskPct}%
          </p>
        </div>

        <Separator className="bg-border" />

        {/* Actions */}
        <div className="py-4 space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Действия</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs border-border"><FileText className="h-3 w-3 mr-1.5" />Отчёт</Button>
            <Button variant="outline" size="sm" className="text-xs border-border">
              <Avatar className="h-4 w-4 mr-1.5"><AvatarFallback className="bg-secondary text-[7px] font-mono text-muted-foreground">{project.initials}</AvatarFallback></Avatar>
              Написать PM
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
