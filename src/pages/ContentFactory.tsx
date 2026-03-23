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
  Play
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace, HQ_ID } from "@/hooks/useWorkspace";
import { PhoneMockup } from "@/components/content/PhoneMockup";
import ScenarioCreator from "@/components/content/ScenarioCreator";
import { cn } from "@/lib/utils";
import { CfButtonMd, CfH1, CfH2, CfH3, CfSection, cfStyles } from "@/components/content/contentFactoryDesignSystem";

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
  const [abVariant, setAbVariant] = useState<"A" | "B">("A");
  const [sessionId, setSessionId] = useState("");

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
  }, [history.length, task?.status]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    let query = (supabase as any).from("content_tasks").select("id, status, progress_text, result_urls, content_type, created_at");

    if (active.id !== HQ_ID) {
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
        project_id: active.id === HQ_ID ? null : active.id,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type, created_at")
        .single();
      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      const formatMap: Record<string, string> = { banner: "fb-target", "carousel-7": "insta-carousel", "carousel-10": "insta-carousel" };

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

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening the task
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;

    try {
      const { error } = await (supabase as any)
        .from("content_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Удалено", description: "Запись успешно удалена" });
      setHistory(prev => prev.filter(t => t.id !== id));
      if (taskId === id) {
        setTask(null);
        setTaskId(null);
      }
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    }
  };

  const loadHistoryItem = (item: ContentTask) => {
    setTask(item);
    setTaskId(item.id);
  };

  const progressPercent = !task ? 0 : task.status === "pending" ? 10 : task.status === "processing" ? 60 : task.status === "completed" ? 100 : 0;

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

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] border border-border/40 bg-card p-10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            
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
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className={cn(cfStyles.page, "flex flex-col h-[calc(100vh-100px)] min-h-[680px]")}>

        {/* Premium Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/40">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Layers className="h-6 w-6 text-primary" />
              </div>
              <CfH1 className="uppercase">Контент-Завод</CfH1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] px-3 py-1 uppercase tracking-widest">Новый интерфейс</Badge>
            </div>
            <p className={cfStyles.hint}>Создавайте сценарии и креативы в одном понятном рабочем пространстве.</p>
          </div>

          <div className="flex flex-wrap bg-muted/50 p-1.5 rounded-2xl border border-border shadow-inner">
            <button
              onClick={() => setPageTab("scenario")}
              className={cn(
                cfStyles.tabButton,
                pageTab === "scenario" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4" /> Сценарий
            </button>
            <button
              onClick={() => setPageTab("create")}
              className={cn(
                cfStyles.tabButton,
                pageTab === "create" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus className="h-4 w-4" /> Создать
            </button>
            <button
              onClick={() => setPageTab("my-content")}
              className={cn(
                cfStyles.tabButton,
                pageTab === "my-content" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-4 w-4" /> История
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">

          {pageTab === "scenario" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10 flex justify-center">
              <ScenarioCreator />
            </div>
          )}

          {pageTab === "my-content" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-8">
              <CfSection className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CfH2>Метрики A/B теста интерфейса</CfH2>
                  <Badge variant="outline" className={cn("text-xs", abStats.reachedGoal ? "text-green-600 border-green-600/30 bg-green-500/10" : "text-primary border-primary/30 bg-primary/10")}>
                    {abStats.totalSessions}/50 пользователей
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/40 bg-background p-4">
                    <p className={cfStyles.label}>Вовлеченность</p>
                    <p className="text-2xl font-black mt-2">{abStats.engagementRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background p-4">
                    <p className={cfStyles.label}>Завершение задач</p>
                    <p className="text-2xl font-black mt-2">{abStats.completionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background p-4">
                    <p className={cfStyles.label}>Среднее время</p>
                    <p className="text-2xl font-black mt-2">{abStats.avgTaskSec || 0}с</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background p-4">
                    <p className={cfStyles.label}>Вариант</p>
                    <p className="text-2xl font-black mt-2">{abVariant}</p>
                  </div>
                </div>
                <p className={cfStyles.hint}>
                  Метрики считаются автоматически по событиям интерфейса. После 50 сессий можно фиксировать итог A/B теста.
                </p>
              </CfSection>
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                   <div className="h-12 w-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                   <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Загрузка истории...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                   <div className="h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center border border-border/50 shadow-inner">
                      <Clock className="h-10 w-10 text-muted-foreground/20" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-foreground uppercase">История пуста</h3>
                      <p className="text-muted-foreground text-sm font-medium">Вы еще не создали ни одного креатива.</p>
                   </div>
                   <Button onClick={() => setPageTab("create")} className="h-11 px-8 rounded-2xl bg-primary/10 text-primary border border-primary/20 font-bold hover:bg-primary/20">
                      Создать первый контент
                   </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {history.map((task, idx) => (
                      <motion.div 
                        layout
                        key={task.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }}
                        className="group relative rounded-[2rem] border border-border/50 bg-card hover:bg-card hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-xl cursor-pointer p-5 space-y-4" 
                        onClick={() => loadHistoryItem(task)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               {task.content_type === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{task.content_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn(
                               "text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-md border-none h-4",
                               task.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"
                             )}>
                               {task.status === "completed" ? "Готово" : "В процессе"}
                             </Badge>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
                               onClick={(e) => handleDeleteTask(task.id, e)}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
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
                        
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                           <span>{task.created_at ? dateFmt(new Date(task.created_at), "dd MMM, HH:mm") : ""}</span>
                           <span className="group-hover:text-primary transition-colors">Смотреть →</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {pageTab === "create" && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 min-h-0">
              {/* Form Section */}
              <div className="overflow-y-auto pr-6 space-y-10 pb-16 custom-scrollbar">

                {/* 1. Type and Source */}
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Настройка формата</h3>
                     </div>
                     <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/60 shadow-inner">
                        {(["video", "photo"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setMainType(t)}
                            className={cn(
                              "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                              mainType === t ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {t === "video" ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                            {t === "video" ? "Видео" : "Фото"}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Источник контента</Label>
                    <div className="flex bg-background rounded-2xl p-1.5 border border-border/40 shadow-inner">
                      <button 
                        onClick={() => mainType === "video" ? setVideoMode("link") : setPhotoMode("link")} 
                        className={cn(
                          "flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                          (mainType === "video" ? videoMode : photoMode) === "link" ? "bg-card text-primary shadow-md ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link className="h-4 w-4" /> Ссылка
                      </button>
                      <button 
                        onClick={() => mainType === "video" ? setVideoMode("description") : setPhotoMode("description")} 
                        className={cn(
                          "flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                          (mainType === "video" ? videoMode : photoMode) === "description" ? "bg-card text-primary shadow-md ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileText className="h-4 w-4" /> Описание
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Dynamic Inputs */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                     <Layout className="h-5 w-5 text-primary" />
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Детали креатива</h3>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {(mainType === "video" ? videoMode : photoMode) === "link" ? (
                      <motion.div key="link" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-6">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Ссылка на продукт или страницу</Label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Input 
                            value={sourceUrl} 
                            onChange={e => setSourceUrl(e.target.value)} 
                            placeholder="https://mysite.com/product" 
                            className="h-14 bg-background border-border/40 text-sm font-bold rounded-2xl focus-visible:ring-primary/20" 
                          />
                          <Button 
                            onClick={handleMagicAI} 
                            disabled={magicLoading || !sourceUrl} 
                            variant="outline" 
                            className="h-14 px-8 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                          >
                            {magicLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />} 
                            Заполнить ТЗ
                          </Button>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground/40 italic px-2">
                           AI проанализирует содержимое страницы и автоматически заполнит параметры ниже.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div key="desc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Визуальный стиль</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMagicExpand("visualStyle", visualStyle, setVisualStyle)} 
                              className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-2" /> AI Улучшить
                            </Button>
                          </div>
                          <Textarea 
                            value={visualStyle} 
                            onChange={e => setVisualStyle(e.target.value)} 
                            placeholder="Напр: Минимализм, Apple style, динамичные переходы..." 
                            className="min-h-[100px] bg-background border-border/40 text-sm font-bold rounded-2xl focus-visible:ring-primary/20 resize-none" 
                          />
                        </div>
                        
                        <div className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                               {mainType === "video" ? "Текст диктора" : "Текст на слайдах"}
                            </Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMagicExpand(mainType === "video" ? "speakerText" : "mainText", mainType === "video" ? speakerText : mainText, mainType === "video" ? setSpeakerText : setMainText)} 
                              className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-2" /> AI Продумать
                            </Button>
                          </div>
                          <Textarea 
                            value={mainType === "video" ? speakerText : mainText} 
                            onChange={e => mainType === "video" ? setSpeakerText(e.target.value) : setMainText(e.target.value)} 
                            placeholder={mainType === "video" ? "О чем должен говорить диктор?" : "Заголовок, оффер, призыв к действию..."} 
                            className="min-h-[140px] bg-background border-border/40 text-sm font-bold rounded-2xl focus-visible:ring-primary/20 resize-none" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-8">
                    <div className="space-y-4 p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Формат</Label>
                      {mainType === "video" ? (
                        <RadioGroup value={videoFormat} onValueChange={(v: any) => setVideoFormat(v)} className="grid grid-cols-2 gap-3">
                          {["reels", "slideshow"].map(f => (
                            <Label 
                              key={f} 
                              className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                                videoFormat === f ? "border-primary bg-primary/5" : "border-border/40 bg-background hover:bg-background"
                              )}
                            >
                              <RadioGroupItem value={f} className="sr-only" />
                              <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center mb-1">
                                 {f === 'reels' ? <Smartphone className="h-5 w-5" /> : <Layout className="h-5 w-5" />}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Select value={photoFormat} onValueChange={setPhotoFormat}>
                          <SelectTrigger className="h-14 bg-background border-border/40 rounded-2xl font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/40">
                            <SelectItem value="banner">ADS Баннер (Static)</SelectItem>
                            <SelectItem value="carousel-7">Карусель (7 слайдов)</SelectItem>
                            <SelectItem value="carousel-10">Карусель (10 слайдов)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div className="space-y-4 p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Пропорции</Label>
                      <Tabs value={mainType === "video" ? videoAspect : aspectRatio} onValueChange={setAspectRatio} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-background h-14 p-1.5 rounded-2xl border border-border/40 shadow-inner">
                          <TabsTrigger value="1:1" disabled={mainType === "video"} className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md">1:1</TabsTrigger>
                          <TabsTrigger value="4:5" disabled={mainType === "video"} className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md">4:5</TabsTrigger>
                          <TabsTrigger value="9:16" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md">9:16</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4 p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Брендинг (Лого)</Label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        className={cn(
                          "h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 gap-3 group",
                          logoFile ? "border-primary bg-primary/5" : "border-border/40 bg-background hover:bg-background"
                        )}
                      >
                        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground max-w-[150px] text-center truncate">
                           {logoFile ? logoFile.name : "Нажми для загрузки"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">Пример (Референс)</Label>
                      <input ref={refFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceFile} />
                      <div 
                        onClick={() => refFileInputRef.current?.click()} 
                        className={cn(
                          "h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 gap-3 group",
                          referencePreview ? "border-primary bg-primary/5" : "border-border/40 bg-background hover:bg-background"
                        )}
                      >
                        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                           {referencePreview ? "Стиль выбран" : "Пример визуала"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={submitting || uploading} 
                    className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 rounded-[2rem] transition-all hover:scale-[1.01] active:scale-95 border-b-4 border-primary-foreground/20 active:border-b-0"
                  >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Sparkles className="h-6 w-6 mr-3" />} 
                    Запустить AI генерацию
                  </Button>
                </div>
              </div>

              {/* Preview Section */}
              <div className="hidden lg:block sticky top-0 h-fit py-4">
                 <div className="relative group">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
