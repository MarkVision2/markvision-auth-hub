import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Image, Download, Loader2, CheckCircle2, RotateCcw,
  Megaphone, CalendarClock, RefreshCw, MessageSquareText, ChevronLeft, Eye,
  Trash2, Sparkles, Upload, Rocket, Link, X, ImagePlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import AutopostSheet from "@/components/sheets/AutopostSheet";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
  format: string | null;
  visual_style: string | null;
  main_text: string | null;
  source_type: string | null;
  aspect_ratio: string | null;
  created_at: string | null;
}

const FORMAT_CARDS = [
  { value: "single", label: "1 Картинка (Баннер)", sub: "Одно изображение", icon: "🖼" },
  { value: "carousel-7", label: "Карусель 7 слайдов", sub: "Продающая серия", icon: "📑" },
  { value: "carousel-10", label: "Карусель 10 слайдов", sub: "Максимум контента", icon: "📚" },
] as const;

const ASPECT_CARDS = [
  { value: "1:1", label: "1:1", sub: "Квадрат" },
  { value: "4:5", label: "4:5", sub: "Лента" },
  { value: "9:16", label: "9:16", sub: "Stories / Reels" },
] as const;

const pipelineSteps = [
  { key: "analyze", label: "Обработка запроса", icon: "🔍" },
  { key: "generate", label: "Создание изображения", icon: "🎨" },
  { key: "text", label: "Добавление текста", icon: "✍️" },
  { key: "prepare", label: "Подготовка к загрузке", icon: "📦" },
  { key: "done", label: "Отправлено в группу", icon: "✅" },
];

const MOCK_AI_DESIGN = `Минималистичный дизайн на тёмном фоне (#0a0a0a). Градиентные неоновые акценты (emerald → cyan). Шрифт: Montserrat Bold для заголовков, Inter для основного текста. Геометрические линии и абстрактные формы на фоне. Фото элайнеров в центральной композиции с мягким свечением. Стиль: премиум-клиника, технологичность, доверие. Палитра: тёмный + изумрудный + белый текст.`;

const MOCK_AI_TEXT = `Слайд 1: 🦷 ИДЕАЛЬНАЯ УЛЫБКА БЕЗ БРЕКЕТОВ
Слайд 2: Элайнеры AIVA — невидимое выравнивание зубов за 6-12 месяцев
Слайд 3: ✅ Незаметны на зубах ✅ Снимаются во время еды ✅ Без боли и дискомфорта
Слайд 4: Технология 3D-моделирования — вы увидите результат ДО начала лечения
Слайд 5: 🔬 Каждая капа изготавливается индивидуально по вашему слепку
Слайд 6: АКЦИЯ -15% на полный курс лечения до конца месяца!
Слайд 7: 📞 Запишитесь на бесплатную консультацию — ссылка в шапке профиля`;

const formatLabel = (val: string | null) => {
  const map: Record<string, string> = {
    single: "Баннер", "carousel-7": "Карусель 7", "carousel-10": "Карусель 10",
    "fb-target": "ADS Баннер", "insta-carousel": "Карусель", stories: "Stories",
    "reels-cover": "Обложка Reels", "ai-photo": "AI Фото",
  };
  return map[val || ""] || val || "—";
};

export default function ContentFactory() {
  const location = useLocation();
  const prefill = (location.state as any)?.prefill || "";

  // Form state
  const [format, setFormat] = useState("single");
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [designPrompt, setDesignPrompt] = useState("");
  const [exactText, setExactText] = useState(prefill);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // AI Magic modal
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicInput, setMagicInput] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  // Task state
  const [submitting, setSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<ContentTask | null>(null);

  // History
  const [history, setHistory] = useState<ContentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [viewingTask, setViewingTask] = useState<ContentTask | null>(null);

  // Edit feedback
  const [editFeedback, setEditFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  // Campaign builder & autopost
  const [campaignSheetOpen, setCampaignSheetOpen] = useState(false);
  const [autopostOpen, setAutopostOpen] = useState(false);
  const [autopostUrls, setAutopostUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      const { data } = await (supabase as any)
        .from("content_tasks")
        .select("id, status, progress_text, result_urls, content_type, format, visual_style, main_text, source_type, aspect_ratio, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) {
        setHistory(data);
        const { data: allIds } = await (supabase as any)
          .from("content_tasks").select("id").order("created_at", { ascending: false });
        if (allIds && allIds.length > 6) {
          const idsToDelete = allIds.slice(6).map((r: any) => r.id);
          await (supabase as any).from("content_tasks").delete().in("id", idsToDelete);
        }
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [taskId]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`content_task_${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "content_tasks", filter: `id=eq.${taskId}` }, (payload) => {
        const row = payload.new as any;
        const updated: ContentTask = {
          id: row.id, status: row.status, progress_text: row.progress_text,
          result_urls: row.result_urls, content_type: row.content_type,
          format: row.format, visual_style: row.visual_style, main_text: row.main_text,
          source_type: row.source_type, aspect_ratio: row.aspect_ratio, created_at: row.created_at,
        };
        setTask(updated);
        setHistory((prev) => prev.map((h) => (h.id === row.id ? updated : h)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `uploads/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("content_assets").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const slidesCount = format === "carousel-7" ? 7 : format === "carousel-10" ? 10 : 1;

  // ── AI MAGIC ──
  const handleMagicGenerate = async () => {
    if (!magicInput.trim()) { toast({ title: "Введите тему поста", variant: "destructive" }); return; }
    setMagicLoading(true);
    // Simulate AI generation (2s) — in production this would call OpenAI
    await new Promise(r => setTimeout(r, 2000));
    setDesignPrompt(MOCK_AI_DESIGN);
    setExactText(MOCK_AI_TEXT);
    setMagicLoading(false);
    setMagicOpen(false);
    setMagicInput("");
    toast({ title: "✨ ТЗ сгенерировано!", description: "Проверьте и отредактируйте поля перед запуском" });
  };

  // ── SUBMIT ──
  const handleGenerate = async (overrides?: { feedback?: string }) => {
    if (!designPrompt.trim() && !exactText.trim() && !referenceUrl.trim() && !referenceFile) {
      toast({ title: "Заполните ТЗ, текст или загрузите референс/ссылку", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setViewingTask(null);
    try {
      let customLogoUrl: string | null = null;
      let referenceImageUrl: string | null = null;

      setUploading(true);
      if (logoFile) {
        customLogoUrl = await uploadFile(logoFile);
        if (!customLogoUrl) { setSubmitting(false); setUploading(false); return; }
      }
      if (referenceFile) {
        referenceImageUrl = await uploadFile(referenceFile);
        if (!referenceImageUrl) { setSubmitting(false); setUploading(false); return; }
      }
      setUploading(false);

      const sourceUrl = referenceUrl.trim() || null;

      const dbPayload: Record<string, any> = {
        content_type: "photo",
        source_type: sourceUrl ? "link" : referenceImageUrl ? "reference" : "description",
        source_url: sourceUrl,
        main_text: exactText || null,
        visual_style: designPrompt || null,
        format,
        aspect_ratio: aspectRatio,
        custom_logo_url: customLogoUrl,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks").insert(dbPayload)
        .select("id, status, progress_text, result_urls, content_type, format, visual_style, main_text, source_type, aspect_ratio, created_at")
        .single();
      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const n8nPayload = {
        task_id: data.id,
        type: format === "single" ? "photo_banner" : "photo_carousel",
        slides_count: slidesCount,
        aspect_ratio: aspectRatio,
        design_prompt: designPrompt,
        exact_text_slides: exactText,
        custom_logo_url: customLogoUrl,
        reference_image_url: referenceImageUrl,
        source_url: sourceUrl,
        ...(overrides?.feedback ? { edit_feedback: overrides.feedback } : {}),
      };

      console.log("📦 Webhook Payload:", JSON.stringify(n8nPayload, null, 2));

      const webhookUrl = import.meta.env.VITE_N8N_CONTENT_WEBHOOK_URL || "https://n8n.zapoinov.com/webhook/content-factory-v2";
      try {
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
        });
        if (resp.ok) toast({ title: "✅ Задание отправлено в производство" });
        else toast({ title: "⚠️ Ошибка сервера", description: `Статус: ${resp.status}`, variant: "destructive" });
      } catch {
        toast({ title: "⚠️ Не удалось отправить на n8n", description: "Проверьте подключение", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setShowFeedbackInput(false);
      setEditFeedback("");
    }
  };

  const handleReset = () => {
    setTaskId(null); setTask(null); setViewingTask(null);
    setDesignPrompt(""); setExactText(""); setLogoFile(null);
    setShowFeedbackInput(false); setEditFeedback("");
  };

  const handleDownloadAll = async (urls: string[]) => {
    for (const url of urls) {
      const a = document.createElement("a"); a.href = url; a.download = ""; a.target = "_blank"; a.click();
    }
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await (supabase as any).from("content_tasks").delete().eq("id", id);
    setHistory(prev => prev.filter(h => h.id !== id));
    if (viewingTask?.id === id) setViewingTask(null);
    toast({ title: "🗑 Контент удалён" });
  };

  const getActiveStep = (t: ContentTask): number => {
    const text = (t.progress_text || "").toLowerCase();
    if (t.status === "completed") return 4;
    if (text.includes("отправ") || text.includes("загруз") || text.includes("готов")) return 3;
    if (text.includes("текст") || text.includes("шрифт") || text.includes("overlay")) return 2;
    if (text.includes("генер") || text.includes("render") || text.includes("изображ")) return 1;
    if (t.status === "processing") return 1;
    return 0;
  };

  const displayTask = viewingTask || task;

  // ── RESULT VIEW ──
  const renderResultView = (t: ContentTask) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Генерация завершена!</h2>
            <p className="text-xs text-muted-foreground">
              {formatLabel(t.format)} • {t.aspect_ratio} • {t.created_at ? new Date(t.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>
        {viewingTask && (
          <Button variant="ghost" size="sm" onClick={() => setViewingTask(null)} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Назад
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {(t.result_urls || []).map((url, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex-shrink-0 snap-center">
            <img src={url} alt={`Слайд ${i + 1}`} className="rounded-xl border border-border max-h-[400px] object-contain" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button onClick={() => handleDownloadAll(t.result_urls || [])} variant="outline" className="gap-2 h-11 border-border">
          <Download className="h-4 w-4" /> Скачать
        </Button>
        <Button onClick={() => setCampaignSheetOpen(true)} className="gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Megaphone className="h-4 w-4" /> В рекламу
        </Button>
        <Button onClick={() => { setAutopostUrls(t.result_urls || []); setAutopostOpen(true); }} variant="outline" className="gap-2 h-11 border-border">
          <CalendarClock className="h-4 w-4" /> Автопостинг
        </Button>
        <Button onClick={() => handleGenerate()} variant="outline" className="gap-2 h-11 border-border">
          <RefreshCw className="h-4 w-4" /> Заново
        </Button>
      </div>

      <div className="space-y-3">
        {!showFeedbackInput ? (
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border h-11" onClick={() => setShowFeedbackInput(true)}>
            <MessageSquareText className="h-4 w-4" /> Указать правки и перегенерировать
          </Button>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
            <Textarea value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)}
              placeholder="Что нужно изменить? Например: сделать текст крупнее, поменять цвет фона..."
              className="min-h-[80px] bg-muted/30 border-border resize-none" />
            <div className="flex gap-2">
              <Button onClick={() => { if (!editFeedback.trim()) { toast({ title: "Укажите правки", variant: "destructive" }); return; } handleGenerate({ feedback: editFeedback }); }}
                disabled={submitting} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Перегенерировать
              </Button>
              <Button variant="ghost" onClick={() => { setShowFeedbackInput(false); setEditFeedback(""); }}>Отмена</Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  // ── PROGRESS VIEW ──
  const renderProgressView = (t: ContentTask) => {
    const step = getActiveStep(t);
    const pct = t.status === "completed" ? 100 : step >= 0 ? Math.min(95, ((step + 1) / pipelineSteps.length) * 100) : 0;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-8 space-y-8">
        <div className="space-y-2">
          <Progress value={pct} className="h-2 bg-muted/40 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000" />
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Производство</span>
            <span className="text-xs text-muted-foreground tabular-nums font-mono">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="space-y-1">
          {pipelineSteps.map((s, i) => {
            const isDone = i < step || t.status === "completed";
            const isActive = i === step && t.status !== "completed";
            return (
              <motion.div key={s.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${isActive ? "bg-primary/10 border border-primary/20" : isDone ? "bg-muted/30" : "opacity-40"}`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base">
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    </motion.div>
                  ) : <span className="text-sm">{s.icon}</span>}
                </div>
                <span className={`text-sm font-medium ${isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {isActive && <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="ml-auto text-[10px] font-medium text-primary tracking-wider uppercase">в процессе</motion.span>}
                {isDone && <span className="ml-auto text-[10px] font-medium text-primary/60">готово</span>}
              </motion.div>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={t.progress_text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-center text-xs text-muted-foreground">
            {t.progress_text || "AI генерирует контент..."}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    );
  };

  // ── HISTORY ──
  const renderHistory = () => {
    const completedTasks = history.filter((h) => h.status === "completed" && h.result_urls && h.result_urls.length > 0).slice(0, 6);
    if (completedTasks.length === 0) return null;
    return (
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">📋 Созданный контент</h2>
          <span className="text-xs text-muted-foreground">Последние 6</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {completedTasks.map((h) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setViewingTask(h)}>
              <div className="aspect-square overflow-hidden bg-muted/20">
                <img src={h.result_urls![0]} alt="Контент" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">{formatLabel(h.format)}</Badge>
                  {h.result_urls && h.result_urls.length > 1 && <span className="text-[10px] text-muted-foreground">{h.result_urls.length} шт</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{h.main_text || "Без описания"}</p>
                <p className="text-[10px] text-muted-foreground/60">
                  {h.created_at ? new Date(h.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Открыть</Button>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={(e) => handleDeleteTask(h.id, e)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // ── THE PRECISION FORM ──
  const renderForm = () => (
    <div className="space-y-6">
      {/* ✨ MAGIC AI BUTTON */}
      <motion.button
        onClick={() => setMagicOpen(true)}
        className="w-full relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 flex items-center gap-4 group hover:border-primary/60 transition-all duration-300"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 relative">
          <Sparkles className="h-6 w-6 text-primary" />
          <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse" />
        </div>
        <div className="text-left relative">
          <p className="text-sm font-semibold text-foreground">✨ Авто-генерация (Магия AI)</p>
          <p className="text-xs text-muted-foreground mt-0.5">AI заполнит ТЗ для дизайна и текст для слайдов автоматически</p>
        </div>
      </motion.button>

      {/* FORM PANEL */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Точное ТЗ для производства</h2>
              <p className="text-[11px] text-muted-foreground">Заполните поля — AI выполнит буквально</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. FORMAT SETUP */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
              <Label className="text-sm font-semibold text-foreground">Формат</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_CARDS.map(f => (
                <button key={f.value} onClick={() => setFormat(f.value)}
                  className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${
                    format === f.value
                      ? "border-primary bg-primary/[0.06] shadow-[0_0_20px_-8px] shadow-primary/30"
                      : "border-border bg-muted/10 hover:bg-muted/20 hover:border-border"
                  }`}>
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.sub}</p>
                  {format === f.value && (
                    <motion.div layoutId="format-check" className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {ASPECT_CARDS.map(a => (
                <button key={a.value} onClick={() => setAspectRatio(a.value)}
                  className={`flex-1 rounded-xl border px-3 py-3 text-center transition-all duration-200 ${
                    aspectRatio === a.value
                      ? "border-primary bg-primary/[0.06]"
                      : "border-border bg-muted/10 hover:bg-muted/20"
                  }`}>
                  <p className="text-sm font-bold text-foreground tabular-nums font-mono">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{a.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. DESIGN PROMPT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</div>
              <Label className="text-sm font-semibold text-foreground">Визуальный стиль и ТЗ для дизайна (Промпт)</Label>
            </div>
            <div className="relative">
              <Textarea
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                placeholder="Например: Минимализм, темный фон, неоновые линии, шрифт Montserrat. Фото продукта в центре, градиент emerald→cyan. Стиль: премиум, технологичный..."
                className="min-h-[120px] bg-muted/10 border-border resize-none focus:border-primary/50 focus:shadow-[0_0_15px_-5px] focus:shadow-primary/20 transition-shadow"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70">Чем детальнее опишете стиль — тем точнее будет результат. AI НЕ будет додумывать.</p>
          </div>

          {/* 3. EXACT TEXT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</div>
              <Label className="text-sm font-semibold text-foreground">Точный текст для слайдов (Режим диктатуры)</Label>
            </div>
            <Textarea
              value={exactText}
              onChange={(e) => setExactText(e.target.value)}
              placeholder={`Слайд 1: Заголовок...\nСлайд 2: Текст...\nСлайд 3: ...\n\n(Нейросеть наложит этот текст слово в слово без изменений)`}
              className="min-h-[160px] bg-muted/10 border-border resize-none font-mono text-[13px] leading-relaxed focus:border-primary/50 focus:shadow-[0_0_15px_-5px] focus:shadow-primary/20 transition-shadow"
            />
            <p className="text-[10px] text-muted-foreground/70">
              Каждая строка «Слайд N:» = отдельный слайд. Текст будет наложен БЕЗ изменений.
            </p>
          </div>

          {/* LOGO UPLOAD */}
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-border text-muted-foreground hover:text-foreground h-10 px-4 gap-2">
              <Upload className="h-3.5 w-3.5" />
              {logoFile ? logoFile.name : "Загрузить логотип"}
            </Button>
            {logoFile && (
              <Button variant="ghost" size="sm" onClick={() => setLogoFile(null)} className="text-muted-foreground h-10">✕ Убрать</Button>
            )}
          </div>

          {/* SUBMIT */}
          <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
            <Button onClick={() => handleGenerate()} disabled={submitting}
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-xl shadow-[0_0_30px_-8px] shadow-primary/40 hover:shadow-primary/60 transition-shadow">
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? "Загрузка файлов..." : "Отправка..."}</>
              ) : (
                <><Rocket className="h-5 w-5" /> Запустить в производство</>
              )}
            </Button>
          </motion.div>

          {/* Payload preview */}
          <details className="text-[10px]">
            <summary className="text-muted-foreground/50 cursor-pointer hover:text-muted-foreground">Превью payload (для отладки)</summary>
            <pre className="mt-2 p-3 rounded-lg bg-muted/20 border border-border text-muted-foreground overflow-x-auto font-mono">
              {JSON.stringify({ type: format === "single" ? "photo_banner" : "photo_carousel", slides_count: slidesCount, aspect_ratio: aspectRatio, design_prompt: designPrompt.slice(0, 50) + "...", exact_text_slides: exactText.slice(0, 50) + "..." }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );

  // ── MAIN RENDER ──
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-4xl py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Image className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
            <p className="text-sm text-muted-foreground">AI-производство точного контента для рекламы и соцсетей</p>
          </div>
        </div>

        {/* Viewing completed task from history */}
        {viewingTask && viewingTask.status === "completed" && viewingTask.result_urls && viewingTask.result_urls.length > 0 && (
          <>{renderResultView(viewingTask)}{renderHistory()}</>
        )}

        {/* Active task completed */}
        {!viewingTask && task && task.status === "completed" && task.result_urls && task.result_urls.length > 0 && (
          <>{renderResultView(task)}{renderHistory()}</>
        )}

        {/* Active task in progress */}
        {!viewingTask && task && (task.status === "pending" || task.status === "processing") && (
          <>{renderProgressView(task)}{renderHistory()}</>
        )}

        {/* Active task error */}
        {!viewingTask && task && task.status === "error" && (
          <>
            <div className="rounded-2xl border border-destructive/30 bg-card p-6 space-y-4">
              <p className="text-sm text-destructive">{task.progress_text || "Произошла ошибка"}</p>
              <Button onClick={handleReset} variant="outline" className="gap-2 border-border"><RotateCcw className="h-4 w-4" /> Попробовать снова</Button>
            </div>
            {renderHistory()}
          </>
        )}

        {/* No active task — show form */}
        {!viewingTask && !task && (
          <>{renderForm()}{renderHistory()}</>
        )}
      </div>

      {/* AI MAGIC DIALOG */}
      <Dialog open={magicOpen} onOpenChange={setMagicOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" /> Магия AI
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Опишите тему поста — AI сгенерирует полное ТЗ для дизайна и тексты для слайдов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">О чём делаем пост?</Label>
              <Textarea
                value={magicInput}
                onChange={(e) => setMagicInput(e.target.value)}
                placeholder='Например: "Пост про элайнеры для клиники AIVA, акция 15%"'
                className="min-h-[80px] bg-muted/10 border-border resize-none"
              />
            </div>
            <Button onClick={handleMagicGenerate} disabled={magicLoading} className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {magicLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> AI генерирует ТЗ...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Сгенерировать ТЗ</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CampaignBuilderSheet open={campaignSheetOpen} onOpenChange={setCampaignSheetOpen} />
      <AutopostSheet open={autopostOpen} onOpenChange={setAutopostOpen} mediaUrls={autopostUrls} />
    </DashboardLayout>
  );
}
