import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clapperboard,
  Download,
  FileType,
  Image as ImageIcon,
  Languages,
  Loader2,
  Maximize,
  Music4,
  RefreshCcw,
  Settings2,
  Sparkles,
  Type,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/useWorkspace";

interface AiEditBlockProps {
  onTaskCreated?: (taskId: string) => void;
}

type EditStyle = "viral" | "minimal" | "business";
type IntensityLevel = "low" | "medium" | "high";
type StageId = "idle" | "upload" | "transcription" | "analysis" | "broll" | "rendering" | "completed";

interface ApiStatus {
  taskId: string;
  status: "processing" | "completed";
  stage: StageId;
  progress: number;
  progressText: string;
  transcript?: { text: string; words: Array<{ word: string; start: number; end: number }> };
  scenes?: Array<{ start: number; end: number; type: string; keywords: string[]; emotion: string }>;
  videos?: Array<{ id: string; name: string; url: string; notes: string }>;
}

const EDIT_STYLES: Array<{ id: EditStyle; label: string; helper: string }> = [
  { id: "viral", label: "Viral captions", helper: "Хук, pop-caption, агрессивный ритм" },
  { id: "minimal", label: "Minimal", helper: "Чистая подача с мягкой анимацией" },
  { id: "business", label: "Business clean", helper: "Аккуратный монтаж для эксперта и бренда" },
];

const PIPELINE_STEPS: Array<{ id: StageId; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "transcription", label: "Transcription" },
  { id: "analysis", label: "AI анализ" },
  { id: "broll", label: "B-roll" },
  { id: "rendering", label: "Rendering" },
  { id: "completed", label: "Готово" },
];

export const AiEditBlock: React.FC<AiEditBlockProps> = ({ onTaskCreated }) => {
  const { active } = useWorkspace();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [brollFile, setBrollFile] = useState<File | null>(null);
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<EditStyle>("viral");
  const [format, setFormat] = useState<"9:16" | "1:1">("9:16");
  const [captionLanguage, setCaptionLanguage] = useState("ru");
  const [businessTemplate, setBusinessTemplate] = useState("clinic");
  const [clipDurationMode, setClipDurationMode] = useState<"auto" | "manual">("auto");
  const [clipDurationSec, setClipDurationSec] = useState("6");
  const [intensity, setIntensity] = useState<IntensityLevel>("medium");
  const [autoBroll, setAutoBroll] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);
  const [scriptHint, setScriptHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToken, setTaskToken] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<ApiStatus | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  useEffect(() => {
    if (!taskToken) {
      return;
    }

    let disposed = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai-edit-status?token=${encodeURIComponent(taskToken)}`);
        if (!response.ok) {
          throw new Error(`Статус недоступен: ${response.status}`);
        }
        const nextStatus = (await response.json()) as ApiStatus;
        if (!disposed) {
          setStatus(nextStatus);
          if (nextStatus.status === "completed") {
            setIsSubmitting(false);
          }
        }
      } catch (error: any) {
        if (!disposed) {
          setIsSubmitting(false);
          toast({
            title: "Ошибка статуса",
            description: error.message ?? "Не удалось получить статус задачи",
            variant: "destructive",
          });
        }
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [taskToken]);

  const currentStepIndex = useMemo(() => {
    const stage = status?.stage ?? "idle";
    return PIPELINE_STEPS.findIndex((item) => item.id === stage);
  }, [status?.stage]);

  const uploadAsset = async (file: File, folder: string) => {
    const extension = file.name.split(".").pop() || "bin";
    const path = `ai-edit/${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("content_assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast({
        title: "Видео слишком большое",
        description: "Для MVP лимит загрузки установлен на 150МБ",
        variant: "destructive",
      });
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const startAiEdit = async () => {
    if (!videoFile) {
      toast({
        title: "Нужен исходник",
        description: "Загрузите mp4 или mov перед запуском монтажа",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({
      taskId: "pending",
      status: "processing",
      stage: "upload",
      progress: 8,
      progressText: "Загрузка исходников в storage",
    });

    try {
      const [videoUrl, fontUrl, brollUrl, soundUrl] = await Promise.all([
        uploadAsset(videoFile, "source"),
        fontFile ? uploadAsset(fontFile, "fonts") : Promise.resolve(null),
        brollFile ? uploadAsset(brollFile, "broll") : Promise.resolve(null),
        soundFile ? uploadAsset(soundFile, "sfx") : Promise.resolve(null),
      ]);

      const response = await fetch("/api/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          projectId: active?.id ?? null,
          style,
          format,
          businessTemplate,
          captionLanguage,
          clipDurationMode,
          clipDurationSec: clipDurationMode === "manual" ? Number(clipDurationSec) : null,
          scriptHint,
          options: {
            autoBroll,
            autoZoom,
            intensity,
          },
          assets: {
            fontUrl,
            brollUrl,
            soundUrl,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Не удалось запустить задачу: ${response.status}`);
      }

      const data = (await response.json()) as { taskId: string; taskToken: string };
      setTaskToken(data.taskToken);
      setTaskId(data.taskId);
      onTaskCreated?.(data.taskId);
    } catch (error: any) {
      setIsSubmitting(false);
      setStatus(null);
      toast({
        title: "Ошибка запуска",
        description: error.message ?? "Не удалось запустить ИИ монтаж",
        variant: "destructive",
      });
    }
  };

  const resetTask = () => {
    setTaskToken(null);
    setTaskId(null);
    setStatus(null);
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Input</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Исходное видео и ассеты</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] font-semibold">Remotion</Badge>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <label className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-secondary/10 transition-colors">
                {videoPreview ? (
                  <video src={videoPreview} controls className="h-full w-full object-cover" />
                ) : (
                  <div className="space-y-3 text-center px-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">Загрузить видео</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">MP4 / MOV, до 150 МБ</p>
                    </div>
                  </div>
                )}
                <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleVideoChange} />
              </label>

              <div className="space-y-4">
                <AssetInput
                  icon={Type}
                  title="Шрифт"
                  description=".ttf, опционально"
                  accept=".ttf,font/ttf"
                  file={fontFile}
                  onChange={setFontFile}
                />
                <AssetInput
                  icon={ImageIcon}
                  title="B-roll"
                  description="доп. видео, опционально"
                  accept="video/*"
                  file={brollFile}
                  onChange={setBrollFile}
                />
                <AssetInput
                  icon={Music4}
                  title="SFX / переходы"
                  description="mp3, wav, опционально"
                  accept="audio/*"
                  file={soundFile}
                  onChange={setSoundFile}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Стиль монтажа</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Как собираем видео</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {EDIT_STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStyle(item.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    style === item.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/50 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/20"
                  )}
                >
                  <div
                    className={cn(
                      "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
                      style === item.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.id === "viral" ? <Zap className="h-5 w-5" /> : item.id === "minimal" ? <Type className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Настройки</p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Формат и поведение</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field title="Формат" icon={Clapperboard}>
                <Select value={format} onValueChange={(value: "9:16" | "1:1") => setFormat(value)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 Reels / Shorts</SelectItem>
                    <SelectItem value="1:1">1:1 Square</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field title="Язык субтитров" icon={Languages}>
                <Select value={captionLanguage} onValueChange={setCaptionLanguage}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="kk">Казахский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field title="Бизнес шаблон" icon={FileType}>
                <Select value={businessTemplate} onValueChange={setBusinessTemplate}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Клиники</SelectItem>
                    <SelectItem value="restaurant">Рестораны</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="general">Общий</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field title="Длина клипов" icon={Clapperboard}>
                <div className="grid grid-cols-[1fr_110px] gap-2">
                  <Select value={clipDurationMode} onValueChange={(value: "auto" | "manual") => setClipDurationMode(value)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Авто</SelectItem>
                      <SelectItem value="manual">Вручную</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={clipDurationSec}
                    onChange={(event) => setClipDurationSec(event.target.value)}
                    disabled={clipDurationMode !== "manual"}
                    placeholder="сек"
                    className="h-11 rounded-xl"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ToggleCard title="Авто B-roll" icon={ImageIcon} checked={autoBroll} onChange={setAutoBroll} />
              <ToggleCard title="Авто Zoom" icon={Maximize} checked={autoZoom} onChange={setAutoZoom} />
            </div>

            <div className="mt-5">
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Плотность эффектов
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as IntensityLevel[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntensity(value)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-xs font-semibold uppercase transition-all",
                      intensity === value
                        ? "border-primary bg-primary text-white"
                        : "border-border/50 bg-secondary/10 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {value === "low" ? "Low" : value === "medium" ? "Medium" : "High"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Контекст речи / хук
              </Label>
              <Textarea
                value={scriptHint}
                onChange={(event) => setScriptHint(event.target.value)}
                placeholder="Коротко опишите суть видео или вставьте ключевой текст, чтобы AI точнее собрал сцены."
                className="min-h-[100px] rounded-xl resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pipeline</p>
                <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">AI режиссёр</h3>
              </div>
              {taskId && (
                <Badge variant="secondary" className="font-mono text-[10px]">{taskId.slice(-8)}</Badge>
              )}
            </div>

            <Button
              onClick={startAiEdit}
              disabled={!videoFile || isSubmitting}
              className="mt-5 h-12 w-full rounded-2xl bg-primary text-white hover:bg-primary/90"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
              {isSubmitting ? "Обрабатываем…" : "Запустить ИИ монтаж"}
            </Button>

            {(isSubmitting || status) && (
              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <span className="truncate pr-2">{status?.progressText ?? "Ожидание запуска"}</span>
                  <span>{status?.progress ?? 0}%</span>
                </div>
                <Progress value={status?.progress ?? 0} className="h-1.5" />
              </div>
            )}

            <div className="mt-5 space-y-2">
              {PIPELINE_STEPS.map((step, index) => {
                const isDone = currentStepIndex > index && currentStepIndex !== -1;
                const isActive = currentStepIndex === index;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      isActive && "bg-primary/5",
                      !isActive && !isDone && "opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        isDone
                          ? "bg-primary text-white"
                          : isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{step.label}</p>
                      {isActive && status?.progressText && (
                        <p className="truncate text-[10px] text-muted-foreground">{status.progressText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {status?.transcript && (
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI данные</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">Транскрипт и сцены</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{status.transcript.text}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {status.scenes?.map((scene, index) => (
                  <Badge key={`${scene.type}-${index}`} variant="secondary" className="text-[10px] font-medium">
                    {scene.type} {scene.start.toFixed(1)}-{scene.end.toFixed(1)}с
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {status?.videos?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 rounded-3xl border border-border/50 bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Results</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">3 варианта монтажа готовы</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Превью генерируется через Remotion Renderer. Скачайте понравившийся или сбросьте задачу.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={resetTask}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {status.videos.map((video, index) => (
              <div key={video.id} className="overflow-hidden rounded-2xl border border-border/50 bg-secondary/10">
                <div className="aspect-[9/16] bg-black">
                  <video src={video.url} controls className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{video.name}</p>
                    <Badge variant="secondary" className="text-[10px] font-semibold">v{index + 1}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{video.notes}</p>
                  <a href={video.url} target="_blank" rel="noreferrer" className="block pt-1">
                    <Button className="h-10 w-full rounded-xl bg-primary text-white hover:bg-primary/90">
                      <Download className="mr-2 h-4 w-4" />
                      Скачать
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};

const Field = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </Label>
    {children}
  </div>
);

const ToggleCard = ({
  title,
  icon: Icon,
  checked,
  onChange,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
      checked ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/10 hover:border-border"
    )}
  >
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", checked ? "bg-primary text-white" : "bg-secondary/40 text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase", checked ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground")}>
      {checked ? "On" : "Off"}
    </span>
  </button>
);

const AssetInput = ({
  icon: Icon,
  title,
  description,
  accept,
  file,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) => (
  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-secondary/10 px-3 py-3 transition-colors hover:border-primary/30">
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", file ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{file?.name ?? description}</p>
      </div>
    </div>
    <div className="shrink-0 rounded-md border border-border/50 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
      {file ? "✓" : "+"}
    </div>
    <input
      type="file"
      accept={accept}
      className="hidden"
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
    />
  </label>
);
