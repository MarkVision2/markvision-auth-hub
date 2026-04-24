import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
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
  Download,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Clock,
  Trash2,
  Layers,
  Zap,
  Plus,
  Play,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Search,
  Rocket,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import ScenarioCreator from "@/components/content/ScenarioCreator";
import ClonyWizard from "@/components/content/ClonyWizard";
import { AiEditBlock } from "@/components/content/ai-edit/AiEditBlock";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { cn } from "@/lib/utils";
import { CfButtonMd, CfH1, CfH2, CfH3, cfStyles } from "@/components/content/contentFactoryDesignSystem";

type TaskStatus = "pending" | "processing" | "completed" | "error";
type ContentFactoryTab = "scenario" | "create" | "ai-edit" | "my-content";

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

const resolveContentFactoryTab = (section?: string): ContentFactoryTab => {
  switch (section) {
    case undefined:
    case "":
    case "scenario":
      return "scenario";
    case "create":
      return "create";
    case "ai-edit":
      return "ai-edit";
    case "history":
    case "my-content":
      return "my-content";
    default:
      return "scenario";
  }
};

const getContentFactoryPath = (tab: ContentFactoryTab) => {
  switch (tab) {
    case "create":
      return "/content/create";
    case "ai-edit":
      return "/content/ai-edit";
    case "my-content":
      return "/content/history";
    case "scenario":
    default:
      return "/content";
  }
};

export default function ContentFactory() {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { active, isAgency } = useWorkspace();
  const [pageTab, setPageTab] = useState<ContentFactoryTab>(() => resolveContentFactoryTab(section));

  // Generation state
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
    const nextTab = resolveContentFactoryTab(section);
    setPageTab((current) => (current === nextTab ? current : nextTab));
  }, [section]);

  const openPageTab = useCallback((tab: ContentFactoryTab) => {
    setPageTab(tab);
    const nextPath = getContentFactoryPath(tab);
    navigate(nextPath);
  }, [navigate]);

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

  const handleReset = () => {
    setTaskId(null);
    setTask(null);
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

    return history.filter((item) => {
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
  }, [history, historyFilter, historySearch, ratingComments, ratings]);

  useEffect(() => {
    saveAbEvent("tab_open", { tab: pageTab });
    if (pageTab === "my-content") fetchHistory();
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

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn(cfStyles.card, "p-8 overflow-hidden relative")}>
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-12 items-start">
              <div className="space-y-8">
                {task.content_type === "video" ? (
                  <div className="space-y-4">
                    {task.result_urls.map((url, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-border/40 bg-secondary/20 shadow-xl max-w-sm mx-auto group relative aspect-[9/16]">
                        <video src={url} controls className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory custom-scrollbar">
                    {task.result_urls.map((url, i) => (
                      <motion.div key={i} className="flex-shrink-0 snap-center rounded-lg overflow-hidden border border-border/40 shadow-xl bg-secondary/10">
                        <img src={url} alt={`Слайд ${i + 1}`} className="max-h-[500px] w-auto object-contain" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-4">
                  <div className="p-6 rounded-xl bg-secondary/30 border border-border/40 space-y-4">
                    <CfH3 className="font-medium flex items-center gap-2 text-sm">
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

                 <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <p className="text-xs font-bold text-primary/80 font-medium">Информация</p>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(cfStyles.card, "p-8 md:p-12 text-center space-y-12 shadow-2xl relative overflow-hidden")}>
            <div className="absolute top-0 left-0 w-full h-2 bg-primary/10 overflow-hidden">
               <motion.div 
                 className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                 initial={{ width: "0%" }}
                 animate={{ width: `${progressPercent}%` }}
                 transition={{ duration: 1, ease: "easeInOut" }}
               />
            </div>

            <div className="space-y-4">
               <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
               </div>
               <CfH2 className="uppercase">Подождите, готовим ваш контент</CfH2>
               <p className="text-muted-foreground font-medium max-w-sm mx-auto">Обычно это занимает до одной минуты.</p>
            </div>

            <div className="flex items-center justify-center gap-10">
              {pipelineStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-all duration-500",
                    stage.done ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110" : "bg-secondary/40 text-muted-foreground/40"
                  )}>
                    {stage.done ? <CheckCircle2 className="h-6 w-6" /> : stage.icon}
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    stage.done ? "text-primary" : "text-muted-foreground/30"
                  )}>{stage.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 max-w-md mx-auto">
               <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Контент-Завод</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-semibold">
                  {activeTabMeta.kicker}
                </Badge>
              </div>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {activeTabMeta.description}
              </p>
            </div>
          </div>

          <div className={cn(cfStyles.card, "flex items-center gap-4 px-4 py-2.5 lg:w-auto")}>
            {topStats.map(({ label, value, icon: Icon, tone }, idx) => (
              <div key={label} className={cn("flex items-center gap-2", idx > 0 && "border-l border-border/50 pl-4")}>
                <Icon className={cn("h-4 w-4 shrink-0", tone)} />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className={cn(cfStyles.card, "inline-flex w-full flex-wrap gap-1 p-1 sm:w-auto")}>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const active = pageTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => openPageTab(tab.id)}
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
                      className={cn(cfStyles.input, "h-10 pl-10")}
                    />
                  </div>
                  <div className={cn(cfStyles.card, "flex flex-wrap gap-1.5 p-1")}>
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
                <div className="flex flex-col items-center justify-center gap-3 py-32">
                  <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Загрузка истории...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                    <Clock className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div className="max-w-sm space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Контента пока нет</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Здесь появятся все задачи — в процессе и завершённые. Создайте первый контент, чтобы начать.
                    </p>
                  </div>
                  <Button onClick={() => openPageTab("create")} className="gap-2 rounded-xl bg-primary px-6 text-white hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Создать первый контент
                  </Button>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
                  <h3 className="text-base font-semibold text-foreground">Ничего не найдено</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Попробуйте изменить фильтр или поисковый запрос.
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
                        className={cn(cfStyles.card, "group relative hover:border-primary/40 transition-colors hover:shadow-lg cursor-pointer p-4 space-y-3 overflow-hidden")}
                        onClick={() => loadHistoryItem(task)}
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary/70 to-emerald-300/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               {task.content_type === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                            </div>
                            <span className="text-xs font-semibold text-foreground">{task.content_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             {(task.status === "pending" || task.status === "processing") && (
                               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                  <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                  </span>
                                  <span className="text-[9px] font-semibold text-primary">Live</span>
                               </div>
                             )}
                             <Badge variant="outline" className={cn(
                               "text-xs font-medium px-2 py-0 rounded-md border-none h-4",
                               task.status === "completed" ? "bg-green-500/10 text-green-600" : 
                               task.status === "error" ? "bg-destructive/10 text-destructive" :
                               "bg-primary/5 text-primary/60"
                             )}>
                               {task.status === "completed" ? "Готово" : task.status === "error" ? "Ошибка" : "В процессе"}
                             </Badge>
                          </div>
                        </div>

                        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-secondary/30 relative border border-border/40 group-hover:scale-[1.02] transition-transform duration-500">
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
                              <span className="rounded-full bg-secondary/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                                {task.format}
                              </span>
                            )}
                            {task.aspect_ratio && (
                              <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-medium text-primary">
                                {task.aspect_ratio}
                              </span>
                            )}
                            {ratings[task.id] === 1 && (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                Одобрено
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground/50">
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
                                className="h-10 rounded-lg bg-primary text-white hover:bg-primary/90"
                                onClick={() => {
                                  setSelectedAdTask(task);
                                  setAdSheetOpen(true);
                                }}
                              >
                                <Rocket className="mr-2 h-4 w-4" /> В рекламу
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 rounded-lg border-border/60"
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
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
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
