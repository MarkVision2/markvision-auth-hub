import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
  Eye,
  Play,
  Send,
  Users,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Instagram,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
  created_at: string;
}

// ─── n8n Webhook ───
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function spyRequest(payload: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/spy-webhook-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ошибка ${res.status}: ${text || "Сервер недоступен"}`);
  }
  return res.json().catch(() => ({}));
}

// ─── Mock data ───
const MOCK_ANALYSES: Omit<AnalysisResult, "id" | "competitor_id" | "created_at">[] = [
  {
    video_url: "https://www.instagram.com/reel/example1",
    transcription: "Результат после 1 процедуры! Без фильтров и ретуши — только реальный эффект.",
    ai_analysis: "Сильный визуальный контраст до/после создаёт эмоциональный триггер. Хук работает через обещание мгновенного результата.",
    generated_script: "🎬 ХУК: «Одна процедура. Один час. Результат — на годы.»\n📖 Врач показывает зону работы → быстрая нарезка процедуры → сплит-экран ДО/ПОСЛЕ\n💥 «Без фильтров. Без ретуши. Только результат.»\n📢 CTA: «Хочешь так же? Ссылка в шапке 👆»",
    performance_score: 92,
    post_caption: "Результат после 1 процедуры! До/после без фильтров 🤩",
    post_type: "reels",
    strengths: ["Мощный визуальный хук до/после", "Трендовый звук повышает охват", "Субтитры увеличивают досматриваемость на 40%"],
    weaknesses: ["Нет брендинга клиники", "Отсутствует CTA в конце"],
    hook: "Одна процедура. Один час. Результат — на годы.",
  },
  {
    video_url: "https://www.instagram.com/reel/example2",
    transcription: "Честный отзыв: почему я выбрала именно эту клинику после 5 попыток...",
    ai_analysis: "Формат «говорящая голова + отзыв» работает за счёт социального доказательства.",
    generated_script: "🎬 ХУК: «Я потратила 200К на косметологов. Вот что я поняла...»\n📖 Интервью в клинике → B-roll процедуры → 3 ключевых тезиса\n💥 «Лучшее вложение в себя за последний год»\n📢 CTA: «Напиши 'ХОЧУ' в директ»",
    performance_score: 85,
    post_caption: "Честный отзыв пациента — почему выбрала AIVA? 🎤",
    post_type: "reels",
    strengths: ["Социальное доказательство", "Искренний тон", "Сторителлинг удерживает внимание"],
    weaknesses: ["Слишком длинное вступление", "Нет текстовых плашек"],
    hook: "Я потратила 200К на косметологов. Вот что я поняла...",
  },
  {
    video_url: "https://www.instagram.com/reel/example3",
    transcription: "Топ-3 процедуры сезона. Биоревитализация? Нет. Вот что реально работает.",
    ai_analysis: "Листиклы (топ-N) — один из самых виральных форматов. Провокационный хук через отрицание ожиданий.",
    generated_script: "🎬 ХУК: «Забудь про биоревитализацию. Вот что реально работает в 2025.»\n📖 Быстрая смена 3 процедур с номерами → врач комментирует\n📢 CTA: «Какая заинтересовала? Пиши номер в комментарии 👇»",
    performance_score: 88,
    post_caption: "Топ-3 процедуры этого сезона 😱",
    post_type: "reels",
    strengths: ["Листикл-формат — высокая виральность", "Провокационный хук", "Динамичный монтаж"],
    weaknesses: ["Мало деталей по каждой процедуре", "Нет экспертного комментария"],
    hook: "Забудь про биоревитализацию. Вот что реально работает.",
  },
];

// ─── Score color helper ───
function scoreColor(score: number) {
  if (score >= 80) return "text-[hsl(var(--status-good))]";
  if (score >= 50) return "text-[hsl(var(--status-warning))]";
  return "text-[hsl(var(--status-critical))]";
}

// ─── Component ───
export default function CompetitorSpy() {
  const { toast } = useToast();

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [profileQuery, setProfileQuery] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  const [postUrl, setPostUrl] = useState("");
  const [postLoading, setPostLoading] = useState(false);
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
          (supabase as any).from("competitors").select("*").eq("is_active", true).order("created_at", { ascending: false }),
          (supabase as any).from("content_factory").select("*").order("created_at", { ascending: false }).limit(20),
        ]);
        if (compRes.data) setCompetitors(compRes.data);
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
        const row = payload.new as AnalysisResult;
        setAnalyses((prev) => [row, ...prev]);
        toast({ title: "🔔 Новый анализ конкурента", description: `Оценка: ${row.performance_score}/100` });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // ─── Handlers ───
  const handleAddCompetitor = useCallback(async () => {
    if (!profileQuery.trim()) return;
    setAddingCompetitor(true);
    try {
      const username = profileQuery.trim().replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
      const { data, error } = await (supabase as any)
        .from("competitors")
        .insert({ username, platform: "instagram", display_name: username, is_active: true })
        .select()
        .single();
      if (error) throw error;
      setCompetitors((prev) => [data, ...prev]);
      setProfileQuery("");
      toast({ title: "✅ Конкурент добавлен", description: `@${username} — автоскан каждые 24ч` });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setAddingCompetitor(false);
    }
  }, [profileQuery, toast]);

  const handleScanNow = useCallback(async () => {
    setProfileLoading(true);
    try {
      await spyRequest({ action: "scan_all", trigger: "manual" });
      toast({ title: "⏳ Сканирование запущено", description: "Результаты через 1-2 мин" });
    } catch (err: any) {
      toast({ title: "Ошибка запуска", description: err.message, variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  }, [toast]);

  const handleDeleteCompetitor = useCallback(async (id: string) => {
    await (supabase as any).from("competitors").delete().eq("id", id);
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Удалён" });
  }, [toast]);

  const handleAnalyzePost = useCallback(async () => {
    if (!postUrl.trim()) return;
    setPostLoading(true);
    setSelectedAnalysis(null);
    setAdaptedScript(null);
    try {
      const result = await spyRequest({ action: "analyze_post", url: postUrl.trim() });
      toast({ title: "⏳ Анализ запущен", description: result.message || "Пост в очереди" });
      if (result.data?.id) {
        setSelectedAnalysis({ ...result.data, performance_score: result.data.performance_score || 0, strengths: result.data.strengths || [], weaknesses: result.data.weaknesses || [] });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setPostLoading(false);
    }
  }, [postUrl, toast]);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    if (id.startsWith("mock-")) return;
    const { error } = await (supabase as any).from("content_factory").delete().eq("id", id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "🗑 Удалено" });
  }, [toast]);

  const handleAdapt = useCallback(async (analysis: AnalysisResult) => {
    setAdaptLoading(true);
    try { await spyRequest({ action: "adapt_content", format: adaptFormat, analysis_id: analysis.id }); } catch { /* continue */ }
    await new Promise((r) => setTimeout(r, 2000));
    setAdaptedScript(analysis.generated_script || MOCK_ANALYSES[0].generated_script!);
    setAdaptLoading(false);
  }, [adaptFormat]);

  const displayAnalyses = analyses.length > 0
    ? analyses
    : MOCK_ANALYSES.map((m, i) => ({ ...m, id: `mock-${i}`, competitor_id: null, created_at: new Date(Date.now() - i * 86400000).toISOString() } as AnalysisResult));

  return (
    <DashboardLayout breadcrumb="Мониторинг конкурентов">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Мониторинг конкурентов</h1>
          <p className="text-sm text-muted-foreground mt-1">Автосканирование · AI-разбор · Генерация сценариев</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Конкуренты", value: competitors.length, icon: Users },
            { label: "AI-разборов", value: displayAnalyses.length, icon: BarChart3 },
            { label: "Ср. оценка", value: displayAnalyses.length ? Math.round(displayAnalyses.reduce((s, a) => s + a.performance_score, 0) / displayAnalyses.length) : 0, icon: Zap },
            { label: "Сценариев", value: displayAnalyses.filter((a) => a.generated_script).length, icon: Sparkles },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold text-foreground font-mono tabular-nums">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-11 bg-secondary/50 border border-border p-1 rounded-xl w-full max-w-md">
            <TabsTrigger value="profile" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
              <Users className="h-3.5 w-3.5" /> Аккаунты
            </TabsTrigger>
            <TabsTrigger value="post" className="flex-1 h-9 text-xs font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Разбор контента
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: АККАУНТЫ ═══ */}
          <TabsContent value="profile" className="space-y-5">
            {/* Add Competitor */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  value={profileQuery}
                  onChange={(e) => setProfileQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
                  placeholder="@username конкурента..."
                  className="pl-10 h-11 bg-secondary/30 border-border text-sm"
                />
              </div>
              <Button onClick={handleAddCompetitor} disabled={addingCompetitor || !profileQuery.trim()} className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5">
                {addingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Добавить
              </Button>
              <Button onClick={handleScanNow} disabled={profileLoading || competitors.length === 0} variant="outline" className="h-11 px-4 border-border gap-1.5">
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Сканировать
              </Button>
            </div>

            {/* Info tip */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                n8n автоматически сканирует конкурентов каждые 24ч → Gemini анализирует → Claude генерирует сценарии.
              </p>
            </div>

            {/* Competitors List */}
            {loadingData ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : competitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-14 w-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">Нет конкурентов</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Добавьте @username для мониторинга</p>
              </div>
            ) : (
              <div className="space-y-2">
                {competitors.map((comp) => (
                  <motion.div key={comp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                      {comp.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">@{comp.username}</p>
                      <p className="text-xs text-muted-foreground">{comp.platform} · {comp.display_name || comp.username}</p>
                    </div>
                    {comp.followers && (
                      <span className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground font-medium">{comp.followers} подписчиков</span>
                    )}
                    <span className="text-[10px] px-2 py-1 rounded-md border border-primary/20 text-primary font-medium">Авто 24ч</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCompetitor(comp.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Latest Analyses */}
            {displayAnalyses.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Последние AI-разборы</h3>
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{displayAnalyses.length} результатов</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {displayAnalyses.slice(0, 6).map((analysis, idx) => (
                    <motion.div key={analysis.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="rounded-xl border border-border bg-card overflow-hidden group">
                      {/* Thumbnail */}
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

                      {/* Content */}
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
                          <Button onClick={() => setSelectedAnalysis(analysis)} size="sm" variant="outline" className="h-8 px-2.5 text-[11px] border-border">
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
              </div>
            )}
          </TabsContent>

          {/* ═══ TAB 2: РАЗБОР КОНТЕНТА ═══ */}
          <TabsContent value="post" className="space-y-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Play className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzePost()}
                  placeholder="Ссылка на Reels или TikTok..."
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
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
                      {/* Left */}
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

                      {/* Right */}
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
                        <Button onClick={() => toast({ title: "✅ Отправлено в Контент-Завод" })} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                          <Send className="h-4 w-4" /> Отправить в Контент-Завод
                        </Button>
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
                  <p className="text-sm font-medium">Вставьте ссылку на Reels или TikTok</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Gemini → анализ, Claude → сценарий</p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

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
              <div className="space-y-4">
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
    </DashboardLayout>
  );
}
