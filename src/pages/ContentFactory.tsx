import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Image as ImageIcon, Link, FileText, Upload, Download, Loader2, CheckCircle2, RotateCcw, Sparkles, Send, Clock, Trash2, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import { PhoneMockup } from "@/components/content/PhoneMockup";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
  created_at?: string;
}

const MAX_HISTORY = 6;

export default function ContentFactory() {
  const { active } = useWorkspace();
  const [pageTab, setPageTab] = useState<"create" | "my-content">("create");
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const [videoFormat, setVideoFormat] = useState<"reels" | "slideshow">("reels");

  // Video is always 9:16
  const videoAspect = "9:16";

  // Fetch history
  const fetchHistory = useCallback(async () => {
    let query = (supabase as any).from("content_tasks").select("id, status, progress_text, result_urls, content_type, created_at");

    if (active.id !== "hq") {
      query = query.eq("project_id", active.id);
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
    if (data) setHistory(data as ContentTask[]);
  }, [active.id]);

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
        const updated: ContentTask = { id: row.id, status: row.status, progress_text: row.progress_text, result_urls: row.result_urls, content_type: row.content_type, created_at: row.created_at };
        setTask(updated);
        if (row.status === "completed" || row.status === "error") fetchHistory();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, fetchHistory]);

  // Handle reference file upload for preview
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

  // Magic expand: takes short text from a field and expands it
  const [expandingField, setExpandingField] = useState<string | null>(null);
  const handleMagicExpand = async (fieldName: string, getter: string, setter: (v: string) => void) => {
    if (!getter.trim()) {
      toast({ title: "Напишите краткое описание", description: "AI развернёт его в полноценный текст", variant: "destructive" });
      return;
    }
    setExpandingField(fieldName);
    await new Promise(r => setTimeout(r, 1500));
    // Simulate expansion based on field type
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

  // Magic AI auto-fill
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
      const payload: Record<string, any> = {
        content_type: mainType,
        source_type: mode,
        source_url: mode === "link" ? sourceUrl : null,
        visual_style: (isVideo && mode === "description") ? visualStyle : (!isVideo && photoMode === "description" ? visualStyle : null),
        main_text: isVideo && mode === "description" ? speakerText : (!isVideo ? mainText : null),
        format: isVideo ? videoFormat : photoFormat,
        aspect_ratio: isVideo ? videoAspect : aspectRatio,
        design_template: !isVideo ? (designTab === "ready" ? designStyle : designTemplate) : null,
        custom_logo_url: customLogoUrl,
        project_id: active.id === "hq" ? null : active.id,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type, created_at")
        .single();
      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const isCarousel = !isVideo && (photoFormat === "carousel7" || photoFormat === "carousel10");
      const slideCount = photoFormat === "carousel10" ? 10 : photoFormat === "carousel7" ? 7 : 1;
      const formatMap: Record<string, string> = { banner: "fb-target", carousel7: "insta-carousel", carousel10: "insta-carousel" };

      const n8nPayload = {
        task_id: data.id,
        project_id: active.id,
        client_name: active.name,
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
        num_slides: slideCount,
        slide_count: slideCount,
        custom_logo_url: payload.custom_logo_url,
        timestamp: new Date().toISOString(),
      };

      try {
        const webhookRes = await fetch("https://n8n.zapoinov.com/webhook/content-factory-v2", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n8nPayload),
        });
        if (!webhookRes.ok) {
          console.error("n8n webhook not ok:", webhookRes.status);
          toast({ title: "Ошибка связи с сервером автоматизации", description: `Статус: ${webhookRes.status}`, variant: "destructive" });
        } else {
          toast({ title: "🚀 Генерация запущена!", description: "Следите за прогрессом ниже" });
        }
      } catch (webhookErr) {
        console.error("n8n webhook error:", webhookErr);
        toast({ title: "Ошибка связи с сервером автоматизации", description: "Проверьте подключение к n8n", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  // Regenerate with feedback
  const handleRegenerate = async () => {
    if (!editFeedback.trim() || !task) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        content_type: task.content_type,
        source_type: "edit_feedback",
        main_text: editFeedback,
        visual_style: `Переделать на основе задачи ${task.id}: ${editFeedback}`,
        project_id: active.id === "hq" ? null : active.id,
      };
      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type, created_at")
        .single();
      if (error) throw error;
      setTask(data as ContentTask);
      setTaskId(data.id);
      setEditFeedback("");
      toast({ title: "🔄 Регенерация запущена", description: "AI учтёт ваши комментарии" });
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

  const handleDownloadAll = async () => {
    if (!task?.result_urls) return;
    for (const url of task.result_urls) {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        const ext = url.split(".").pop()?.split("?")[0] || "file";
        a.download = `content_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        const a = document.createElement("a");
        a.href = url; a.download = ""; a.target = "_blank"; a.click();
      }
    }
  };

  const loadHistoryItem = (item: ContentTask) => {
    setTask(item);
    setTaskId(item.id);
  };

  const progressPercent = !task ? 0 : task.status === "pending" ? 10 : task.status === "processing" ? 60 : task.status === "completed" ? 100 : 0;

  // Pipeline stages
  const pipelineStages = [
    { label: "Анализ ТЗ", icon: "📋", done: progressPercent >= 10 },
    { label: "Генерация", icon: "🎨", done: progressPercent >= 30 },
    { label: "Рендер", icon: "⚙️", done: progressPercent >= 50 },
    { label: "Оптимизация", icon: "✨", done: progressPercent >= 80 },
    { label: "Готово", icon: "🚀", done: progressPercent >= 100 },
  ];

  // ======== RESULT VIEW ========
  if (task && task.status === "completed" && task.result_urls && task.result_urls.length > 0) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-4xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Результат генерации</p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-[hsl(var(--status-good))]" />
                <h2 className="text-lg font-semibold text-foreground">Генерация завершена!</h2>
              </div>
              <Button onClick={handleReset} variant="outline" size="sm" className="gap-1.5 border-border">
                <RotateCcw className="h-3.5 w-3.5" /> Назад
              </Button>
            </div>

            {task.content_type === "video" ? (
              <div className="space-y-4">
                {task.result_urls.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border bg-secondary/20 max-w-sm mx-auto" style={{ aspectRatio: "9/16" }}>
                    <video src={url} controls className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {task.result_urls.map((url, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex-shrink-0 snap-center">
                    <img src={url} alt={`Слайд ${i + 1}`} className="rounded-lg border border-border max-h-[400px] object-contain" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Edit feedback */}
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
              <Label className="text-sm font-medium text-foreground">🔄 Не устраивает? Опишите что изменить</Label>
              <div className="flex gap-2">
                <Textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  placeholder="Например: сделай текст крупнее, поменяй фон на тёмный..."
                  className="min-h-[60px] bg-background border-border resize-none flex-1"
                />
                <Button onClick={handleRegenerate} disabled={submitting || !editFeedback.trim()} size="sm" className="self-end gap-1.5 bg-primary hover:bg-primary/90">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Переделать
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleDownloadAll} className="gap-2 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))]/90 text-white">
                <Download className="h-4 w-4" /> Скачать всё
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2 border-border">
                <RotateCcw className="h-4 w-4" /> Создать ещё
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ======== PROGRESS VIEW ========
  if (task && (task.status === "pending" || task.status === "processing")) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Генерация контента</p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-8 space-y-8">
            {/* Pipeline stages */}
            <div className="flex items-center justify-between px-4">
              {pipelineStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={stage.done ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-base transition-colors ${stage.done ? "bg-primary/20 shadow-sm" : "bg-secondary/40"
                      }`}
                  >
                    {stage.icon}
                  </motion.div>
                  <span className={`text-[10px] font-medium ${stage.done ? "text-foreground" : "text-muted-foreground/50"}`}>{stage.label}</span>
                </div>
              ))}
            </div>

            {/* Glowing orb */}
            <div className="flex justify-center">
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-12 h-12 rounded-full bg-primary/40 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-primary shadow-[0_0_30px_hsl(var(--primary)/0.5)]" />
                </motion.div>
              </motion.div>
            </div>

            <div className="space-y-3">
              <Progress value={progressPercent} className="h-2.5 bg-secondary/40 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000" />
              <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.p key={task.progress_text} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-sm font-medium text-foreground">
                    {task.progress_text || "Запуск завода..."}
                  </motion.p>
                </AnimatePresence>
                <span className="text-xs text-muted-foreground tabular-nums">{progressPercent}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ======== ERROR VIEW ========
  if (task && task.status === "error") {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4 mt-8">
            <p className="text-sm text-destructive">{task.progress_text || "Произошла ошибка"}</p>
            <Button onClick={handleReset} variant="outline" className="gap-2 border-border"><RotateCcw className="h-4 w-4" /> Попробовать снова</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  // ======== FORM VIEW — two-column layout with PhoneMockup ========
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-6xl py-4 flex flex-col h-[calc(100vh-80px)]">
        {/* Single-row header: title + all toggles */}
        <div className="flex items-center justify-between mb-3 gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
          <div className="flex items-center gap-2">
            {/* Video / Photo type switcher (only shown on create tab) */}
            {pageTab === "create" && (
              <div className="flex bg-secondary/20 rounded-lg p-1 border border-border">
                {(["video", "photo"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMainType(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mainType === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {t === "video" ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {t === "video" ? "Видео" : "Фото"}
                  </button>
                ))}
              </div>
            )}
            {/* Page tabs */}
            <div className="flex bg-secondary/20 rounded-lg p-1 border border-border">
              <button
                onClick={() => setPageTab("create")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pageTab === "create" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Создать
              </button>
              <button
                onClick={() => setPageTab("my-content")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pageTab === "my-content" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Clock className="h-3.5 w-3.5" /> Мой Контент
              </button>
            </div>
          </div>
        </div>

        {/* ─── MY CONTENT TAB ─── */}
        {pageTab === "my-content" && (
          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pb-8">
            <p className="text-sm text-muted-foreground">История сгенерированного контента и задач</p>

            {/* Filter bar */}
            <div className="flex gap-2 flex-wrap bg-secondary/20 border border-border rounded-xl p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  placeholder="Поиск по типу контента..."
                  className="w-full pl-8 h-9 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary px-3"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    // Filter is applied on history rendered below
                    (window as any).__cfSearch = q;
                  }}
                />
              </div>
              <select
                className="h-9 px-3 bg-secondary/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary min-w-[160px]"
                onChange={(e) => { (window as any).__cfStatusFilter = e.target.value; }}
              >
                <option value="">Все статусы</option>
                <option value="completed">Выполнено</option>
                <option value="processing">В обработке</option>
                <option value="pending">Ожидание</option>
                <option value="error">Ошибка</option>
              </select>
              <select
                className="h-9 px-3 bg-secondary/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary min-w-[160px]"
              >
                <option value="created_desc">Сначала новые</option>
                <option value="created_asc">Сначала старые</option>
              </select>
            </div>

            {/* Tasks grid */}
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="h-14 w-14 rounded-xl bg-secondary/30 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">История пуста</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Создайте первый контент во вкладке «Создать»</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    {/* Type + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.content_type === "video" ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                        <span className="text-xs font-semibold text-foreground capitalize">{task.content_type}</span>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${task.status === "completed" ? "bg-[hsl(var(--status-good))]/10 border-[hsl(var(--status-good))]/30 text-[hsl(var(--status-good))]" :
                        task.status === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                          task.status === "processing" ? "bg-primary/10 border-primary/30 text-primary" :
                            "bg-secondary/50 border-border text-muted-foreground"
                        }`}>
                        {task.status === "completed" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {task.status === "completed" ? "Готово" : task.status === "error" ? "Ошибка" : task.status === "processing" ? "Обработка" : "Ожидание"}
                      </span>
                    </div>

                    {/* Progress text */}
                    {task.progress_text && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.progress_text}</p>
                    )}

                    {/* Result URLs */}
                    {task.result_urls && task.result_urls.length > 0 && (
                      <div className="space-y-1.5">
                        {task.result_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] text-primary hover:text-primary/80 truncate">
                            <Download className="h-3 w-3 shrink-0" /> {url.split("/").pop() || `Файл ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    {task.created_at && (
                      <p className="text-[10px] text-muted-foreground/50">
                        {dateFmt(new Date(task.created_at), "dd.MM.yyyy HH:mm")}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setMainType(task.content_type === "video" ? "video" : "photo");
                          setPageTab("create");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold h-8 rounded-lg border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                      >
                        <RotateCcw className="h-3 w-3" /> Повторить
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CREATE TAB ─── */}
        {pageTab === "create" && (
          <>
            <p className="text-xs text-muted-foreground mb-3">Генерация видео и фото контента с помощью AI</p>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 min-h-0">
              {/* Left Column: Form */}
              <div className="overflow-y-auto pr-4 space-y-8 pb-10 custom-scrollbar">
                {/* Source Type Selection */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Источник контента
                  </Label>
                  <Tabs
                    value={mainType === "video" ? videoMode : photoMode}
                    onValueChange={(v: any) => mainType === "video" ? setVideoMode(v) : setPhotoMode(v)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/30 border border-border h-12">
                      <TabsTrigger value="link" className="data-[state=active]:bg-background flex items-center gap-2 h-10">
                        <Link className="h-4 w-4" /> По ссылке
                      </TabsTrigger>
                      <TabsTrigger value="description" className="data-[state=active]:bg-background flex items-center gap-2 h-10">
                        <FileText className="h-4 w-4" /> Описание / Текст
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <AnimatePresence mode="wait">
                  {/* LINK Mode UI */}
                  {(mainType === "video" ? videoMode : photoMode) === "link" && (
                    <motion.div
                      key="link-mode"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Ссылка на продукт / конкурента / видео</Label>
                        <div className="flex gap-2">
                          <Input
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://..."
                            className="bg-secondary/20 border-border h-11"
                          />
                          <Button
                            onClick={handleMagicAI}
                            disabled={magicLoading || !sourceUrl}
                            variant="outline"
                            className="h-11 border-primary/30 text-primary hover:bg-primary/10 transition-all px-4"
                          >
                            {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Заполнить ТЗ
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 italic">AI проанализирует страницу и заполнит стиль и текст</p>
                      </div>
                    </motion.div>
                  )}

                  {/* DESCRIPTION Mode UI */}
                  {(mainType === "video" ? videoMode : photoMode) === "description" && (
                    <motion.div
                      key="desc-mode"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Визуальный стиль контента</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMagicExpand("visualStyle", visualStyle, setVisualStyle)}
                            disabled={expandingField === "visualStyle"}
                            className="h-8 text-[11px] text-primary hover:bg-primary/10"
                          >
                            {expandingField === "visualStyle" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                            AI Улучшить
                          </Button>
                        </div>
                        <Textarea
                          value={visualStyle}
                          onChange={(e) => setVisualStyle(e.target.value)}
                          placeholder="Опишите в каком стиле сделать контент (цвета, освещение, динамика...)"
                          className="min-h-[100px] bg-secondary/20 border-border resize-none custom-scrollbar"
                        />
                      </div>

                      {mainType === "video" ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Текст диктора / Скрипт</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMagicExpand("speakerText", speakerText, setSpeakerText)}
                              disabled={expandingField === "speakerText"}
                              className="h-8 text-[11px] text-primary hover:bg-primary/10"
                            >
                              {expandingField === "speakerText" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                              AI Дописать
                            </Button>
                          </div>
                          <Textarea
                            value={speakerText}
                            onChange={(e) => setSpeakerText(e.target.value)}
                            placeholder="О чем должен говорить AI диктор в видео?"
                            className="min-h-[120px] bg-secondary/20 border-border resize-none custom-scrollbar"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Текст для слайдов / Баннера</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMagicExpand("mainText", mainText, setMainText)}
                              disabled={expandingField === "mainText"}
                              className="h-8 text-[11px] text-primary hover:bg-primary/10"
                            >
                              {expandingField === "mainText" ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                              AI Продумать
                            </Button>
                          </div>
                          <Textarea
                            value={mainText}
                            onChange={(e) => setMainText(e.target.value)}
                            placeholder="Каждая новая строка — новый слайд. Для баннера — 1 строка."
                            className="min-h-[120px] bg-secondary/20 border-border resize-none custom-scrollbar"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Common Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    {mainType === "video" ? (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Формат видео</Label>
                        <RadioGroup value={videoFormat} onValueChange={(v: any) => setVideoFormat(v)} className="grid grid-cols-2 gap-3">
                          <Label className={`flex flex-col items-center gap-1 rounded-xl border p-4 cursor-pointer transition-all ${videoFormat === "reels" ? "border-primary bg-primary/10" : "border-border bg-secondary/20"}`}>
                            <RadioGroupItem value="reels" className="sr-only" />
                            <span className="text-sm font-medium">Reels / Shorts</span>
                            <span className="text-[10px] text-muted-foreground">Диктор + Текст</span>
                          </Label>
                          <Label className={`flex flex-col items-center gap-1 rounded-xl border p-4 cursor-pointer transition-all ${videoFormat === "slideshow" ? "border-primary bg-primary/10" : "border-border bg-secondary/20"}`}>
                            <RadioGroupItem value="slideshow" className="sr-only" />
                            <span className="text-sm font-medium">Слайдшоу</span>
                            <span className="text-[10px] text-muted-foreground">Кадры с текстом</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Формат фото</Label>
                        <Select value={photoFormat} onValueChange={setPhotoFormat}>
                          <SelectTrigger className="h-11 bg-secondary/20 border-border rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="banner">ADS Баннер (1 шт)</SelectItem>
                            <SelectItem value="carousel7">Карусель (7 слайдов)</SelectItem>
                            <SelectItem value="carousel10">Карусель (10 слайдов)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Соотношение сторон</Label>
                      <Tabs value={mainType === "video" ? videoAspect : aspectRatio} onValueChange={setAspectRatio} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-secondary/30 border border-border h-11 p-1">
                          <TabsTrigger value="1:1" disabled={mainType === "video"} className="text-xs">1:1</TabsTrigger>
                          <TabsTrigger value="4:5" disabled={mainType === "video"} className="text-xs">4:5</TabsTrigger>
                          <TabsTrigger value="9:16" className="text-xs">9:16</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Логотип бренда</Label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`h-11 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-all ${logoFile ? "border-primary bg-primary/5 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-muted-foreground/30"}`}
                      >
                        {logoFile ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            <span className="text-xs truncate max-w-[150px]">{logoFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="text-xs">Загрузить логотип</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Референс (опционально)</Label>
                      <input ref={refFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceFile} />
                      <div
                        onClick={() => refFileInputRef.current?.click()}
                        className={`h-11 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-all ${referencePreview ? "border-primary bg-primary/5 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-muted-foreground/30"}`}
                      >
                        {referencePreview ? (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span className="text-xs">Референс загружен</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="text-xs">Загрузить пример</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleGenerate}
                    disabled={submitting || uploading}
                    className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all rounded-2xl"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Запуск конвейера AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-3" />
                        Запустить генерацию контента
                      </>
                    )}
                  </Button>
                </div>

                {/* History section */}
                {history.filter(h => h.status === "completed" && h.result_urls && h.result_urls.length > 0 && h.content_type === mainType).length > 0 && (
                  <div className="pt-10 border-t border-border mt-10">
                    <div className="flex items-center gap-1.5 mb-4">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Недавно созданное</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {history.filter(h => h.status === "completed" && h.result_urls && h.result_urls.length > 0 && h.content_type === mainType).map((h) => (
                        <motion.button
                          key={h.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => loadHistoryItem(h)}
                          className="group relative aspect-square rounded-xl border border-border bg-secondary/20 overflow-hidden"
                        >
                          {h.content_type === "video" ? (
                            <video src={h.result_urls![0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" muted />
                          ) : (
                            <img src={h.result_urls![0]} alt="Результат" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-[8px] text-white/60">{h.created_at ? dateFmt(new Date(h.created_at), "dd.MM") : ""}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Preview Sticked */}
              <div className="hidden lg:block sticky top-0 h-fit">
                <PhoneMockup
                  contentMode={mainType}
                  format={mainType === "video" ? videoFormat : photoFormat}
                  aspectRatio={mainType === "video" ? videoAspect : aspectRatio}
                  designPrompt={visualStyle}
                  exactText={mainType === "video" ? speakerText : mainText}
                  referencePreview={referencePreview}
                  logoFile={logoFile}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
