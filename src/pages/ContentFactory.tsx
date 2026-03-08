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
import { Video, Image, Link, FileText, Upload, Download, Loader2, CheckCircle2, RotateCcw, Sparkles, Send, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneMockup } from "@/components/content/PhoneMockup";
import { format as dateFmt } from "date-fns";

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
    const { data } = await (supabase as any)
      .from("content_tasks")
      .select("id, status, progress_text, result_urls, content_type, created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
    if (data) setHistory(data as ContentTask[]);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`content_task_${taskId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "content_tasks", filter: `id=eq.${taskId}` }, (payload) => {
        const row = payload.new as any;
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

  // Magic AI auto-fill
  const handleMagicAI = async () => {
    if (!sourceUrl.trim()) {
      toast({ title: "Укажите ссылку", description: "Вставьте ссылку, чтобы AI мог проанализировать контент", variant: "destructive" });
      return;
    }
    setMagicLoading(true);
    // Simulate AI analysis (in production this calls an edge function)
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
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type, created_at")
        .single();
      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const formatMap: Record<string, string> = { banner: "fb-target", carousel7: "insta-carousel", carousel10: "insta-carousel" };
      const n8nPayload = {
        task_id: data.id,
        content_type: mainType,
        source_type: payload.source_type,
        source_url: payload.source_url,
        format: isVideo ? videoFormat : (formatMap[photoFormat] || "fb-target"),
        aspect_ratio: isVideo ? videoAspect : aspectRatio,
        main_text: payload.main_text || "",
        visual_style: payload.visual_style || payload.design_template || "",
        slide_count: photoFormat === "carousel10" ? 10 : photoFormat === "carousel7" ? 7 : 1,
        custom_logo_url: payload.custom_logo_url,
      };

      try {
        await fetch("https://n8n.zapoinov.com/webhook/content-factory-v2", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n8nPayload),
        });
      } catch (webhookErr) { console.error("n8n webhook error:", webhookErr); }
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
      const a = document.createElement("a");
      a.href = url; a.download = ""; a.target = "_blank"; a.click();
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
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--status-good))]" />
              <h2 className="text-lg font-semibold text-foreground">Генерация завершена!</h2>
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
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-base transition-colors ${
                      stage.done ? "bg-primary/20 shadow-sm" : "bg-secondary/40"
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
      <div className="mx-auto max-w-5xl py-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Генерация видео и фото контента с помощью AI</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* LEFT: Form */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-8">
            {/* Type toggle */}
            <Tabs value={mainType} onValueChange={(v) => setMainType(v as "video" | "photo")}>
              <TabsList className="w-full grid grid-cols-2 h-12 bg-secondary/60">
                <TabsTrigger value="video" className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Video className="mr-2 h-4 w-4" /> Видео (9:16)
                </TabsTrigger>
                <TabsTrigger value="photo" className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Image className="mr-2 h-4 w-4" /> Фото / Карусель
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* VIDEO MODE */}
            {mainType === "video" && (
              <div className="space-y-6">
                <Tabs value={videoMode} onValueChange={(v) => setVideoMode(v as "link" | "description")}>
                  <TabsList className="h-9 bg-secondary/40">
                    <TabsTrigger value="link" className="text-xs data-[state=active]:bg-background"><Link className="mr-1.5 h-3.5 w-3.5" />По ссылке</TabsTrigger>
                    <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background"><FileText className="mr-1.5 h-3.5 w-3.5" />По описанию</TabsTrigger>
                  </TabsList>
                </Tabs>

                {videoMode === "link" ? (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Ссылка на видео</Label>
                    <div className="flex gap-2">
                      <Input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="YouTube, TikTok или Reels" className="h-11 bg-secondary/30 border-border flex-1" />
                      <Button onClick={handleMagicAI} disabled={magicLoading} variant="outline" size="icon" className="h-11 w-11 border-border shrink-0" title="Магия AI">
                        {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground/70">AI проанализирует видео и создаст уникальный аналог в формате 9:16</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Описание визуала</Label>
                      <Textarea value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} placeholder="Опишите стиль, цвета, композицию и что должно быть изображено…" className="min-h-[100px] bg-secondary/30 border-border resize-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Текст для AI-Спикера</Label>
                      <Textarea value={speakerText} onChange={(e) => setSpeakerText(e.target.value)} placeholder="Точный текст, который будет озвучен (слово в слово)" className="min-h-[100px] bg-secondary/30 border-border resize-none" />
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-secondary/20 border border-border p-3">
                  <p className="text-xs text-muted-foreground">📐 Видео всегда генерируется в формате <span className="font-semibold text-foreground">9:16</span> (Reels / Stories / Shorts)</p>
                </div>
              </div>
            )}

            {/* PHOTO MODE */}
            {mainType === "photo" && (
              <div className="space-y-8">
                <Tabs value={photoMode} onValueChange={(v) => setPhotoMode(v as "link" | "description")}>
                  <TabsList className="h-9 bg-secondary/40">
                    <TabsTrigger value="link" className="text-xs data-[state=active]:bg-background"><Link className="mr-1.5 h-3.5 w-3.5" />По ссылке</TabsTrigger>
                    <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background"><FileText className="mr-1.5 h-3.5 w-3.5" />По описанию</TabsTrigger>
                  </TabsList>
                </Tabs>

                {photoMode === "link" ? (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Ссылка на референс</Label>
                    <div className="flex gap-2">
                      <Input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Ссылка на пример дизайна, пост или рекламу" className="h-11 bg-secondary/30 border-border flex-1" />
                      <Button onClick={handleMagicAI} disabled={magicLoading} variant="outline" size="icon" className="h-11 w-11 border-border shrink-0" title="Магия AI">
                        {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                      </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input ref={refFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceFile} />
                      <Button variant="ghost" size="sm" onClick={() => refFileInputRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
                        <Upload className="h-3 w-3" /> Или загрузить изображение
                      </Button>
                      {referencePreview && <span className="text-xs text-muted-foreground">✓ Загружено</span>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Описание визуала</Label>
                    <Textarea value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} placeholder="Опишите стиль, цвета, композицию и что должно быть изображено…" className="min-h-[100px] bg-secondary/30 border-border resize-none" />
                  </div>
                )}

                {/* Format */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Формат</Label>
                  <RadioGroup value={photoFormat} onValueChange={setPhotoFormat} className="grid grid-cols-3 gap-3">
                    {[
                      { value: "banner", label: "ADS Баннер", sub: "1 картинка" },
                      { value: "carousel7", label: "Карусель", sub: "7 слайдов" },
                      { value: "carousel10", label: "Карусель", sub: "10 слайдов" },
                    ].map((opt) => (
                      <Label key={opt.value} htmlFor={opt.value} className={`flex flex-col items-center gap-1 rounded-lg border p-4 cursor-pointer transition-colors ${photoFormat === opt.value ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-secondary/20 hover:bg-secondary/40"}`}>
                        <RadioGroupItem value={opt.value} id={opt.value} className="sr-only" />
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.sub}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Aspect ratio */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Соотношение сторон</Label>
                  <Tabs value={aspectRatio} onValueChange={setAspectRatio}>
                    <TabsList className="h-9 bg-secondary/40">
                      <TabsTrigger value="1:1" className="text-xs data-[state=active]:bg-background">1:1 Квадрат</TabsTrigger>
                      <TabsTrigger value="4:5" className="text-xs data-[state=active]:bg-background">4:5 Лента</TabsTrigger>
                      <TabsTrigger value="9:16" className="text-xs data-[state=active]:bg-background">9:16 Stories</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Slide text */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Текст для слайдов</Label>
                  <Textarea value={mainText} onChange={(e) => setMainText(e.target.value)} placeholder="Каждая новая строка — новый слайд. Для баннера — одна строка." className="min-h-[120px] bg-secondary/30 border-border resize-none" />
                </div>

                {/* Design */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Дизайн и стиль</Label>
                  <Tabs value={designTab} onValueChange={(v) => setDesignTab(v as "ready" | "my")}>
                    <TabsList className="h-9 bg-secondary/40 mb-3">
                      <TabsTrigger value="ready" className="text-xs data-[state=active]:bg-background">Готовые стили</TabsTrigger>
                      <TabsTrigger value="my" className="text-xs data-[state=active]:bg-background">Мои шаблоны</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {designTab === "ready" ? (
                    <div>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger className="h-11 bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Современный</SelectItem>
                          <SelectItem value="tech">Технологичный</SelectItem>
                          <SelectItem value="stylish">Стильный</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={designTemplate} onValueChange={setDesignTemplate}>
                        <SelectTrigger className="h-11 bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tmpl1">Шаблон «Минимализм»</SelectItem>
                          <SelectItem value="tmpl2">Шаблон «Премиум»</SelectItem>
                          <SelectItem value="tmpl3">Шаблон «Яркий»</SelectItem>
                        </SelectContent>
                      </Select>
                      <input ref={fileInputRef} type="file" accept="image/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-border text-muted-foreground hover:text-foreground">
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {logoFile ? logoFile.name : "Загрузить Логотип / Шрифт"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button onClick={handleGenerate} disabled={submitting} className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />{uploading ? "Загрузка файлов..." : "Отправка..."}</>) : "🚀 Запустить генерацию"}
              </Button>
            </div>
          </div>

          {/* RIGHT: Phone Mockup + History */}
          <div className="space-y-6">
            {/* Phone preview */}
            <div className="sticky top-4">
              <PhoneMockup
                contentMode={mainType}
                format={mainType === "video" ? "reels" : photoFormat}
                aspectRatio={mainType === "video" ? videoAspect : aspectRatio}
                designPrompt={visualStyle}
                exactText={mainType === "video" ? speakerText : mainText}
                referencePreview={referencePreview}
                logoFile={logoFile}
              />

              {/* History */}
              {history.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">История</span>
                  </div>
                  <div className="space-y-1.5">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => loadHistoryItem(h)}
                        className="w-full text-left rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 p-2.5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-foreground">
                            {h.content_type === "video" ? "🎬" : "📸"} {h.content_type === "video" ? "Видео" : "Фото"}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            h.status === "completed" ? "bg-primary/10 text-primary" :
                            h.status === "error" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {h.status === "completed" ? "✓" : h.status === "error" ? "✗" : "⏳"}
                          </span>
                        </div>
                        {h.created_at && (
                          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                            {dateFmt(new Date(h.created_at), "dd.MM HH:mm")}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
