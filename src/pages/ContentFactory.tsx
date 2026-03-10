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

import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";

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
    if (active.id === "hq") {
      setHistory([]);
      return;
    }
    const { data } = await (supabase as any)
      .from("content_tasks")
      .select("id, status, progress_text, result_urls, content_type, created_at")
      .eq("project_id", active.id)
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
        project_id: active.id,
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
        content_type: isCarousel ? "carousel" : mainType,
        source_type: payload.source_type,
        source_url: payload.source_url,
        format: isVideo ? videoFormat : (formatMap[photoFormat] || "fb-target"),
        aspect_ratio: isVideo ? videoAspect : aspectRatio,
        main_text: payload.main_text || "",
        visual_style: payload.visual_style || payload.design_template || "",
        is_carousel: isCarousel,
        num_slides: slideCount,
        slide_count: slideCount,
        custom_logo_url: payload.custom_logo_url,
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
        project_id: active.id,
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
      {active.id === "hq" ? (
        <div className="mx-auto max-w-5xl py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Проект не выбран</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            Выберите или создайте проект в боковой панели, чтобы пользоваться Контент-Заводом
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl py-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Генерация видео и фото контента с помощью AI</p>

          <div className="max-w-3xl">
            {/* History */}
            {history.filter(h => h.status === "completed" && h.result_urls && h.result_urls.length > 0 && h.content_type === mainType).length > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Последние {mainType === "video" ? "видео" : "фото"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {history.filter(h => h.status === "completed" && h.result_urls && h.result_urls.length > 0 && h.content_type === mainType).map((h) => (
                    <div key={h.id} className="relative group">
                      <button
                        onClick={() => {
                          setTask(h);
                          setTaskId(h.id);
                        }}
                        className="w-full text-left rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 overflow-hidden transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square bg-secondary/30 overflow-hidden">
                          {h.content_type === "video" ? (
                            <video src={h.result_urls![0]} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={h.result_urls![0]} alt="Результат" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-foreground">
                              {h.content_type === "video" ? "🎬 Видео" : "📸 Фото"}
                              {h.result_urls!.length > 1 && ` (${h.result_urls!.length})`}
                            </span>
                          </div>
                          {h.created_at && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {dateFmt(new Date(h.created_at), "dd.MM HH:mm")}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await (supabase as any).from("content_tasks").delete().eq("id", h.id);
                            fetchHistory();
                            toast({ title: "Удалено" });
                          } catch { toast({ title: "Ошибка", variant: "destructive" }); }
                        }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
