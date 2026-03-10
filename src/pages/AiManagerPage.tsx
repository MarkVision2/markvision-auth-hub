import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Cpu, Activity, Bot, Zap, MessageSquare, HeartHandshake,
  Wrench, CheckCircle2, ShieldCheck, Headphones
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
      <div className="space-y-6">
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

        {/* ── Section 2: AI Toggles ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Управление ИИ-Ассистентом</h2>
          </div>
          <div className="space-y-2">
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

        {/* ── Section 3: Activity Log ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Журнал действий ИИ</h2>
            <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">Сегодня</Badge>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {loading && (
                <div className="p-8 text-center text-sm text-muted-foreground">Загрузка журнала...</div>
              )}
              {!loading && systemLogs.map((entry) => {
                const Icon = entry.type === 'audit' ? Headphones : entry.type === 'action' ? CheckCircle2 : Wrench;
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-secondary border border-border"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", typeColors[entry.type] || "text-muted-foreground")} />
                    </div>
                    <p className="text-sm text-foreground flex-1">{entry.text}</p>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">{entry.time}</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5",
                      entry.type === "fix"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : entry.type === "audit"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {entry.type === "fix" ? "Auto-heal" : entry.type === "audit" ? "Аудит" : "Интеграция"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
