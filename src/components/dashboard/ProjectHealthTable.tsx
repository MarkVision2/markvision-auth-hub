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
  { name: "Avicenna Clinic", health: "green", romi: 420, leads: 38, spend: "180K ₸", aiTasks: 56, manager: "Айгерим" },
  { name: "Beauty Lab", health: "green", romi: 350, leads: 45, spend: "200K ₸", aiTasks: 61, manager: "Данияр" },
  { name: "NeoVision Eye", health: "green", romi: 290, leads: 28, spend: "140K ₸", aiTasks: 42, manager: "Мария" },
  { name: "Kitarov Clinic", health: "yellow", romi: 110, leads: 18, spend: "120K ₸", aiTasks: 34, manager: "Мария" },
  { name: "Дентал Тайм", health: "yellow", romi: 85, leads: 12, spend: "95K ₸", aiTasks: 23, manager: "Данияр" },
  { name: "Технология позвоночника", health: "red", romi: 0, leads: 4, spend: "60K ₸", aiTasks: 8, manager: "Айгерим" },
];

const statusConfig: Record<HealthStatus, { dot: string; label: string }> = {
  green: { dot: "bg-[hsl(var(--status-good))]", label: "OK" },
  yellow: { dot: "bg-[hsl(var(--status-warning))]", label: "Риск" },
  red: { dot: "bg-[hsl(var(--status-critical))]", label: "SOS" },
};

export default function ProjectHealthTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Здоровье проектов
          </CardTitle>
          <Badge variant="outline" className="ml-auto text-[10px] border-border text-muted-foreground font-mono">
            {projects.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Проект", "Статус", "ROMI %", "Лиды", "Расход", "AI", "PM"].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const cfg = statusConfig[p.health];
                return (
                  <tr key={p.name} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer">
                    <td className="px-5 py-2.5 font-medium text-foreground/90 whitespace-nowrap">{p.name}</td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-muted-foreground">{cfg.label}</span>
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-mono tabular-nums">
                      <span className={p.romi >= 200 ? "text-[hsl(var(--status-good))]" : p.romi >= 100 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}>
                        {p.romi}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-foreground/80 font-mono tabular-nums">{p.leads}</td>
                    <td className="px-5 py-2.5 text-foreground/70 font-mono tabular-nums">{p.spend}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(p.aiTasks, 65) / 65 * 100} className="h-1 w-10 bg-secondary" />
                        <span className="text-[hsl(var(--status-ai))] font-mono tabular-nums">{p.aiTasks}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">{p.manager}</td>
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
