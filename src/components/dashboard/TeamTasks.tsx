import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock } from "lucide-react";

interface Task {
  title: string;
  project: string;
  manager: string;
  initials: string;
  deadline: string;
  status: "overdue" | "today" | "upcoming";
}

const tasks: Task[] = [
  { title: "Подготовить отчет для клиента", project: "Avicenna Clinic", manager: "Айгерим", initials: "АГ", deadline: "Просрочено", status: "overdue" },
  { title: "Запустить новую кампанию", project: "Beauty Lab", manager: "Данияр", initials: "ДН", deadline: "Сегодня", status: "today" },
  { title: "Созвон с клиентом", project: "NeoVision Eye", manager: "Мария", initials: "МР", deadline: "Сегодня, 15:00", status: "today" },
  { title: "Обновить креативы", project: "Дентал Тайм", manager: "Данияр", initials: "ДН", deadline: "Завтра", status: "upcoming" },
  { title: "Ревью аудиторий", project: "Kitarov Clinic", manager: "Мария", initials: "МР", deadline: "Пт", status: "upcoming" },
];

const statusColors = {
  overdue: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  today: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  upcoming: "border-white/10 bg-white/[0.04] text-muted-foreground",
};

export default function TeamTasks() {
  return (
    <Card className="bg-[#0f0f11] border-white/[0.08]">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Задачи команды
          </CardTitle>
          <Badge variant="outline" className="ml-auto border-rose-500/20 text-rose-400 text-[10px]">
            1 просрочена
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-0">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0"
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="bg-white/[0.06] text-muted-foreground text-[9px]">
                  {task.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/90 truncate">{task.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{task.project}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[task.status]}`}>
                <Clock className="h-2.5 w-2.5 mr-1" />
                {task.deadline}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
