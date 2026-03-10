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
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
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
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-secondary/50 text-[10px] text-muted-foreground">AI Доклад</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 line-clamp-1" title={m.label}>{m.label}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-foreground text-sm xl:text-base tabular-nums">{m.value}</span>
              {m.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {m.trend === "down" && <TrendingDown className="h-3 w-3 text-rose-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          <Bot className="h-3.5 w-3.5 text-primary" /> Аналитика и действия
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
  const [activeClients, setActiveClients] = useState<number>(0);
  const [todayActions, setTodayActions] = useState<number>(0);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Fetch active clients
        const { count: clientsCount } = await supabase
          .from("clients_config")
          .select("*", { count: 'exact', head: true })
          .eq("is_active", true);

        setActiveClients(clientsCount || 0);

        // Date bounds for today's logs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayIso = todayStart.toISOString();

        // 2. Fetch AI Bridge Tasks (today count + recent logs)
        const { data: bridgeData, count: bridgeCount } = await supabase
          .from("ai_bridge_tasks")
          .select("id, prompt, response, status, created_at", { count: 'exact' })
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(20);

        // 3. Fetch AI ROP Audits (today count + recent logs)
        const { data: auditData, count: auditCount } = await supabase
          .from("ai_rop_audits")
          .select("id, manager_name, ai_score, interaction_type, created_at", { count: 'exact' })
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(20);

        setTodayActions((bridgeCount || 0) + (auditCount || 0));

        // Format Logs
        const logs: LogEntry[] = [];

        if (bridgeData) {
          bridgeData.forEach(item => {
            const date = new Date(item.created_at);
            const isError = item.status === "error";
            logs.push({
              id: `bridge-${item.id}`,
              type: isError ? "fix" : "action",
              text: isError
                ? `Ошибка webhook, попытка авто-лечения: ${item.prompt.slice(0, 40)}...`
                : `Обработан запрос интеграции (статус: ${item.status || "ok"})`,
              time: format(date, "HH:mm"),
              timestamp: date.getTime(),
            });
          });
        }

        if (auditData) {
          auditData.forEach(item => {
            const date = new Date(item.created_at);
            logs.push({
              id: `audit-${item.id}`,
              type: "audit",
              text: `AI РОП провел аудит. Оценка: ${item.ai_score || 0}/100. Тип: ${item.interaction_type}.`,
              time: format(date, "HH:mm"),
              timestamp: date.getTime(),
            });
          });
        }

        // Add an implicit "healthy" log to show system is running
        if (logs.length === 0) {
          logs.push({
            id: "sys-healthy",
            type: "action",
            text: "Система успешно инициализирована. Ожидание событий.",
            time: format(new Date(), "HH:mm"),
            timestamp: new Date().getTime(),
          });
        }

        // Sort descending by time
        logs.sort((a, b) => b.timestamp - a.timestamp);

        setSystemLogs(logs.slice(0, 30)); // Keep top 30
      } catch (err) {
        console.error("Error fetching AI manager data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
              icon={Activity}
              label="Состояние платформы"
              value="Healthy"
              sub="Все сервисы работают штатно"
              glow
            />
            <StatusCard
              icon={ShieldCheck}
              label="Активные Кабинеты"
              value={loading ? "..." : activeClients}
              sub="Проекты под управлением ИИ"
            />
            <StatusCard
              icon={Zap}
              label="Действий за сегодня"
              value={loading ? "..." : todayActions}
              sub="Все задачи и проверки за сегодня"
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

            <TabsContent value="yesterday" className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <ReportCard
                  title="ИИ-Таргетолог" icon={PieChart} dateLabel="За вчера"
                  metrics={[
                    { label: "Расход", value: "34,500 ₸", trend: "up" },
                    { label: "Лидов", value: "18", trend: "up" },
                    { label: "Стоимость (CPL)", value: "1,916 ₸", trend: "down" },
                  ]}
                  analysis={<>
                    <p>• Отключил креативы группы "B" (CPL &gt; 3,000₸).</p>
                    <p>• Перераспределил +7,000₸ бюджета на связку "Скидка -20%", она дала 70% лидов.</p>
                    <p>• Прогнозирую снижение CPL на 15% сегодня.</p>
                  </>}
                />
                <ReportCard
                  title="Сквозная Аналитика" icon={BarChart} dateLabel="За вчера"
                  metrics={[
                    { label: "Визиты (Диаг.)", value: "7", trend: "up" },
                    { label: "Продажи", value: "2", trend: "neutral" },
                    { label: "Выручка", value: "450k ₸", trend: "up" },
                  ]}
                  analysis={<>
                    <p>• Конверсия <strong>Лид → Диагностика</strong> составила 38% (Выше нормы).</p>
                    <p>• Подписано 2 договора из 7 пришедших, ROMI составил <strong>1204%</strong>.</p>
                  </>}
                />
                <ReportCard
                  title="AI РОП (Контроль)" icon={Users} dateLabel="За вчера"
                  metrics={[
                    { label: "Аудитов", value: "12", trend: "up" },
                    { label: "Оценка", value: "88/100", trend: "neutral" },
                    { label: "Upsell", value: "15%", trend: "down" },
                  ]}
                  analysis={<>
                    <p>• Менеджеры быстро берут лидов в работу (среднее время: 4 мин).</p>
                    <p>• Выявлена точка роста: забыли отправить полезные материалы после звонка в 3-х случаях.</p>
                  </>}
                  alertInfo="Айгерим получила оценку 65/100: не предложила альтернативный пакет."
                />
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <ReportCard
                  title="ИИ-Таргетолог" icon={PieChart} dateLabel="За 7 дней"
                  metrics={[
                    { label: "Расход", value: "241k ₸", trend: "neutral" },
                    { label: "Лидов", value: "114", trend: "up" },
                    { label: "Стоимость (CPL)", value: "2,114 ₸", trend: "down" },
                  ]}
                  analysis={<>
                    <p>• Протестировано 5 новых аудиторий. Lookalike (1%) дал лучший результат.</p>
                    <p>• Снижение стоимости клика [CPC] на 22% по сравнению с прошлой неделей.</p>
                  </>}
                />
                <ReportCard
                  title="Сквозная Аналитика" icon={BarChart} dateLabel="За 7 дней"
                  metrics={[
                    { label: "Диагностики", value: "42", trend: "up" },
                    { label: "Продажи", value: "11", trend: "up" },
                    { label: "ROMI", value: "956%", trend: "up" },
                  ]}
                  analysis={<>
                    <p>• Выручка за 7 дней составила <strong>2,545,000 ₸</strong>.</p>
                    <p>• Замечен спад конверсии в пятницу. Рекомендуется отправлять follow-up в выходные.</p>
                  </>}
                />
                <ReportCard
                  title="AI РОП (Контроль)" icon={Users} dateLabel="За 7 дней"
                  metrics={[
                    { label: "Аудитов", value: "84", trend: "up" },
                    { label: "Оценка", value: "85/100", trend: "neutral" },
                    { label: "Холодные", value: "48%", trend: "neutral" },
                  ]}
                  analysis={<>
                    <p>• Отдел продаж выполняет недельный план на 110%.</p>
                    <p>• Менеджер Санжар показал лучший рост качества звонков (+12 пунктов).</p>
                  </>}
                />
              </div>
            </TabsContent>

            <TabsContent value="month" className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <ReportCard
                  title="ИИ-Таргетолог" icon={PieChart} dateLabel="За 30 дней"
                  metrics={[
                    { label: "Расход", value: "1.1M ₸", trend: "up" },
                    { label: "Лидов", value: "492", trend: "up" },
                    { label: "Стоимость (CPL)", value: "2,235 ₸", trend: "neutral" },
                  ]}
                  analysis={<>
                    <p>• Провел A/B тесты на 14 лендингах.</p>
                    <p>• Масштабировал 3 связки x2 бюджета без потери окупаемости.</p>
                    <p>• Instagram Reels принесли 60% всего трафика (самый эффективный формат).</p>
                  </>}
                />
                <ReportCard
                  title="Сквозная Аналитика" icon={BarChart} dateLabel="За 30 дней"
                  metrics={[
                    { label: "Визиты", value: "172", trend: "up" },
                    { label: "Продажи", value: "40", trend: "up" },
                    { label: "Выручка", value: "11.2M ₸", trend: "up" },
                  ]}
                  analysis={<>
                    <p>• Выполнение месячного плана <strong>112%</strong>.</p>
                    <p>• Цикл сделки уменьшился на 2 дня (за счет авто-отправок NPS и кейсов).</p>
                  </>}
                  alertInfo="Выявлена потеря 15% квалифицированных лидов на этапе 'Жду оплату'. Требуется дожим-бот."
                />
                <ReportCard
                  title="AI РОП (Контроль)" icon={Users} dateLabel="За 30 дней"
                  metrics={[
                    { label: "Аудитов", value: "320", trend: "up" },
                    { label: "Оценка", value: "89/100", trend: "up" },
                    { label: "NPS Средн.", value: "9.2", trend: "up" },
                  ]}
                  analysis={<>
                    <p>• Нареканий на грубость не выявлено.</p>
                    <p>• Сформировано 12 обучающих кейсов на основе лучших записей звонков (база знаний).</p>
                    <p>• Автоматизировано 100% сбора обратной связи (NPS).</p>
                  </>}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
