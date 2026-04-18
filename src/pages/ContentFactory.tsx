import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Image as ImageIcon,
  Link,
  FileText,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Clock,
  Trash2,
  Layers,
  Zap,
  Layout,
  Smartphone,
  Plus,
  Play,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  X,
  Search,
  Rocket,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import { PhoneMockup } from "@/components/content/PhoneMockup";
import ScenarioCreator from "@/components/content/ScenarioCreator";
import ClonyWizard from "@/components/content/ClonyWizard";
import { AiEditBlock } from "@/components/content/ai-edit/AiEditBlock";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { cn } from "@/lib/utils";
import { CfButtonMd, CfH1, CfH2, CfH3, CfSection, cfStyles } from "@/components/content/contentFactoryDesignSystem";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
  main_text?: string | null;
  aspect_ratio?: string | null;
  format?: string | null;
  created_at?: string;
}

const MAX_HISTORY = 12;
const AB_STORAGE = "content_factory_ab_events_v1";
const AB_VARIANT_STORAGE = "content_factory_ab_variant_v1";
const AB_SESSION_STORAGE = "content_factory_ab_session_v1";

type AbEvent = {
  ts: string;
  sessionId: string;
  variant: "A" | "B";
  event: string;
  meta?: Record<string, string | number | boolean>;
};

const DELETE_REASON_OPTIONS = [
  "Не нравится результат",
  "Нужна другая версия",
  "Случайно создал",
  "Больше не актуально",
  "Другое",
] as const;

const TAB_CONTENT = {
  scenario: {
    kicker: "AI Story Lab",
    title: "Сценарии, которые можно снимать сразу",
    description: "Разбор по ссылке, работа от темы или голоса, быстрый выход в суфлёр, описание и полный сценарий.",
    highlights: ["Ссылка или идея", "Голосовой ввод", "Сценарий + описание"],
  },
  create: {
    kicker: "Creative Studio",
    title: "Производство креативов под площадку",
    description: "Пошаговый мастер для баннеров, сторис, Reels cover, YouTube и нейрофотосессий с понятной сводкой.",
    highlights: ["Тип креатива", "Источник материалов", "Формат и CTA"],
  },
  "ai-edit": {
    kicker: "AI Video Editor",
    title: "ИИ монтаж для Reels и Shorts",
    description: "Загрузите исходник — ИИ сделает динамичный монтаж, добавит субтитры, B-roll и зумы.",
    highlights: ["Viral Captions", "Auto B-roll", "Remotion Render"],
  },
  "my-content": {
    kicker: "Content Vault",
    title: "Готовый контент, который можно запустить дальше",
    description: "Смотрите готовые материалы, оценивайте, удаляйте с причиной и сразу отправляйте в рекламу.",
    highlights: ["Фильтры и поиск", "Оценка качества", "Запуск в рекламу"],
  },
} as const;

export default function ContentFactory() {
  const { active, isAgency } = useWorkspace();
  const [pageTab, setPageTab] = useState<"scenario" | "create" | "ai-edit" | "my-content">("scenario");
  const [mainType, setMainType] = useState<"video" | "photo">("video");
  const [videoMode, setVideoMode] = useState<"link" | "description">("link");
  const [photoMode, setPhotoMode] = useState<"link" | "description">("link");
  const [photoFormat, setPhotoFormat] = useState("banner");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [designTab, setDesignTab] = useState<"ready" | "my">("ready");
  const [designStyle, setDesignStyle] = useState("modern");
  const [designTemplate, setDesignTemplate] = useState("tmpl1");

  // Form field values
  const [sourceUrl, setSourceUrl] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [speakerText, setSpeakerText] = useState("");
  const [mainText, setMainText] = useState("");
  const [editFeedback, setEditFeedback] = useState("");

  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);

  // Generation state
  const [submitting, setSubmitting] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<ContentTask | null>(null);

  // History
  const [history, setHistory] = useState<ContentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [abVariant, setAbVariant] = useState<"A" | "B">("A");
  const [sessionId, setSessionId] = useState("");

  // Ratings / feedback for learning
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>(() => {
    try { return JSON.parse(localStorage.getItem("cf_ratings") || "{}"); } catch { return {}; }
  });
  const [ratingComments, setRatingComments] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("cf_rating_comments") || "{}"); } catch { return {}; }
  });
  const [activeCommentTask, setActiveCommentTask] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [adSheetOpen, setAdSheetOpen] = useState(false);
  const [selectedAdTask, setSelectedAdTask] = useState<ContentTask | null>(null);
  const [deleteDialogTask, setDeleteDialogTask] = useState<ContentTask | null>(null);
  const [deleteReason, setDeleteReason] = useState<(typeof DELETE_REASON_OPTIONS)[number] | "">("");
  const [deleteDetails, setDeleteDetails] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "video" | "image" | "liked">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const [videoFormat, setVideoFormat] = useState<"reels" | "slideshow">("reels");
  const videoAspect = "9:16";

  const saveAbEvent = useCallback((event: string, meta?: Record<string, string | number | boolean>) => {
    if (!sessionId) return;
    const payload: AbEvent = {
      ts: new Date().toISOString(),
      sessionId,
      variant: abVariant,
      event,
      meta,
    };
    const raw = localStorage.getItem(AB_STORAGE);
    const list: AbEvent[] = raw ? JSON.parse(raw) : [];
    list.push(payload);
    localStorage.setItem(AB_STORAGE, JSON.stringify(list.slice(-5000)));
  }, [abVariant, sessionId]);

  useEffect(() => {
    const existingSession = localStorage.getItem(AB_SESSION_STORAGE);
    if (existingSession) {
      setSessionId(existingSession);
    } else {
      const next = crypto.randomUUID();
      localStorage.setItem(AB_SESSION_STORAGE, next);
      setSessionId(next);
    }
    const storedVariant = localStorage.getItem(AB_VARIANT_STORAGE) as "A" | "B" | null;
    if (storedVariant === "A" || storedVariant === "B") {
      setAbVariant(storedVariant);
      return;
    }
    const randomVariant = Math.random() >= 0.5 ? "B" : "A";
    localStorage.setItem(AB_VARIANT_STORAGE, randomVariant);
    setAbVariant(randomVariant);
  }, []);

  useEffect(() => {
    if (sessionId) saveAbEvent("page_open");
  }, [sessionId, saveAbEvent]);

  const abStats = useMemo(() => {
    const raw = localStorage.getItem(AB_STORAGE);
    const list: AbEvent[] = raw ? JSON.parse(raw) : [];
    const bySession = new Map<string, AbEvent[]>();
    list.forEach((item) => {
      if (!bySession.has(item.sessionId)) bySession.set(item.sessionId, []);
      bySession.get(item.sessionId)!.push(item);
    });
    const sessions = Array.from(bySession.values());
    const totalSessions = sessions.length;
    const started = sessions.filter((group) => group.some((e) => e.event === "generate_click")).length;
    const completed = sessions.filter((group) => group.some((e) => e.event === "task_completed")).length;
    const durations: number[] = [];
    sessions.forEach((group) => {
      const start = group.find((e) => e.event === "generate_click");
      const finish = group.find((e) => e.event === "task_completed");
      if (start && finish) {
        const delta = (new Date(finish.ts).getTime() - new Date(start.ts).getTime()) / 1000;
        if (delta > 0 && Number.isFinite(delta)) durations.push(delta);
      }
    });
    const avgTaskSec = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const engagementRate = totalSessions ? Math.round((started / totalSessions) * 100) : 0;
    const completionRate = started ? Math.round((completed / started) * 100) : 0;
    return {
      totalSessions,
      started,
      completed,
      avgTaskSec,
      engagementRate,
      completionRate,
      reachedGoal: totalSessions >= 50,
    };
  }, [history]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!active) {
      setLoadingHistory(false);
      return;
    }
    const currentActiveId = active.id;
    setLoadingHistory(true);
    let query = (supabase as any).from("content_tasks").select("id, status, progress_text, result_urls, content_type, main_text, aspect_ratio, format, created_at");

    if (!isAgency) {
      query = query.eq("project_id", currentActiveId);
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
      
    if (data) setHistory(data as ContentTask[]);
    setLoadingHistory(false);
  }, [active?.id, isAgency]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`content_task_${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "content_tasks", filter: `id=eq.${taskId}` }, (payload: any) => {
        const row = payload.new;
        const updated: ContentTask = {
          id: row.id,
          status: row.status,
          progress_text: row.progress_text,
          result_urls: row.result_urls,
          content_type: row.content_type,
          main_text: row.main_text,
          aspect_ratio: row.aspect_ratio,
          format: row.format,
          created_at: row.created_at,
        };
        setTask(updated);
        if (row.status === "completed" || row.status === "error") fetchHistory();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, fetchHistory]);

  const handleReferenceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReferencePreview(url);
  };

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `uploads/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("content_assets").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const [expandingField, setExpandingField] = useState<string | null>(null);
  const handleMagicExpand = async (fieldName: string, getter: string, setter: (v: string) => void) => {
    if (!getter.trim()) {
      toast({ title: "Напишите краткое описание", description: "AI развернёт его в полноценный текст", variant: "destructive" });
      return;
    }
    setExpandingField(fieldName);
    await new Promise(r => setTimeout(r, 1500));
    const expansions: Record<string, (input: string) => string> = {
      visualStyle: (input) => `${input}. Используйте динамичные переходы между сценами, крупные планы с акцентом на детали. Тёплая цветовая палитра с натуральным освещением. Минималистичный фон, современная типографика с контрастными акцентами.`,
      speakerText: (input) => `${input}\n\nПредставьте себе результат, который говорит сам за себя. Каждый элемент продуман до мелочей — от идеи до реализации. Наш подход — это качество в каждой детали, которое вы почувствуете с первого взгляда.\n\nДействуйте прямо сейчас — количество мест ограничено.`,
      mainText: (input) => `Слайд 1: ${input}\nСлайд 2: Ключевое преимущество — то, что отличает вас от конкурентов\nСлайд 3: Социальное доказательство — отзывы и результаты клиентов\nСлайд 4: Призыв к действию — запишитесь сегодня и получите бонус`,
    };
    const expand = expansions[fieldName] || ((i: string) => `${i}. Дополнительные детали, визуальные акценты, профессиональная подача контента с учётом целевой аудитории.`);
    setter(expand(getter));
    setExpandingField(null);
    toast({ title: "✨ Текст расширен" });
  };

  const handleMagicAI = async () => {
    if (!sourceUrl.trim()) {
      toast({ title: "Укажите ссылку", description: "Вставьте ссылку, чтобы AI мог проанализировать контент", variant: "destructive" });
      return;
    }
    setMagicLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    if (mainType === "video") {
      setVisualStyle("Динамичные переходы, крупные планы продукта, тёплая цветовая палитра, натуральное освещение");
      setSpeakerText("Представьте себе результат, который говорит сам за себя. Наш подход — это качество в каждой детали.");
    } else {
      setMainText("Слайд 1: Заголовок с главным оффером\nСлайд 2: Ключевое преимущество\nСлайд 3: Социальное доказательство\nСлайд 4: Призыв к действию");
      setVisualStyle("Чистый минимализм, контрастные акценты, современная типографика");
    }
    setMagicLoading(false);
    toast({ title: "✨ AI заполнил ТЗ", description: "Проверьте и скорректируйте под ваши задачи" });
  };

  const handleGenerate = async () => {
    saveAbEvent("generate_click", { mainType, sourceMode: mainType === "video" ? videoMode : photoMode });
    setSubmitting(true);
    try {
      let customLogoUrl: string | null = null;
      if (logoFile) {
        setUploading(true);
        customLogoUrl = await uploadFile(logoFile);
        setUploading(false);
        if (!customLogoUrl) { setSubmitting(false); return; }
      }

      const isVideo = mainType === "video";
      const mode = isVideo ? videoMode : photoMode;
      const isCarousel = !isVideo && (photoFormat === "carousel-7" || photoFormat === "carousel-10");
      const slideCount = photoFormat === "carousel-10" ? 10 : photoFormat === "carousel-7" ? 7 : 1;

      const slides = (isVideo ? speakerText : mainText || "")
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^слайд\s*\d+\s*[:：]\s*/i, "").trim())
        .filter(Boolean);

      const payload: Record<string, any> = {
        content_type: isCarousel ? "carousel" : mainType,
        source_type: mode,
        source_url: mode === "link" ? sourceUrl : null,
        visual_style: visualStyle || null,
        main_text: isCarousel ? (slides.length > 0 ? slides[0] : mainText) : (isVideo ? speakerText : mainText),
        format: isVideo ? videoFormat : photoFormat,
        aspect_ratio: isVideo ? videoAspect : aspectRatio,
        design_template: !isVideo ? (designTab === "ready" ? designStyle : designTemplate) : null,
        custom_logo_url: customLogoUrl,
        project_id: isAgency ? null : active?.id,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type, main_text, aspect_ratio, format, created_at")
        .single();
      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const formatMap: Record<string, string> = { banner: "fb-target", "carousel-7": "insta-carousel", "carousel-10": "insta-carousel" };

      const n8nPayload = {
        task_id: data.id,
        project_id: active?.id,
        client_name: active?.name,
        content_type: isCarousel ? "carousel" : mainType,
        source_type: payload.source_type,
        source_url: payload.source_url,
        format: isVideo ? videoFormat : (formatMap[photoFormat] || "fb-target"),
        aspect_ratio: isVideo ? videoAspect : aspectRatio,
        main_text: payload.main_text || "",
        visual_style: payload.visual_style || "",
        speaker_text: isVideo ? speakerText : "",
        design_template: payload.design_template || "modern",
        is_carousel: isCarousel,
        num_slides: isCarousel ? Math.max(slideCount, slides.length) : 1,
        slide_count: isCarousel ? Math.max(slideCount, slides.length) : 1,
        slides: isCarousel ? slides : [],
        custom_logo_url: payload.custom_logo_url,
        timestamp: new Date().toISOString(),
      };

      const webhookRes = await fetch("https://n8n.zapoinov.com/webhook/content-factory-v3", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n8nPayload),
      });
      if (!webhookRes.ok) {
        toast({ title: "Ошибка связи с сервером", description: `Статус: ${webhookRes.status}`, variant: "destructive" });
        saveAbEvent("generate_error", { status: webhookRes.status });
      } else {
        toast({ title: "Запуск выполнен", description: "Контент создается. Обычно это занимает до минуты." });
        saveAbEvent("generate_started");
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setTaskId(null);
    setTask(null);
    setSourceUrl("");
    setVisualStyle("");
    setSpeakerText("");
    setMainText("");
    setLogoFile(null);
    setEditFeedback("");
    setReferencePreview(null);
  };

  const openDeleteDialog = (task: ContentTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogTask(task);
    setDeleteReason("");
    setDeleteDetails("");
  };

  const handleDeleteTask = async () => {
    if (!deleteDialogTask || !deleteReason) return;

    try {
      const feedbackComment = deleteDetails.trim()
        ? `Удалено из истории. Причина: ${deleteReason}. Комментарий: ${deleteDetails.trim()}`
        : `Удалено из истории. Причина: ${deleteReason}`;

      await (supabase as any).from("content_feedback").insert({
        task_id: deleteDialogTask.id,
        rating: -1,
        comment: feedbackComment,
      });

      const { error } = await (supabase as any)
        .from("content_tasks")
        .delete()
        .eq("id", deleteDialogTask.id);

      if (error) throw error;

      toast({ title: "Удалено", description: "Контент удалён из истории" });
      setHistory(prev => prev.filter(t => t.id !== deleteDialogTask.id));
      if (taskId === deleteDialogTask.id) {
        setTask(null);
        setTaskId(null);
      }
      setDeleteDialogTask(null);
      setDeleteReason("");
      setDeleteDetails("");
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    }
  };

  const loadHistoryItem = (item: ContentTask) => {
    setTask(item);
    setTaskId(item.id);
  };

  const handleRating = useCallback(async (taskId: string, rating: 1 | -1, comment?: string) => {
    const newRatings = { ...ratings, [taskId]: rating };
    setRatings(newRatings);
    localStorage.setItem("cf_ratings", JSON.stringify(newRatings));
    let nextComment = ratingComments[taskId] ?? "";
    if (comment !== undefined) {
      const newComments = { ...ratingComments, [taskId]: comment };
      setRatingComments(newComments);
      localStorage.setItem("cf_rating_comments", JSON.stringify(newComments));
      nextComment = comment;
    }
    try {
      await (supabase as any).from("content_feedback").insert({
        task_id: taskId,
        rating,
        comment: nextComment || null,
      });
    } catch {
      /* silent */
    }
    try {
      await fetch("https://n8n.zapoinov.com/webhook/clony-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          rating,
          comment: nextComment,
          ts: new Date().toISOString(),
        }),
      });
    } catch {
      /* silent — feedback is best-effort */
    }
  }, [ratings, ratingComments]);

  const submitComment = useCallback((taskId: string) => {
    const text = commentDraft.trim();
    if (!text) return;
    const currentRating = ratings[taskId] ?? -1;
    handleRating(taskId, currentRating as 1 | -1, text);
    setActiveCommentTask(null);
    setCommentDraft("");
    toast({ title: "Спасибо за отзыв", description: "Система учтёт это при обучении." });
  }, [commentDraft, ratings, handleRating, toast]);

  const progressPercent = !task ? 0 : task.status === "pending" ? 10 : task.status === "processing" ? 60 : task.status === "completed" ? 100 : 0;
  const readyHistory = useMemo(
    () => history.filter((item) => item.status === "completed" && Array.isArray(item.result_urls) && item.result_urls.length > 0),
    [history]
  );
  const historyStats = useMemo(() => {
    const likes = Object.values(ratings).filter((value) => value === 1).length;
    const videos = readyHistory.filter((item) => item.content_type === "video").length;
    const visuals = readyHistory.filter((item) => item.content_type !== "video").length;

    return {
      total: readyHistory.length,
      likes,
      videos,
      visuals,
    };
  }, [ratings, readyHistory]);
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return readyHistory.filter((item) => {
      const matchesFilter =
        historyFilter === "all" ||
        (historyFilter === "video" && item.content_type === "video") ||
        (historyFilter === "image" && item.content_type !== "video") ||
        (historyFilter === "liked" && ratings[item.id] === 1);

      if (!matchesFilter) return false;
      if (!query) return true;

      const haystack = [
        item.content_type,
        item.main_text || "",
        item.format || "",
        ratingComments[item.id] || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [historyFilter, historySearch, ratingComments, ratings, readyHistory]);

  useEffect(() => {
    saveAbEvent("tab_open", { tab: pageTab });
  }, [pageTab, saveAbEvent]);

  useEffect(() => {
    if (task?.status === "completed") saveAbEvent("task_completed", { type: task.content_type });
    if (task?.status === "error") saveAbEvent("task_failed", { type: task.content_type });
  }, [task?.status, task?.content_type, saveAbEvent]);

  // Stage indicator logic for progress view
  const pipelineStages = [
    { label: "Анализ", icon: "📋", done: progressPercent >= 10 },
    { label: "Генерация", icon: "🎨", done: progressPercent >= 40 },
    { label: "Рендер", icon: "⚙️", done: progressPercent >= 70 },
    { label: "Готово", icon: "🚀", done: progressPercent >= 100 },
  ];
  const activeTabMeta = TAB_CONTENT[pageTab];
  const topStats = [
    { label: "Готово", value: historyStats.total, icon: Sparkles, tone: "text-primary" },
    { label: "Видео", value: historyStats.videos, icon: Video, tone: "text-sky-400" },
    { label: "Баннеры", value: historyStats.visuals, icon: ImageIcon, tone: "text-amber-300" },
    { label: "Лайки", value: historyStats.likes, icon: ThumbsUp, tone: "text-emerald-300" },
  ];

  // 1. Result View
  if (task && task.status === "completed" && task.result_urls && task.result_urls.length > 0) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className={cfStyles.page}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <CfH1 className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                Контент готов!
              </CfH1>
              <p className={cn(cfStyles.hint, "mt-1")}>Файлы созданы. Проверьте и скачайте результат.</p>
            </div>
            <CfButtonMd onClick={handleReset} variant="outline" className="gap-2 border-border/60 shadow-sm">
              <RotateCcw className="h-4 w-4" /> Назад к созданию
            </CfButtonMd>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-border/50 bg-card p-8 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-12 items-start">
              <div className="space-y-8">
                {task.content_type === "video" ? (
                  <div className="space-y-4">
                    {task.result_urls.map((url, i) => (
                      <div key={i} className="rounded-[2rem] overflow-hidden border border-border/40 bg-secondary/20 shadow-xl max-w-sm mx-auto group relative aspect-[9/16]">
                        <video src={url} controls className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory custom-scrollbar">
                    {task.result_urls.map((url, i) => (
                      <motion.div key={i} className="flex-shrink-0 snap-center rounded-[2rem] overflow-hidden border border-border/40 shadow-xl bg-secondary/10">
                        <img src={url} alt={`Слайд ${i + 1}`} className="max-h-[500px] w-auto object-contain" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-4">
                  <div className="p-6 rounded-3xl bg-secondary/30 border border-border/40 space-y-4">
                    <CfH3 className="uppercase tracking-widest flex items-center gap-2 text-sm">
                       <Zap className="h-4 w-4 text-primary" /> Действия
                    </CfH3>
                    <div className="grid grid-cols-1 gap-3">
                       {task.result_urls.map((url, i) => (
                         <a key={i} href={url} target="_blank" rel="noreferrer" className="w-full">
                           <CfButtonMd className="w-full gap-2.5 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                             <Download className="h-5 w-5" /> Скачать {task.result_urls!.length > 1 ? `(Слайд ${i + 1})` : "Контент"}
                           </CfButtonMd>
                         </a>
                       ))}
                       <CfButtonMd onClick={handleReset} variant="outline" className="w-full gap-2.5 border-border/60 hover:bg-accent">
                         <RotateCcw className="h-5 w-5" /> Создать новый
                       </CfButtonMd>
                    </div>
                 </div>

                 <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
                    <p className="text-xs font-bold text-primary/80 uppercase tracking-widest">Информация</p>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-muted-foreground">Тип:</span>
                       <span className="font-bold text-foreground capitalize">{task.content_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-muted-foreground">Дата:</span>
                       <span className="font-bold text-foreground">{task.created_at ? dateFmt(new Date(task.created_at), "dd.MM.yyyy") : "—"}</span>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Progress View
  if (task && (task.status === "pending" || task.status === "processing")) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-4xl py-20 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[3rem] border border-border/40 bg-card p-16 text-center space-y-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary/10 overflow-hidden">
               <motion.div 
                 className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                 initial={{ width: "0%" }}
                 animate={{ width: `${progressPercent}%` }}
                 transition={{ duration: 1, ease: "easeInOut" }}
               />
            </div>

            <div className="space-y-4">
               <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
               </div>
               <CfH2 className="uppercase">Подождите, готовим ваш контент</CfH2>
               <p className="text-muted-foreground font-medium max-w-sm mx-auto">Обычно это занимает до одной минуты.</p>
            </div>

            <div className="flex items-center justify-center gap-10">
              {pipelineStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                    stage.done ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110" : "bg-secondary/40 text-muted-foreground/40"
                  )}>
                    {stage.done ? <CheckCircle2 className="h-6 w-6" /> : stage.icon}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                    stage.done ? "text-primary" : "text-muted-foreground/30"
                  )}>{stage.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 max-w-md mx-auto">
               <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <span>{task.progress_text || "Готовим этапы..."}</span>
                  <span className="text-primary">{progressPercent}%</span>
               </div>
               <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8 }}
                  />
               </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // 3. Main Interface
  const tabs = [
    { id: "scenario" as const, icon: Sparkles, label: "Сценарий" },
    { id: "create" as const, icon: Plus, label: "Создать" },
    { id: "ai-edit" as const, icon: Wand2, label: "ИИ Монтаж" },
    { id: "my-content" as const, icon: Clock, label: "История" },
  ];

  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className={cn(cfStyles.page, "flex flex-col h-[calc(100vh-100px)] min-h-[680px]")}>
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Контент-Завод</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider">
                  {activeTabMeta.kicker}
                </Badge>
              </div>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {activeTabMeta.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 lg:w-auto">
            {topStats.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-1 rounded-2xl border border-border/50 bg-card px-3 py-2 sm:px-4 sm:py-3"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                  <Icon className={cn("h-3.5 w-3.5", tone)} />
                </div>
                <p className="text-xl font-bold text-foreground sm:text-2xl">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-border/50 bg-card p-1 sm:w-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const active = pageTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPageTab(tab.id)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors sm:flex-none",
                    active ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-tab-bg"
                      className="absolute inset-0 rounded-xl bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <TabIcon className="relative h-4 w-4" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">

          {pageTab === "scenario" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10 flex justify-center">
              <ScenarioCreator />
            </div>
          )}

          {pageTab === "ai-edit" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
              <AiEditBlock />
            </div>
          )}

          {pageTab === "my-content" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-8">
              {readyHistory.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 sm:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Поиск по описанию, типу или формату"
                      className="h-10 rounded-xl border-border/50 bg-card pl-10 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/50 bg-card p-1">
                    {[
                      { id: "all" as const, label: "Все" },
                      { id: "video" as const, label: "Видео" },
                      { id: "image" as const, label: "Визуалы" },
                      { id: "liked" as const, label: "Любимые" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setHistoryFilter(item.id)}
                        className={cn(
                          "h-8 rounded-lg px-3 text-xs font-semibold transition-colors",
                          historyFilter === item.id
                            ? "bg-primary text-white"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                   <div className="h-12 w-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                   <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Загрузка истории...</p>
                </div>
              ) : readyHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                     className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border border-primary/20 shadow-inner relative overflow-hidden"
                   >
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        <Clock className="h-14 w-14 text-primary/40" />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                   </motion.div>
                   <div className="space-y-3 max-w-sm">
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Готового контента пока нет</h3>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        Здесь будут появляться только завершённые креативы, готовые к просмотру, оценке, удалению и запуску в рекламу.
                      </p>
                   </div>
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => setPageTab("create")} className="h-14 px-10 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all gap-3">
                         <Plus className="h-5 w-5" /> Создать первый контент
                      </Button>
                   </motion.div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-[2.2rem] border border-dashed border-border/60 bg-card/70 px-6 py-16 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">История</p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground">Ничего не найдено</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
                    Попробуйте изменить фильтр или поисковый запрос. Готовые материалы остаются в истории и доступны для оценки и запуска в рекламу.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredHistory.map((task, idx) => (
                      <motion.div 
                        layout
                        key={task.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }}
                        className="group relative rounded-2xl border border-border/50 bg-card hover:border-primary/40 transition-colors shadow-sm hover:shadow-lg cursor-pointer p-4 space-y-3 overflow-hidden"
                        onClick={() => loadHistoryItem(task)}
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary/70 to-emerald-300/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               {task.content_type === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{task.content_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             {(task.status === "pending" || task.status === "processing") && (
                               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                  <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                  </span>
                                  <span className="text-[7px] font-black uppercase tracking-widest text-primary">Live</span>
                               </div>
                             )}
                             <Badge variant="outline" className={cn(
                               "text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-md border-none h-4",
                               task.status === "completed" ? "bg-green-500/10 text-green-600" : 
                               task.status === "error" ? "bg-destructive/10 text-destructive" :
                               "bg-primary/5 text-primary/60"
                             )}>
                               {task.status === "completed" ? "Готово" : task.status === "error" ? "Ошибка" : "В процессе"}
                             </Badge>
                          </div>
                        </div>

                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-secondary/30 relative border border-border/40 group-hover:scale-[1.02] transition-transform duration-500">
                           {task.result_urls?.[0] ? (
                             task.content_type === 'video' ? (
                               <div className="relative h-full w-full">
                                  <video src={task.result_urls[0]} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Play className="h-8 w-8 text-white fill-white" />
                                  </div>
                               </div>
                             ) : (
                               <img src={task.result_urls[0]} className="w-full h-full object-cover" />
                             )
                           ) : (
                             <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
                             </div>
                           )}
                        </div>

                        <div className="space-y-2">
                          <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-foreground/90">
                            {task.main_text?.trim() || "Готовый материал без описания. Откройте карточку, чтобы просмотреть и использовать креатив дальше."}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {task.format && (
                              <span className="rounded-full bg-secondary/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                {task.format}
                              </span>
                            )}
                            {task.aspect_ratio && (
                              <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                {task.aspect_ratio}
                              </span>
                            )}
                            {ratings[task.id] === 1 && (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                                Одобрено
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                           <span>{task.created_at ? dateFmt(new Date(task.created_at), "dd MMM, HH:mm") : ""}</span>
                           <span className="group-hover:text-primary transition-colors">Открыть →</span>
                        </div>

                        {task.status === "completed" && task.result_urls?.[0] && (
                          <div
                            className="pt-3 border-t border-border/40 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                className="h-10 rounded-2xl bg-primary text-white hover:bg-primary/90"
                                onClick={() => {
                                  setSelectedAdTask(task);
                                  setAdSheetOpen(true);
                                }}
                              >
                                <Rocket className="mr-2 h-4 w-4" /> В рекламу
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 rounded-2xl border-border/60"
                                onClick={(e) => openDeleteDialog(task, e)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Удалить
                              </Button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 rounded-lg transition-colors",
                                    ratings[task.id] === 1
                                      ? "bg-green-500/15 text-green-600 hover:bg-green-500/20"
                                      : "text-muted-foreground/50 hover:text-green-600 hover:bg-green-500/10"
                                  )}
                                  onClick={() => handleRating(task.id, 1)}
                                  title="Нравится"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 rounded-lg transition-colors",
                                    ratings[task.id] === -1
                                      ? "bg-destructive/15 text-destructive hover:bg-destructive/20"
                                      : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                                  )}
                                  onClick={() => handleRating(task.id, -1)}
                                  title="Не нравится"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 rounded-lg transition-colors",
                                    ratingComments[task.id]
                                      ? "bg-primary/15 text-primary hover:bg-primary/20"
                                      : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                                  )}
                                  onClick={() => {
                                    setActiveCommentTask(activeCommentTask === task.id ? null : task.id);
                                    setCommentDraft(ratingComments[task.id] ?? "");
                                  }}
                                  title="Комментарий"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                              {ratingComments[task.id] && activeCommentTask !== task.id && (
                                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[60%]" title={ratingComments[task.id]}>
                                  «{ratingComments[task.id]}»
                                </span>
                              )}
                            </div>
                            {activeCommentTask === task.id && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={commentDraft}
                                  onChange={(e) => setCommentDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      submitComment(task.id);
                                    }
                                  }}
                                  placeholder="Что понравилось или нет?"
                                  className="flex-1 h-9 px-3 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  className="h-9 w-9 rounded-lg bg-primary text-white hover:bg-primary/90"
                                  onClick={() => submitComment(task.id)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {pageTab === "create" && (
            <div className="h-full">
              <ClonyWizard />
            </div>
          )}
        </div>
      </div>
      <CampaignBuilderSheet
        open={adSheetOpen}
        onOpenChange={setAdSheetOpen}
        initialCreative={
          selectedAdTask
            ? {
                urls: selectedAdTask.result_urls || [],
                contentType: selectedAdTask.content_type,
                mainText: selectedAdTask.main_text || "",
                aspectRatio: selectedAdTask.aspect_ratio || null,
                format: selectedAdTask.format || null,
              }
            : null
        }
      />
      <Dialog open={Boolean(deleteDialogTask)} onOpenChange={(open) => !open && setDeleteDialogTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить контент из истории</DialogTitle>
            <DialogDescription>
              Укажите причину удаления. Это поможет понимать, какой контент вам подходит, а какой нет.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Причина</Label>
              <Select value={deleteReason} onValueChange={(value) => setDeleteReason(value as (typeof DELETE_REASON_OPTIONS)[number])}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите причину" />
                </SelectTrigger>
                <SelectContent>
                  {DELETE_REASON_OPTIONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Textarea
                value={deleteDetails}
                onChange={(e) => setDeleteDetails(e.target.value)}
                placeholder="Например: текст слабый, нужен другой оффер, визуал не подходит"
                className="min-h-[110px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogTask(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={!deleteReason}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
