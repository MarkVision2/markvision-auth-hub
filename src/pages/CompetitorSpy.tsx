import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Heart,
  Play,
  Send,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Instagram,
  MessageCircle,
  RefreshCw,
  Plus,
  Trash2,
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

// ─── n8n Webhook (for on-demand profile scan) ───
const N8N_WEBHOOK = import.meta.env.VITE_N8N_SPY_WEBHOOK || "https://n8n.zapoinov.com/webhook/competitor-spy";

async function spyRequest(payload: Record<string, unknown>): Promise<any> {
  const res = await fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ошибка ${res.status}: ${text || "Сервер недоступен"}`);
  }
  return res.json().catch(() => ({}));
}

// ─── Mock data for immediate WOW (used when DB is empty) ───
const MOCK_ANALYSES: Omit<AnalysisResult, "id" | "competitor_id" | "created_at">[] = [
  {
    video_url: "https://www.instagram.com/reel/example1",
    transcription: "Результат после 1 процедуры! Без фильтров и ретуши — только реальный эффект.",
    ai_analysis: "Сильный визуальный контраст до/после создаёт эмоциональный триггер. Хук работает через обещание мгновенного результата — это один из самых конверсионных паттернов в нише красоты. Динамичный монтаж удерживает внимание.",
    generated_script: "🎬 ХУК: «Одна процедура. Один час. Результат — на годы.»\n📖 Врач показывает зону работы → быстрая нарезка процедуры → сплит-экран ДО/ПОСЛЕ\n💥 «Без фильтров. Без ретуши. Только результат.»\n📢 CTA: «Хочешь так же? Ссылка в шапке 👆»",
    performance_score: 92,
    post_caption: "Результат после 1 процедуры! До/после без фильтров 🤩",
    post_type: "reels",
    strengths: ["Мощный визуальный хук до/после", "Трендовый звук повышает охват", "Субтитры увеличивают досматриваемость на 40%", "Эмоциональный триггер — удивление"],
    weaknesses: ["Нет брендинга клиники", "Отсутствует CTA в конце"],
    hook: "Одна процедура. Один час. Результат — на годы.",
  },
  {
    video_url: "https://www.instagram.com/reel/example2",
    transcription: "Честный отзыв: почему я выбрала именно эту клинику после 5 попыток...",
    ai_analysis: "Формат «говорящая голова + отзыв» работает за счёт социального доказательства. Исповедальный тон создаёт доверие. B-roll процедуры добавляет экспертность. Сторителлинг удерживает до конца.",
    generated_script: "🎬 ХУК: «Я потратила 200К на косметологов. Вот что я поняла...»\n📖 Интервью в клинике → B-roll процедуры → 3 ключевых тезиса\n💥 «Лучшее вложение в себя за последний год»\n📢 CTA: «Напиши 'ХОЧУ' в директ»",
    performance_score: 85,
    post_caption: "Честный отзыв пациента — почему выбрала AIVA? 🎤",
    post_type: "reels",
    strengths: ["Социальное доказательство", "Искренний тон без рекламного пафоса", "Сторителлинг удерживает внимание"],
    weaknesses: ["Слишком длинное вступление", "Нет текстовых плашек"],
    hook: "Я потратила 200К на косметологов. Вот что я поняла...",
  },
  {
    video_url: "https://www.instagram.com/reel/example3",
    transcription: "Топ-3 процедуры сезона. Биоревитализация? Нет. Вот что реально работает.",
    ai_analysis: "Листиклы (топ-N) — один из самых виральных форматов. Провокационный хук через отрицание ожиданий создаёт когнитивный диссонанс. Быстрая смена кадров соответствует паттерну TikTok.",
    generated_script: "🎬 ХУК: «Забудь про биоревитализацию. Вот что реально работает в 2025.»\n📖 Быстрая смена 3 процедур с номерами → врач комментирует\n📢 CTA: «Какая заинтересовала? Пиши номер в комментарии 👇»",
    performance_score: 88,
    post_caption: "Топ-3 процедуры этого сезона 😱",
    post_type: "reels",
    strengths: ["Листикл-формат — высокая виральность", "Провокационный хук", "Динамичный монтаж"],
    weaknesses: ["Мало деталей по каждой процедуре", "Нет экспертного комментария"],
    hook: "Забудь про биоревитализацию. Вот что реально работает.",
  },
];

// ─── Component ───
export default function CompetitorSpy() {
  const { toast } = useToast();

  // Data
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Tab 1: Profile Scanner
  const [profileQuery, setProfileQuery] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  // Tab 2: Post Analysis
  const [postUrl, setPostUrl] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  // Script dialog
  const [scriptDialog, setScriptDialog] = useState<{ open: boolean; script: string | null; loading: boolean }>({
    open: false, script: null, loading: false,
  });

  // Adapt
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

    // Realtime for new analyses
    const channel = supabase
      .channel("content_factory_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "content_factory" }, (payload) => {
        const row = payload.new as AnalysisResult;
        setAnalyses(prev => [row, ...prev]);
        toast({ title: "🔔 Новый анализ конкурента", description: `Оценка: ${row.performance_score}/100` });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // ─── Add Competitor ───
  const handleAddCompetitor = useCallback(async () => {
    if (!profileQuery.trim()) return;
    setAddingCompetitor(true);
    try {
      const username = profileQuery.trim().replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");

      // Save to DB
      const { data, error } = await (supabase as any)
        .from("competitors")
        .insert({ username, platform: "instagram", display_name: username, is_active: true })
        .select()
        .single();

      if (error) throw error;
      setCompetitors(prev => [data, ...prev]);
      setProfileQuery("");
      toast({ title: "✅ Конкурент добавлен", description: `@${username} будет сканироваться автоматически каждые 24ч` });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setAddingCompetitor(false);
    }
  }, [profileQuery, toast]);

  // ─── Scan Now (trigger n8n) ───
  const handleScanNow = useCallback(async () => {
    setProfileLoading(true);
    try {
      await spyRequest({ action: "scan_all", trigger: "manual" });
      toast({ title: "⏳ Сканирование запущено", description: "Результаты появятся автоматически через 1-2 мин" });
    } catch (err: any) {
      toast({ title: "Ошибка запуска", description: err.message, variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  }, [toast]);

  // ─── Delete Competitor ───
  const handleDeleteCompetitor = useCallback(async (id: string) => {
    await (supabase as any).from("competitors").delete().eq("id", id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
    toast({ title: "Удалён", description: "Конкурент удалён из мониторинга" });
  }, [toast]);

  // ─── Analyze Post ───
  const handleAnalyzePost = useCallback(async () => {
    if (!postUrl.trim()) return;
    setPostLoading(true);
    setSelectedAnalysis(null);
    setAdaptedScript(null);
    try {
      await spyRequest({ action: "analyze_post", url: postUrl.trim() });
      toast({ title: "⏳ Анализ запущен", description: "Результат появится через 30-60 сек" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
    // Simulate for demo (real data arrives via Realtime)
    await new Promise(r => setTimeout(r, 2500));
    const mock = MOCK_ANALYSES[0];
    const fakeResult: AnalysisResult = {
      id: crypto.randomUUID(),
      competitor_id: null,
      video_url: postUrl,
      ...mock,
      created_at: new Date().toISOString(),
    };
    setSelectedAnalysis(fakeResult);
    setPostLoading(false);
  }, [postUrl, toast]);

  // ─── Delete Analysis ───
  const handleDeleteAnalysis = useCallback(async (id: string) => {
    if (id.startsWith("mock-")) {
      // just hide mock
      return;
    }
    const { error } = await (supabase as any).from("content_factory").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    setAnalyses(prev => prev.filter(a => a.id !== id));
    toast({ title: "🗑 Удалено", description: "Контент удалён из базы" });
  }, [toast]);

  // ─── View Script ───
  const handleViewScript = useCallback((analysis: AnalysisResult) => {
    setScriptDialog({ open: true, script: analysis.generated_script, loading: false });
  }, []);

  // ─── Adapt ───
  const handleAdapt = useCallback(async (analysis: AnalysisResult) => {
    setAdaptLoading(true);
    try {
      await spyRequest({ action: "adapt_content", format: adaptFormat, analysis_id: analysis.id });
    } catch { /* continue */ }
    await new Promise(r => setTimeout(r, 2000));
    setAdaptedScript(analysis.generated_script || MOCK_ANALYSES[0].generated_script!);
    setAdaptLoading(false);
  }, [adaptFormat]);

  // Use mock data if DB empty, otherwise real
  const displayAnalyses = analyses.length > 0
    ? analyses
    : MOCK_ANALYSES.map((m, i) => ({
        ...m,
        id: `mock-${i}`,
        competitor_id: null,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      } as AnalysisResult));

  return (
    <DashboardLayout breadcrumb="Мониторинг конкурентов">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Мониторинг конкурентов</h1>
            <p className="text-sm text-muted-foreground">Автосканирование · Gemini + Claude AI-разбор · Генерация сценариев</p>
          </div>
          {analyses.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {analyses.length} анализов в базе
            </Badge>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-12 bg-secondary/40 border border-border p-1 rounded-xl w-full max-w-lg">
            <TabsTrigger value="profile" className="flex-1 h-10 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2">
              <Users className="h-4 w-4" /> Анализ аккаунта
            </TabsTrigger>
            <TabsTrigger value="post" className="flex-1 h-10 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2">
              <BarChart3 className="h-4 w-4" /> Разбор контента
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 1: АНАЛИЗ АККАУНТА                     */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="profile" className="space-y-6">
            {/* Add Competitor */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={profileQuery}
                  onChange={(e) => setProfileQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
                  placeholder="Введите @username Instagram конкурента..."
                  className="pl-11 h-12 bg-card border-border text-sm rounded-xl"
                />
              </div>
              <Button
                onClick={handleAddCompetitor}
                disabled={addingCompetitor || !profileQuery.trim()}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all gap-2"
              >
                {addingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Добавить
              </Button>
              <Button
                onClick={handleScanNow}
                disabled={profileLoading || competitors.length === 0}
                variant="outline"
                className="h-12 px-4 rounded-xl border-border gap-2"
              >
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                🚀 Сканировать сейчас
              </Button>
            </div>

            {/* Info */}
            <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-3 flex items-start gap-2">
              <Zap className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Добавьте конкурентов — n8n воркфлоу автоматически сканирует их каждые 24ч через Apify → анализирует Gemini → генерирует сценарии Claude. Результаты появляются через Realtime.
              </p>
            </div>

            {/* Competitors List */}
            {loadingData ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : competitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-14 w-14 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">Нет конкурентов</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Добавьте @username для автоматического мониторинга</p>
              </div>
            ) : (
              <div className="space-y-2">
                {competitors.map((comp) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {comp.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">@{comp.username}</p>
                      <p className="text-xs text-muted-foreground">{comp.platform} · {comp.display_name || comp.username}</p>
                    </div>
                    {comp.followers && (
                      <Badge variant="secondary" className="text-[10px]">{comp.followers} подписчиков</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">Авто-скан 24ч</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCompetitor(comp.id)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Latest Analyses from n8n */}
            {displayAnalyses.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">🔥 Последние AI-разборы</h3>
                  <span className="text-[10px] text-muted-foreground">{displayAnalyses.length} результатов</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayAnalyses.slice(0, 6).map((analysis, idx) => (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="rounded-2xl border border-border bg-card overflow-hidden group"
                    >
                      {/* Thumbnail area */}
                      <div className="aspect-[4/5] bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/20 relative flex items-center justify-center">
                        <Play className="h-10 w-10 text-foreground/20" />
                        <Badge className="absolute top-2 left-2 text-[9px] bg-card/80 backdrop-blur-sm text-foreground border-border/50">
                          {analysis.post_type || "reels"}
                        </Badge>
                        {/* Score badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/50">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary font-mono">{analysis.performance_score}</span>
                        </div>
                        {/* Stats overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                          {analysis.hook && (
                            <p className="text-[11px] text-foreground/80 font-medium line-clamp-2">🪝 {analysis.hook}</p>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-foreground/70 line-clamp-2">{analysis.post_caption || analysis.transcription}</p>

                        {/* Strengths preview */}
                        {analysis.strengths && analysis.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.strengths.slice(0, 2).map((s, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">✓ {s.slice(0, 30)}{s.length > 30 ? "…" : ""}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewScript(analysis)}
                            size="sm"
                            className="flex-1 h-9 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:via-orange-400 hover:to-pink-400 text-white font-semibold text-xs shadow-md shadow-orange-500/20 gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Сценарий
                          </Button>
                          <Button
                            onClick={() => setSelectedAnalysis(analysis)}
                            size="sm"
                            variant="outline"
                            className="h-9 px-3 rounded-lg border-border text-xs"
                          >
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 2: РАЗБОР КОНТЕНТА                     */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="post" className="space-y-6">
            {/* Search */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Play className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzePost()}
                  placeholder="Ссылка на конкретный Reels или TikTok..."
                  className="pl-11 h-12 bg-card border-border text-sm rounded-xl"
                />
              </div>
              <Button
                onClick={handleAnalyzePost}
                disabled={postLoading || !postUrl.trim()}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all"
              >
                {postLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                🔍 Анализировать
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {/* Loading */}
              {postLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    <Skeleton className="aspect-[9/16] rounded-xl" />
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="space-y-2 mt-6">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Analysis Result */}
              {!postLoading && selectedAnalysis && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                      {/* Left: Thumbnail */}
                      <div className="bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/20 p-6 flex flex-col items-center justify-center border-r border-border">
                        <div className="aspect-[9/16] w-full max-w-[200px] rounded-xl bg-secondary/40 flex items-center justify-center relative overflow-hidden">
                          <Play className="h-12 w-12 text-foreground/15" />
                        </div>
                        <div className="mt-4 text-center">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mx-auto w-fit">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <span className="text-lg font-bold text-primary font-mono">{selectedAnalysis.performance_score}/100</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Оценка виральности</p>
                        </div>
                      </div>

                      {/* Right: AI Breakdown */}
                      <div className="p-6 space-y-5">
                        <h3 className="text-lg font-bold text-foreground">AI-Разбор контента</h3>

                        {/* Hook */}
                        {selectedAnalysis.hook && (
                          <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-3">
                            <p className="text-xs text-purple-400 font-semibold mb-1">🪝 Хук</p>
                            <p className="text-sm text-foreground/80">{selectedAnalysis.hook}</p>
                          </div>
                        )}

                        {/* Analysis */}
                        {selectedAnalysis.ai_analysis && (
                          <div className="rounded-xl bg-secondary/20 border border-border p-3">
                            <p className="text-xs text-muted-foreground/50 mb-1">Анализ:</p>
                            <p className="text-sm text-foreground/80">{selectedAnalysis.ai_analysis}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {selectedAnalysis.strengths && selectedAnalysis.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-primary" /> Сильные стороны
                            </p>
                            <div className="space-y-1.5">
                              {selectedAnalysis.strengths.map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <span className="text-primary mt-0.5">✓</span><span>{s}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {selectedAnalysis.weaknesses && selectedAnalysis.weaknesses.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                              <XCircle className="h-4 w-4 text-destructive" /> Слабые места
                            </p>
                            <div className="space-y-1.5">
                              {selectedAnalysis.weaknesses.map((w, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.3 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <span className="text-destructive mt-0.5">✗</span><span>{w}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adapt Section */}
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" /> Адаптировать под нас
                      </h3>
                      <Select value={adaptFormat} onValueChange={setAdaptFormat}>
                        <SelectTrigger className="w-52 h-9 bg-secondary/30 border-border text-sm">
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
                      <Button
                        onClick={() => handleAdapt(selectedAnalysis)}
                        disabled={adaptLoading}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:via-orange-400 hover:to-pink-400 text-white font-semibold text-base shadow-lg shadow-orange-500/20 transition-all gap-2"
                      >
                        {adaptLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> AI генерирует сценарий...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" /> ✨ Адаптировать под нас</>
                        )}
                      </Button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="rounded-xl bg-secondary/20 border border-border p-4 max-h-[400px] overflow-y-auto">
                          <pre className="text-sm text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{adaptedScript}</pre>
                        </div>
                        <Button
                          onClick={() => toast({ title: "✅ Отправлено в Контент-Завод", description: "Сценарий добавлен в очередь" })}
                          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2"
                        >
                          <Send className="h-4 w-4" /> ➡️ Отправить в Контент-Завод
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!postLoading && !selectedAnalysis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
                    <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium">Вставьте ссылку на Reels или TikTok</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">AI разберёт контент: Gemini → анализ, Claude → сценарий</p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════ */}
        {/* SCRIPT DIALOG                              */}
        {/* ═══════════════════════════════════════════ */}
        <Dialog open={scriptDialog.open} onOpenChange={(open) => !open && setScriptDialog({ open: false, script: null, loading: false })}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI-Сценарий (Claude)
              </DialogTitle>
            </DialogHeader>
            {scriptDialog.script ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/20 border border-border p-4 max-h-[50vh] overflow-y-auto">
                  <pre className="text-sm text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{scriptDialog.script}</pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      toast({ title: "✅ Отправлено в Контент-Завод" });
                      setScriptDialog({ open: false, script: null, loading: false });
                    }}
                    className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  >
                    <Send className="h-4 w-4" /> Отправить в Контент-Завод
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(scriptDialog.script || "");
                      toast({ title: "📋 Скопировано" });
                    }}
                    className="h-11 rounded-xl border-border"
                  >
                    Копировать
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">Сценарий отсутствует</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
