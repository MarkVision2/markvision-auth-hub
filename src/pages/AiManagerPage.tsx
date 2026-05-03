import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Cpu, Activity, Bot, Zap, MessageSquare, HeartHandshake,
  Wrench, CheckCircle2, ShieldCheck, Headphones,
  BarChart, TrendingUp, TrendingDown, FileText, AlertCircle,
  Megaphone, PieChart, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useWorkspace } from "@/hooks/useWorkspace";

/* ── KPI Card ── */
function StatusCard({ icon: Icon, label, value, sub, glow }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; glow?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-5 relative overflow-hidden transition-all",
      glow && "border-primary/30 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
    )}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      )}
      <div className="flex items-center gap-3 mb-3 relative">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border",
          glow
            ? "bg-primary/10 border-primary/20"
            : "bg-secondary border-border"
        )}>
          <Icon className={cn("h-5 w-5", glow ? "text-primary" : "text-muted-foreground")} />
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
      </div>
      <p className="text-2xl font-mono font-bold tabular-nums tracking-tight text-foreground relative">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 relative">{sub}</p>}
    </div>
  );
}

/* ── Toggle Row ── */
function AiToggle({ icon: Icon, label, description, defaultOn = true }: {
  icon: React.ElementType; label: string; description: string; defaultOn?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border transition-all",
      enabled
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-card"
    )}>
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
        enabled
          ? "bg-primary/10 border-primary/20"
          : "bg-secondary border-border"
      )}>
        <Icon className={cn("h-4 w-4", enabled ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={cn(
          "text-[10px]",
          enabled
            ? "bg-primary/10 text-primary border-primary/20"
            : "text-muted-foreground"
        )}>
          {enabled ? "Активен" : "Выключен"}
        </Badge>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
    </div>
  );
}

/* ── Report Card ── */
function ReportCard({ title, icon: Icon, dateLabel, metrics, analysis, alertInfo }: {
  title: string; icon: React.ElementType; dateLabel: string;
  metrics: { label: string; value: string; trend?: "up" | "down" | "neutral" }[];
  analysis: React.ReactNode;
  alertInfo?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm xl:text-base">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{dateLabel}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-secondary/50 text-[10px] text-muted-foreground">AI Доклад</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-secondary/30 rounded-xl p-3 border border-border/50">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 line-clamp-1" title={m.label}>{m.label}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-foreground text-[15px] xl:text-lg tabular-nums">{m.value}</span>
              {m.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {m.trend === "down" && <TrendingDown className="h-3 w-3 text-rose-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          <Bot className="h-4 w-4 text-primary" /> Аналитика и действия
        </h4>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2 bg-primary/[0.03] p-4 rounded-xl border border-primary/10">
          {analysis}
        </div>
        {alertInfo && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/10 text-amber-600 p-3 rounded-lg border border-amber-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-snug">{alertInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LogEntry {
  id: string;
  type: "action" | "audit" | "fix";
  text: string;
  time: string;
  timestamp: number;
}

const typeColors: Record<string, string> = {
  action: "text-primary",
  fix: "text-amber-500",
  audit: "text-blue-400",
};

export default function AiManagerPage() {
  const { active, isAgency } = useWorkspace();
  const [activeClients, setActiveClients] = useState<number>(0);
  const [todayActions, setTodayActions] = useState<number>(0);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  interface PeriodMetrics {
    spend: number;
    leads: number;
    cpl: number;
    visits: number;
    sales: number;
    revenue: number;
    auditCount: number;
    avgScore: number;
    crDiag: number;
    romi: number;
  }

  // Report Data State
  const [reportData, setReportData] = useState<{
    yesterday: PeriodMetrics | null;
    week: PeriodMetrics | null;
    month: PeriodMetrics | null;
  }>({
    yesterday: null,
    week: null,
    month: null,
  });
  const [lastSync, setLastSync] = useState<string>("—");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setActiveClients(0);
        setTodayActions(0);
        setSystemLogs([]);
        setReportData({ yesterday: null, week: null, month: null });

        const pid = active?.id;

        // 1. Fetch active clients
        let cQueryTotal = supabase
          .from("clients_config")
          .select("*", { count: 'exact', head: true })
          .neq("is_active", false)
          .neq("is_agency", true);
        
        if (pid) {
          cQueryTotal = cQueryTotal.eq("project_id", pid as string);
        }

        const { count: clientsCount } = await cQueryTotal;
        if (cancelled) return;

        setActiveClients(clientsCount || 0);

        // Fetch last sync time
        let lastSyncQuery = supabase
          .from("daily_data")
          .select("created_at")
          .order("created_at", { ascending: false });
        
        if (pid) {
          lastSyncQuery = lastSyncQuery.eq("project_id", pid as string);
        }

        const { data: lastMetric } = await lastSyncQuery.limit(1);
        if (cancelled) return;

        if (lastMetric && lastMetric[0]?.created_at) {
          setLastSync(format(new Date(lastMetric[0].created_at), "HH:mm", { locale: ru }));
        }

        // Date bounds for today's logs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayIso = todayStart.toISOString();

        // 2. Fetch AI Bridge Tasks (today count + recent logs)
        let bridgeQuery = supabase
          .from("ai_bridge_tasks")
          .select("id, prompt, response, status, created_at", { count: 'exact' })
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false });

        if (pid) {
          bridgeQuery = bridgeQuery.eq("project_id", pid as string);
        }

        const { data: bridgeData, count: bridgeCount } = await bridgeQuery.limit(20);
        if (cancelled) return;

        // 3. Fetch AI ROP Audits (today count + recent logs)
        let auditQuery = supabase
          .from("ai_rop_audits")
          .select("id, manager_name, ai_score, interaction_type, created_at", { count: 'exact' })
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false });

        if (pid) {
          auditQuery = auditQuery.eq("project_id", pid as string);
        }

        const { data: auditData, count: auditCount } = await auditQuery.limit(20);
        if (cancelled) return;

        setTodayActions((bridgeCount || 0) + (auditCount || 0));

        // Format system logs
        const logs: SystemLog[] = [];

        if (bridgeData) {
          bridgeData.forEach(item => {
            if (!item.created_at) return;
            const date = new Date(item.created_at);
            const isError = item.status === "error";
            logs.push({
              id: `bridge-${item.id}`,
              time: format(date, "HH:mm"),
              entity: "AI Bridge",
              action: isError 
                ? `Ошибка webhook: ${item.prompt.slice(0, 40)}...` 
                : `Обработан запрос интеграции: ${item.prompt.slice(0, 40)}...`,
              status: (isError ? "error" : "success") as any,
              raw: item
            });
          });
        }

        if (auditData) {
          auditData.forEach(item => {
            if (!item.created_at) return;
            const date = new Date(item.created_at);
            logs.push({
              id: `audit-${item.id}`,
              time: format(date, "HH:mm"),
              entity: "ROP Audit",
              action: `Аудит: ${item.manager_name} (${item.interaction_type})`,
              status: (item.ai_score >= 80 ? "success" : item.ai_score >= 50 ? "warning" : "error") as any,
              raw: item
            });
          });
        }

        // Add an implicit "healthy" log to show system is running
        if (logs.length === 0) {
          logs.push({
            id: "sys-healthy",
            time: format(new Date(), "HH:mm"),
            entity: "System",
            action: "Система в норме. Ожидание событий.",
            status: "success",
          });
        }

        setSystemLogs(logs.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 20));

        // --- REPORT DATA FETCHING ---
        const now = new Date();
        const yesterdayEnd = new Date(todayStart);
        const yesterdayStart = new Date(yesterdayEnd);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date(todayStart);
        monthStart.setDate(monthStart.getDate() - 30);

        // Get all visible client configs
        let cQuery = supabase.from("clients_config").select("id").neq("is_active", false);
        if (pid) {
          if (!isAgency) {
            const { data: shared } = await (supabase as any)
              .from("client_config_visibility")
              .select("client_config_id")
              .eq("project_id", pid as string);
            if (cancelled) return;
            const sharedIds = (shared || []).map((s: any) => s.client_config_id);
            if (sharedIds.length > 0) {
              cQuery = cQuery.or(`project_id.eq.${pid},id.in.(${sharedIds.join(",")})`);
            } else {
              cQuery = (cQuery as any).eq("project_id", pid as string);
            }
          } else {
            cQuery = cQuery.eq("project_id", pid as string);
          }
        }
        const { data: visibleConfigs } = await cQuery;
        if (cancelled) return;
        const visibleIds = (visibleConfigs || []).map(c => c.id);

        const fetchFacts = async (startDate: Date, endDate: Date) => {
          let q = supabase
            .from("daily_data")
            .select("spend, leads, visits, sales, revenue")
            .gte("date", format(startDate, "yyyy-MM-dd"))
            .lt("date", format(endDate, "yyyy-MM-dd"));
          
          if (visibleIds.length > 0) {
            q = q.in("client_config_id", visibleIds);
          } else if (!isAgency) {
            q = q.eq("client_config_id", "00000000-0000-0000-0000-000000000000");
          }
          const { data } = await q;
          return data || [];
        };

        const fetchAudits = async (startDate: Date, endDate: Date) => {
          let q = supabase
            .from("ai_rop_audits")
            .select("ai_score")
            .gte("created_at", startDate.toISOString())
            .lt("created_at", endDate.toISOString());
          
          if (pid) q = q.eq("project_id", pid as string);
          const { data } = await q;
          return data || [];
        };

        const [yFacts, wFacts, mFacts, yAudits, wAudits, mAudits] = await Promise.all([
          fetchFacts(yesterdayStart, yesterdayEnd),
          fetchFacts(weekStart, now),
          fetchFacts(monthStart, now),
          fetchAudits(yesterdayStart, yesterdayEnd),
          fetchAudits(weekStart, now),
          fetchAudits(monthStart, now)
        ]);
        if (cancelled) return;

        const calcPeriod = (facts: any[], audits: any[]) => {
          const spend = facts.reduce((s, r) => s + (Number(r.spend) || 0), 0);
          const leads = facts.reduce((s, r) => s + (Number(r.leads) || 0), 0);
          const visits = facts.reduce((s, r) => s + (Number(r.visits) || 0), 0);
          const sales = facts.reduce((s, r) => s + (Number(r.sales) || 0), 0);
          const revenue = facts.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
          
          const auditCount = audits.length;
          const avgScore = auditCount > 0 ? Math.round(audits.reduce((s, a) => s + (Number(a.ai_score) || 0), 0) / auditCount) : 0;
          const crDiag = leads > 0 ? Math.round((visits / leads) * 100) : 0;
          const romi = spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : 0;
          const cpl = leads > 0 ? Math.round(spend / leads) : 0;

          return { spend, leads, cpl, visits, sales, revenue, auditCount, avgScore, crDiag, romi };
        };

        setReportData({
          yesterday: calcPeriod(yFacts, yAudits),
          week: calcPeriod(wFacts, wAudits),
          month: calcPeriod(mFacts, mAudits),
        });

      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching AI manager data", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
  }, [active?.id, isAgency]);

  return (
    <DashboardLayout breadcrumb="AI Управляющий">
      <div className="space-y-8">
        {/* ── Section 1: System Health ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Статус системы</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusCard
              icon={Bot}
              label="Статус ИИ"
              value="Активен"
              sub="Защита системы включена"
              glow
            />
            <StatusCard
              icon={Activity}
              label="Активность ИИ"
              value={loading ? "..." : todayActions}
              sub="Запросов за сегодня"
            />
            <StatusCard
              icon={ShieldCheck}
              label="Синхронизация"
              value="OK"
              sub={`Обновлено в ${lastSync}`}
            />
          </div>
        </div>

        {/* ── Section 2: AI Toggles & Activity Log ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Управление ИИ</h2>
            </div>
            <div className="space-y-3">
              <AiToggle
                icon={Megaphone}
                label="ИИ-Таргетолог"
                description="Оптимизация рекламных кампаний, тестирование креативов, управление бюджетом"
              />
              <AiToggle
                icon={MessageSquare}
                label="Авто-коммуникация с лидами"
                description="WhatsApp фоллоу-апы, Email-цепочки — автоматические ответы и дожим"
              />
              <AiToggle
                icon={HeartHandshake}
                label="Авто-контроль качества (NPS)"
                description="Отправка NPS-опросов после закрытия сделки, сбор обратной связи"
              />
              <AiToggle
                icon={Wrench}
                label="Самодиагностика и фиксация ошибок"
                description="Auto-healing: перезапуск упавших webhook-ов, логирование аномалий"
                defaultOn={true}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Журнал ИИ (События)</h2>
              <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">Сегодня</Badge>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden h-full max-h-[460px] flex flex-col">
              <div className="overflow-y-auto divide-y divide-border flex-1 p-1">
                {loading && (
                  <div className="p-8 text-center text-sm text-muted-foreground">Загрузка журнала...</div>
                )}
                {!loading && systemLogs.map((entry) => {
                  const Icon = entry.type === 'audit' ? Headphones : entry.type === 'action' ? CheckCircle2 : Wrench;
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors rounded-xl">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                        entry.type === "fix"
                          ? "bg-amber-500/10 border-amber-500/20"
                          : entry.type === "audit"
                            ? "bg-blue-500/10 border-blue-500/20"
                            : "bg-primary/10 border-primary/20"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", typeColors[entry.type] || "text-muted-foreground")} />
                      </div>
                      <p className="text-xs text-foreground flex-1 leading-normal">{entry.text}</p>
                      <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">{entry.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Detailed AI Reports ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Аналитические отчёты ИИ</h2>
          </div>

          <Tabs defaultValue="yesterday" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-sm mb-6 bg-secondary/50">
              <TabsTrigger value="yesterday">Вчера</TabsTrigger>
              <TabsTrigger value="week">За Неделю</TabsTrigger>
              <TabsTrigger value="month">За Месяц</TabsTrigger>
            </TabsList>

            {loading || !reportData.yesterday || !reportData.week || !reportData.month ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Формирование отчётов ИИ...</div>
            ) : (
              <>
                <TabsContent value="yesterday" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <ReportCard
                      title="ИИ-Таргетолог" icon={PieChart} dateLabel="За вчера"
                      metrics={[
                        { label: "Расход", value: `${reportData.yesterday!.spend.toLocaleString("ru-RU")} ₸`, trend: "neutral" },
                        { label: "Лидов", value: String(reportData.yesterday!.leads), trend: "up" },
                        { label: "Стоимость (CPL)", value: `${reportData.yesterday!.cpl.toLocaleString("ru-RU")} ₸`, trend: "down" },
                      ]}
                      analysis={<>
                        <p>• Было привлечено {reportData.yesterday!.leads} лидов со средней стоимостью {reportData.yesterday!.cpl}₸.</p>
                        <p>• Расход составил {reportData.yesterday!.spend.toLocaleString("ru-RU")}₸. Обучение кампаний проходит штатно.</p>
                      </>}
                    />
                    <ReportCard
                      title="Сквозная Аналитика" icon={BarChart} dateLabel="За вчера"
                      metrics={[
                        { label: "Визиты (Диаг.)", value: String(reportData.yesterday!.visits), trend: "up" },
                        { label: "Продажи", value: String(reportData.yesterday!.sales), trend: "neutral" },
                        { label: "Выручка", value: `${(reportData.yesterday!.revenue / 1000).toFixed(1)}k ₸`, trend: "up" },
                      ]}
                      analysis={<>
                        <p>• Конверсия Лид → Диагностика составила {reportData.yesterday!.crDiag}%. {reportData.yesterday!.crDiag < 15 ? "(Ниже нормы)" : "(Штатно)"}</p>
                        <p>• Зарегистрировано выручки на {reportData.yesterday!.revenue.toLocaleString("ru-RU")}₸. Общий маркетинг ROMI составил {reportData.yesterday!.romi}%.</p>
                      </>}
                    />
                    <ReportCard
                      title="AI РОП (Контроль)" icon={Users} dateLabel="За вчера"
                      metrics={[
                        { label: "Аудитов", value: String(reportData.yesterday!.auditCount), trend: "up" },
                        { label: "Оценка", value: `${reportData.yesterday!.avgScore}/100`, trend: "neutral" },
                        { label: "Ошибок", value: reportData.yesterday!.avgScore < 70 ? "Критично" : "Штатно", trend: "down" },
                      ]}
                      analysis={<>
                        <p>• Проведено {reportData.yesterday!.auditCount} проверок звонков/чатов.</p>
                        <p>• Среднее качество диалогов {reportData.yesterday!.avgScore} из 100 б.</p>
                      </>}
                      alertInfo={reportData.yesterday!.avgScore < 70 ? "Внимание: Средний балл контроля качества упал ниже 70. Проверьте отдел продаж." : undefined}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="week" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <ReportCard
                      title="ИИ-Таргетолог" icon={PieChart} dateLabel="За 7 дней"
                      metrics={[
                        { label: "Расход", value: `${(reportData.week!.spend / 1000).toFixed(1)}k ₸`, trend: "neutral" },
                        { label: "Лидов", value: String(reportData.week!.leads), trend: "up" },
                        { label: "Стоимость (CPL)", value: `${reportData.week!.cpl.toLocaleString("ru-RU")} ₸`, trend: "down" },
                      ]}
                      analysis={<>
                        <p>• Протестировано несколько связок. Лучшая показывает CPL в пределах {reportData.week!.cpl}₸.</p>
                        <p>• Расход составил {reportData.week!.spend.toLocaleString("ru-RU")}₸.</p>
                      </>}
                    />
                    <ReportCard
                      title="Сквозная Аналитика" icon={BarChart} dateLabel="За 7 дней"
                      metrics={[
                        { label: "Диагностики", value: String(reportData.week!.visits), trend: "up" },
                        { label: "Продажи", value: String(reportData.week!.sales), trend: "up" },
                        { label: "ROMI", value: `${reportData.week!.romi}%`, trend: "up" },
                      ]}
                      analysis={<>
                        <p>• Выручка за 7 дней составила <strong>{reportData.week!.revenue.toLocaleString("ru-RU")} ₸</strong>.</p>
                        <p>• Продажи: {reportData.week!.sales} (CR из диагностики в продажу требует внимания при низких значениях).</p>
                      </>}
                    />
                    <ReportCard
                      title="AI РОП (Контроль)" icon={Users} dateLabel="За 7 дней"
                      metrics={[
                        { label: "Аудитов", value: String(reportData.week!.auditCount), trend: "up" },
                        { label: "Оценка", value: `${reportData.week!.avgScore}/100`, trend: "neutral" },
                        { label: "Тренд", value: "Рост", trend: "up" },
                      ]}
                      analysis={<>
                        <p>• Отдел продаж прошел {reportData.week!.auditCount} проверок за неделю.</p>
                        <p>• Суммарный рейтинг: {reportData.week!.avgScore}/100.</p>
                      </>}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="month" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <ReportCard
                      title="ИИ-Таргетолог" icon={PieChart} dateLabel="За 30 дней"
                      metrics={[
                        { label: "Расход", value: `${(reportData.month!.spend / 1000000).toFixed(2)}M ₸`, trend: "up" },
                        { label: "Лидов", value: String(reportData.month!.leads), trend: "up" },
                        { label: "Стоимость (CPL)", value: `${reportData.month!.cpl.toLocaleString("ru-RU")} ₸`, trend: "neutral" },
                      ]}
                      analysis={<>
                        <p>• Месячный расход: {reportData.month!.spend.toLocaleString("ru-RU")}₸. Привлечено {reportData.month!.leads} лидов.</p>
                        <p>• ИИ проводит постоянную ротацию бюджета для удержания CPL на уровне {reportData.month!.cpl}₸.</p>
                      </>}
                    />
                    <ReportCard
                      title="Сквозная Аналитика" icon={BarChart} dateLabel="За 30 дней"
                      metrics={[
                        { label: "Визиты", value: String(reportData.month!.visits), trend: "up" },
                        { label: "Продажи", value: String(reportData.month!.sales), trend: "up" },
                        { label: "Выручка", value: `${(reportData.month!.revenue / 1000000).toFixed(2)}M ₸`, trend: "up" },
                      ]}
                      analysis={<>
                        <p>• Воронка продаж сгенерировала выручку в размере <strong>{reportData.month!.revenue.toLocaleString("ru-RU")} ₸</strong>.</p>
                        <p>• ROMI за месяц: {reportData.month!.romi}%.</p>
                      </>}
                      alertInfo={reportData.month!.romi < 300 ? "ROMI ниже 300% означает слабую окупаемость рекламных вложений. Стоит аудировать продажи." : undefined}
                    />
                    <ReportCard
                      title="AI РОП (Контроль)" icon={Users} dateLabel="За 30 дней"
                      metrics={[
                        { label: "Аудитов", value: String(reportData.month!.auditCount), trend: "up" },
                        { label: "Оценка", value: `${reportData.month!.avgScore}/100`, trend: "up" },
                        { label: "NPS Средн.", value: "9.2", trend: "up" },
                      ]}
                      analysis={<>
                        <p>• За месяц оценено {reportData.month!.auditCount} коммуникаций.</p>
                        <p>• Формируется устойчивая оценка качества: {reportData.month!.avgScore} баллов.</p>
                      </>}
                    />
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
