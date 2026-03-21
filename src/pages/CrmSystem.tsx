import { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ChatsView from "@/components/crm/ChatsView";
import ClientDatabase from "@/components/crm/ClientDatabase";
import Automations from "@/components/crm/Automations";
import AddLeadSheet from "@/components/crm/AddLeadSheet";
import TodayTasksPanel from "@/components/crm/TodayTasksPanel";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { type AITask } from "@/components/crm/types";
import {
  Kanban, Database, Cpu, MessageCircle, Plus,
  Users, TrendingUp, DollarSign, AlertCircle,
  ArrowUpRight, Zap, Clock, PhoneOutgoing, Timer,
  AlertTriangle, Sparkles, LayoutList,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";



interface Lead {
  id: string;
  status: string | null;
  amount: number | null;
  ai_score: number | null;
  created_at: string | null;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("ru-RU");
}

export default function CrmSystem() {
  const { active } = useWorkspace();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prevLeadsCount, setPrevLeadsCount] = useState(0);
  const [tasks, setTasks] = useState<AITask[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        let query = (supabase as any).from("leads_crm").select("id, status, amount, ai_score, created_at");

        if (active.id === "hq") {
          // MarkVision AI sees all
        } else {
          // Client project: own + shared
          const { data: shared } = await (supabase as any)
            .from("client_config_visibility")
            .select("client_config_id")
            .eq("project_id", active.id);
          const sharedCabIds = (shared || []).map((s: any) => s.client_config_id);

          if (sharedCabIds.length > 0) {
            // This is slightly more complex because leads are linked to client_configs
            // We need leads WHERE project_id = active.id OR client_config_id IN sharedCabIds
            query = query.or(`project_id.eq.${active.id},client_config_id.in.(${sharedCabIds.join(",")})`);
          } else {
            query = query.eq("project_id", active.id);
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        if (data) {
          setPrevLeadsCount(leads.length);
          setLeads(data);
        }
      } catch (err: unknown) {
        console.error("CRM leads fetch error:", err);
      }
    };
    load();
    const ch = supabase
      .channel("crm_kpi_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads_crm" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active.id]);

  const handleTaskGenerated = useCallback((task: AITask) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const handleMarkDone = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" as const } : t));
  }, []);

  const kpis = useMemo(() => {
    const total = leads.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayLeads = leads.filter(l => l.created_at?.slice(0, 10) === today).length;
    const noResponse = leads.filter(l => l.status === "Без ответа").length;
    const paid = leads.filter(l => l.status === "Оплачен");
    const revenue = paid.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const convRate = total > 0 ? Math.round((paid.length / total) * 100) : 0;
    const avgScore = leads.filter(l => (l.ai_score ?? 0) > 0);
    const avg = avgScore.length ? Math.round(avgScore.reduce((s, l) => s + (l.ai_score ?? 0), 0) / avgScore.length) : 0;
    const inWork = leads.filter(l => l.status === "В работе").length;
    return { total, todayLeads, noResponse, revenue, convRate, avg, inWork, paidCount: paid.length };
  }, [leads]);

  const kpiCards = [
    { title: "Всего лидов", value: kpis.total, suffix: "", sub: `+${kpis.todayLeads} сегодня`, icon: Users, color: "primary" as const, trend: kpis.todayLeads > 0 ? "up" as const : "neutral" as const },
    { title: "В работе", value: kpis.inWork, suffix: "", sub: `${kpis.noResponse} без ответа`, icon: Clock, color: "warning" as const, trend: kpis.noResponse > 3 ? "down" as const : "neutral" as const },
    { title: "Конверсия", value: kpis.convRate, suffix: "%", sub: `${kpis.paidCount} оплат`, icon: TrendingUp, color: "good" as const, trend: kpis.convRate > 10 ? "up" as const : "neutral" as const },
    { title: "Выручка", value: fmt(kpis.revenue), suffix: " ₸", sub: `Средний скор: ${kpis.avg}%`, icon: DollarSign, color: "primary" as const, trend: kpis.revenue > 0 ? "up" as const : "neutral" as const },
  ];

  const colorMap = {
    primary: { bg: "bg-primary/8", icon: "bg-primary/15 text-primary", text: "text-primary", glow: "shadow-primary/5" },
    warning: { bg: "bg-[hsl(var(--status-warning)/0.06)]", icon: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]", text: "text-[hsl(var(--status-warning))]", glow: "shadow-[hsl(var(--status-warning)/0.05)]" },
    good: { bg: "bg-[hsl(var(--status-good)/0.06)]", icon: "bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))]", text: "text-[hsl(var(--status-good))]", glow: "shadow-[hsl(var(--status-good)/0.05)]" },
  };


  return (
    <DashboardLayout breadcrumb="CRM Система">
      <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)]">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between shrink-0 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">CRM Система</h1>
              <p className="text-sm text-muted-foreground">Управление лидами · Воронка продаж · AI-скоринг</p>
            </div>
          </div>
          <Button
            onClick={() => setAddLeadOpen(true)}
            className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 gap-2"
          >
            <Plus className="h-4 w-4" /> Новый лид
          </Button>
        </div>

        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
          {kpiCards.map((kpi, idx) => {
            const colors = colorMap[kpi.color];
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative rounded-2xl border border-border bg-card p-4 overflow-hidden group hover:shadow-lg ${colors.glow} transition-all duration-300`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg}`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-xl ${colors.icon} flex items-center justify-center`}>
                      <kpi.icon className="h-4.5 w-4.5" />
                    </div>
                    {kpi.trend === "up" && (
                      <div className="flex items-center gap-0.5 text-[hsl(var(--status-good))]">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {kpi.trend === "down" && (
                      <div className="flex items-center gap-0.5 text-[hsl(var(--status-warning))]">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums font-mono">
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString("ru-RU") : kpi.value}
                    <span className="text-base font-semibold text-muted-foreground">{kpi.suffix}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
                </div>
              </motion.div>
            );
          })}
        </div>



        {/* ─── Alert: No Response ─── */}
        {kpis.noResponse > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[hsl(var(--status-warning)/0.06)] border border-[hsl(var(--status-warning)/0.15)] p-3 flex items-center gap-3 shrink-0 mb-4"
          >
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {kpis.noResponse} {kpis.noResponse === 1 ? 'лид' : 'лидов'} без ответа
              </p>
              <p className="text-xs text-muted-foreground">Обработайте заявки чтобы не потерять клиентов</p>
            </div>
            <Button variant="outline" size="sm" className="border-[hsl(var(--status-warning)/0.2)] text-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning)/0.1)] text-xs h-8">
              Показать
            </Button>
          </motion.div>
        )}

        {/* ─── Main Content: Tabs + Tasks Sidebar ─── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
              <TabsList className="h-11 bg-secondary/30 border border-border p-1 rounded-xl">
                <TabsTrigger value="kanban" className="h-9 px-4 text-sm font-medium rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Kanban className="h-4 w-4" /> Воронка
                </TabsTrigger>
                <TabsTrigger value="chats" className="h-9 px-4 text-sm font-medium rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <MessageCircle className="h-4 w-4" /> Чаты
                </TabsTrigger>
                <TabsTrigger value="clients" className="h-9 px-4 text-sm font-medium rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Database className="h-4 w-4" /> База клиентов
                </TabsTrigger>
                <TabsTrigger value="automations" className="h-9 px-4 text-sm font-medium rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Cpu className="h-4 w-4" /> Автоматизации
                </TabsTrigger>
              </TabsList>
              
              {/* Tasks Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-11 px-4 gap-2 rounded-xl border-border bg-card hover:bg-secondary/50 font-semibold shadow-sm">
                    <LayoutList className="h-4 w-4 text-primary" />
                    Задачи
                    {tasks.filter(t => t.status !== "done").length > 0 && (
                      <Badge variant="default" className="ml-1 h-5 px-1.5 text-[10px] rounded-sm">
                        {tasks.filter(t => t.status !== "done").length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col border-l border-border bg-background">
                  <div className="h-full overflow-y-auto">
                    <TodayTasksPanel
                      tasks={tasks}
                      onMarkDone={handleMarkDone}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <TabsContent value="kanban" className="flex-1 min-h-0"><KanbanBoard /></TabsContent>
            <TabsContent value="chats" className="flex-1 min-h-0"><ChatsView /></TabsContent>
            <TabsContent value="clients" className="flex-1 min-h-0"><ClientDatabase /></TabsContent>
            <TabsContent value="automations" className="flex-1 min-h-0"><Automations /></TabsContent>
          </Tabs>
        </div>

        <AddLeadSheet open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      </div>
    </DashboardLayout>
  );
}
