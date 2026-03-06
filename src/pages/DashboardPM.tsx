import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import ProjectDetailSheet from "@/components/sheets/ProjectDetailSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Activity, FolderKanban, Users, Eye, ShoppingCart, ListChecks, Plus, CheckCircle2, Loader2,
} from "lucide-react";

interface ClientProject { id: string; name: string; is_active: boolean; }
interface Lead { id: string; status: string | null; client_config_id: string | null; }
type Health = "green" | "yellow" | "red";
interface ProjectRow { name: string; health: Health; visits: number; sales: number; totalLeads: number; }

const healthMap: Record<Health, { dot: string; label: string }> = {
  green: { dot: "bg-[hsl(var(--status-good))]", label: "OK" },
  yellow: { dot: "bg-[hsl(var(--status-warning))]", label: "Риск" },
  red: { dot: "bg-[hsl(var(--status-critical))]", label: "SOS" },
};

interface Task { id: string; text: string; assignee: string; done: boolean; }
const teamMembers = ["Айгерим", "Данияр", "Мария", "Алексей"];

export default function DashboardPM() {
  const [clients, setClients] = useState<ClientProject[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Подготовить отчёт по клиентам", assignee: "Айгерим", done: false },
    { id: "2", text: "Обновить креативы", assignee: "Данияр", done: true },
    { id: "3", text: "Созвон с клиентом", assignee: "Мария", done: false },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, leadsRes] = await Promise.all([
        (supabase as any).from("clients_config").select("id, client_name, is_active").eq("is_active", true),
        (supabase as any).from("leads").select("id, status, client_config_id"),
      ]);
      if (clientsRes.error) throw clientsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      setClients(((clientsRes.data as any[]) ?? []).map((c) => ({ id: c.id, name: c.client_name, is_active: c.is_active })));
      setLeads((leadsRes.data as Lead[]) ?? []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const channel = supabase.channel("pm_leads_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const projects = useMemo<ProjectRow[]>(() => {
    return clients.map((client) => {
      const clientLeads = leads.filter((l) => l.client_config_id === client.id);
      const visits = clientLeads.filter((l) => l.status === "Визит совершен").length;
      const sales = clientLeads.filter((l) => l.status === "Оплачен").length;
      const total = clientLeads.length;
      let health: Health = "red";
      if (sales > 0) health = "green";
      else if (total > 0) health = "yellow";
      return { name: client.name, health, visits, sales, totalLeads: total };
    });
  }, [clients, leads]);

  const kpis = useMemo(() => {
    const totalVisits = leads.filter((l) => l.status === "Визит совершен").length;
    const totalSales = leads.filter((l) => l.status === "Оплачен").length;
    const doneTasks = tasks.filter((t) => t.done).length;
    return [
      { title: "Проекты", value: String(clients.length), sub: "активных", icon: FolderKanban, color: "text-foreground" },
      { title: "Визиты", value: String(totalVisits), sub: "Визит совершен", icon: Eye, color: "text-[hsl(var(--status-ai))]" },
      { title: "Продажи", value: String(totalSales), sub: "Оплачен", icon: ShoppingCart, color: "text-[hsl(var(--status-good))]" },
      { title: "Задачи", value: `${doneTasks}/${tasks.length}`, sub: "выполнено", icon: ListChecks, color: "text-foreground" },
    ];
  }, [clients, leads, tasks]);

  const addTask = () => {
    if (!newTaskText.trim() || !newTaskAssignee) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), assignee: newTaskAssignee, done: false }]);
    setNewTaskText("");
    setNewTaskAssignee("");
  };
  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Управляющий">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Управляющий">
      <StaggerContainer className="space-y-5">
        <FadeUpItem>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Панель управляющего
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Проекты · Визиты · Продажи · Задачи — данные из CRM
          </p>
        </FadeUpItem>

        <FadeUpItem className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-[0.08em]">{kpi.title}</span>
                  <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </FadeUpItem>

        <FadeUpItem>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5" />
                Обзор проектов
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Проект", "Статус", "Лиды", "Визиты", "Продажи"].map((h) => (
                      <th key={h} className="text-xs text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left">{h}</th>
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
                            <span className={`h-2 w-2 rounded-full ${h.dot}`} />
                            <span className="text-muted-foreground">{h.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{p.totalLeads}</td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{p.visits}</td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{p.sales}</td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">Нет активных проектов</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Добавьте клиентов в разделе «Кабинеты»</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </FadeUpItem>

        <FadeUpItem>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  Задачи команды
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono border-border text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {tasks.filter((t) => t.done).length}/{tasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Новая задача..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="h-9 text-sm bg-secondary/30 border-border"
                />
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger className="h-9 w-[130px] text-sm bg-secondary/30 border-border">
                    <SelectValue placeholder="Кто" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addTask} className="h-9 px-3" disabled={!newTaskText.trim() || !newTaskAssignee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-0">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                    <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground/90"}`}>{task.text}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono border-border text-muted-foreground shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      {task.assignee}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeUpItem>
      </StaggerContainer>

      <ProjectDetailSheet project={selectedProject} open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)} />
    </DashboardLayout>
  );
}
