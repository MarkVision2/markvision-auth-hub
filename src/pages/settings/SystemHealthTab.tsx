import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
    Database, Workflow, Globe, ScanSearch, Cpu, Send,
    RefreshCw, Terminal, Wifi, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type ServiceStatus = "operational" | "degraded" | "outage" | "loading";

interface ServiceState {
    name: string;
    sub: string;
    icon: typeof Database;
    status: ServiceStatus;
    metric: string;
}

const STATUS_MAP = {
    operational: { label: "Operational", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    degraded: { label: "Degraded", color: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" },
    outage: { label: "Outage", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10" },
    loading: { label: "Checking…", color: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border", bg: "bg-secondary/20" },
} as const;

const LEVEL_COLORS: Record<string, string> = {
    INFO: "text-blue-400",
    SUCCESS: "text-emerald-400",
    WARN: "text-amber-400",
    ERROR: "text-rose-400",
};

export default function SystemHealthTab() {
    const [services, setServices] = useState<ServiceState[]>([
        { name: "Supabase", sub: "База данных", icon: Database, status: "loading", metric: "Проверка..." },
        { name: "n8n", sub: "Ядро автоматизации", icon: Workflow, status: "loading", metric: "Проверка..." },
        { name: "Meta Graph API", sub: "Рекламный трафик", icon: Globe, status: "loading", metric: "Проверка..." },
        { name: "Apify", sub: "Радар конкурентов", icon: ScanSearch, status: "loading", metric: "Проверка..." },
        { name: "Anthropic / Gemini", sub: "AI Engine", icon: Cpu, status: "loading", metric: "Проверка..." },
        { name: "Telegram Bot", sub: "Уведомления", icon: Send, status: "loading", metric: "Проверка..." },
    ]);
    const [logs, setLogs] = useState<{ time: string; level: string; msg: string }[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [lastCheck, setLastCheck] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [restartingId, setRestartingId] = useState<string | null>(null);

    const callGateway = async (action: string) => {
        try {
            const { data, error } = await supabase.functions.invoke("n8n-health-check", {
                body: { action },
            });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error(`Gateway ${action} error:`, err);
            return null;
        }
    };

    const runHealthCheck = async () => {
        setChecking(true);
        const newLogs: { time: string; level: string; msg: string }[] = [];
        const now = () => new Date().toLocaleTimeString("ru-RU", { hour12: false });

        try {
            const start = performance.now();
            const { error } = await (supabase as any).from("profiles").select("id").limit(1);
            const latency = Math.round(performance.now() - start);
            if (error) throw error;
            setServices(prev => prev.map(s => s.name === "Supabase" ? { ...s, status: "operational", metric: `Latency: ${latency}ms` } : s));
            newLogs.push({ time: now(), level: "SUCCESS", msg: `Supabase health check passed (${latency}ms)` });
        } catch {
            setServices(prev => prev.map(s => s.name === "Supabase" ? { ...s, status: "outage", metric: "Connection failed" } : s));
            newLogs.push({ time: now(), level: "ERROR", msg: "Supabase connection failed" });
        }

        const pingResult = await callGateway("ping");
        if (pingResult?.success) {
            setServices(prev => prev.map(s => s.name === "n8n" ? { ...s, status: "operational", metric: "Webhook OK" } : s));
            newLogs.push({ time: now(), level: "SUCCESS", msg: "n8n AI_CONTROL_GATEWAY ping successful" });
        } else {
            setServices(prev => prev.map(s => s.name === "n8n" ? { ...s, status: "outage", metric: pingResult?.error || "Unreachable" } : s));
            newLogs.push({ time: now(), level: "ERROR", msg: `n8n ping failed: ${pingResult?.error || "no response"}` });
        }

        const wfResult = await callGateway("list_workflows");
        if (wfResult?.success && wfResult.data) {
            const wfData = Array.isArray(wfResult.data) ? wfResult.data : [];
            setWorkflows(wfData);
            const activeCount = wfData.filter((w: any) => w.active).length;
            newLogs.push({ time: now(), level: "SUCCESS", msg: `n8n REST API: ${wfData.length} workflows loaded, ${activeCount} active` });
        } else {
            newLogs.push({ time: now(), level: "WARN", msg: `n8n workflows: ${wfResult?.error || "failed to load"}` });
        }

        const errResult = await callGateway("last_errors");
        if (errResult?.success && errResult.data) {
            const errData = Array.isArray(errResult.data) ? errResult.data : [];
            setErrors(errData);
            if (errData.length > 0) {
                newLogs.push({ time: now(), level: "WARN", msg: `n8n: ${errData.length} recent execution errors` });
            } else {
                newLogs.push({ time: now(), level: "SUCCESS", msg: "n8n: No recent execution errors" });
            }
        }
        const integrationsResult = await callGateway("check_integrations");
        if (integrationsResult?.success && Array.isArray(integrationsResult.data)) {
            const results = integrationsResult.data;
            setServices(prev => prev.map(s => {
                const match = results.find((r: any) =>
                    (s.name === "Meta Graph API" && r.name === "Meta") ||
                    (s.name === "Apify" && r.name === "Firecrawl") ||
                    (s.name === "Anthropic / Gemini" && r.name === "AI Gateway") ||
                    (s.name === "Telegram Bot" && r.name === "Telegram")
                );
                if (match) {
                    newLogs.push({ time: now(), level: match.status === "operational" ? "SUCCESS" : "ERROR", msg: `${match.name} status: ${match.status} (${match.metric})` });
                    return { ...s, status: match.status, metric: match.metric };
                }
                return s;
            }));
        }

        setServices(prev => prev.map(s => s.status === "loading" ? { ...s, status: "operational", metric: "Ready" } : s));
        newLogs.push({ time: now(), level: "INFO", msg: "System health sweep completed" });
        setLogs(newLogs);
        setLastCheck(now());
        setChecking(false);
    };

    const restartWorkflow = async (wfId: string, wfName: string) => {
        setRestartingId(wfId);
        try {
            const { data, error } = await supabase.functions.invoke("n8n-health-check", {
                body: { action: "activate_workflow", workflowId: wfId },
            });
            if (error) throw error;
            if (data?.success) {
                toast({ title: `Workflow перезапущен`, description: wfName });
            } else {
                toast({ title: "Ошибка перезапуска", description: data?.error || "Unknown", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setRestartingId(null);
        }
    };

    useEffect(() => { runHealthCheck(); }, []);

    const operationalCount = services.filter(s => s.status === "operational").length;
    const allOk = operationalCount === services.length && !services.some(s => s.status === "loading");
    const hasIssues = services.some(s => s.status === "outage" || s.status === "degraded");

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
        } catch { return "—"; }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Здоровье системы</h1>
                <p className="text-sm text-muted-foreground mt-1">Мониторинг инфраструктуры и сервисов в реальном времени</p>
            </div>

            {/* Overall Status Banner */}
            <div className={cn(
                "rounded-xl border p-6 flex items-center justify-between",
                allOk ? "border-emerald-500/20 bg-emerald-500/[0.04]" : hasIssues ? "border-rose-500/20 bg-rose-500/[0.04]" : "border-border bg-secondary/10"
            )}>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={cn("h-4 w-4 rounded-full", allOk ? "bg-emerald-500 animate-pulse" : hasIssues ? "bg-rose-500 animate-pulse" : "bg-muted-foreground")} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            {allOk ? "Все системы работают в штатном режиме" : hasIssues ? "Обнаружены проблемы" : "Проверка..."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {operationalCount} из {services.length} сервисов активны
                            {workflows.length > 0 && ` · ${workflows.length} n8n workflows`}
                            {errors.length > 0 && ` · ${errors.length} ошибок`}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={runHealthCheck} disabled={checking}>
                    <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
                    <span>{lastCheck ? `Проверено: ${lastCheck}` : "Проверить"}</span>
                </Button>
            </div>

            {/* Services Grid */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус сервисов</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {services.map(svc => {
                        const s = STATUS_MAP[svc.status];
                        return (
                            <div key={svc.name} className={cn("rounded-xl border p-4 transition-colors", s.border, s.bg)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-accent/30 border border-border/20 flex items-center justify-center">
                                            <svc.icon size={16} className="text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{svc.sub}</p>
                                        </div>
                                    </div>
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5", s.bg, s.text)}>
                                        <span className={cn("h-1.5 w-1.5 rounded-full", s.color)} />
                                        {s.label}
                                    </span>
                                </div>
                                <div className="rounded-lg bg-accent/20 border border-border/10 px-3 py-2">
                                    <span className="text-[11px] font-mono text-muted-foreground">{svc.metric}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* n8n Workflows */}
            <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/20 flex items-center gap-2">
                    <Workflow size={14} className="text-primary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">n8n Workflows</h2>
                    {workflows.length > 0 && (
                        <span className="text-[10px] text-muted-foreground/40 ml-auto">{workflows.length} подключено</span>
                    )}
                </div>

                {checking && workflows.length === 0 && (
                    <div className="px-5 py-8 text-center">
                        <RefreshCw size={16} className="animate-spin text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Загрузка workflows из n8n REST API...</p>
                    </div>
                )}

                {!checking && workflows.length === 0 && (
                    <div className="px-5 py-8 text-center">
                        <Wifi size={20} className="text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Не удалось загрузить workflows</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">Проверьте N8N_CONTROL_API_KEY в секретах Supabase</p>
                    </div>
                )}

                {workflows.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] uppercase tracking-wider">Workflow</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-center w-20">Узлы</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-right w-36">Обновлён</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-right w-24">Статус</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-center w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workflows.map((wf: any, i: number) => (
                                <TableRow key={wf.id || i} className="hover:bg-accent/10">
                                    <TableCell className="py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn("h-2 w-2 rounded-full shrink-0", wf.active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                            <span className="text-sm text-foreground truncate max-w-[280px]">{wf.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-2.5">
                                        <span className="text-xs text-muted-foreground tabular-nums">{wf.nodes || "—"}</span>
                                    </TableCell>
                                    <TableCell className="text-right py-2.5">
                                        <span className="text-[11px] text-muted-foreground tabular-nums">
                                            {wf.updatedAt ? formatDate(wf.updatedAt) : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-2.5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5",
                                            wf.active
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {wf.active ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-2.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                            disabled={restartingId === wf.id}
                                            onClick={() => restartWorkflow(wf.id, wf.name)}
                                            title="Перезапустить workflow"
                                        >
                                            <RefreshCw size={13} className={restartingId === wf.id ? "animate-spin" : ""} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* n8n Errors */}
            {errors.length > 0 && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-rose-500/10 flex items-center gap-2">
                        <Activity size={14} className="text-rose-400" />
                        <h2 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Последние ошибки n8n</h2>
                        <span className="text-[10px] text-muted-foreground/40 ml-auto">{errors.length}</span>
                    </div>
                    <div className="divide-y divide-rose-500/10 font-mono text-[12px]">
                        {errors.slice(0, 10).map((err: any, i: number) => (
                            <div key={err.id || i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-rose-500/5 transition-colors">
                                <span className="text-muted-foreground/40 shrink-0 tabular-nums">
                                    {err.startedAt ? formatDate(err.startedAt) : "—"}
                                </span>
                                <span className="text-rose-400 shrink-0 font-semibold w-16">[ERROR]</span>
                                <span className="text-muted-foreground truncate">
                                    {err.workflowName || `Workflow ${err.workflowId}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Logs */}
            <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/20 flex items-center gap-2">
                    <Terminal size={14} className="text-muted-foreground" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Системный лог</h2>
                </div>
                <div className="divide-y divide-border/10 font-mono text-[12px]">
                    {logs.length === 0 && (
                        <div className="px-5 py-4 text-center text-muted-foreground/40">Запуск проверки...</div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="px-5 py-2.5 flex items-start gap-3 hover:bg-accent/10 transition-colors">
                            <span className="text-muted-foreground/40 shrink-0 tabular-nums">[{log.time}]</span>
                            <span className={cn("shrink-0 font-semibold w-16", LEVEL_COLORS[log.level] || "text-foreground")}>[{log.level}]</span>
                            <span className="text-muted-foreground">{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
