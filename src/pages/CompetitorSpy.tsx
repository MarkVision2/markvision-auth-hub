import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowRight,
  Instagram,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───
interface ProfileResult {
  username: string;
  full_name: string;
  followers: string;
  following: string;
  posts_count: string;
  engagement_rate: string;
  avatar_url: string;
  bio: string;
  top_posts: TopPost[];
}

interface TopPost {
  id: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  caption: string;
  type: "reels" | "photo" | "carousel";
  posted_at: string;
}

interface PostAnalysis {
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  caption: string;
  account: string;
  strengths: string[];
  weaknesses: string[];
  hook_analysis: string;
  virality_score: number;
  adapted_script: string | null;
}

// ─── Mock Data ───
const MOCK_PROFILE: ProfileResult = {
  username: "aivaclinic",
  full_name: "AIVA Clinic — Косметология",
  followers: "12.5K",
  following: "342",
  posts_count: "891",
  engagement_rate: "4.2%",
  avatar_url: "",
  bio: "Клиника эстетической медицины 💎 Москва 📍 Запись: +7 999 123-45-67",
  top_posts: [
    {
      id: "1",
      thumbnail: "",
      views: "485K",
      likes: "12.3K",
      comments: "892",
      caption: "Результат после 1 процедуры! До/после без фильтров 🤩",
      type: "reels",
      posted_at: "2 дня назад",
    },
    {
      id: "2",
      thumbnail: "",
      views: "312K",
      likes: "8.7K",
      comments: "654",
      caption: "Честный отзыв пациента — почему выбрала AIVA? 🎤",
      type: "reels",
      posted_at: "5 дней назад",
    },
    {
      id: "3",
      thumbnail: "",
      views: "198K",
      likes: "5.4K",
      comments: "423",
      caption: "Топ-3 процедуры этого сезона. Спойлер: биоревитализация не в списке 😱",
      type: "reels",
      posted_at: "1 неделю назад",
    },
  ],
};

const MOCK_SCRIPTS: Record<string, string> = {
  "1": `🎬 СЦЕНАРИЙ: "Результат за 1 процедуру"

⏱ Хронометраж: 45 сек | Формат: Reels 9:16

🪝 ХУК (0-3 сек):
"Одна процедура. Один час. Результат — на годы."
[Динамичный зум на лицо пациента]

📖 ОСНОВА (3-30 сек):
— Врач показывает зону работы (крупный план)
— Быстрая нарезка: подготовка → процедура → финал
— Субтитры с ключевыми фразами
— Фоновая музыка: trending audio

💥 КУЛЬМИНАЦИЯ (30-40 сек):
Сплит-экран: ДО | ПОСЛЕ
"Без фильтров. Без ретуши. Только результат."

📢 CTA (40-45 сек):
"Хочешь так же? Ссылка в шапке профиля 👆"
[Стрелка анимация вверх]

🎵 Рекомендуемый звук: Trending — "Metamorphosis"
#️⃣ Хештеги: #косметология #доипосле #результат`,

  "2": `🎬 СЦЕНАРИЙ: "Честный отзыв пациента"

⏱ Хронометраж: 60 сек | Формат: Reels 9:16

🪝 ХУК (0-3 сек):
"Я потратила 200К на косметологов. Вот что я поняла..."
[Говорящая голова, эмоциональный старт]

📖 ОСНОВА (3-45 сек):
— Интервью в уютной обстановке клиники
— B-roll: процедура, улыбка, результат
— 3 ключевых тезиса с текстовыми плашками
— Искренний тон, без рекламного пафоса

💥 КУЛЬМИНАЦИЯ (45-55 сек):
"Лучшее вложение в себя за последний год"
[Показ результата в зеркале]

📢 CTA (55-60 сек):
"Напиши 'ХОЧУ' в директ — расскажем подробнее"`,

  "3": `🎬 СЦЕНАРИЙ: "Топ-3 процедуры сезона"

⏱ Хронометраж: 30 сек | Формат: Reels 9:16

🪝 ХУК (0-3 сек):
"Забудь про биоревитализацию. Вот что реально работает в 2025."
[Текст крупно + перечеркнутое слово "биоревитализация"]

📖 ОСНОВА (3-25 сек):
— Быстрая смена 3 процедур с номерами
— Каждая: 2 сек показ + текстовая плашка с названием
— Врач кратко комментирует каждую

📢 CTA (25-30 сек):
"Какая заинтересовала? Пиши номер в комментарии 👇"`,
};

const MOCK_POST_ANALYSIS: PostAnalysis = {
  thumbnail: "",
  views: "1.2M",
  likes: "45.2K",
  comments: "3.8K",
  caption: "POV: ты нашёл идеального косметолога 🪄✨ #косметология #доипосле #reels",
  account: "@beautydoc_msk",
  strengths: [
    "Мощный хук — интрига с первых секунд",
    "Динамичный монтаж с трендовым звуком",
    "До/После — самый вирусный формат в нише",
    "Субтитры повышают досматриваемость на 40%",
    "Правильный CTA в конце (вопрос в комментарии)",
  ],
  weaknesses: [
    "Нет брендинга — лого или название клиники не видны",
    "Слабое освещение в начале ролика",
    "Отсутствует призыв перейти в профиль",
    "Слишком длинный средний блок (потеря внимания)",
  ],
  hook_analysis: "Использован паттерн 'POV' — один из топ-5 форматов по вовлечению в 2025. Первые 2 секунды содержат визуальный контраст и эмоциональный триггер.",
  virality_score: 87,
  adapted_script: null,
};

const ADAPTED_SCRIPT = `🎬 АДАПТИРОВАННЫЙ СЦЕНАРИЙ

⏱ Хронометраж: 40 сек | Формат: Reels 9:16

🪝 ХУК (0-3 сек):
"POV: ты наконец нашёл клинику, где не обманывают"
[Быстрый зум на камеру + текст крупно]

📖 ОСНОВА (3-30 сек):
— Врач входит в кадр (уверенная подача)
— Нарезка: консультация → процедура → wow-результат  
— Каждый кадр: 1.5-2 сек (динамика!)
— Текстовые плашки с ключевыми фразами
— ВАЖНО: лого клиники на каждом 3м кадре

💡 УЛУЧШЕНИЯ vs ОРИГИНАЛ:
✅ Добавлен брендинг (лого + название)
✅ Улучшено освещение (ring light)
✅ Сокращён средний блок (было 20 сек → стало 12 сек)
✅ Двойной CTA (директ + ссылка в шапке)

📢 CTA (30-40 сек):
"Запишись на бесплатную консультацию 👆 Ссылка в шапке"
+ "Или напиши 'ХОЧУ' в директ — ответим за 5 минут"`;

// ─── Webhook Wrapper ───
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

// ─── Component ───
export default function CompetitorSpy() {
  const { toast } = useToast();

  // Tab 1 state
  const [profileQuery, setProfileQuery] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [scriptDialog, setScriptDialog] = useState<{ open: boolean; postId: string; loading: boolean; script: string | null }>({
    open: false, postId: "", loading: false, script: null,
  });

  // Tab 2 state
  const [postUrl, setPostUrl] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postAnalysis, setPostAnalysis] = useState<PostAnalysis | null>(null);
  const [adaptLoading, setAdaptLoading] = useState(false);
  const [adaptedScript, setAdaptedScript] = useState<string | null>(null);
  const [adaptFormat, setAdaptFormat] = useState("video");

  // ─── Tab 1 Handlers ───
  const handleScanProfile = useCallback(async () => {
    if (!profileQuery.trim()) return;
    setProfileLoading(true);
    setProfileResult(null);
    try {
      await spyRequest({ action: "scan_profile", url: profileQuery.trim() });
    } catch (err: any) {
      toast({ title: "Ошибка сканирования", description: err.message, variant: "destructive" });
    }
    // Show mock data after a delay (simulating response)
    await new Promise(r => setTimeout(r, 2200));
    setProfileResult(MOCK_PROFILE);
    setProfileLoading(false);
  }, [profileQuery, toast]);

  const handleGenerateScript = useCallback(async (postId: string) => {
    setScriptDialog({ open: true, postId, loading: true, script: null });
    try {
      await spyRequest({ action: "generate_script", post_id: postId });
    } catch {
      // continue with mock
    }
    await new Promise(r => setTimeout(r, 1800));
    setScriptDialog({ open: true, postId, loading: false, script: MOCK_SCRIPTS[postId] || MOCK_SCRIPTS["1"] });
  }, []);

  const handleSendToFactory = useCallback(() => {
    toast({ title: "✅ Отправлено в Контент-Завод", description: "Сценарий добавлен в очередь генерации" });
    setScriptDialog({ open: false, postId: "", loading: false, script: null });
  }, [toast]);

  // ─── Tab 2 Handlers ───
  const handleAnalyzePost = useCallback(async () => {
    if (!postUrl.trim()) return;
    setPostLoading(true);
    setPostAnalysis(null);
    setAdaptedScript(null);
    try {
      await spyRequest({ action: "analyze_post", url: postUrl.trim() });
    } catch (err: any) {
      toast({ title: "Ошибка анализа", description: err.message, variant: "destructive" });
    }
    await new Promise(r => setTimeout(r, 2500));
    setPostAnalysis(MOCK_POST_ANALYSIS);
    setPostLoading(false);
  }, [postUrl, toast]);

  const handleAdapt = useCallback(async () => {
    setAdaptLoading(true);
    try {
      await spyRequest({ action: "adapt_content", format: adaptFormat });
    } catch {
      // continue with mock
    }
    await new Promise(r => setTimeout(r, 2000));
    setAdaptedScript(ADAPTED_SCRIPT);
    setAdaptLoading(false);
  }, [adaptFormat]);

  return (
    <DashboardLayout breadcrumb="Мониторинг конкурентов">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Мониторинг конкурентов</h1>
            <p className="text-sm text-muted-foreground">Сканирование аккаунтов · AI-разбор контента · Генерация сценариев</p>
          </div>
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
            {/* Search */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={profileQuery}
                  onChange={(e) => setProfileQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScanProfile()}
                  placeholder="Введите ник Instagram или ссылку на профиль TikTok..."
                  className="pl-11 h-12 bg-card border-border text-sm rounded-xl"
                />
              </div>
              <Button
                onClick={handleScanProfile}
                disabled={profileLoading || !profileQuery.trim()}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all"
              >
                {profileLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                🚀 Сканировать
              </Button>
            </div>

            {/* Loading Skeleton */}
            <AnimatePresence mode="wait">
              {profileLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                        <Skeleton className="aspect-[4/5] rounded-xl" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Profile Result */}
              {!profileLoading && profileResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
                  {/* Profile Card */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {profileResult.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-foreground">{profileResult.full_name}</h2>
                          <Badge variant="secondary" className="text-[10px]">Instagram</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">@{profileResult.username}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{profileResult.bio}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Подписчики", value: profileResult.followers, icon: Users },
                        { label: "Публикации", value: profileResult.posts_count, icon: BarChart3 },
                        { label: "Подписки", value: profileResult.following, icon: Heart },
                        { label: "ER", value: profileResult.engagement_rate, icon: TrendingUp },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                          <stat.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground tabular-nums font-mono">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Posts Grid */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">🔥 Топ-контент по вовлечению</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {profileResult.top_posts.map((post, idx) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          className="rounded-2xl border border-border bg-card overflow-hidden group"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-[4/5] bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/20 relative flex items-center justify-center">
                            <Play className="h-10 w-10 text-foreground/20" />
                            <Badge className="absolute top-2 left-2 text-[9px] bg-card/80 backdrop-blur-sm text-foreground border-border/50">{post.type}</Badge>
                            <span className="absolute top-2 right-2 text-[9px] text-muted-foreground/60 bg-card/60 backdrop-blur-sm px-1.5 py-0.5 rounded">{post.posted_at}</span>

                            {/* Stats overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                              <div className="flex items-center gap-3 text-[11px] text-foreground/80">
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>
                                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments}</span>
                              </div>
                            </div>
                          </div>

                          {/* Caption + Action */}
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{post.caption}</p>
                            <Button
                              onClick={() => handleGenerateScript(post.id)}
                              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:via-orange-400 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              Собрать сценарий
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!profileLoading && !profileResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium">Введите ник конкурента для анализа</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Instagram, TikTok или любая соцсеть</p>
                </motion.div>
              )}
            </AnimatePresence>
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
                  <div className="grid grid-cols-[280px_1fr] gap-6">
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
              {!postLoading && postAnalysis && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                  {/* Split Card */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                      {/* Left: Thumbnail */}
                      <div className="bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/20 p-6 flex flex-col items-center justify-center border-r border-border">
                        <div className="aspect-[9/16] w-full max-w-[200px] rounded-xl bg-secondary/40 flex items-center justify-center relative overflow-hidden">
                          <Play className="h-12 w-12 text-foreground/15" />
                          <div className="absolute bottom-3 inset-x-3 flex items-center gap-2 text-[10px] text-foreground/60">
                            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {postAnalysis.views}</span>
                            <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {postAnalysis.likes}</span>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">{postAnalysis.views}</p>
                          <p className="text-xs text-muted-foreground">просмотров</p>
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-2">{postAnalysis.account}</p>
                      </div>

                      {/* Right: AI Breakdown */}
                      <div className="p-6 space-y-6">
                        {/* Virality Score */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-foreground">AI-Разбор контента</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Виральность:</span>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-bold text-primary font-mono">{postAnalysis.virality_score}/100</span>
                            </div>
                          </div>
                        </div>

                        {/* Caption */}
                        <div className="rounded-xl bg-secondary/20 border border-border p-3">
                          <p className="text-xs text-muted-foreground/50 mb-1">Подпись:</p>
                          <p className="text-sm text-foreground/80">{postAnalysis.caption}</p>
                        </div>

                        {/* Hook Analysis */}
                        <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-3">
                          <p className="text-xs text-purple-400 font-semibold mb-1">🪝 Анализ хука</p>
                          <p className="text-sm text-foreground/80">{postAnalysis.hook_analysis}</p>
                        </div>

                        {/* Strengths */}
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Сильные стороны
                          </p>
                          <div className="space-y-1.5">
                            {postAnalysis.strengths.map((s, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>{s}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Weaknesses */}
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <XCircle className="h-4 w-4 text-destructive" /> Слабые места
                          </p>
                          <div className="space-y-1.5">
                            {postAnalysis.weaknesses.map((w, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.3 }} className="flex items-start gap-2 text-sm text-foreground/80">
                                <span className="text-destructive mt-0.5">✗</span>
                                <span>{w}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {[
                            { label: "Лайки", value: postAnalysis.likes, icon: Heart },
                            { label: "Комментарии", value: postAnalysis.comments, icon: MessageCircle },
                            { label: "Просмотры", value: postAnalysis.views, icon: Eye },
                          ].map((stat) => (
                            <div key={stat.label} className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                              <stat.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                              <p className="text-sm font-bold text-foreground font-mono tabular-nums">{stat.value}</p>
                              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                            </div>
                          ))}
                        </div>
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
                          <SelectValue placeholder="Формат" />
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
                        onClick={handleAdapt}
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
                          onClick={() => {
                            toast({ title: "✅ Отправлено в Контент-Завод", description: "Сценарий и формат добавлены в очередь" });
                          }}
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
              {!postLoading && !postAnalysis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
                    <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium">Вставьте ссылку на Reels или TikTok</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">AI разберёт контент и покажет что можно улучшить</p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════ */}
        {/* SCRIPT DIALOG                              */}
        {/* ═══════════════════════════════════════════ */}
        <Dialog open={scriptDialog.open} onOpenChange={(open) => !open && setScriptDialog({ open: false, postId: "", loading: false, script: null })}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI-Сценарий
              </DialogTitle>
            </DialogHeader>
            {scriptDialog.loading ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="h-8 w-8 text-amber-500" />
                </motion.div>
                <p className="text-sm text-muted-foreground">AI анализирует контент и создаёт сценарий...</p>
              </div>
            ) : scriptDialog.script ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/20 border border-border p-4 max-h-[50vh] overflow-y-auto">
                  <pre className="text-sm text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{scriptDialog.script}</pre>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSendToFactory} className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
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
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
