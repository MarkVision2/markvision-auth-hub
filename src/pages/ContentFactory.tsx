import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Image, Link, FileText, Upload, Download, Loader2, CheckCircle2, RotateCcw,
  Megaphone, CalendarClock, RefreshCw, MessageSquareText, ChevronLeft, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";

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

const FORMAT_OPTIONS = [
  { value: "fb-target", label: "ADS Баннер", sub: "1 изображение" },
  { value: "insta-carousel", label: "Карусель", sub: "До 10 слайдов" },
  { value: "stories", label: "Stories", sub: "Вертикальный формат" },
  { value: "reels-cover", label: "Обложка Reels", sub: "Обложка для видео" },
  { value: "ai-photo", label: "AI Фото", sub: "Фотореалистичное" },
] as const;

const ASPECT_OPTIONS = [
  { value: "1:1", label: "1:1 Квадрат" },
  { value: "4:5", label: "4:5 Лента" },
  { value: "9:16", label: "9:16 Stories" },
  { value: "16:9", label: "16:9 Широкий" },
] as const;

const STYLE_OPTIONS = [
  { value: "modern", label: "Современный" },
  { value: "tech", label: "Технологичный" },
  { value: "stylish", label: "Стильный" },
  { value: "minimal", label: "Минимализм" },
  { value: "premium", label: "Премиум" },
] as const;

const pipelineSteps = [
  { key: "analyze", label: "Обработка запроса", icon: "🔍" },
  { key: "generate", label: "Создание изображения", icon: "🎨" },
  { key: "text", label: "Добавление текста", icon: "✍️" },
  { key: "prepare", label: "Подготовка к загрузке", icon: "📦" },
  { key: "done", label: "Отправлено в группу", icon: "✅" },
];

const formatLabel = (val: string | null) =>
  FORMAT_OPTIONS.find((f) => f.value === val)?.label || val || "—";

export default function ContentFactory() {
  const location = useLocation();
  const prefill = (location.state as any)?.prefill || "";

  const [sourceMode, setSourceMode] = useState<"link" | "description">("description");
  const [format, setFormat] = useState("fb-target");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [designStyle, setDesignStyle] = useState("modern");
  const [slideCount, setSlideCount] = useState(1);

  const [sourceUrl, setSourceUrl] = useState("");
  const [mainText, setMainText] = useState(prefill);
  const [visualInstructions, setVisualInstructions] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<ContentTask | null>(null);

  // History
  const [history, setHistory] = useState<ContentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [viewingTask, setViewingTask] = useState<ContentTask | null>(null);

  // Edit feedback for regeneration
  const [editFeedback, setEditFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  // Campaign builder sheet
  const [campaignSheetOpen, setCampaignSheetOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      const { data } = await (supabase as any)
        .from("content_tasks")
        .select("id, status, progress_text, result_urls, content_type, format, visual_style, main_text, source_type, aspect_ratio, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data);
      setLoadingHistory(false);
    };
    loadHistory();
  }, [taskId]); // Reload when new task is created

  useEffect(() => {
    if (format === "insta-carousel") setSlideCount(7);
    else setSlideCount(1);
    if (format === "stories" || format === "reels-cover") setAspectRatio("9:16");
  }, [format]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`content_task_${taskId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "content_tasks", filter: `id=eq.${taskId}` },
        (payload) => {
          const row = payload.new as any;
          const updated: ContentTask = {
            id: row.id,
            status: row.status,
            progress_text: row.progress_text,
            result_urls: row.result_urls,
            content_type: row.content_type,
            format: row.format,
            visual_style: row.visual_style,
            main_text: row.main_text,
            source_type: row.source_type,
            aspect_ratio: row.aspect_ratio,
            created_at: row.created_at,
          };
          setTask(updated);
          // Also update in history
          setHistory((prev) => prev.map((h) => (h.id === row.id ? updated : h)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `uploads/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("content_assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const handleGenerate = async (overrides?: { feedback?: string }) => {
    if (sourceMode === "link" && !sourceUrl.trim()) {
      toast({ title: "Вставьте ссылку", variant: "destructive" });
      return;
    }
    if (sourceMode === "description" && !mainText.trim() && !visualInstructions.trim()) {
      toast({ title: "Заполните текст или описание визуала", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setViewingTask(null);
    try {
      let customLogoUrl: string | null = null;
      if (logoFile) {
        setUploading(true);
        customLogoUrl = await uploadFile(logoFile);
        setUploading(false);
        if (!customLogoUrl) { setSubmitting(false); return; }
      }

      const dbPayload: Record<string, any> = {
        content_type: "photo",
        source_type: sourceMode,
        source_url: sourceMode === "link" ? sourceUrl : null,
        main_text: mainText || null,
        visual_style: designStyle,
        format: format,
        aspect_ratio: aspectRatio,
        design_template: designStyle,
        custom_logo_url: customLogoUrl,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(dbPayload)
        .select("id, status, progress_text, result_urls, content_type, format, visual_style, main_text, source_type, aspect_ratio, created_at")
        .single();

      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const n8nPayload: Record<string, any> = {
        task_id: data.id,
        content_type: format,
        source_type: sourceMode,
        source_url: sourceMode === "link" ? sourceUrl : null,
        format: format,
        aspect_ratio: aspectRatio,
        main_text: mainText || "",
        visual_instructions: visualInstructions || "",
        visual_style: designStyle,
        design_template_id: designStyle,
        slide_count: slideCount,
        custom_logo_url: customLogoUrl,
      };

      if (overrides?.feedback) {
        n8nPayload.edit_feedback = overrides.feedback;
      }

      const webhookUrl = import.meta.env.VITE_N8N_CONTENT_WEBHOOK_URL || "https://n8n.zapoinov.com/webhook/content-factory-v2";
      try {
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
        });
        if (resp.ok) {
          toast({ title: "✅ Задание отправлено", description: "Контент генерируется..." });
        } else {
          toast({ title: "⚠️ Сервер ответил ошибкой", description: `Статус: ${resp.status}`, variant: "destructive" });
        }
      } catch (webhookErr) {
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
    setTaskId(null);
    setTask(null);
    setViewingTask(null);
    setSourceUrl("");
    setVisualInstructions("");
    setMainText("");
    setLogoFile(null);
    setShowFeedbackInput(false);
    setEditFeedback("");
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleRegenerateWithFeedback = () => {
    if (!editFeedback.trim()) {
      toast({ title: "Укажите правки", variant: "destructive" });
      return;
    }
    handleGenerate({ feedback: editFeedback });
  };

  const handleDownloadAll = async (urls: string[]) => {
    for (const url of urls) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.target = "_blank";
      a.click();
    }
  };

  const handleSendToAds = () => {
    setCampaignSheetOpen(true);
  };

  const handleAutoposting = () => {
    toast({ title: "📅 Автопостинг", description: "Раздел автопостинга скоро будет доступен" });
  };

  const getActiveStep = (t: ContentTask): number => {
    const text = (t.progress_text || "").toLowerCase();
    if (t.status === "completed") return 4;
    if (text.includes("отправ") || text.includes("загруз") || text.includes("готов")) return 3;
    if (text.includes("текст") || text.includes("шрифт") || text.includes("overlay")) return 2;
    if (text.includes("генер") || text.includes("render") || text.includes("изображ") || text.includes("рендер")) return 1;
    if (t.status === "processing") return 1;
    if (t.status === "pending") return 0;
    return 0;
  };

  const displayTask = viewingTask || task;
  const activeStep = displayTask ? getActiveStep(displayTask) : -1;
  const progressPercent =
    !displayTask ? 0
    : displayTask.status === "completed" ? 100
    : activeStep >= 0 ? Math.min(95, ((activeStep + 1) / pipelineSteps.length) * 100)
    : 0;

  // ── RESULT VIEW (completed task with results) ──
  const renderResultView = (t: ContentTask) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Генерация завершена!</h2>
            <p className="text-xs text-muted-foreground">
              {formatLabel(t.format)} • {t.aspect_ratio || "1:1"} • {t.created_at ? new Date(t.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>
        {viewingTask && (
          <Button variant="ghost" size="sm" onClick={() => setViewingTask(null)} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Назад
          </Button>
        )}
      </div>

      {/* Images */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {(t.result_urls || []).map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 snap-center"
          >
            <img
              src={url}
              alt={`Слайд ${i + 1}`}
              className="rounded-lg border border-border max-h-[400px] object-contain"
            />
          </motion.div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          onClick={() => handleDownloadAll(t.result_urls || [])}
          variant="outline"
          className="gap-2 border-border h-11"
        >
          <Download className="h-4 w-4" />
          Скачать
        </Button>
        <Button
          onClick={handleSendToAds}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11"
        >
          <Megaphone className="h-4 w-4" />
          В рекламу
        </Button>
        <Button
          onClick={handleAutoposting}
          variant="outline"
          className="gap-2 border-border h-11"
        >
          <CalendarClock className="h-4 w-4" />
          Автопостинг
        </Button>
        <Button
          onClick={handleRegenerate}
          variant="outline"
          className="gap-2 border-border h-11"
        >
          <RefreshCw className="h-4 w-4" />
          Заново
        </Button>
      </div>

      {/* Edit & Regenerate */}
      <div className="space-y-3">
        {!showFeedbackInput ? (
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border h-11"
            onClick={() => setShowFeedbackInput(true)}
          >
            <MessageSquareText className="h-4 w-4" />
            Указать правки и перегенерировать
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <Textarea
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
              placeholder="Что нужно изменить? Например: сделать текст крупнее, поменять цвет фона на синий, убрать иконку..."
              className="min-h-[80px] bg-secondary/30 border-border resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleRegenerateWithFeedback}
                disabled={submitting}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Перегенерировать с правками
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowFeedbackInput(false); setEditFeedback(""); }}
              >
                Отмена
              </Button>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-8 space-y-8"
      >
        <div className="space-y-2">
          <Progress
            value={pct}
            className="h-2 bg-secondary/40 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000"
          />
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Прогресс</span>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
          </div>
        </div>

        <div className="space-y-1">
          {pipelineSteps.map((s, i) => {
            const isDone = i < step || t.status === "completed";
            const isActive = i === step && t.status !== "completed";
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive ? "bg-primary/10 border border-primary/20" : isDone ? "bg-secondary/30" : "opacity-40"
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base">
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    </motion.div>
                  ) : (
                    <span className="text-sm">{s.icon}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {isActive && (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="ml-auto text-[10px] font-medium text-primary tracking-wider uppercase">
                    в процессе
                  </motion.span>
                )}
                {isDone && <span className="ml-auto text-[10px] font-medium text-primary/60">готово</span>}
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p key={t.progress_text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-center text-xs text-muted-foreground">
            {t.progress_text || "AI генерирует контент-стратегию..."}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    );
  };

  // ── HISTORY SECTION ──
  const renderHistory = () => {
    const completedTasks = history.filter((h) => h.status === "completed" && h.result_urls && h.result_urls.length > 0);
    if (completedTasks.length === 0) return null;

    return (
      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-semibold text-foreground">📋 Созданный контент</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {completedTasks.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setViewingTask(h)}
            >
              <div className="aspect-square overflow-hidden bg-secondary/20">
                <img
                  src={h.result_urls![0]}
                  alt="Контент"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">
                    {formatLabel(h.format)}
                  </Badge>
                  {h.result_urls && h.result_urls.length > 1 && (
                    <span className="text-[10px] text-muted-foreground">{h.result_urls.length} шт</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {h.main_text || "Без описания"}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {h.created_at ? new Date(h.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Открыть
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ──
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-4xl py-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <Image className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
            <p className="text-sm text-muted-foreground">Генерация фото-контента с помощью AI</p>
          </div>
        </div>

        {/* If viewing a completed task from history */}
        {viewingTask && viewingTask.status === "completed" && viewingTask.result_urls && viewingTask.result_urls.length > 0 && (
          <>
            {renderResultView(viewingTask)}
            {renderHistory()}
          </>
        )}

        {/* Active task - completed with results */}
        {!viewingTask && task && task.status === "completed" && task.result_urls && task.result_urls.length > 0 && (
          <>
            {renderResultView(task)}
            {renderHistory()}
          </>
        )}

        {/* Active task - in progress */}
        {!viewingTask && task && (task.status === "pending" || task.status === "processing") && (
          <>
            {renderProgressView(task)}
            {renderHistory()}
          </>
        )}

        {/* Active task - error */}
        {!viewingTask && task && task.status === "error" && (
          <>
            <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4">
              <p className="text-sm text-destructive">{task.progress_text || "Произошла ошибка"}</p>
              <Button onClick={handleReset} variant="outline" className="gap-2 border-border">
                <RotateCcw className="h-4 w-4" />
                Попробовать снова
              </Button>
            </div>
            {renderHistory()}
          </>
        )}

        {/* No active task — show form + history */}
        {!viewingTask && !task && (
          <>
            <div className="rounded-xl border border-border bg-card p-6 space-y-8">
              {/* Source mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Источник</Label>
                <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as "link" | "description")}>
                  <TabsList className="h-9 bg-secondary/40">
                    <TabsTrigger value="link" className="text-xs data-[state=active]:bg-background">
                      <Link className="mr-1.5 h-3.5 w-3.5" />По ссылке
                    </TabsTrigger>
                    <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background">
                      <FileText className="mr-1.5 h-3.5 w-3.5" />По описанию
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {sourceMode === "link" ? (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="Ссылка на пример дизайна, пост или рекламу"
                      className="h-11 bg-secondary/30 border-border"
                    />
                    <p className="text-xs text-muted-foreground/70">AI проанализирует пример и создаст уникальный аналог.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Описание визуала</Label>
                    <Textarea
                      value={visualInstructions}
                      onChange={(e) => setVisualInstructions(e.target.value)}
                      placeholder="Стиль, цвета, композиция, что должно быть изображено…"
                      className="min-h-[80px] bg-secondary/30 border-border resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Format */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Формат</Label>
                <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`fmt-${opt.value}`}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                        format === opt.value
                          ? "border-primary/60 bg-primary/[0.06]"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`fmt-${opt.value}`} className="sr-only" />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.sub}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Slide count for carousel */}
              {format === "insta-carousel" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Количество слайдов</Label>
                  <Tabs value={String(slideCount)} onValueChange={(v) => setSlideCount(Number(v))}>
                    <TabsList className="h-9 bg-secondary/40">
                      <TabsTrigger value="5" className="text-xs data-[state=active]:bg-background">5</TabsTrigger>
                      <TabsTrigger value="7" className="text-xs data-[state=active]:bg-background">7</TabsTrigger>
                      <TabsTrigger value="10" className="text-xs data-[state=active]:bg-background">10</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Aspect ratio */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Соотношение сторон</Label>
                <Tabs value={aspectRatio} onValueChange={setAspectRatio}>
                  <TabsList className="h-9 bg-secondary/40">
                    {ASPECT_OPTIONS.map((o) => (
                      <TabsTrigger key={o.value} value={o.value} className="text-xs data-[state=active]:bg-background">{o.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Text for slides */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Текст для слайдов</Label>
                <Textarea
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  placeholder={format === "insta-carousel"
                    ? "Каждая новая строка — новый слайд"
                    : "Заголовок, описание, CTA — каждый с новой строки"
                  }
                  className="min-h-[120px] bg-secondary/30 border-border resize-none"
                />
              </div>

              {/* Design style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Стиль дизайна</Label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select value={designStyle} onValueChange={setDesignStyle}>
                      <SelectTrigger className="h-11 bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.woff,.woff2,.ttf,.otf"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-border text-muted-foreground hover:text-foreground h-11 px-4"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {logoFile ? logoFile.name : "Логотип"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  onClick={() => handleGenerate()}
                  disabled={submitting}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploading ? "Загрузка файлов..." : "Отправка..."}
                    </>
                  ) : (
                    "🚀 Запустить генерацию"
                  )}
                </Button>
              </div>
            </div>

            {renderHistory()}
          </>
        )}
      </div>

      {/* Campaign Builder Sheet */}
      <CampaignBuilderSheet open={campaignSheetOpen} onOpenChange={setCampaignSheetOpen} />
    </DashboardLayout>
  );
}
