import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Loader2,
    Sparkles,
    Play,
    Send,
    Users,
    BarChart3,
    Zap,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Copy,
    ExternalLink,
    Activity,
    FileText,
    Cpu,
    ScanSearch,
    Download,
    RotateCcw,
    Globe,
    TrendingUp,
    Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format as dateFmt } from "date-fns";
import { useWorkspace } from "@/hooks/useWorkspace";

// ─── Constants ───
const N8N_SCRAPE_HEAVY = import.meta.env.VITE_N8N_SCRAPE_HEAVY_URL || "";
const N8N_SCRAPE_LIGHT = import.meta.env.VITE_N8N_SCRAPE_LIGHT_URL || "";
const BOOST_WEBHOOK_URL = import.meta.env.VITE_BOOST_WEBHOOK_URL || "";
const INSTAGRAM_ANALYSIS_WEBHOOK = "https://n8n.zapoinov.com/webhook/lovableinstagram";

// ─── Types ───
interface Competitor {
    id: string;
    username: string;
    platform: string;
    display_name: string | null;
    avatar_url: string | null;
    followers: string | null;
    engagement_rate: string | null;
    bio: string | null;
    is_active: boolean;
    created_at?: string;
}

interface AnalysisResult {
    id: string;
    competitor_id: string | null;
    video_url: string | null;
    transcription: string | null;
    ai_analysis: string | null;
    generated_script: string | null;
    performance_score: number;
    post_caption: string | null;
    post_type: string | null;
    strengths: string[] | null;
    weaknesses: string[] | null;
    hook: string | null;
    status: string | null;
    created_at: string;
}

// ─── Score color helper ───
function scoreColor(score: number) {
    if (score >= 80) return "text-[hsl(var(--status-good))]";
    if (score >= 50) return "text-[hsl(var(--status-warning))]";
    return "text-[hsl(var(--status-critical))]";
}

// ─── Trigger Boost.space webhook ───
async function triggerBoostWebhook(payload: Record<string, unknown>) {
    if (!BOOST_WEBHOOK_URL) throw new Error("VITE_BOOST_WEBHOOK_URL не задан");
    const response = await fetch(BOOST_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Boost webhook error: ${response.status}`);
}

// ─── Trigger n8n webhook ───
async function triggerScrape(url: string, payload: Record<string, unknown>) {
    console.log(`[Proxy] Triggering scrape via proxy: ${url}`, payload);
    try {
        if (!url) {
            console.error("[n8n] Webhook URL is MISSING. Check VITE_N8N_... variables.");
            throw new Error("n8n Webhook URL is not configured");
        }

        const { data, error } = await supabase.functions.invoke("spy-webhook-proxy", {
            body: {
                action: "trigger_scrape",
                url: url,
                payload: payload
            }
        });

        if (error) {
            console.error("[Proxy] Invoke error:", error);
            throw new Error(`Ошибка прокси: ${error.message}`);
        }

        console.log("[Proxy] Webhook triggered successfully via proxy", data);
    } catch (e: any) {
        console.error("n8n proxy connection error details:", e);
        throw new Error("Ошибка связи через прокси: " + e.message);
    }
}

export function CompetitorAnalysis() {
    const [profileAnalysisUrl, setProfileAnalysisUrl] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileResult, setProfileResult] = useState<any>(null);

    const { toast } = useToast();
    const { active } = useWorkspace();

    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [scrapingId, setScrapingId] = useState<string | null>(null);

    // Add competitor
    const [profileQuery, setProfileQuery] = useState("");
    const [addingCompetitor, setAddingCompetitor] = useState(false);

    // Filters
    const [compSearch, setCompSearch] = useState("");
    const [compTrackFilter, setCompTrackFilter] = useState<"all" | "active" | "inactive">("all");
    const [compSort, setCompSort] = useState("followers_desc");

    // Posts dialog
    const [postsDialog, setPostsDialog] = useState<{ open: boolean; competitor: Competitor | null }>({ open: false, competitor: null });
    const [postsForDialog, setPostsForDialog] = useState<AnalysisResult[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState("competitors");

    // Post analysis tab
    const [postUrl, setPostUrl] = useState("");
    const [postLoading, setPostLoading] = useState(false);
    const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
    const [scriptDialog, setScriptDialog] = useState<{ open: boolean; script: string | null }>({ open: false, script: null });
    const [adaptFormat, setAdaptFormat] = useState("video");
    const [adaptLoading, setAdaptLoading] = useState(false);
    const [adaptedScript, setAdaptedScript] = useState<string | null>(null);

    // ─── Load Data ───
    useEffect(() => {
        const load = async () => {
            try {
                const [compRes, analysisRes] = await Promise.all([
                    (supabase as any).from("competitors").select("*").order("created_at", { ascending: false }),
                    (supabase as any).from("content_factory").select("*").order("created_at", { ascending: false }).limit(30),
                ]);
                if (compRes.data) {
                    setCompetitors(compRes.data);
                    // Auto-enrich competitors missing profile data or with old Instagram CDN URLs
                    const missing = (compRes.data as Competitor[]).filter(
                        (c) => c.is_active && (!c.avatar_url || c.avatar_url.includes("fbcdn") || c.avatar_url.includes("cdninstagram"))
                    );
                    if (missing.length > 0) {
                        // Enrich one at a time to avoid overloading Apify
                        (async () => {
                            for (const comp of missing.slice(0, 3)) {
                                try {
                                    const { data: profileData } = await supabase.functions.invoke("spy-webhook-proxy", {
                                        body: { action: "enrich_profile", competitor_id: comp.id, username: comp.username }
                                    });
                                    if (profileData?.profile) {
                                        setCompetitors((prev) => prev.map((c) =>
                                            c.id === comp.id ? { ...c, ...profileData.profile } : c
                                        ));
                                    }
                                } catch {/* silent */}
                            }
                        })();
                    }
                }
                if (analysisRes.data) setAnalyses(analysisRes.data);
            } catch (e) {
                console.error("Load error:", e);
            } finally {
                setLoadingData(false);
            }
        };
        load();

        const channel = supabase
            .channel("content_factory_realtime")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "content_factory" }, (payload) => {
                const row = payload.new as unknown as AnalysisResult;
                setAnalyses((prev) => [row, ...prev]);
                // Тост только для завершённых записей (не для pending)
                if (row.status === "completed" && row.performance_score > 0) {
                    toast({ title: "🔔 Новый AI-разбор", description: `Оценка: ${row.performance_score}/100` });
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "content_factory" }, (payload) => {
                const row = payload.new as unknown as AnalysisResult;
                // Обновляем список разборов
                setAnalyses((prev) => prev.map((a) => a.id === row.id ? row : a));
                // Если это тот самый pending-анализ с сайта — показываем результат
                setPendingAnalysisId((pendingId) => {
                    if (pendingId === row.id && row.status === "completed") {
                        setPostLoading(false);
                        setSelectedAnalysis(row);
                        setActiveTab("post");
                        toast({ title: "✅ Анализ готов!", description: `Оценка виральности: ${row.performance_score}/100` });
                        return null;
                    }
                    return pendingId;
                });
            })
            .subscribe();

        const compChannel = supabase
            .channel("competitors_realtime")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "competitors" }, (payload) => {
                const updated = payload.new as unknown as Competitor;
                setCompetitors((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(compChannel);
        };
    }, [toast]);

    // ─── Filter / Sort competitors ───
    const filteredCompetitors = competitors
        .filter((c) => {
            const q = compSearch.toLowerCase();
            const matchSearch = !q || c.username.toLowerCase().includes(q) || (c.display_name || "").toLowerCase().includes(q);
            const matchTrack = compTrackFilter === "all" || (compTrackFilter === "active" ? c.is_active : !c.is_active);
            return matchSearch && matchTrack;
        })
        .sort((a, b) => {
            if (compSort === "followers_desc") return parseInt(b.followers || "0") - parseInt(a.followers || "0");
            if (compSort === "followers_asc") return parseInt(a.followers || "0") - parseInt(b.followers || "0");
            return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
        });

    // ─── Handlers ───
    const handleAddCompetitor = useCallback(async () => {
        if (!profileQuery.trim()) return;
        setAddingCompetitor(true);
        try {
            const raw = profileQuery.trim().replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
            const username = raw.split("/").filter(Boolean).pop() || raw;
            const instagramUrl = `https://www.instagram.com/${username}/`;

            const { data, error } = await (supabase as any)
                .from("competitors")
                .insert({ username, platform: "instagram", display_name: username, is_active: true, project_id: active.id === "hq" ? null : active.id })
                .select()
                .single();
            if (error) throw error;

            setCompetitors((prev) => [data, ...prev]);
            setProfileQuery("");
            toast({ title: "✅ Конкурент добавлен", description: `@${username} — запускаю парсинг...` });

            // Enrich competitor profile data (avatar, followers, bio) via Apify
            supabase.functions.invoke("spy-webhook-proxy", {
                body: { action: "enrich_profile", competitor_id: data.id, username }
            }).then(({ data: profileData }) => {
                if (profileData?.profile) {
                    setCompetitors((prev) => prev.map((c) =>
                        c.id === data.id ? { ...c, ...profileData.profile } : c
                    ));
                    toast({ title: "✅ Профиль загружен", description: `@${username} — данные обновлены` });
                }
            }).catch(() => {/* silent */});

            // Trigger n8n webhook for posts scrape
            try {
                await triggerScrape(N8N_SCRAPE_HEAVY, {
                    username,
                    competitor_id: data.id,
                    project_id: active.id === "hq" ? null : active.id,
                });
                toast({ title: "🚀 Сканирование запущено!", description: "Посты появятся через 1-2 мин" });
            } catch {
                toast({ title: "⚠️ Конкурент сохранён, но автоскан не запустился", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setAddingCompetitor(false);
        }
    }, [profileQuery, toast]);

    const handleScrapeNow = useCallback(async (comp: Competitor, mode: "heavy" | "light" = "heavy") => {
        setScrapingId(comp.id);
        const url = mode === "heavy" ? N8N_SCRAPE_HEAVY : N8N_SCRAPE_LIGHT;
        try {
            // Always enrich profile first (avatar, followers, bio)
            const { data: profileData } = await supabase.functions.invoke("spy-webhook-proxy", {
                body: { action: "enrich_profile", competitor_id: comp.id, username: comp.username }
            });
            if (profileData?.profile) {
                setCompetitors((prev) => prev.map((c) =>
                    c.id === comp.id ? { ...c, ...profileData.profile } : c
                ));
            }

            // Also trigger n8n for post data (if URL configured)
            if (url) {
                await triggerScrape(url, {
                    username: comp.username,
                    competitor_id: comp.id,
                    project_id: active.id === "hq" ? null : active.id,
                }).catch(() => {/* n8n optional */});
            }

            toast({
                title: mode === "heavy" ? "🚀 Профиль обновлён!" : "⚡️ Профиль обновлён!",
                description: `@${comp.username} — аватар и данные загружены`
            });
        } catch (err: any) {
            toast({ title: "Ошибка скрейпа", description: err.message, variant: "destructive" });
        } finally {
            setScrapingId(null);
        }
    }, [toast]);

    const handleToggleTracking = useCallback(async (comp: Competitor) => {
        const newState = !comp.is_active;
        try {
            const { error } = await (supabase as any).from("competitors").update({ is_active: newState }).eq("id", comp.id);
            if (error) throw error;
            setCompetitors((prev) => prev.map((c) => c.id === comp.id ? { ...c, is_active: newState } : c));
            toast({ title: newState ? "Слежка включена ✅" : "Слежка выключена ⏸️" });
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        }
    }, [toast]);

    const handleDeleteCompetitor = useCallback(async (id: string) => {
        try {
            const { error } = await (supabase as any).from("competitors").delete().eq("id", id);
            if (error) throw error;
            setCompetitors((prev) => prev.filter((c) => c.id !== id));
            toast({ title: "🗑 Удалён" });
        } catch (err: any) {
            toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
        }
    }, [toast]);

    const openPostsDialog = useCallback(async (comp: Competitor) => {
        setPostsDialog({ open: true, competitor: comp });
        setLoadingPosts(true);
        try {
            const { data } = await (supabase as any)
                .from("content_factory")
                .select("*")
                .eq("competitor_id", comp.id)
                .order("created_at", { ascending: false })
                .limit(20);
            setPostsForDialog(data || []);
        } catch { setPostsForDialog([]); }
        finally { setLoadingPosts(false); }
    }, []);

    const handleAnalyzePost = useCallback(async () => {
        if (!postUrl.trim()) return;
        setPostLoading(true);
        setSelectedAnalysis(null);
        setAdaptedScript(null);
        setPendingAnalysisId(null);
        try {
            const { data, error } = await supabase.functions.invoke("spy-webhook-proxy", {
                body: {
                    action: "analyze_video",
                    url: postUrl.trim(),
                    project_id: active.id === "hq" ? null : active.id,
                },
            });
            if (error) throw new Error(error.message);
            if (!data?.record_id) throw new Error("Не получен record_id от сервера");
            // Сохраняем ID — realtime подписка покажет результат когда n8n завершит анализ
            setPendingAnalysisId(data.record_id);
            toast({ title: "⏳ Анализ запущен", description: "n8n скачивает и транскрибирует видео… 1-3 мин" });
            // Таймаут 5 мин — сбрасываем загрузку если n8n не ответил
            setTimeout(() => {
                setPendingAnalysisId((currentId) => {
                    if (currentId === data.record_id) {
                        setPostLoading(false);
                        toast({ title: "⚠️ Анализ занял слишком долго", description: "Попробуйте ещё раз или проверьте n8n", variant: "destructive" });
                        return null;
                    }
                    return currentId;
                });
            }, 5 * 60 * 1000);
        } catch (err: any) {
            setPostLoading(false);
            toast({ title: "Ошибка запуска анализа", description: err.message, variant: "destructive" });
        }
        // postLoading сбрасывается в realtime UPDATE обработчике когда приходит результат
    }, [postUrl, toast, active.id]);

    const handleDeleteAnalysis = useCallback(async (id: string) => {
        try {
            const { error } = await (supabase as any).from("content_factory").delete().eq("id", id);
            if (error) throw error;
            setAnalyses((prev) => prev.filter((a) => a.id !== id));
            toast({ title: "🗑 Удалено" });
        } catch (err: any) {
            toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
        }
    }, [toast]);

    const handleAdapt = useCallback(async (analysis: AnalysisResult) => {
        setAdaptLoading(true);
        try {
            await triggerBoostWebhook({
                action: "adapt_content",
                format: adaptFormat,
                analysis_id: analysis.id,
                hook: analysis.hook,
                ai_analysis: analysis.ai_analysis,
                source: "markvision-platform",
            });
            await new Promise((r) => setTimeout(r, 2000));
            setAdaptedScript(analysis.generated_script || "Сценарий генерируется автоматизацией Boost.space...");
            toast({ title: "✅ Сценарий адаптирован" });
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setAdaptLoading(false);
        }
    }, [adaptFormat, toast]);

    const displayAnalyses = analyses.filter((a) =>
        a.status === "completed" && (a.performance_score > 0 || !!a.hook || !!a.ai_analysis)
    );

    // ─── Instagram Profile Analysis Handler ───
    const handleProfileAnalyze = useCallback(async () => {
        if (!profileAnalysisUrl.trim()) return;
        setProfileLoading(true);
        setProfileResult(null);
        try {
            const raw = profileAnalysisUrl.trim().replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
            const username = raw.split("/").filter(Boolean).pop() || raw;
            const instagramUrl = `https://www.instagram.com/${username}/`;

            toast({ title: "⏳ Запускаю анализ профиля...", description: `@${username} → n8n обрабатывает` });

            const response = await fetch(INSTAGRAM_ANALYSIS_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: instagramUrl,
                    username,
                    project_id: active.id === "hq" ? null : active.id,
                }),
            });

            if (!response.ok) throw new Error(`Ошибка webhook: ${response.status}`);

            const data = await response.json();
            setProfileResult(data);
            toast({ title: "✅ Анализ готов!", description: `@${data?.account_overview?.username || username}` });
            setProfileAnalysisUrl("");
        } catch (err: any) {
            toast({ title: "Ошибка анализа", description: err.message, variant: "destructive" });
        } finally {
            setProfileLoading(false);
        }
    }, [profileAnalysisUrl, active, toast]);

    return (
        <div className="space-y-6">
            {/* KPI Cards — Premium Glass */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Конкуренты", value: competitors.length, icon: Users, gradient: "from-blue-500/10 to-cyan-500/5", iconColor: "text-blue-400" },
                    { label: "AI-разборов", value: displayAnalyses.length, icon: BarChart3, gradient: "from-violet-500/10 to-purple-500/5", iconColor: "text-violet-400" },
                    { label: "Ср. оценка", value: displayAnalyses.length ? Math.round(displayAnalyses.reduce((s, a) => s + a.performance_score, 0) / displayAnalyses.length) : 0, icon: TrendingUp, gradient: "from-amber-500/10 to-orange-500/5", iconColor: "text-amber-400" },
                    { label: "Сценариев", value: displayAnalyses.filter((a) => a.generated_script).length, icon: Sparkles, gradient: "from-emerald-500/10 to-green-500/5", iconColor: "text-emerald-400" },
                ].map((kpi) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border border-border/40 bg-gradient-to-br ${kpi.gradient} backdrop-blur-sm p-4 text-left hover:border-border/60 transition-all`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                            <div className={`h-7 w-7 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center`}>
                                <kpi.icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground font-mono tabular-nums">{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="h-11 bg-secondary/50 border border-border p-1 rounded-xl w-full">
                    <TabsTrigger value="competitors" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Конкуренты
                        {competitors.length > 0 && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold">{competitors.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Анализ аккаунта
                    </TabsTrigger>
                    <TabsTrigger value="post" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
                        <Play className="h-3.5 w-3.5" /> Разбор контента
                    </TabsTrigger>
                    <TabsTrigger value="analyses" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> AI-Разборы
                        {displayAnalyses.length > 0 && (
                            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">{displayAnalyses.length}</span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ═══ TAB 1: КОНКУРЕНТЫ ═══ */}
                <TabsContent value="competitors" className="space-y-5">
                    {/* Add competitor */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm font-bold">@</span>
                            <Input
                                value={profileQuery}
                                onChange={(e) => setProfileQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
                                placeholder="username или ссылка на Instagram..."
                                className="pl-9 h-11 bg-secondary/30 border-border text-sm"
                            />
                        </div>
                        <Button onClick={handleAddCompetitor} disabled={addingCompetitor || !profileQuery.trim()} className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5">
                            {addingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Добавить
                        </Button>
                    </div>


                    {/* Filter Bar */}
                    <div className="flex gap-2 flex-wrap bg-secondary/20 border border-border rounded-xl p-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input
                                value={compSearch}
                                onChange={(e) => setCompSearch(e.target.value)}
                                placeholder="Поиск по @username..."
                                className="pl-8 h-9 bg-secondary/30 border-border text-sm"
                            />
                        </div>
                        <Select value={compTrackFilter} onValueChange={(v: any) => setCompTrackFilter(v)}>
                            <SelectTrigger className="w-40 h-9 bg-secondary/30 border-border text-sm">
                                <SelectValue placeholder="Все аккаунты" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все аккаунты</SelectItem>
                                <SelectItem value="active">Слежка ВКЛ</SelectItem>
                                <SelectItem value="inactive">Слежка ВЫКЛ</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={compSort} onValueChange={setCompSort}>
                            <SelectTrigger className="w-44 h-9 bg-secondary/30 border-border text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="followers_desc">Больше подписчиков</SelectItem>
                                <SelectItem value="followers_asc">Меньше подписчиков</SelectItem>
                                <SelectItem value="created_desc">Сначала новые</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Competitors list */}
                    {loadingData ? (
                        <div className="space-y-3 text-left">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                        </div>
                    ) : filteredCompetitors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="h-14 w-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium">Нет конкурентов</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Добавьте @username или ссылку на Instagram</p>
                        </div>
                    ) : (
                        <div className="space-y-3 text-left">
                            {filteredCompetitors.map((comp) => {
                                const initials = comp.username.slice(0, 2).toUpperCase();
                                const followersNum = comp.followers ? parseInt(comp.followers).toLocaleString("ru-RU") : null;
                                const isScrapingThis = scrapingId === comp.id;
                                return (
                                    <motion.div key={comp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 flex-wrap group">
                                        {/* Avatar — initials as base, photo on top */}
                                        <div className="relative h-12 w-12 shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                                                {initials}
                                            </div>
                                            {comp.avatar_url && (
                                                <img
                                                    src={comp.avatar_url}
                                                    alt={comp.username}
                                                    referrerPolicy="no-referrer"
                                                    className="absolute inset-0 h-12 w-12 rounded-full object-cover border-2 border-border"
                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-[140px]">
                                            <p className="text-sm font-semibold text-foreground">@{comp.username}</p>
                                            <p className="text-xs text-muted-foreground">{comp.display_name || comp.username}</p>
                                            {comp.created_at && (
                                                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                                    Добавлен {dateFmt(new Date(comp.created_at), "dd.MM.yyyy")}
                                                </p>
                                            )}
                                        </div>

                                        {/* Stats & Actions */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {followersNum && (
                                                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground font-medium border border-border">
                                                    {followersNum} подп.
                                                </span>
                                            )}

                                            {/* Tracking toggle */}
                                            <button
                                                onClick={() => handleToggleTracking(comp)}
                                                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${comp.is_active
                                                    ? "bg-[hsl(var(--status-good))]/10 border-[hsl(var(--status-good))]/30 text-[hsl(var(--status-good))]"
                                                    : "bg-secondary/30 border-border text-muted-foreground"
                                                    }`}
                                            >
                                                <Activity className="h-3 w-3" />
                                                {comp.is_active ? "Слежка ВКЛ" : "Слежка ВЫКЛ"}
                                            </button>

                                            {/* Instagram link */}
                                            <a
                                                href={`https://www.instagram.com/${comp.username}/`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
                                            >
                                                <ExternalLink className="h-3 w-3" /> Insta
                                            </a>

                                            {/* Posts button */}
                                            <button
                                                onClick={() => openPostsDialog(comp)}
                                                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                                            >
                                                <FileText className="h-3 w-3" /> Посты
                                            </button>

                                            {/* Scrape button with dropdown */}
                                            <div className="flex items-center">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleScrapeNow(comp, "heavy")}
                                                    disabled={isScrapingThis}
                                                    className="h-8 px-3 text-[11px] gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-r-none border-r border-primary-foreground/10"
                                                >
                                                    {isScrapingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                                    Full Scrape
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleScrapeNow(comp, "light")}
                                                    disabled={isScrapingThis}
                                                    className="h-8 px-2 text-[11px] bg-primary/80 hover:bg-primary text-primary-foreground rounded-l-none"
                                                    title="Быстрый парсинг (без видео)"
                                                >
                                                    <Zap className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Delete */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteCompetitor(comp.id)}
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ═══ TAB 2: АНАЛИЗ АККАУНТА ═══ */}
                <TabsContent value="profile" className="space-y-5">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                value={profileAnalysisUrl}
                                onChange={(e) => setProfileAnalysisUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleProfileAnalyze()}
                                placeholder="Ссылка на Instagram аккаунт или @username..."
                                className="pl-10 h-11 bg-secondary/30 border-border text-sm"
                            />
                        </div>
                        <Button onClick={handleProfileAnalyze} disabled={profileLoading || !profileAnalysisUrl.trim()} className="h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold gap-1.5 border-0">
                            {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            Анализировать
                        </Button>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/15 p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <Cpu className="h-4 w-4 text-violet-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-foreground mb-0.5">AI-анализ профиля Instagram</p>
                            <p className="text-xs text-muted-foreground">
                                n8n автоматически проанализирует профиль — подписчики, вовлеченность, качество контента, стиль коммуникации, частоту постов и даст рекомендации по улучшению стратегии.
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {profileLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                                            <Loader2 className="h-7 w-7 text-violet-400 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-foreground">Анализ профиля запущен</p>
                                        <p className="text-xs text-muted-foreground mt-1">n8n обрабатывает данные… Это может занять 1–3 минуты</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-2">
                                        {["Парсинг профиля", "Анализ контента", "Генерация отчёта"].map((step, i) => (
                                            <div key={step} className="flex flex-col items-center gap-1.5">
                                                <div className={`h-1.5 w-full rounded-full ${i === 0 ? 'bg-violet-500' : 'bg-border'}`} />
                                                <span className="text-[10px] text-muted-foreground">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!profileLoading && !profileResult && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                                    <Globe className="h-7 w-7 text-violet-400/50" />
                                </div>
                                <p className="text-sm font-medium">Вставьте ссылку на Instagram-аккаунт</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Например: https://instagram.com/username или @username</p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {["Анализ подписчиков", "Качество контента", "Стратегия", "Рекомендации"].map((tag) => (
                                        <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/8 border border-violet-500/15 text-violet-400/80">{tag}</span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Profile Analysis Result ─── */}
                        {!profileLoading && profileResult && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-left">
                                {/* Account Overview */}
                                {profileResult.account_overview && (
                                    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5 space-y-3">
                                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-violet-400" />
                                            @{profileResult.account_overview.username}
                                        </h3>
                                        {profileResult.account_overview.positioning_summary && (
                                            <p className="text-sm text-foreground/80">{profileResult.account_overview.positioning_summary}</p>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {profileResult.account_overview.target_audience_guess && (
                                                <div className="rounded-lg bg-card/60 border border-border/30 p-2.5">
                                                    <p className="text-[10px] text-muted-foreground mb-0.5">Целевая аудитория</p>
                                                    <p className="text-xs text-foreground/80">{profileResult.account_overview.target_audience_guess}</p>
                                                </div>
                                            )}
                                            {profileResult.account_overview.main_offer_guess && (
                                                <div className="rounded-lg bg-card/60 border border-border/30 p-2.5">
                                                    <p className="text-[10px] text-muted-foreground mb-0.5">Основной оффер</p>
                                                    <p className="text-xs text-foreground/80">{profileResult.account_overview.main_offer_guess}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Scores */}
                                {profileResult.scores_0_10 && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-amber-400" /> Оценки (0–10)
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {Object.entries(profileResult.scores_0_10).map(([key, val]) => {
                                                const labels: Record<string, string> = { profile_packaging: "Профиль", content_strategy: "Контент", engagement: "Вовлечённость", growth_potential: "Рост", sales_funnel: "Воронка" };
                                                const score = Number(val) || 0;
                                                const color = score >= 7 ? "text-emerald-400" : score >= 4 ? "text-amber-400" : "text-red-400";
                                                return (
                                                    <div key={key} className="rounded-lg bg-secondary/30 border border-border/30 p-3 text-center">
                                                        <p className={`text-xl font-bold font-mono ${color}`}>{score}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{labels[key] || key}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Top Mistakes */}
                                {profileResult.top_mistakes && profileResult.top_mistakes.length > 0 && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-400" /> Ошибки
                                        </h3>
                                        <div className="space-y-2">
                                            {profileResult.top_mistakes.map((m: any, i: number) => (
                                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 space-y-1">
                                                    <p className="text-xs font-semibold text-foreground">❌ {m.title}</p>
                                                    <p className="text-[11px] text-muted-foreground">{m.why_bad}</p>
                                                    <p className="text-[11px] text-emerald-400">→ {m.how_fix}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick Wins */}
                                {profileResult.quick_wins_24h && profileResult.quick_wins_24h.length > 0 && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-400" /> Быстрые улучшения (24ч)
                                        </h3>
                                        <div className="space-y-2">
                                            {profileResult.quick_wins_24h.map((w: any, i: number) => (
                                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 space-y-1">
                                                    <p className="text-xs font-semibold text-foreground">⚡ {w.action}</p>
                                                    {w.example && <p className="text-[11px] text-muted-foreground">Пример: {w.example}</p>}
                                                    {w.expected_effect && <p className="text-[11px] text-emerald-400">Результат: {w.expected_effect}</p>}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bio Rewrite */}
                                {profileResult.bio_rewrite && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-400" /> Переписать BIO
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {profileResult.bio_rewrite.version_1_short && (
                                                <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                                                    <p className="text-[10px] text-blue-400 font-semibold mb-1">Вариант 1 (короткий)</p>
                                                    <p className="text-xs text-foreground/80">{profileResult.bio_rewrite.version_1_short}</p>
                                                </div>
                                            )}
                                            {profileResult.bio_rewrite.version_2_with_offer && (
                                                <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                                                    <p className="text-[10px] text-blue-400 font-semibold mb-1">Вариант 2 (с оффером)</p>
                                                    <p className="text-xs text-foreground/80">{profileResult.bio_rewrite.version_2_with_offer}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Content Plan */}
                                {profileResult.content_plan_5_reels && profileResult.content_plan_5_reels.length > 0 && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Play className="h-4 w-4 text-violet-400" /> Контент-план (5 Reels)
                                        </h3>
                                        <div className="space-y-2">
                                            {profileResult.content_plan_5_reels.map((r: any, i: number) => (
                                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3 space-y-1.5">
                                                    <p className="text-xs font-semibold text-foreground">🎬 {r.hook}</p>
                                                    <p className="text-[11px] text-muted-foreground">Тема: {r.topic}</p>
                                                    {r.structure_3_steps && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {r.structure_3_steps.map((s: string, j: number) => (
                                                                <span key={j} className="text-[9px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">{j + 1}. {s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {r.cta && <p className="text-[11px] text-primary">CTA: {r.cta}</p>}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3-Day Plan */}
                                {profileResult.next_3_days_plan && profileResult.next_3_days_plan.length > 0 && (
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> План на 3 дня
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {profileResult.next_3_days_plan.map((d: any) => (
                                                <div key={d.day} className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                                                    <p className="text-[10px] text-emerald-400 font-bold mb-1">День {d.day}</p>
                                                    <ul className="space-y-0.5">
                                                        {(d.tasks || []).map((t: string, i: number) => (
                                                            <li key={i} className="text-[11px] text-foreground/70">• {t}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Copy All Button */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(profileResult, null, 2));
                                            toast({ title: "📋 Анализ скопирован" });
                                        }}
                                        variant="outline"
                                        className="h-10 border-border gap-1.5"
                                    >
                                        <Copy className="h-3.5 w-3.5" /> Копировать анализ
                                    </Button>
                                    <Button
                                        onClick={() => setProfileResult(null)}
                                        variant="ghost"
                                        className="h-10 text-muted-foreground gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" /> Новый анализ
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                {/* ═══ TAB 3: РАЗБОР КОНТЕНТА ═══ */}
                <TabsContent value="post" className="space-y-5">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Play className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                value={postUrl}
                                onChange={(e) => setPostUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAnalyzePost()}
                                placeholder="Ссылка на Reels, TikTok или пост Instagram..."
                                className="pl-10 h-11 bg-secondary/30 border-border text-sm"
                            />
                        </div>
                        <Button onClick={handleAnalyzePost} disabled={postLoading || !postUrl.trim()} className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5">
                            {postLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Анализировать
                        </Button>
                    </div>


                    <AnimatePresence mode="wait">
                        {postLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-6 space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                                    <Skeleton className="aspect-[9/16] rounded-lg" />
                                    <div className="space-y-3">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!postLoading && selectedAnalysis && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-left">
                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
                                        <div className="bg-secondary/20 p-6 flex flex-col items-center justify-center border-r border-border">
                                            <div className="aspect-[9/16] w-full max-w-[180px] rounded-lg bg-secondary/40 flex items-center justify-center">
                                                <Play className="h-10 w-10 text-foreground/10" />
                                            </div>
                                            <div className="mt-4 text-center">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 mx-auto w-fit">
                                                    <Zap className="h-3.5 w-3.5 text-primary" />
                                                    <span className={`text-lg font-bold font-mono tabular-nums ${scoreColor(selectedAnalysis.performance_score)}`}>{selectedAnalysis.performance_score}/100</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">Оценка виральности</p>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            <h3 className="text-base font-bold text-foreground">AI-Разбор контента</h3>
                                            {selectedAnalysis.hook && (
                                                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                                                    <p className="text-[10px] text-primary font-semibold mb-1">🪝 ХУК</p>
                                                    <p className="text-sm text-foreground/80">{selectedAnalysis.hook}</p>
                                                </div>
                                            )}
                                            {selectedAnalysis.ai_analysis && (
                                                <div className="rounded-lg bg-secondary/20 border border-border p-3">
                                                    <p className="text-[10px] text-muted-foreground mb-1">Анализ</p>
                                                    <p className="text-sm text-foreground/80">{selectedAnalysis.ai_analysis}</p>
                                                </div>
                                            )}
                                            {selectedAnalysis.strengths && selectedAnalysis.strengths.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-good))]" /> Сильные стороны
                                                    </p>
                                                    <div className="space-y-1">
                                                        {selectedAnalysis.strengths.map((s, i) => (
                                                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                                                <span className="text-[hsl(var(--status-good))] mt-0.5">✓</span><span>{s}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedAnalysis.weaknesses && selectedAnalysis.weaknesses.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                        <XCircle className="h-4 w-4 text-destructive" /> Слабые места
                                                    </p>
                                                    <div className="space-y-1">
                                                        {selectedAnalysis.weaknesses.map((w, i) => (
                                                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.2 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                                                <span className="text-destructive mt-0.5">✗</span><span>{w}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Adapt */}
                                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-[hsl(var(--status-ai))]" /> Адаптировать под нас
                                        </h3>
                                        <Select value={adaptFormat} onValueChange={setAdaptFormat}>
                                            <SelectTrigger className="w-48 h-9 bg-secondary/30 border-border text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="video">🎬 Видео (Reels)</SelectItem>
                                                <SelectItem value="slideshow">📸 Слайд-шоу</SelectItem>
                                                <SelectItem value="carousel">🖼 Фото Карусель</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {!adaptedScript ? (
                                        <Button onClick={() => handleAdapt(selectedAnalysis)} disabled={adaptLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                                            {adaptLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> AI генерирует…</> : <><Sparkles className="h-4 w-4" /> Адаптировать</>}
                                        </Button>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                            <div className="rounded-lg bg-secondary/20 border border-border p-4 max-h-[360px] overflow-y-auto">
                                                <pre className="text-sm text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{adaptedScript}</pre>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => toast({ title: "✅ Отправлено в Контент-Завод" })} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                                                    <Send className="h-4 w-4" /> В Контент-Завод
                                                </Button>
                                                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(adaptedScript); toast({ title: "📋 Скопировано" }); }} className="h-11 border-border gap-1.5">
                                                    <Copy className="h-3.5 w-3.5" /> Копировать
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {!postLoading && !selectedAnalysis && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="h-14 w-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-4">
                                    <BarChart3 className="h-6 w-6 text-muted-foreground/30" />
                                </div>
                                <p className="text-sm font-medium">Вставьте ссылку на пост или видео</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Instagram / TikTok / YouTube → транскрипция → AI-разбор → сценарий</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                {/* ═══ TAB 3: AI-РАЗБОРЫ ═══ */}
                <TabsContent value="analyses" className="space-y-5">

                    {displayAnalyses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="h-14 w-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-4">
                                <Cpu className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium">Нет AI-разборов</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Добавьте конкурента и нажмите «Спарсить»</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                            {displayAnalyses.map((analysis, idx) => (
                                <motion.div key={analysis.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="rounded-xl border border-border bg-card overflow-hidden group">
                                    <div className="aspect-[4/5] bg-secondary/30 relative flex items-center justify-center">
                                        <Play className="h-10 w-10 text-foreground/10" />
                                        <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-card/80 backdrop-blur-sm text-muted-foreground border border-border/50">
                                            {analysis.post_type || "reels"}
                                        </span>
                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-card/80 backdrop-blur-sm border border-border/50">
                                            <Zap className="h-3 w-3 text-primary" />
                                            <span className={`text-[10px] font-bold font-mono ${scoreColor(analysis.performance_score)}`}>{analysis.performance_score}</span>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                                            {analysis.hook && <p className="text-[11px] text-foreground/80 font-medium line-clamp-2">🪝 {analysis.hook}</p>}
                                        </div>
                                    </div>

                                    <div className="p-3.5 space-y-2.5">
                                        <p className="text-xs text-foreground/70 line-clamp-2">{analysis.post_caption || analysis.transcription}</p>
                                        {analysis.strengths && analysis.strengths.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.strengths.slice(0, 2).map((s, i) => (
                                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">✓ {s.length > 30 ? s.slice(0, 30) + "…" : s}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-1.5 pt-1">
                                            <Button onClick={() => setScriptDialog({ open: true, script: analysis.generated_script })} size="sm" className="flex-1 h-8 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                                                <Sparkles className="h-3 w-3" /> Сценарий
                                            </Button>
                                            <Button onClick={() => { setSelectedAnalysis(analysis); setAdaptedScript(null); setActiveTab("post"); }} size="sm" variant="outline" className="h-8 px-2.5 text-[11px] border-border">
                                                Подробнее
                                            </Button>
                                            <Button onClick={() => handleDeleteAnalysis(analysis.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ─── Posts Dialog ─── */}
            <Dialog open={postsDialog.open} onOpenChange={(open) => !open && setPostsDialog({ open: false, competitor: null })}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-primary" />
                            @{postsDialog.competitor?.username} — Посты и анализ
                        </DialogTitle>
                    </DialogHeader>
                    {loadingPosts ? (
                        <div className="space-y-3 py-4 text-left">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                    ) : postsForDialog.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-muted-foreground">
                            <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
                            <p className="text-sm">Нет данных. Нажмите «Спарсить» в списке конкурентов.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 text-left">
                            {postsForDialog.map((post) => (
                                <div key={post.id} className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{post.post_type || "reels"}</span>
                                            <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${scoreColor(post.performance_score)} border-current/20 bg-current/5`}>
                                                {post.performance_score}/100
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground/50">{dateFmt(new Date(post.created_at), "dd.MM.yyyy")}</span>
                                    </div>
                                    {post.hook && (
                                        <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                                            <p className="text-[10px] text-primary font-semibold mb-1">🪝 Хук</p>
                                            <p className="text-xs text-foreground/80">{post.hook}</p>
                                        </div>
                                    )}
                                    {post.ai_analysis && (
                                        <div className="rounded-lg bg-secondary/30 border border-border p-2.5">
                                            <p className="text-[10px] text-muted-foreground mb-1">AI Анализ</p>
                                            <p className="text-xs text-foreground/70 line-clamp-4">{post.ai_analysis}</p>
                                        </div>
                                    )}
                                    {post.generated_script && (
                                        <Button onClick={() => setScriptDialog({ open: true, script: post.generated_script })} size="sm" className="w-full h-8 text-[11px] bg-primary hover:bg-primary/90 gap-1.5" style={{ display: 'flex' }}>
                                            <Sparkles className="h-3.5 w-3.5" /> Готовый сценарий
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Script Dialog */}
            <Dialog open={scriptDialog.open} onOpenChange={(open) => !open && setScriptDialog({ open: false, script: null })}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-[hsl(var(--status-ai))]" />
                            AI-Сценарий
                        </DialogTitle>
                    </DialogHeader>
                    {scriptDialog.script ? (
                        <div className="space-y-4 text-left">
                            <div className="rounded-lg bg-secondary/20 border border-border p-4 max-h-[50vh] overflow-y-auto">
                                <pre className="text-sm text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{scriptDialog.script}</pre>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => { toast({ title: "✅ Отправлено в Контент-Завод" }); setScriptDialog({ open: false, script: null }); }} className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                                    <Send className="h-4 w-4" /> В Контент-Завод
                                </Button>
                                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(scriptDialog.script || ""); toast({ title: "📋 Скопировано" }); }} className="h-10 border-border gap-1.5">
                                    <Copy className="h-3.5 w-3.5" /> Копировать
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center">
                            <p className="text-sm text-muted-foreground">Сценарий отсутствует</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
