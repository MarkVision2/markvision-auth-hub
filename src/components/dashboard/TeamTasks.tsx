import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock } from "lucide-react";

interface Task { title: string; project: string; initials: string; deadline: string; status: "overdue" | "today" | "upcoming"; }

const tasks: Task[] = [
  { title: "Подготовить отчет для клиента", project: "Avicenna Clinic", initials: "АГ", deadline: "Просрочено", status: "overdue" },
  { title: "Запустить новую кампанию", project: "Beauty Lab", initials: "ДН", deadline: "Сегодня", status: "today" },
  { title: "Созвон с клиентом", project: "NeoVision Eye", initials: "МР", deadline: "15:00", status: "today" },
  { title: "Обновить креативы", project: "Дентал Тайм", initials: "ДН", deadline: "Завтра", status: "upcoming" },
  { title: "Ревью аудиторий", project: "Kitarov Clinic", initials: "МР", deadline: "Пт", status: "upcoming" },
];

const statusColors: Record<Task["status"], string> = {
  overdue: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]",
  today: "border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]",
  upcoming: "border-border bg-secondary/40 text-muted-foreground",
};

export default function TeamTasks() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Задачи команды
          </CardTitle>
          <Badge variant="outline" className="ml-auto border-[hsl(var(--status-critical)/0.2)] text-[hsl(var(--status-critical))] text-xs font-mono">
            1 просрочена
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-0">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-mono">{task.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/90 truncate leading-tight">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">{task.project}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 font-mono ${statusColors[task.status]}`}>
                <Clock className="h-3 w-3 mr-1" />
                {task.deadline}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
