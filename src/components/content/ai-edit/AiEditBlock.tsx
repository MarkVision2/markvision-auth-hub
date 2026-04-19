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
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { CfStepIndicator, CfButtonMd, cfStyles } from "@/components/content/contentFactoryDesignSystem";

interface AiEditBlockProps {
  onTaskCreated?: (taskId: string) => void;
}

type EditStyle = "viral" | "minimal" | "business";
type IntensityLevel = "low" | "medium" | "high";
type StageId = "idle" | "upload" | "transcription" | "analysis" | "broll" | "rendering" | "completed";

interface ProjectStatus {
  projectId: string;
  status: string;
  stage: StageId;
  progress: number;
  progressText: string;
  errorMessage?: string | null;
  renders?: Array<{ id: string; version: number; output_url: string; variant_name: string; variant_notes: string }>;
}

const N8N_AI_MONTAGE_WEBHOOK =
  import.meta.env.VITE_N8N_AI_MONTAGE_URL || "https://n8n.zapoinov.com/webhook/ai-montage-start";



const AI_EDIT_STEPS = [
  "Материалы",
  "Стиль монтажа",
  "Настройки"
];
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
  const [step, setStep] = useState(0);
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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let disposed = false;

    const mapRow = (row: Record<string, unknown>): ProjectStatus => ({
      projectId: row.id as string,
      status: (row.status as string) ?? "queued",
      stage: (row.stage as StageId) ?? "upload",
      progress: (row.progress as number) ?? 0,
      progressText: (row.progress_text as string) ?? "",
      errorMessage: (row.error_message as string) ?? null,
    });

    const fetchState = async () => {
      const { data: project } = await supabase
        .from("ai_edit_projects")
        .select("id,status,stage,progress,progress_text,error_message")
        .eq("id" as any, projectId)
        .maybeSingle();
      if (!project || disposed) return;

      const { data: renders } = await supabase
        .from("ai_edit_renders")
        .select("id,version,output_url,variant_name,variant_notes,status")
        .eq("project_id" as any, projectId)
        .eq("status" as any, "completed")
        .order("version", { ascending: true });

      if (disposed) return;
      setStatus({
        ...mapRow(project as Record<string, unknown>),
        renders: ((renders as any[]) ?? []).map((r: any) => ({
          id: r.id as string,
          version: (r.version as number) ?? 1,
          output_url: (r.output_url as string) ?? "",
          variant_name: (r.variant_name as string) ?? `Вариант ${r.version}`,
          variant_notes: (r.variant_notes as string) ?? "",
        })),
      });
      if ((project as any).status === "completed" || (project as any).status === "failed") {
        setIsSubmitting(false);
      }
    };

    void fetchState();

    const channel = supabase
      .channel(`ai-edit-${projectId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ai_edit_projects", filter: `id=eq.${projectId}` },
        () => void fetchState()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_edit_renders", filter: `project_id=eq.${projectId}` },
        () => void fetchState()
      )
      .subscribe();

    return () => {
      disposed = true;
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

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
      projectId: "pending",
      status: "uploading",
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

      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id ?? null;

      const { data: inserted, error: insertError } = await supabase
        .from("ai_edit_projects")
        .insert({
          project_id: active?.id ?? null,
          owner_id: ownerId,
          source_video_url: videoUrl,
          source_size_bytes: videoFile.size,
          style,
          format,
          caption_language: captionLanguage,
          business_template: businessTemplate,
          clip_duration_mode: clipDurationMode,
          clip_duration_sec: clipDurationMode === "manual" ? Number(clipDurationSec) : null,
          intensity,
          auto_broll: autoBroll,
          auto_zoom: autoZoom,
          script_hint: scriptHint || null,
          font_url: fontUrl,
          custom_broll_url: brollUrl,
          custom_sfx_url: soundUrl,
          status: "queued",
          stage: "upload",
          progress: 10,
          progress_text: "Задача поставлена в очередь",
        } as any)
        .select("id,task_token")
        .single() as any;

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? "Не удалось создать проект");
      }

      const response = await fetch(N8N_AI_MONTAGE_WEBHOOK as any, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: inserted.id, taskToken: inserted.task_token }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook error: ${response.status}`);
      }

      setProjectId(inserted.id);
      onTaskCreated?.(inserted.id);
    } catch (error: unknown) {
      setIsSubmitting(false);
      setStatus(null);
      const message = error instanceof Error ? error.message : "Не удалось запустить ИИ монтаж";
      toast({
        title: "Ошибка запуска",
        description: message,
        variant: "destructive",
      });
    }
  };

  const resetTask = () => {
    setProjectId(null);
    setStatus(null);
    setIsSubmitting(false);
  };

    // --- STEPS RENDERERS ---
  const renderStep0 = () => (
    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Исходное видео и ассеты</h3>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">Загрузите сырые материалы для нейронного монтажа</p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-semibold">Remotion</Badge>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <label className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-secondary/10 transition-colors">
            {videoPreview ? (
              <video src={videoPreview} controls className="h-full w-full object-cover" />
            ) : (
              <div className="space-y-3 text-center px-6">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
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
            <AssetInput icon={Type} title="Шрифт" description=".ttf, опционально" accept=".ttf,font/ttf" file={fontFile} onChange={setFontFile} />
            <AssetInput icon={ImageIcon} title="B-roll" description="доп. видео" accept="video/*" file={brollFile} onChange={setBrollFile} />
            <AssetInput icon={Music4} title="SFX / переходы" description="mp3, wav" accept="audio/*" file={soundFile} onChange={setSoundFile} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep1 = () => (
    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Стиль и динамика</h3>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Выберите темп и способ подачи контента</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {EDIT_STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setStyle(item.id); setStep(2); }}
              className={cn(
                "rounded-lg border p-4 text-left transition-all",
                style === item.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02] shadow-sm"
                  : "border-border/50 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/20 hover:scale-[1.01]"
              )}
            >
              <div
                className={cn(
                  "mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
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
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Детали и генерация</h3>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground mb-5">Финальные настройки перед запуском пайплайна</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field title="Формат" icon={Clapperboard}>
            <Select value={format} onValueChange={(value: "9:16" | "1:1") => setFormat(value)}>
              <SelectTrigger className="h-10 rounded-lg">
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
              <SelectTrigger className="h-10 rounded-lg">
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
              <SelectTrigger className="h-10 rounded-lg">
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
                <SelectTrigger className="h-10 rounded-lg">
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
                className="h-10 rounded-lg"
              />
            </div>
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ToggleCard title="Авто B-roll" icon={ImageIcon} checked={autoBroll} onChange={setAutoBroll} />
          <ToggleCard title="Авто Zoom" icon={Maximize} checked={autoZoom} onChange={setAutoZoom} />
        </div>

        <div className="mt-5">
          <Label className="mb-2 block text-[10px] font-semibold text-muted-foreground">ПЛОТНОСТЬ ЭФФЕКТОВ</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as IntensityLevel[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setIntensity(value)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all",
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
          <Label className="mb-2 block text-[10px] font-semibold text-muted-foreground">КОНТЕКСТ РЕЧИ / ХУК</Label>
          <Textarea
            value={scriptHint}
            onChange={(event) => setScriptHint(event.target.value)}
            placeholder="Опишите суть видео или ключевой текст, чтобы AI точнее собрал сцены."
            className="min-h-[100px] rounded-lg resize-none"
          />
        </div>
      </div>
    </motion.div>
  );

  const canNext = () => {
    if (step === 0) return Boolean(videoFile);
    if (step === 1) return Boolean(style);
    return true;
  };

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-8">
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <CfStepIndicator steps={AI_EDIT_STEPS} current={step} />
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-4 pb-4">
            <CfButtonMd
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Назад
            </CfButtonMd>

            {step < 2 ? (
              <CfButtonMd
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-8"
              >
                Далее <ArrowRight className="h-4 w-4" />
              </CfButtonMd>
            ) : (
              <CfButtonMd
                onClick={startAiEdit}
                disabled={!canNext() || isSubmitting}
                className="gap-2.5 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 px-8"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Запустить ИИ монтаж
              </CfButtonMd>
            )}
          </div>
        </div>

        <aside className="xl:sticky xl:top-4 self-start space-y-4">
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
               <h3 className="text-[12px] font-bold tracking-tight text-muted-foreground">ПРОГРЕСС МОНТАЖА</h3>
               {projectId && <Badge variant="secondary" className="font-mono text-[10px]">{projectId.slice(-8)}</Badge>}
            </div>

            {(isSubmitting || status) && (
              <div className="mt-5 rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-primary">
                  <span className="truncate pr-2">{status?.progressText ?? "Ожидание запуска"}</span>
                  <span>{status?.progress ?? 0}%</span>
                </div>
                <Progress value={status?.progress ?? 0} className="h-1.5" />
              </div>
            )}

            <div className="mt-5 space-y-2">
              {PIPELINE_STEPS.map((pStep, index) => {
                const isDone = currentStepIndex > index && currentStepIndex !== -1;
                const isActive = currentStepIndex === index;
                return (
                  <div key={pStep.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", isActive && "bg-primary/5", !isActive && !isDone && "opacity-60")}>
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isDone ? "bg-primary text-white" : isActive ? "bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground")}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{pStep.label}</p>
                      {isActive && status?.progressText && <p className="truncate text-[10px] text-muted-foreground">{status.progressText}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {status?.errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm">
              <p className="text-[10px] font-semibold text-destructive">Ошибка пайплайна</p>
              <p className="mt-2 text-sm leading-relaxed text-destructive/90">{status.errorMessage}</p>
            </div>
          )}
        </aside>
      </div>

      {status?.renders?.length ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold font-medium text-muted-foreground">Results</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Монтаж готов</h3>
            </div>
            <Button variant="outline" className="rounded-xl text-sm" onClick={resetTask}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Сбросить
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {status.renders.map((render) => (
              <div key={render.id} className="overflow-hidden rounded-lg border border-border/50 bg-secondary/10">
                <div className="aspect-[9/16] bg-black">
                  <video src={render.output_url} controls className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{render.variant_name}</p>
                    <Badge variant="secondary" className="text-[10px] font-semibold">v{render.version}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{render.variant_notes}</p>
                  <a href={render.output_url} target="_blank" rel="noreferrer" className="block pt-1">
                    <Button className="h-10 w-full rounded-xl bg-primary text-white hover:bg-primary/90 text-sm">
                       <Download className="mr-2 h-4 w-4" /> Скачать
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
    <Label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold font-medium text-muted-foreground">
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
