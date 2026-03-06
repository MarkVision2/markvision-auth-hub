import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import ProjectDetailSheet from "@/components/sheets/ProjectDetailSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity,
  DollarSign,
  HeartPulse,
  FolderKanban,
  Sparkles,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* ── KPIs ── */
const kpis = [
  { title: "Проекты", value: "14", sub: "2 на паузе", icon: FolderKanban, color: "text-foreground" },
  { title: "MRR", value: "4.2M ₸", sub: "+5%", icon: DollarSign, color: "text-[hsl(var(--status-good))]" },
  { title: "Health", value: "85%", sub: "3 в риске", icon: HeartPulse, color: "text-[hsl(var(--status-good))]", progress: 85 },
  { title: "AI / 24ч", value: "342", sub: "≈28ч saved", icon: Sparkles, color: "text-[hsl(var(--status-ai))]" },
];

/* ── Projects ── */
type Health = "green" | "yellow" | "red";
interface Project {
  name: string;
  health: Health;
  mrr: string;
  romi: number;
  leads: number;
  tasks: { done: number; total: number };
  manager: string;
  initials: string;
}

const projects: Project[] = [
  { name: "Avicenna Clinic", health: "green", mrr: "450K", romi: 420, leads: 38, tasks: { done: 12, total: 14 }, manager: "Айгерим", initials: "АГ" },
  { name: "Beauty Lab", health: "green", mrr: "380K", romi: 350, leads: 45, tasks: { done: 8, total: 10 }, manager: "Данияр", initials: "ДН" },
  { name: "NeoVision Eye", health: "green", mrr: "320K", romi: 290, leads: 28, tasks: { done: 6, total: 9 }, manager: "Мария", initials: "МР" },
  { name: "Kitarov Clinic", health: "yellow", mrr: "220K", romi: 110, leads: 18, tasks: { done: 5, total: 11 }, manager: "Мария", initials: "МР" },
  { name: "Дентал Тайм", health: "yellow", mrr: "180K", romi: 85, leads: 12, tasks: { done: 3, total: 8 }, manager: "Данияр", initials: "ДН" },
  { name: "Технология позвоночника", health: "red", mrr: "90K", romi: 0, leads: 4, tasks: { done: 1, total: 6 }, manager: "Айгерим", initials: "АГ" },
];

const healthMap: Record<Health, { dot: string; label: string }> = {
  green: { dot: "bg-[hsl(var(--status-good))]", label: "OK" },
  yellow: { dot: "bg-[hsl(var(--status-warning))]", label: "Риск" },
  red: { dot: "bg-[hsl(var(--status-critical))]", label: "SOS" },
};

/* ── Team Load ── */
interface Member {
  name: string;
  initials: string;
  role: string;
  projects: number;
  tasks: { overdue: number; today: number; total: number };
}

const team: Member[] = [
  { name: "Айгерим", initials: "АГ", role: "PM", projects: 3, tasks: { overdue: 1, today: 2, total: 8 } },
  { name: "Данияр", initials: "ДН", role: "Таргетолог", projects: 3, tasks: { overdue: 0, today: 3, total: 6 } },
  { name: "Мария", initials: "МР", role: "PM", projects: 3, tasks: { overdue: 0, today: 1, total: 5 } },
  { name: "Алексей", initials: "АЛ", role: "Продажи", projects: 6, tasks: { overdue: 0, today: 4, total: 9 } },
];

/* ── AI Briefing ── */
const aiBriefing = [
  { text: "Перераспределить бюджет «Avicenna»", priority: "medium" },
  { text: "Решить карту «Технология позвоночника»", priority: "high" },
  { text: "Обновить креативы «Дентал Тайм»", priority: "medium" },
];

const priorityColor = { high: "text-[hsl(var(--status-critical))]", medium: "text-[hsl(var(--status-warning))]" };

export default function DashboardPM() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  return (
    <DashboardLayout breadcrumb="Управляющий">
      <StaggerContainer className="space-y-5">
        {/* Header */}
        <FadeUpItem>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Панель управляющего
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Проекты · Команда · Финансы · ИИ-сводка
          </p>
        </FadeUpItem>

        {/* KPIs */}
        <FadeUpItem className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em]">{kpi.title}</span>
                  <kpi.icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className={`text-xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
                {kpi.progress && <Progress value={kpi.progress} className="h-1 bg-secondary mt-2" />}
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </FadeUpItem>

        {/* Projects Table */}
        <FadeUpItem>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
              <FolderKanban className="h-3.5 w-3.5" />
              Обзор проектов
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Проект", "Статус", "MRR", "ROMI", "Лиды", "Задачи", "PM"].map((h) => (
                    <th key={h} className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const h = healthMap[p.health];
                  return (
                    <tr key={p.name} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setSelectedProject(p)}>
                      <td className="px-5 py-2.5 font-medium text-foreground/90 whitespace-nowrap">{p.name}</td>
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} />
                          <span className="text-muted-foreground">{h.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{p.mrr} ₸</td>
                      <td className={`px-5 py-2.5 font-mono tabular-nums ${p.romi >= 200 ? "text-[hsl(var(--status-good))]" : p.romi >= 100 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-critical))]"}`}>
                        {p.romi}%
                      </td>
                      <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{p.leads}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={p.tasks.done / p.tasks.total * 100} className="h-1 w-10 bg-secondary" />
                          <span className="font-mono tabular-nums text-muted-foreground">{p.tasks.done}/{p.tasks.total}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-secondary text-[8px] font-mono text-muted-foreground">{p.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{p.manager}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </FadeUpItem>

        {/* Team + AI Briefing */}
        <FadeUpItem className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Team */}
          <Card className="bg-card border-border lg:col-span-3">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Загрузка команды
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-0">
              {team.map((m) => (
                <div key={m.name} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-secondary text-[9px] font-mono text-muted-foreground">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground/90">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role} · {m.projects} проектов</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.tasks.overdue > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        {m.tasks.overdue}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {m.tasks.today} сегодня
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{m.tasks.total} всего</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Briefing */}
          <Card className="bg-card border-[hsl(var(--status-ai)/0.15)] relative overflow-hidden lg:col-span-2">
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[hsl(var(--status-ai)/0.05)] blur-3xl pointer-events-none" />
            <CardHeader className="pb-2 pt-4 px-5 relative z-10">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--status-ai))]" />
                ИИ-Директор
                <span className="text-[10px] text-[hsl(var(--status-ai)/0.5)] font-mono ml-auto">10:00</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 relative z-10 space-y-3">
              <p className="text-xs text-foreground/75 leading-relaxed">
                <span className="text-[hsl(var(--status-ai))] font-medium">Сводка:</span>{" "}
                Контент-Завод — <span className="text-foreground font-medium">12 видео</span>.
                CRM — <span className="text-[hsl(var(--status-good))] font-semibold">4 сделки</span> закрыты AI.
                MRR — <span className="text-[hsl(var(--status-good))] font-semibold">+5%</span>.
              </p>
              <div className="space-y-1.5">
                <p className="text-[hsl(var(--status-ai))] font-medium text-[10px] uppercase tracking-wider">Рекомендации</p>
                {aiBriefing.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                    <span className={`mt-px text-[10px] ${priorityColor[r.priority as keyof typeof priorityColor]}`}>→</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" className="w-full bg-[hsl(var(--status-ai))] hover:bg-[hsl(25_95%_46%)] text-white border-0 h-7 text-[11px]">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Принять рекомендации
              </Button>
            </CardContent>
          </Card>
        </FadeUpItem>
      </StaggerContainer>

      <ProjectDetailSheet project={selectedProject} open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)} />
    </DashboardLayout>
  );
}
