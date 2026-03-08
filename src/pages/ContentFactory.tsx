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
import { Video, Image, Link, FileText, Upload, Download, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
}

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

  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Generation state
  const [submitting, setSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<ContentTask | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`content_task_${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "content_tasks",
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          const row = payload.new as any;
          setTask({
            id: row.id,
            status: row.status,
            progress_text: row.progress_text,
            result_urls: row.result_urls,
            content_type: row.content_type,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleGenerate = async () => {
    setSubmitting(true);

    try {
      // Upload logo if present
      let customLogoUrl: string | null = null;
      if (logoFile) {
        setUploading(true);
        customLogoUrl = await uploadFile(logoFile);
        setUploading(false);
        if (!customLogoUrl) {
          setSubmitting(false);
          return;
        }
      }

      // Build payload
      const isVideo = mainType === "video";
      const mode = isVideo ? videoMode : photoMode;
      const payload: Record<string, any> = {
        content_type: mainType,
        source_type: mode,
        source_url: mode === "link" ? sourceUrl : null,
        visual_style: isVideo && mode === "description" ? visualStyle : null,
        main_text: isVideo && mode === "description" ? speakerText : (!isVideo ? mainText : null),
        format: isVideo ? null : photoFormat,
        aspect_ratio: isVideo ? null : aspectRatio,
        design_template: !isVideo ? (designTab === "ready" ? designStyle : designTemplate) : null,
        custom_logo_url: customLogoUrl,
      };

      const { data, error } = await (supabase as any)
        .from("content_tasks")
        .insert(payload)
        .select("id, status, progress_text, result_urls, content_type")
        .single();

      if (error) throw error;

      setTask(data as ContentTask);
      setTaskId(data.id);

      // Map frontend format to n8n format
      const formatMap: Record<string, string> = {
        banner: "fb-target",
        carousel7: "insta-carousel",
        carousel10: "insta-carousel",
      };

      // Trigger n8n Content Factory workflow
      const n8nPayload = {
        task_id: data.id,
        content_type: mainType,
        source_type: payload.source_type,
        source_url: payload.source_url,
        format: formatMap[photoFormat] || "fb-target",
        aspect_ratio: aspectRatio,
        main_text: payload.main_text || "",
        visual_style: payload.visual_style || payload.design_template || "",
        slide_count: photoFormat === "carousel10" ? 10 : photoFormat === "carousel7" ? 7 : 1,
        custom_logo_url: payload.custom_logo_url,
      };

      try {
        await fetch("https://n8n.zapoinov.com/webhook/content-factory-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
        });
      } catch (webhookErr) {
        console.error("n8n webhook error:", webhookErr);
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTaskId(null);
    setTask(null);
    setSourceUrl("");
    setVisualStyle("");
    setSpeakerText("");
    setMainText("");
    setLogoFile(null);
  };

  const handleDownloadAll = async () => {
    if (!task?.result_urls) return;
    for (const url of task.result_urls) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.target = "_blank";
      a.click();
    }
  };

  const pipelineSteps = [
    { key: "analyze", label: "Обработка запроса", icon: "🔍" },
    { key: "generate", label: "Создание изображения", icon: "🎨" },
    { key: "text", label: "Добавление текста", icon: "✍️" },
    { key: "prepare", label: "Подготовка к загрузке", icon: "📦" },
    { key: "done", label: "Отправлено в группу", icon: "✅" },
  ];

  const getActiveStep = (): number => {
    if (!task) return -1;
    const t = (task.progress_text || "").toLowerCase();
    if (task.status === "completed") return 4;
    if (t.includes("отправ") || t.includes("загруз") || t.includes("готов")) return 3;
    if (t.includes("текст") || t.includes("шрифт") || t.includes("overlay")) return 2;
    if (t.includes("генер") || t.includes("render") || t.includes("изображ") || t.includes("créat") || t.includes("рендер")) return 1;
    if (task.status === "processing") return 1;
    if (task.status === "pending") return 0;
    return 0;
  };

  const activeStep = getActiveStep();

  const progressPercent =
    !task ? 0
    : task.status === "completed" ? 100
    : activeStep >= 0 ? Math.min(95, ((activeStep + 1) / pipelineSteps.length) * 100)
    : 0;

  // ---- RENDER ----

  // RESULT VIEW
  if (task && task.status === "completed" && task.result_urls && task.result_urls.length > 0) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Результат генерации</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--status-good))]" />
              <h2 className="text-lg font-semibold text-foreground">Генерация завершена!</h2>
            </div>

            {task.content_type === "video" ? (
              <div className="space-y-4">
                {task.result_urls.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border bg-black">
                    <video
                      src={url}
                      controls
                      className="w-full max-h-[500px]"
                      poster=""
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {task.result_urls.map((url, i) => (
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
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDownloadAll}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                📥 Скачать всё
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2 border-border">
                <RotateCcw className="h-4 w-4" />
                Создать ещё
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // PROGRESS VIEW
  if (task && (task.status === "pending" || task.status === "processing")) {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Генерация контента</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-8 space-y-8"
          >
            {/* Glowing orb animation */}
            <div className="flex justify-center">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full bg-primary/40 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary shadow-[0_0_30px_hsl(var(--primary)/0.5)]" />
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <Progress
                value={progressPercent}
                className="h-2.5 bg-secondary/40 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000"
              />
              <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={task.progress_text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm font-medium text-foreground"
                  >
                    {task.progress_text || "Запуск завода..."}
                  </motion.p>
                </AnimatePresence>
                <span className="text-xs text-muted-foreground tabular-nums">{progressPercent}%</span>
              </div>
            </div>

            {task.status === "processing" && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center text-sm text-muted-foreground"
              >
                AI рендерит материалы...
              </motion.p>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ERROR VIEW
  if (task && task.status === "error") {
    return (
      <DashboardLayout breadcrumb="Контент-Завод">
        <div className="mx-auto max-w-3xl py-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
          <p className="text-sm text-muted-foreground mb-8">Ошибка генерации</p>
          <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4">
            <p className="text-sm text-destructive">{task.progress_text || "Произошла ошибка"}</p>
            <Button onClick={handleReset} variant="outline" className="gap-2 border-border">
              <RotateCcw className="h-4 w-4" />
              Попробовать снова
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // FORM VIEW
  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-3xl py-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Контент-Завод</h1>
        <p className="text-sm text-muted-foreground mb-8">Генерация видео и фото контента с помощью AI</p>

        <div className="rounded-xl border border-border bg-card p-6 space-y-8">
          {/* Type toggle */}
          <Tabs value={mainType} onValueChange={(v) => setMainType(v as "video" | "photo")}>
            <TabsList className="w-full grid grid-cols-2 h-12 bg-secondary/60">
              <TabsTrigger value="video" className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Video className="mr-2 h-4 w-4" />
                Видео (Sora 2)
              </TabsTrigger>
              <TabsTrigger value="photo" className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Image className="mr-2 h-4 w-4" />
                Фото / Карусель
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* VIDEO MODE */}
          {mainType === "video" && (
            <div className="space-y-6">
              <Tabs value={videoMode} onValueChange={(v) => setVideoMode(v as "link" | "description")}>
                <TabsList className="h-9 bg-secondary/40">
                  <TabsTrigger value="link" className="text-xs data-[state=active]:bg-background">
                    <Link className="mr-1.5 h-3.5 w-3.5" />По ссылке
                  </TabsTrigger>
                  <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />По описанию
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {videoMode === "link" ? (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Ссылка на видео</Label>
                  <Input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Вставьте ссылку на YouTube, TikTok или Reels"
                    className="h-11 bg-secondary/30 border-border"
                  />
                  <p className="text-xs text-muted-foreground/70">AI проанализирует видео и создаст уникальный аналог.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Визуальный стиль и детали</Label>
                    <Textarea
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      placeholder="Что должно происходить на экране — стиль, сцена, движение камеры…"
                      className="min-h-[100px] bg-secondary/30 border-border resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Текст для AI-Спикера</Label>
                    <Textarea
                      value={speakerText}
                      onChange={(e) => setSpeakerText(e.target.value)}
                      placeholder="Точный текст, который будет озвучен (слово в слово)"
                      className="min-h-[100px] bg-secondary/30 border-border resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHOTO MODE */}
          {mainType === "photo" && (
            <div className="space-y-8">
              <Tabs value={photoMode} onValueChange={(v) => setPhotoMode(v as "link" | "description")}>
                <TabsList className="h-9 bg-secondary/40">
                  <TabsTrigger value="link" className="text-xs data-[state=active]:bg-background">
                    <Link className="mr-1.5 h-3.5 w-3.5" />По ссылке
                  </TabsTrigger>
                  <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />По описанию
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {photoMode === "link" ? (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Ссылка на референс</Label>
                  <Input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Вставьте ссылку на пример дизайна, пост или рекламу"
                    className="h-11 bg-secondary/30 border-border"
                  />
                  <p className="text-xs text-muted-foreground/70">AI проанализирует пример и создаст уникальный аналог в выбранном формате.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Описание визуала</Label>
                  <Textarea
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    placeholder="Опишите стиль, цвета, композицию и что должно быть изображено…"
                    className="min-h-[100px] bg-secondary/30 border-border resize-none"
                  />
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
                    <Label
                      key={opt.value}
                      htmlFor={opt.value}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                        photoFormat === opt.value
                          ? "border-primary/60 bg-primary/[0.06]"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
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
                <Textarea
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  placeholder="Каждая новая строка — новый слайд. Для баннера — одна строка."
                  className="min-h-[120px] bg-secondary/30 border-border resize-none"
                />
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
                  <Select value={designStyle} onValueChange={setDesignStyle}>
                    <SelectTrigger className="h-11 bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Современный</SelectItem>
                      <SelectItem value="tech">Технологичный</SelectItem>
                      <SelectItem value="stylish">Стильный</SelectItem>
                    </SelectContent>
                  </Select>
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
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {logoFile ? logoFile.name : "Загрузить Логотип / Шрифт"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <Button
              onClick={handleGenerate}
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
      </div>
    </DashboardLayout>
  );
}
