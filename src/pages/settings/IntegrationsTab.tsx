import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
    Eye, EyeOff, Lock, Globe, Copy, ExternalLink, Plug,
    HeartPulse, Radar, Target, Activity, Bot, Zap,
    RefreshCw, Clock, Cpu, Workflow, Send, MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

/* ── IntegrationCard ── */
interface IntegrationCardProps {
    icon: React.ReactNode;
    name: string;
    description: string;
    connected: boolean;
    fields: { label: string; value: string; type?: string }[];
    buttonLabel?: string;
}

function IntegrationCard({ icon, name, description, connected, fields, buttonLabel }: IntegrationCardProps) {
    const [showTokens, setShowTokens] = useState<Record<number, boolean>>({});

    return (
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", connected ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}>
                    {connected ? "🟢 Подключено" : "⚪️ Не подключено"}
                </Badge>
            </div>

            <Separator className="bg-border/15" />

            <div className="space-y-3">
                {fields.map((f, i) => (
                    <div key={i} className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                        <div className="relative">
                            <Input
                                type={f.type === "password" && !showTokens[i] ? "password" : "text"}
                                defaultValue={f.value}
                                className="bg-accent/20 border-border/20 text-sm font-mono pr-10"
                                readOnly
                            />
                            {f.type === "password" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowTokens(prev => ({ ...prev, [i]: !prev[i] }))}
                                >
                                    {showTokens[i] ? <EyeOff size={13} /> : <Eye size={13} />}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Button variant={connected ? "ghost" : "outline"} size="sm" className="h-8 text-xs gap-1.5">
                {connected ? <ExternalLink size={12} /> : <Plug size={12} />}
                {buttonLabel || (connected ? "Обновить токен" : "Подключить")}
            </Button>
        </div>
    );
}

/* ── WhatsApp Card ── */
const SETTINGS_PROJECT_ID = import.meta.env.VITE_PROJECT_ID || "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

function WhatsAppGreenApiCard() {
    const [instanceId, setInstanceId] = useState("");
    const [apiToken, setApiToken] = useState("");
    const [showInstance, setShowInstance] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function load() {
            const { data } = await (supabase as any)
                .from("clients_config")
                .select("project_id, wa_instance_id, wa_api_token")
                .eq("project_id", SETTINGS_PROJECT_ID)
                .limit(1)
                .maybeSingle();
            if (data) {
                setInstanceId((data as any).wa_instance_id || "");
                setApiToken((data as any).wa_api_token || "");
            }
            setLoaded(true);
        }
        load();
    }, []);

    const handleSave = async () => {
        if (!instanceId.trim() || !apiToken.trim()) {
            toast({ title: "Заполните оба поля", variant: "destructive" });
            return;
        }
        setSaving(true);
        const { error } = await (supabase as any)
            .from("clients_config")
            .update({ wa_instance_id: instanceId.trim(), wa_api_token: apiToken.trim() })
            .eq("project_id", SETTINGS_PROJECT_ID);
        setSaving(false);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✅ Ключи WhatsApp сохранены" });
        }
    };

    const connected = loaded && !!instanceId && !!apiToken;

    return (
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(142,70%,45%)]/10 border border-[hsl(142,70%,45%)]/20 flex items-center justify-center shrink-0">
                        <MessageCircle size={18} className="text-[hsl(142,70%,45%)]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">WhatsApp (Green-API)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Отправка и приём сообщений</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", connected ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}>
                    {connected ? "🟢 Подключено" : "⚪️ Не подключено"}
                </Badge>
            </div>

            <Separator className="bg-border/15" />

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Instance ID</Label>
                    <div className="relative">
                        <Input type={showInstance ? "text" : "password"} value={instanceId} onChange={e => setInstanceId(e.target.value)} placeholder="1234567890" className="bg-accent/20 border-border/20 text-sm font-mono pr-10" />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowInstance(!showInstance)}>
                            {showInstance ? <EyeOff size={13} /> : <Eye size={13} />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">API Token</Label>
                    <div className="relative">
                        <Input type={showToken ? "text" : "password"} value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="your-api-token-here" className="bg-accent/20 border-border/20 text-sm font-mono pr-10" />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowToken(!showToken)}>
                            {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                        </Button>
                    </div>
                </div>
            </div>

            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Lock size={12} />}
                Сохранить ключи
            </Button>
        </div>
    );
}

/* ── Meta Ads Card ── */
function MetaAdsCard() {
    const [token, setToken] = useState("");
    const [accountId, setAccountId] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function load() {
            const { data } = await (supabase as any)
                .from("clients_config")
                .select("project_id, fb_token, ad_account_id")
                .eq("project_id", SETTINGS_PROJECT_ID)
                .limit(1)
                .maybeSingle();
            if (data) {
                setToken((data as any).fb_token || "");
                setAccountId((data as any).ad_account_id || "");
            }
            setLoaded(true);
        }
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await (supabase as any)
            .from("clients_config")
            .update({ 
                fb_token: token.trim(), 
                ad_account_id: accountId.trim() 
            })
            .eq("project_id", SETTINGS_PROJECT_ID);
        setSaving(false);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✅ Настройки Meta Ads сохранены" });
        }
    };

    const connected = loaded && !!token;

    return (
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">📘</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Meta Ads (Facebook)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Facebook & Instagram Ads Manager</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", connected ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground")}>
                    {connected ? "🟢 Подключено" : "⚪️ Не подключено"}
                </Badge>
            </div>

            <Separator className="bg-border/15" />

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">System User Token (fb_token)</Label>
                    <div className="relative">
                        <Input type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)} placeholder="EAAG..." className="bg-accent/20 border-border/20 text-sm font-mono pr-10" />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowToken(!showToken)}>
                            {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Ad Account ID</Label>
                    <Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="act_123456789" className="bg-accent/20 border-border/20 text-sm font-mono" />
                </div>
            </div>

            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Lock size={12} />}
                Сохранить настройки Meta
            </Button>
        </div>
    );
}

/* ── Webhook Lead Card ── */
function WebhookLeadCard() {
    const webhookUrl = "https://n8n.zapoinov.com/webhook/execute-any-flow-new";
    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast({ title: "📋 Скопировано", description: "Webhook URL в буфере обмена" });
    };
    return (
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
                        <Globe size={18} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Сайт / Лид-форма (Webhook)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Ссылка для передачи заявок с вашего сайта в CRM</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">🟢 Активен</Badge>
            </div>
            <Separator className="bg-border/15" />
            <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Webhook URL</Label>
                <div className="flex gap-2">
                    <Input value={webhookUrl} readOnly className="bg-accent/20 border-border/20 text-sm font-mono flex-1" />
                    <Button variant="outline" size="sm" className="h-10 text-xs gap-1.5 shrink-0" onClick={handleCopy}>
                        <Copy size={12} /> Копировать
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Main IntegrationsTab ── */
export default function IntegrationsTab() {
    const [wfStatuses, setWfStatuses] = useState<Record<string, { status: "active" | "inactive" | "error" | "loading"; lastRun: string | null; errors: number }>>({});
    const [checking, setChecking] = useState(false);

    const N8N_WORKFLOWS = [
        { id: "rGcbMYpFDsAJdzKk", name: "AI_CONTROL_GATEWAY", desc: "Здоровье системы — ping, workflows, errors", icon: HeartPulse, color: "text-emerald-400", category: "Инфраструктура", webhook: "/webhook/ai-control", triggers: "POST webhook" },
        { id: "c2a6VlSlvYdO167U", name: "Ad Library — Core Engine", desc: "5 вебхуков: scrape, rebuild, site-scrape, FC-scrape, preview", icon: Radar, color: "text-purple-400", category: "Радар конкурентов", webhook: "/webhook/ad-library-scrape", triggers: "5 webhooks" },
        { id: "nR8Dsm5s4VLcwdWg", name: "Spy Module: FB Ads Monitor", desc: "Автоматический мониторинг через Apify → Supabase", icon: Eye, color: "text-blue-400", category: "Радар конкурентов", webhook: "/webhook/competitor-spy-sync", triggers: "POST webhook" },
        { id: "RMy7Gf7Ij2RGjN52CJI1r", name: "CAPI-Send-Conversion", desc: "Отправка конверсий Lead/Purchase в Facebook Pixel", icon: Target, color: "text-amber-400", category: "CRM → Facebook", webhook: "/webhook/capi-conversion", triggers: "POST webhook" },
        { id: "lObqS3bSMYjGa3L-46icJ", name: "Подписчики и посты", desc: "Ежедневный сбор IG followers → daily_data", icon: Activity, color: "text-pink-400", category: "Instagram", webhook: null, triggers: "Cron 07:00 Алматы" },
        { id: "gWCLC3k70FXfOABK", name: "AI-Targetolog", desc: "Telegram-бот для управления рекламой через AI", icon: Bot, color: "text-violet-400", category: "Управление рекламой", webhook: null, triggers: "Telegram + Cron" },
        { id: "qnb4dfXTdJ5NXm0v", name: "CAPI-Status-Trigger", desc: "Слушает смену статуса лида → отправляет CAPI события", icon: Zap, color: "text-orange-400", category: "CRM → Facebook", webhook: "/webhook/lead-status-changed", triggers: "POST webhook" },
    ];

    const fetchStatuses = async () => {
        setChecking(true);
        const initial: typeof wfStatuses = {};
        N8N_WORKFLOWS.forEach(wf => { initial[wf.id] = { status: "loading", lastRun: null, errors: 0 }; });
        setWfStatuses(initial);

        try {
            const { data, error } = await supabase.functions.invoke("n8n-health-check", { body: { action: "list_workflows" } });
            if (!error && data?.success) {
                const wfData = Array.isArray(data.data) ? data.data : data.data?.data || [];
                const updated: typeof wfStatuses = {};
                N8N_WORKFLOWS.forEach(wf => {
                    const match = wfData.find((w: any) => w.id === wf.id);
                    updated[wf.id] = {
                        status: match ? (match.active ? "active" : "inactive") : "active",
                        lastRun: match?.updatedAt || null,
                        errors: 0,
                    };
                });
                setWfStatuses(updated);
            }
        } catch {}
        setChecking(false);
    };

    useEffect(() => { fetchStatuses(); }, []);

    const statusConfig = {
        active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        inactive: { label: "Inactive", dot: "bg-muted-foreground/40", text: "text-muted-foreground", bg: "bg-secondary/30 border-border/30" },
        error: { label: "Errors", dot: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
        loading: { label: "Checking…", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-secondary/20 border-border/20" },
    };

    const categories = [...new Set(N8N_WORKFLOWS.map(w => w.category))];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Интеграции</h1>
                <p className="text-sm text-muted-foreground mt-1">n8n автоматизации, API-подключения и вебхуки</p>
            </div>

            {categories.map(cat => (
                <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {N8N_WORKFLOWS.filter(w => w.category === cat).map(wf => {
                            const sc = statusConfig[wfStatuses[wf.id]?.status || "loading"];
                            return (
                                <div key={wf.id} className={cn("rounded-xl border p-4 transition-colors", sc.bg)}>
                                    <div className="flex items-center gap-3">
                                        <wf.icon size={18} className={wf.color} />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{wf.name}</p>
                                            <p className="text-xs text-muted-foreground">{wf.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <Separator className="bg-border/20" />

            <div>
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">API Подключения</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <WhatsAppGreenApiCard />
                    <MetaAdsCard />
                    <IntegrationCard
                        icon={<Send size={18} className="text-blue-400" />}
                        name="Telegram"
                        description="Бот-уведомления и отчёты"
                        connected={true}
                        fields={[
                            { label: "Bot Token", value: "7123456789:AAF...", type: "password" },
                            { label: "Chat ID", value: "-1003746647686" },
                        ]}
                    />
                    <WebhookLeadCard />
                </div>
            </div>
        </div>
    );
}
