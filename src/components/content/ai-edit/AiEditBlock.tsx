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
          <div className="rounded-[2.25rem] border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">Input</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">Исходное видео и ассеты</h3>
              </div>
              <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">Remotion</Badge>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-primary/20 bg-secondary/20">
                {videoPreview ? (
                  <video src={videoPreview} controls className="h-full w-full object-cover" />
                ) : (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-primary/10">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-black tracking-tight text-foreground">Загрузить видео</p>
                      <p className="text-sm font-medium text-muted-foreground">MP4 / MOV, вертикальный или квадратный исходник</p>
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

          <div className="rounded-[2.25rem] border border-border/50 bg-card p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">Настройки</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field title="Формат" icon={Clapperboard}>
                <Select value={format} onValueChange={(value: "9:16" | "1:1") => setFormat(value)}>
                  <SelectTrigger className="h-12 rounded-2xl">
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
                  <SelectTrigger className="h-12 rounded-2xl">
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
                  <SelectTrigger className="h-12 rounded-2xl">
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
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Select value={clipDurationMode} onValueChange={(value: "auto" | "manual") => setClipDurationMode(value)}>
                    <SelectTrigger className="h-12 rounded-2xl">
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
                    className="h-12 rounded-2xl"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ToggleCard title="Авто B-roll" icon={ImageIcon} checked={autoBroll} onChange={setAutoBroll} />
              <ToggleCard title="Авто Zoom" icon={Maximize} checked={autoZoom} onChange={setAutoZoom} />
            </div>

            <div className="mt-5">
              <Label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Плотность эффектов
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {(["low", "medium", "high"] as IntensityLevel[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntensity(value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition-all",
                      intensity === value
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                        : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-primary/25 hover:text-foreground"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <Label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Контекст речи / хук
              </Label>
              <Textarea
                value={scriptHint}
                onChange={(event) => setScriptHint(event.target.value)}
                placeholder="Коротко опишите суть видео или вставьте ключевой текст, чтобы AI точнее собрал сцены."
                className="min-h-[120px] rounded-[1.5rem]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {EDIT_STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStyle(item.id)}
                className={cn(
                  "rounded-[1.8rem] border p-5 text-left transition-all",
                  style === item.id
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                    : "border-border/50 bg-card hover:border-primary/25"
                )}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {item.id === "viral" ? <Zap className="h-5 w-5" /> : item.id === "minimal" ? <Type className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
                </div>
                <p className="text-sm font-black uppercase tracking-tight text-foreground">{item.label}</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">{item.helper}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.25rem] border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">Pipeline</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">AI режиссер</h3>
              </div>
              {taskId && <Badge className="border-border/50 bg-secondary/30 text-foreground shadow-none">{taskId}</Badge>}
            </div>

            <div className="mt-5 space-y-3">
              {PIPELINE_STEPS.map((step, index) => {
                const isDone = currentStepIndex >= index && currentStepIndex !== -1;
                return (
                  <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/10 px-4 py-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", isDone ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground")}>
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-foreground">{step.label}</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        {status?.stage === step.id ? status.progressText : "Ожидает этап"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-primary/10 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-primary/80">
                <span>{status?.progressText ?? "Ожидание запуска"}</span>
                <span>{status?.progress ?? 0}%</span>
              </div>
              <Progress value={status?.progress ?? 0} className="h-2" />
            </div>

            <Button
              onClick={startAiEdit}
              disabled={!videoFile || isSubmitting}
              className="mt-5 h-14 w-full rounded-2xl bg-primary text-white shadow-2xl shadow-primary/25 hover:bg-primary/90"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
              Запустить ИИ монтаж
            </Button>
          </div>

          {status?.transcript && (
            <div className="rounded-[2.25rem] border border-border/50 bg-card p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">AI данные</p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-foreground">Транскрипт и сцены</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">{status.transcript.text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {status.scenes?.map((scene, index) => (
                  <Badge key={`${scene.type}-${index}`} className="border-border/50 bg-secondary/30 text-foreground shadow-none">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 rounded-[2.5rem] border border-border/50 bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">Results</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">3 варианта видео готовы</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Для следующего этапа сюда можно подключить реальный worker-рендер через Remotion Renderer и S3.
              </p>
            </div>
            <Button variant="outline" className="rounded-2xl border-border/60" onClick={resetTask}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {status.videos.map((video, index) => (
              <div key={video.id} className="overflow-hidden rounded-[2rem] border border-border/40 bg-secondary/10">
                <div className="aspect-[9/16] bg-black/80">
                  <video src={video.url} controls className="h-full w-full object-cover" />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black tracking-tight text-foreground">{video.name}</p>
                    <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">v{index + 1}</Badge>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">{video.notes}</p>
                  <a href={video.url} target="_blank" rel="noreferrer" className="block">
                    <Button className="h-11 w-full rounded-2xl bg-primary text-white hover:bg-primary/90">
                      <Download className="mr-2 h-4 w-4" />
                      Открыть / скачать
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
    <Label className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
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
      "flex items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left transition-all",
      checked ? "border-primary bg-primary/5" : "border-border/40 bg-secondary/10"
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", checked ? "bg-primary text-white" : "bg-secondary/40 text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-bold text-foreground">{title}</span>
    </div>
    <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]", checked ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground")}>
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
  <label className="flex cursor-pointer items-center justify-between rounded-[1.5rem] border border-border/40 bg-secondary/10 px-4 py-4 transition-all hover:border-primary/25">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black tracking-tight text-foreground">{title}</p>
        <p className="text-xs font-medium text-muted-foreground">{file?.name ?? description}</p>
      </div>
    </div>
    <div className="rounded-full border border-border/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
      {file ? "Готово" : "Выбрать"}
    </div>
    <input
      type="file"
      accept={accept}
      className="hidden"
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
    />
  </label>
);
