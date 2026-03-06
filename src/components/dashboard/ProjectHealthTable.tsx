import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

type HealthStatus = "green" | "yellow" | "red";

interface Project {
  name: string;
  health: HealthStatus;
  romi: number;
  leads: number;
  spend: string;
  aiTasks: number;
  manager: string;
}

const projects: Project[] = [
  { name: "Avicenna Clinic", health: "green", romi: 420, leads: 38, spend: "180 000 ₸", aiTasks: 56, manager: "Айгерим" },
  { name: "Дентал Тайм", health: "yellow", romi: 85, leads: 12, spend: "95 000 ₸", aiTasks: 23, manager: "Данияр" },
  { name: "Kitarov Clinic", health: "yellow", romi: 110, leads: 18, spend: "120 000 ₸", aiTasks: 34, manager: "Мария" },
  { name: "Технология позвоночника", health: "red", romi: 0, leads: 4, spend: "60 000 ₸", aiTasks: 8, manager: "Айгерим" },
  { name: "Beauty Lab", health: "green", romi: 350, leads: 45, spend: "200 000 ₸", aiTasks: 61, manager: "Данияр" },
  { name: "NeoVision Eye", health: "green", romi: 290, leads: 28, spend: "140 000 ₸", aiTasks: 42, manager: "Мария" },
];

const statusConfig: Record<HealthStatus, { dot: string; label: string }> = {
  green: { dot: "bg-emerald-400", label: "Норма" },
  yellow: { dot: "bg-amber-400", label: "Внимание" },
  red: { dot: "bg-rose-500", label: "Критично" },
};

export default function ProjectHealthTable() {
  return (
    <Card className="bg-[#0f0f11] border-white/[0.08]">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Здоровье проектов
          </CardTitle>
          <Badge variant="outline" className="ml-auto text-[10px] border-white/10 text-muted-foreground">
            {projects.length} проектов
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Проект", "Статус", "ROMI", "Лиды", "Расходы", "AI-задачи", "Менеджер"].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest px-4 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const cfg = statusConfig[p.health];
                return (
                  <tr key={p.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-2.5 font-medium text-foreground/90">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-xs text-muted-foreground">{cfg.label}</span>
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 font-mono text-xs ${p.romi >= 200 ? "text-emerald-400" : p.romi >= 100 ? "text-amber-400" : "text-rose-400"}`}>
                      {p.romi}%
                    </td>
                    <td className="px-4 py-2.5 text-foreground/80 font-mono text-xs">{p.leads}</td>
                    <td className="px-4 py-2.5 text-foreground/80 text-xs">{p.spend}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(p.aiTasks, 60) / 60 * 100} className="h-1 w-12 bg-white/[0.06]" />
                        <span className="text-xs text-orange-400 font-mono">{p.aiTasks}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.manager}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
