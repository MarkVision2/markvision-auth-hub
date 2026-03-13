import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Send,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import { PhoneMockup } from "@/components/content/PhoneMockup";
import ScenarioCreator from "@/components/content/ScenarioCreator";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
  created_at?: string;
}

const MAX_HISTORY = 12;

export default function ContentFactory() {
  const { active } = useWorkspace();
  const [pageTab, setPageTab] = useState<"scenario" | "create" | "my-content">("scenario");
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const [videoFormat, setVideoFormat] = useState<"reels" | "slideshow">("reels");
  const videoAspect = "9:16";

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    let query = (supabase as any).from("content_tasks").select("id, status, progress_text, result_urls, content_type, created_at");

    if (active.id !== "hq") {
      query = query.eq("project_id", active.id);
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
    if (data) setHistory(data as ContentTask[]);
    setLoadingHistory(false);
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
        visual_style: visualStyle || null,
        main_text: isVideo ? speakerText : mainText,
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

      const webhookRes = await fetch("https://n8n.zapoinov.com/webhook/content-factory-v2", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n8nPayload),
      });
      if (!webhookRes.ok) {
        toast({ title: "Ошибка связи с сервером", description: `Статус: ${webhookRes.status}`, variant: "destructive" });
      } else {
        toast({ title: "🚀 Генерация запущена!" });
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

  const loadHistoryItem = (item: ContentTask) => {
    setTask(item);
    setTaskId(item.id);
  };

  const progressPercent = !task ? 0 : task.status === "pending" ? 10 : task.status === "processing" ? 60 : task.status === "completed" ? 100 : 0;

  // Stage indicator logic for progress view
  const pipelineStages = [
    { label: "Анализ", icon: "📋", done: progressPercent >= 10 },
    { label: "Генерация", icon: "🎨", done: progressPercent >= 40 },
    { label: "Рендер", icon: "⚙️", done: progressPercent >= 70 },
    { label: "Готово", icon: "🚀", done: progressPercent >= 100 },
  ];

  // 1. Result View
  if (task && task.status === "completed" && task.result_urls && task.result_urls.length > 0) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-4xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Результат генерации</p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 space-y-6">
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
                  <motion.div key={i} className="flex-shrink-0 snap-center">
                    <img src={url} alt={`Слайд ${i + 1}`} className="rounded-lg border border-border max-h-[400px] object-contain" />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleReset} variant="outline" className="gap-2 border-border">
                <RotateCcw className="h-4 w-4" /> Создать ещё
              </Button>
              {task.result_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <Button className="gap-2 bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))]/90 text-white">
                    <Download className="h-4 w-4" /> Скачать {task.result_urls!.length > 1 ? `(${i + 1})` : ""}
                  </Button>
                </a>
              ))}
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
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Генерация контента</p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-8 space-y-8">
            <div className="flex items-center justify-between px-4">
              {pipelineStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base transition-colors ${stage.done ? "bg-primary/20 shadow-sm" : "bg-secondary/40"}`}>
                    {stage.icon}
                  </div>
                  <span className={`text-[10px] font-medium ${stage.done ? "text-foreground" : "text-muted-foreground/50"}`}>{stage.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-2.5 bg-secondary/40" />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{task.progress_text || "Запуск завода..."}</p>
                <span className="text-xs text-muted-foreground tabular-nums">{progressPercent}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // 3. Main Interface
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-6xl py-4 flex flex-col h-[calc(100vh-80px)]">

        {/* Unified Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Создание сценария и AI генерация</p>
          </div>

          <div className="flex bg-secondary/20 rounded-xl p-1 border border-border">
            <button
              onClick={() => setPageTab("scenario")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "scenario" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Сценарий
            </button>
            <button
              onClick={() => setPageTab("create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "create" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Создать контент
            </button>
            <button
              onClick={() => setPageTab("my-content")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "my-content" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Clock className="h-3.5 w-3.5" /> Мой Контент
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">

          {pageTab === "scenario" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
              <ScenarioCreator />
            </div>
          )}

          {pageTab === "my-content" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">История пуста</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((task) => (
                    <motion.div key={task.id} className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => loadHistoryItem(task)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.content_type === "video" ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                          <span className="text-xs font-bold uppercase tracking-wider">{task.content_type === "video" ? "ВИДЕО" : "ФОТО"}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.status === "completed" ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-primary/10 border-primary/30 text-primary"}`}>
                          {task.status === "completed" ? "ГОТОВО" : "ОЖИДАНИЕ"}
                        </span>
                      </div>
                      {task.result_urls?.[0] && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-secondary/30 relative">
                          {task.content_type === 'video' ? <video src={task.result_urls[0]} className="w-full h-full object-cover" muted /> : <img src={task.result_urls[0]} className="w-full h-full object-cover" />}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">{task.created_at ? dateFmt(new Date(task.created_at), "dd.MM.yyyy HH:mm") : ""}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {pageTab === "create" && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 min-h-0">
              {/* Form Section */}
              <div className="overflow-y-auto pr-4 space-y-8 pb-10 custom-scrollbar">

                {/* 1. Type and Source */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    {(["video", "photo"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setMainType(t)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mainType === t ? "bg-primary text-primary-foreground" : "bg-secondary/20 text-muted-foreground"}`}
                      >
                        {t === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                        {t === "video" ? "Креатив (Видео)" : "Креатив (Фото)"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Источник контента</Label>
                    <div className="flex bg-secondary/10 rounded-xl p-1 border border-border">
                      <button onClick={() => mainType === "video" ? setVideoMode("link") : setPhotoMode("link")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${(mainType === "video" ? videoMode : photoMode) === "link" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                        <Link className="h-3.5 w-3.5" /> Ссылка на продукт
                      </button>
                      <button onClick={() => mainType === "video" ? setVideoMode("description") : setPhotoMode("description")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${(mainType === "video" ? videoMode : photoMode) === "description" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                        <FileText className="h-3.5 w-3.5" /> Описание / Текст
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Dynamic Inputs */}
                <AnimatePresence mode="wait">
                  {(mainType === "video" ? videoMode : photoMode) === "link" ? (
                    <motion.div key="link" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <Label className="text-sm font-medium">Ссылка на сайт или страницу</Label>
                      <div className="flex gap-2">
                        <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." className="h-11 bg-secondary/10 border-border" />
                        <Button onClick={handleMagicAI} disabled={magicLoading || !sourceUrl} variant="outline" className="h-11 border-primary/20 text-primary">
                          {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />} Заполнить ТЗ
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="desc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Визуальный стиль</Label>
                          <Button variant="ghost" size="sm" onClick={() => handleMagicExpand("visualStyle", visualStyle, setVisualStyle)} className="h-7 text-[10px] text-primary">
                            <Sparkles className="h-3 w-3 mr-1" /> AI Улучшить
                          </Button>
                        </div>
                        <Textarea value={visualStyle} onChange={e => setVisualStyle(e.target.value)} placeholder="Опишите желаемый стиль..." className="min-h-[100px] bg-secondary/10 border-border" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">{mainType === "video" ? "Сценарий / Текст диктора" : "Текст на слайдах"}</Label>
                          <Button variant="ghost" size="sm" onClick={() => handleMagicExpand(mainType === "video" ? "speakerText" : "mainText", mainType === "video" ? speakerText : mainText, mainType === "video" ? setSpeakerText : setMainText)} className="h-7 text-[10px] text-primary">
                            <Sparkles className="h-3 w-3 mr-1" /> AI Продумать
                          </Button>
                        </div>
                        <Textarea value={mainType === "video" ? speakerText : mainText} onChange={e => mainType === "video" ? setSpeakerText(e.target.value) : setMainText(e.target.value)} placeholder={mainType === "video" ? "О чем должен говорить диктор?" : "Текст для баннера или карусели..."} className="min-h-[120px] bg-secondary/10 border-border" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3. Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{mainType === "video" ? "Формат видео" : "Формат фото"}</Label>
                      {mainType === "video" ? (
                        <RadioGroup value={videoFormat} onValueChange={(v: any) => setVideoFormat(v)} className="grid grid-cols-2 gap-2">
                          {["reels", "slideshow"].map(f => (
                            <Label key={f} className={`flex flex-col items-center gap-1 rounded-xl border p-3 cursor-pointer transition-all ${videoFormat === f ? "border-primary bg-primary/5" : "border-border bg-secondary/5"}`}>
                              <RadioGroupItem value={f} className="sr-only" />
                              <span className="text-xs font-bold capitalize">{f}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Select value={photoFormat} onValueChange={setPhotoFormat}>
                          <SelectTrigger className="h-11 bg-secondary/10 border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="banner">ADS Баннер</SelectItem>
                            <SelectItem value="carousel7">Карусель (7)</SelectItem>
                            <SelectItem value="carousel10">Карусель (10)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Пропорции</Label>
                      <Tabs value={mainType === "video" ? videoAspect : aspectRatio} onValueChange={setAspectRatio} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-secondary/10 h-10 p-1">
                          <TabsTrigger value="1:1" disabled={mainType === "video"} className="text-[10px]">1:1</TabsTrigger>
                          <TabsTrigger value="4:5" disabled={mainType === "video"} className="text-[10px]">4:5</TabsTrigger>
                          <TabsTrigger value="9:16" className="text-[10px]">9:16</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Брендинг (Лого)</Label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                      <div onClick={() => fileInputRef.current?.click()} className={`h-11 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-all ${logoFile ? "border-primary bg-primary/5" : "border-border bg-secondary/5"}`}>
                        <Upload className="h-4 w-4 mr-2" /> <span className="text-xs">{logoFile ? logoFile.name : "Загрузить лого"}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Пример (Референс)</Label>
                      <input ref={refFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceFile} />
                      <div onClick={() => refFileInputRef.current?.click()} className={`h-11 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-all ${referencePreview ? "border-primary bg-primary/5" : "border-border bg-secondary/5"}`}>
                        <ImageIcon className="h-4 w-4 mr-2" /> <span className="text-xs">{referencePreview ? "Загружено" : "Пример стиля"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button onClick={handleGenerate} disabled={submitting || uploading} className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 shadow-xl rounded-2xl">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />} Запустить генерацию
                  </Button>
                </div>

                {/* Quick History Strip */}
                {history.filter(h => h.status === "completed" && h.content_type === mainType).length > 0 && (
                  <div className="pt-8 border-t border-border">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Недавние результаты</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {history.filter(h => h.status === "completed" && h.content_type === mainType).map(h => (
                        <div key={h.id} onClick={() => loadHistoryItem(h)} className="w-16 h-16 rounded-lg border border-border bg-secondary/5 overflow-hidden flex-shrink-0 cursor-pointer grayscale hover:grayscale-0 transition-all">
                          {h.content_type === 'video' ? <video src={h.result_urls![0]} className="w-full h-full object-cover" /> : <img src={h.result_urls![0]} className="w-full h-full object-cover" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Section */}
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
