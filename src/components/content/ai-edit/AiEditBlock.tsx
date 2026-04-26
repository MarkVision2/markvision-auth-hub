import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Clock,
  Download,
  FileType,
  Image as ImageIcon,
  Layers,
  Languages,
  Layout,
  Loader2,
  Maximize,
  Move,
  Music4,
  Plus,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Type,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { MontageLayoutTemplate } from "@/remotion/types";
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
import { CfStepIndicator, CfButtonMd } from "@/components/content/contentFactoryDesignSystem";
import { cfStyles } from "@/components/content/contentFactoryDesignSystem";

interface AiEditBlockProps {
  onTaskCreated?: (taskId: string) => void;
}

const cfCard = cfStyles.card;

type EditStyle = "viral" | "minimal" | "business";
type IntensityLevel = "low" | "medium" | "high";
type StageId = "idle" | "upload" | "transcription" | "analysis" | "broll" | "rendering" | "completed" | "failed";

interface ProjectStatus {
  projectId: string;
  status: string;
  stage: StageId;
  progress: number;
  progressText: string;
  errorMessage?: string | null;
  renders?: Array<{ id: string; version: number; output_url: string; variant_name: string; variant_notes: string }>;
}

interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
}

interface RenderRow {
  id: string;
  version: number | null;
  output_url: string | null;
  variant_name: string | null;
  variant_notes: string | null;
}

interface ProjectInsertResult {
  id: string;
  task_token: string;
}

const N8N_AI_MONTAGE_WEBHOOK =
  import.meta.env.VITE_N8N_AI_MONTAGE_URL || "https://n8n.zapoinov.com/webhook/ai-montage-start";



const AI_EDIT_STEPS = [
  "Материалы",
  "Шаблон монтажа",
  "Настройки",
  "Предпросмотр и правка",
];

interface TranscriptWord {
  t: number;
  d: number;
  w: string;
}
const MONTAGE_TEMPLATES: Array<{
  id: MontageLayoutTemplate;
  label: string;
  helper: string;
  requirements: string;
}> = [
  {
    id: "split_demo_top",
    label: "2 экрана",
    helper: "Сверху демонстрация, снизу эксперт, титры по центру.",
    requirements: "Нужен 1 доп. ролик для верхнего экрана.",
  },
  {
    id: "triple_demo_stack",
    label: "3 экрана",
    helper: "Сверху и снизу демонстрации, в центре эксперт.",
    requirements: "Нужно 2 доп. ролика: верхний и нижний.",
  },
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

const STAGE_ALIASES: Record<string, StageId> = {
  idle: "idle",
  queued: "upload",
  uploading: "upload",
  upload: "upload",
  transcribing: "transcription",
  transcription: "transcription",
  analyzing: "analysis",
  analysis: "analysis",
  generating_broll: "broll",
  broll: "broll",
  rendering: "rendering",
  completed: "completed",
  failed: "failed",
};

const DEFAULT_STAGE_TEXT: Record<StageId, string> = {
  idle: "Подготовьте исходник и запустите монтаж.",
  upload: "Загружаем файл и ставим задачу в очередь.",
  transcription: "Расшифровываем речь и собираем тайминги слов.",
  analysis: "ИИ размечает сцены, акценты и логику монтажа.",
  broll: "Подбираем B-roll, зумы и дополнительные вставки.",
  rendering: "Собираем итоговый mp4 и сохраняем результат.",
  completed: "Монтаж готов к просмотру и скачиванию.",
  failed: "Пайплайн остановился с ошибкой.",
};

const normalizeStage = (rawStage?: string | null, rawStatus?: string | null): StageId => {
  if (rawStatus === "failed" || rawStatus === "error") {
    return "failed";
  }

  if (!rawStage) {
    return "idle";
  }

  return STAGE_ALIASES[rawStage] ?? "idle";
};

const readVideoMetadata = (file: File) =>
  new Promise<VideoMetadata>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const metadata = {
        durationSec: Number.isFinite(video.duration) ? video.duration : 0,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать метаданные видео"));
    };
    video.src = objectUrl;
  });

export const AiEditBlock: React.FC<AiEditBlockProps> = ({ onTaskCreated }) => {
  const { active } = useWorkspace();
  const [step, setStep] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [brollFile, setBrollFile] = useState<File | null>(null);
  const [bottomDemoFile, setBottomDemoFile] = useState<File | null>(null);
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [style, setStyle] = useState<EditStyle>("viral");
  const [layoutTemplate, setLayoutTemplate] = useState<MontageLayoutTemplate>("split_demo_top");
  const [format] = useState<"9:16">("9:16");
  const [captionLanguage, setCaptionLanguage] = useState("ru");
  const [clipDurationMode, setClipDurationMode] = useState<"auto" | "manual">("auto");
  const [clipDurationSec, setClipDurationSec] = useState("6");
  const [intensity, setIntensity] = useState<IntensityLevel>("medium");
  const [autoBroll, setAutoBroll] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);
  const [scriptHint, setScriptHint] = useState("");
  const [expertCropYPct, setExpertCropYPct] = useState(10);
  const [expertZoomPct, setExpertZoomPct] = useState(100);
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([]);
  const [transcribeStatus, setTranscribeStatus] = useState<"idle" | "uploading" | "transcribing" | "ready" | "error">("idle");
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [showExtraAssets, setShowExtraAssets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectIdRaw] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem("ai-edit-project-id") : null;
    } catch {
      return null;
    }
  });
  const setProjectId = (id: string | null) => {
    setProjectIdRaw(id);
    try {
      if (typeof window !== "undefined") {
        if (id) window.localStorage.setItem("ai-edit-project-id", id);
        else window.localStorage.removeItem("ai-edit-project-id");
      }
    } catch {
      /* ignore */
    }
  };
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const completionToastedRef = useRef(false);
  const renderResultsRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top on submit/error
  useEffect(() => {
    if (isSubmitting || status?.errorMessage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isSubmitting, status?.errorMessage]);

  useEffect(() => {
    const isDone = status?.status === "completed" && (status.renders?.length ?? 0) > 0;
    if (!isDone) {
      completionToastedRef.current = false;
      return;
    }
    if (completionToastedRef.current) return;
    completionToastedRef.current = true;
    toast({
      title: "Монтаж готов",
      description: "Результат доступен ниже — можно скачать или отправить.",
    });
    setTimeout(() => {
      renderResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [status?.status, status?.renders?.length, toast]);

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
      stage: normalizeStage(row.stage as string | null, row.status as string | null),
      progress: (row.progress as number) ?? 0,
      progressText:
        (row.progress_text as string) ??
        DEFAULT_STAGE_TEXT[normalizeStage(row.stage as string | null, row.status as string | null)],
      errorMessage: (row.error_message as string) ?? null,
    });

    const fetchState = async () => {
      const { data: project } = await supabase
        .from("ai_edit_projects")
        .select("id,status,stage,progress,progress_text,error_message")
        .eq("id", projectId)
        .maybeSingle();
      if (!project || disposed) return;

      const { data: renders } = await supabase
        .from("ai_edit_renders")
        .select("id,version,output_url,variant_name,variant_notes,status")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("version", { ascending: true });

      if (disposed) return;
      const renderRows: RenderRow[] = Array.isArray(renders) ? (renders as RenderRow[]) : [];
      const projectStatus = (project as { status?: string | null }).status;

      setStatus({
        ...mapRow(project as Record<string, unknown>),
        renders: renderRows.map((r) => ({
          id: r.id as string,
          version: (r.version as number) ?? 1,
          output_url: (r.output_url as string) ?? "",
          variant_name: (r.variant_name as string) ?? `Вариант ${r.version}`,
          variant_notes: (r.variant_notes as string) ?? "",
        })),
      });
      if (projectStatus === "completed" || projectStatus === "failed") {
        setIsSubmitting(false);
      }
    };

    void fetchState();

    const pollId = window.setInterval(() => {
      void fetchState();
    }, 4000);

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
      window.clearInterval(pollId);
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

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      const metadata = await readVideoMetadata(file);
      setVideoMeta(metadata);
    } catch (error) {
      console.warn("Video metadata read failed", error);
      setVideoMeta(null);
    }
  };

  // Создаёт черновик проекта в БД и запускает транскрибацию (без рендера).
  // Используется при переходе на шаг "Предпросмотр и правка".
  const prepareDraft = async (): Promise<string | null> => {
    if (!videoFile || !active?.id) return null;
    if (draftProjectId) return draftProjectId; // уже создан
    try {
      setTranscribeStatus("uploading");
      setTranscribeError(null);

      const ext = videoFile.name.split(".").pop() || "mp4";
      const videoPath = `ai-edit/source/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content_assets")
        .upload(videoPath, videoFile, { contentType: videoFile.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { data: pub } = supabase.storage.from("content_assets").getPublicUrl(videoPath);

      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id;
      if (!ownerId) throw new Error("Нет авторизации");

      const metadata = videoMeta ?? {};
      const insertPayload: Database["public"]["Tables"]["ai_edit_projects"]["Insert"] = {
        project_id: active.id,
        owner_id: ownerId,
        source_video_url: pub.publicUrl,
        source_duration_sec: metadata.durationSec ? Math.ceil(metadata.durationSec) : null,
        source_size_bytes: videoFile.size,
        style,
        format,
        caption_language: captionLanguage,
        business_template: layoutTemplate,
        clip_duration_mode: clipDurationMode,
        clip_duration_sec: clipDurationMode === "manual" ? Number(clipDurationSec) : null,
        intensity,
        auto_broll: autoBroll,
        auto_zoom: autoZoom,
        script_hint: scriptHint || null,
        expert_crop_y_pct: expertCropYPct,
        expert_zoom_pct: expertZoomPct,
        status: "draft",
        stage: "draft",
        progress: 5,
        progress_text: "Подготовка предпросмотра",
      };
      const { data: inserted, error: insertError } = await supabase
        .from("ai_edit_projects")
        .insert(insertPayload)
        .select("id")
        .single();
      if (insertError || !inserted) throw new Error(insertError?.message || "Не удалось создать черновик");
      setDraftProjectId(inserted.id);
      setTranscribeStatus("transcribing");

      // Запуск транскрибации
      const transcribeRes = await fetch("/api/ai-montage-transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: inserted.id }),
      });
      if (!transcribeRes.ok) {
        const txt = await transcribeRes.text();
        throw new Error(`Транскрибация не удалась: ${txt.slice(0, 200)}`);
      }
      const transcribeJson = await transcribeRes.json();

      // Достаём analysis_json из БД
      const { data: project } = await supabase
        .from("ai_edit_projects")
        .select("analysis_json")
        .eq("id", inserted.id)
        .single();
      const words = (project?.analysis_json as { words?: TranscriptWord[] } | null)?.words || [];
      setTranscriptWords(words);
      setTranscribeStatus("ready");
      toast({
        title: "Транскрибация готова",
        description: `${transcribeJson.words_count || words.length} слов · ${transcribeJson.segments_count || 0} сегментов`,
      });
      return inserted.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ошибка подготовки черновика";
      setTranscribeError(message);
      setTranscribeStatus("error");
      toast({ title: "Ошибка", description: message, variant: "destructive" });
      return null;
    }
  };

  // Запуск финального рендера: сохраняет правки в БД и зовёт n8n webhook.
  const submitFinalRender = async () => {
    if (!draftProjectId) {
      toast({ title: "Ошибка", description: "Черновик не создан", variant: "destructive" });
      return;
    }
    try {
      setIsSubmitting(true);
      // Сохраняем отредактированные титры и параметры размещения
      await supabase
        .from("ai_edit_projects")
        .update({
          analysis_json: { words: transcriptWords, segments: [], summary: "" },
          expert_crop_y_pct: expertCropYPct,
          expert_zoom_pct: expertZoomPct,
          status: "queued",
          stage: "upload",
          progress: 10,
          progress_text: "Задача поставлена в очередь",
        })
        .eq("id", draftProjectId);

      setProjectId(draftProjectId);
      setStatus({
        projectId: draftProjectId,
        status: "queued",
        stage: "upload",
        progress: 20,
        progressText: "Запускаем рендер",
      });

      const response = await fetch(N8N_AI_MONTAGE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: draftProjectId, projectId: draftProjectId }),
      });
      if (!response.ok) throw new Error(`n8n webhook error: ${response.status}`);

      setIsSubmitting(false);
      onTaskCreated?.(draftProjectId);
    } catch (error: unknown) {
      setIsSubmitting(false);
      const message = error instanceof Error ? error.message : "Ошибка запуска монтажа";
      toast({ title: "Ошибка запуска", description: message, variant: "destructive" });
    }
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

    if (!brollFile) {
      toast({
        title: "Нужно видео демонстрации",
        description: "Для этих шаблонов загрузите ролик для верхнего экрана.",
        variant: "destructive",
      });
      return;
    }

    if (layoutTemplate === "triple_demo_stack" && !bottomDemoFile) {
      toast({
        title: "Нужен нижний ролик",
        description: "Для шаблона на 3 экрана загрузите второе видео для нижнего блока.",
        variant: "destructive",
      });
      return;
    }

    if (clipDurationMode === "manual") {
      const clipDuration = Number(clipDurationSec);
      if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
        toast({
          title: "Проверьте длину клипов",
          description: "Укажите длительность в секундах, например 3 или 6.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    setStatus({
      projectId: "pending",
      status: "uploading",
      stage: "upload",
      progress: 5,
      progressText: "Загружаем исходник и дополнительные файлы",
    });

    try {
      const metadata = videoMeta ?? (await readVideoMetadata(videoFile));
      setVideoMeta(metadata);

      const [videoUrl, fontUrl, brollUrl, soundUrl] = await Promise.all([
        uploadAsset(videoFile, "source"),
        fontFile ? uploadAsset(fontFile, "fonts") : Promise.resolve(null),
        brollFile ? uploadAsset(brollFile, "layout-top") : Promise.resolve(null),
        soundFile ? uploadAsset(soundFile, "sfx") : Promise.resolve(null),
      ]);
      const bottomDemoUrl = bottomDemoFile ? await uploadAsset(bottomDemoFile, "layout-bottom") : null;

      setStatus({
        projectId: "pending",
        status: "uploading",
        stage: "upload",
        progress: 22,
        progressText: "Файл загружен, создаем проект монтажа",
      });

      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData?.user?.id ?? null;

      const insertPayload: Database["public"]["Tables"]["ai_edit_projects"]["Insert"] = {
        project_id: active?.id ?? null,
        owner_id: ownerId,
        source_video_url: videoUrl,
        source_duration_sec: metadata.durationSec ? Math.ceil(metadata.durationSec) : null,
        source_size_bytes: videoFile.size,
        style,
        format,
        caption_language: captionLanguage,
        business_template: layoutTemplate,
        clip_duration_mode: clipDurationMode,
        clip_duration_sec: clipDurationMode === "manual" ? Number(clipDurationSec) : null,
        intensity,
        auto_broll: autoBroll,
        auto_zoom: autoZoom,
        script_hint: scriptHint || null,
        expert_crop_y_pct: expertCropYPct,
        expert_zoom_pct: expertZoomPct,
        font_url: fontUrl,
        custom_broll_url: brollUrl,
        custom_sfx_url: soundUrl,
        status: "queued",
        stage: "upload",
        progress: 10,
        progress_text: "Задача поставлена в очередь",
      };

      const { data: inserted, error: insertError } = await supabase
        .from("ai_edit_projects")
        .insert(insertPayload)
        .select("id,task_token")
        .single();

      const insertedProject = inserted as ProjectInsertResult | null;

      if (insertError || !insertedProject) {
        throw new Error(insertError?.message ?? "Не удалось создать проект");
      }

      const assetPayload: Database["public"]["Tables"]["ai_edit_assets"]["Insert"][] = [];
      if (brollUrl) {
        assetPayload.push({
          project_id: insertedProject.id,
          kind: "layout_demo_top",
          source: "upload",
          status: "ready",
          url: brollUrl,
          metadata: { slot: "top" },
        });
      }
      if (bottomDemoUrl) {
        assetPayload.push({
          project_id: insertedProject.id,
          kind: "layout_demo_bottom",
          source: "upload",
          status: "ready",
          url: bottomDemoUrl,
          metadata: { slot: "bottom" },
        });
      }
      if (assetPayload.length > 0) {
        const { error: assetError } = await supabase.from("ai_edit_assets").insert(assetPayload);
        if (assetError) {
          throw new Error(assetError.message);
        }
      }

      setProjectId(insertedProject.id);
      setStatus({
        projectId: insertedProject.id,
        status: "queued",
        stage: "upload",
        progress: 34,
        progressText: "Проект создан, запускаем AI пайплайн",
      });

      const response = await fetch(N8N_AI_MONTAGE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: insertedProject.id,
          projectId: insertedProject.id,
          task_token: insertedProject.task_token,
          taskToken: insertedProject.task_token,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook error: ${response.status}`);
      }

      setStatus({
        projectId: insertedProject.id,
        status: "processing",
        stage: "transcription",
        progress: 42,
        progressText: "Пайплайн запущен, ожидаем расшифровку видео",
      });
      setIsSubmitting(false);
      onTaskCreated?.(insertedProject.id);
    } catch (error: unknown) {
      setIsSubmitting(false);
      const message = error instanceof Error ? error.message : "Не удалось запустить ИИ монтаж";
      setStatus({
        projectId: projectId ?? "failed",
        status: "failed",
        stage: "failed",
        progress: 0,
        progressText: "Запуск не удался",
        errorMessage: message,
      });
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
    setVideoFile(null);
    setFontFile(null);
    setBrollFile(null);
    setBottomDemoFile(null);
    setSoundFile(null);
    setVideoMeta(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setStep(0);
  };

  const uploadSummary = useMemo(() => {
    if (!videoFile) return null;

    const sizeMb = (videoFile.size / (1024 * 1024)).toFixed(1);
    const durationLabel = videoMeta
      ? `${Math.floor(videoMeta.durationSec / 60)}:${Math.floor(videoMeta.durationSec % 60)
          .toString()
          .padStart(2, "0")}`
      : "—";
    const resolutionLabel =
      videoMeta && videoMeta.width && videoMeta.height ? `${videoMeta.width}x${videoMeta.height}` : "—";

    return {
      sizeMb,
      durationLabel,
      resolutionLabel,
    };
  }, [videoFile, videoMeta]);

  const stageDescription = useMemo(() => {
    const stage = status?.stage ?? "idle";
    return status?.progressText || DEFAULT_STAGE_TEXT[stage];
  }, [status]);

  const stageChecklist = useMemo(
    () => [
      {
        title: "Загрузка",
        text: "Сохраняем исходник и создаем задачу монтажа.",
      },
      {
        title: "Расшифровка",
        text: "Получаем речь, тайминги слов и понимание структуры ролика.",
      },
      {
        title: "Сборка",
        text: "Подбираем эффекты, B-roll и собираем финальный mp4.",
      },
      {
        title: "Результат",
        text: "Показываем готовый ролик для проверки и скачивания.",
      },
    ],
    []
  );

    // --- STEPS RENDERERS ---
  const renderStep0 = () => (
    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className={cn(cfCard, "p-6")}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Исходное видео</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Загрузите mp4/mov исходник для AI монтажа</p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-semibold">Remotion</Badge>
        </div>

        {/* Main video upload — compact */}
        <label className="group relative flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-secondary/5 transition-all hover:bg-secondary/10">
          {videoPreview ? (
            <video src={videoPreview} controls className="h-full w-full object-cover rounded-lg" />
          ) : (
            <div className="space-y-2 text-center px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Перетащите или нажмите</p>
              <p className="text-xs text-muted-foreground">MP4 / MOV, до 150 МБ</p>
            </div>
          )}
          <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleVideoChange} />
        </label>

        {/* File metadata */}
        {uploadSummary && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="rounded-lg bg-secondary/30 px-3 py-1.5 font-medium text-foreground">{videoFile?.name}</span>
            <span className="rounded-lg bg-secondary/30 px-3 py-1.5 font-medium text-muted-foreground">{uploadSummary.sizeMb} MB · {uploadSummary.durationLabel}</span>
            <span className="rounded-lg bg-secondary/30 px-3 py-1.5 font-medium text-muted-foreground">{uploadSummary.resolutionLabel}</span>
          </div>
        )}

        {/* Required assets: демо-ролики */}
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-foreground/80">Обязательные ролики для шаблона</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <AssetInput icon={ImageIcon} title="Верхний экран" description="демонстрация для верхнего блока" accept="video/*" file={brollFile} onChange={setBrollFile} />
            {layoutTemplate === "triple_demo_stack" && (
              <AssetInput icon={Clapperboard} title="Нижний экран" description="демонстрация для нижнего блока" accept="video/*" file={bottomDemoFile} onChange={setBottomDemoFile} />
            )}
          </div>
        </div>

        {/* Optional: font & sfx */}
        <button
          type="button"
          onClick={() => setShowExtraAssets(!showExtraAssets)}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showExtraAssets && "rotate-180")} />
          Дополнительные ассеты (шрифт, звуки)
        </button>
        <AnimatePresence>
          {showExtraAssets && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AssetInput icon={Type} title="Шрифт" description=".ttf, опционально" accept=".ttf,font/ttf" file={fontFile} onChange={setFontFile} />
                <AssetInput icon={Music4} title="SFX / переходы" description="mp3, wav" accept="audio/*" file={soundFile} onChange={setSoundFile} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderStep1 = () => (
    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className={cn(cfCard, "p-6")}>
        <div className="mb-5">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Шаблон монтажа</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Выберите макет для вертикального контента 9:16</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MONTAGE_TEMPLATES.map((item) => {
            const active = layoutTemplate === item.id;
            const is3 = item.id === "triple_demo_stack";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLayoutTemplate(item.id)}
                className={cn(
                  "group rounded-xl border-2 p-5 text-left transition-all duration-200",
                  active
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/40 bg-card hover:border-primary/30 hover:shadow-md"
                )}
              >
                {/* Visual layout preview */}
                <div className={cn(
                  "mb-4 flex h-28 w-full items-center justify-center rounded-lg border transition-colors",
                  active ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/10"
                )}>
                  <div className="flex h-20 w-10 flex-col gap-0.5 rounded border border-border/60 bg-background overflow-hidden">
                    {/* Top demo */}
                    <div className={cn("flex-1 flex items-center justify-center text-[6px] font-bold",
                      active ? "bg-primary/20 text-primary" : "bg-secondary/40 text-muted-foreground/60"
                    )}>
                      Демо
                    </div>
                    {/* Speaker */}
                    <div className={cn("flex items-center justify-center text-[6px] font-bold",
                      is3 ? "flex-1" : "flex-[2]",
                      active ? "bg-primary/10 text-primary/80" : "bg-secondary/20 text-muted-foreground/40"
                    )}>
                      Спикер
                    </div>
                    {/* Bottom demo — only for 3-screen */}
                    {is3 && (
                      <div className={cn("flex-1 flex items-center justify-center text-[6px] font-bold",
                        active ? "bg-primary/20 text-primary" : "bg-secondary/40 text-muted-foreground/60"
                      )}>
                        Демо
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.helper}</p>
                  </div>
                  {active && (
                    <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-medium text-primary/70">{item.requirements}</p>
              </button>
            );
          })}
        </div>

        {/* Тонкая настройка размещения эксперта (для split-шаблонов) */}
        {(layoutTemplate === "split_demo_top" || layoutTemplate === "triple_demo_stack") && (
          <div className="mt-6 rounded-xl border border-border/40 bg-secondary/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Move className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Размещение эксперта в кадре</p>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Эти ползунки управляют crop'ом нижней панели. Если голову срезает — уменьшите «Смещение по вертикали».
              Если эксперт мелкий — увеличьте «Зум».
            </p>
            <div className="grid gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Смещение по вертикали</span>
                  <span className="text-xs font-mono text-primary">{expertCropYPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={expertCropYPct}
                  onChange={(e) => setExpertCropYPct(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>верх (0%)</span>
                  <span>середина (25%)</span>
                  <span>низ (50%)</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Зум на эксперта</span>
                  <span className="text-xs font-mono text-primary">{expertZoomPct}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={150}
                  step={5}
                  value={expertZoomPct}
                  onChange={(e) => setExpertZoomPct(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>дальше (80%)</span>
                  <span>норма (100%)</span>
                  <span>ближе (150%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className={cn(cfCard, "p-6")}>
        <div className="mb-5">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Настройки монтажа</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Финальные параметры перед запуском</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field title="Формат" icon={Clapperboard}>
            <div className="flex h-10 items-center rounded-lg border border-border/40 bg-secondary/10 px-3 text-sm font-semibold text-foreground">
              9:16 Vertical
            </div>
          </Field>
          <Field title="Язык титров" icon={Languages}>
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
          <Field title="Стиль титров" icon={FileType}>
            <Select value={style} onValueChange={(value: EditStyle) => setStyle(value)}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDIT_STYLES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label} — {item.helper}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field title="Длина клипов" icon={Clapperboard}>
            <div className="grid grid-cols-[1fr_100px] gap-2">
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

        {/* Auto-effects section */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold text-foreground/80">Авто-эффекты</p>
          <div className="grid gap-3 md:grid-cols-3">
            <ToggleCard title="Авто B-roll" icon={ImageIcon} checked={autoBroll} onChange={setAutoBroll} />
            <ToggleCard title="Авто Zoom" icon={Maximize} checked={autoZoom} onChange={setAutoZoom} />
            <div className="space-y-1.5">
              <Label className="block text-[10px] font-semibold text-muted-foreground">Плотность</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["low", "medium", "high"] as IntensityLevel[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntensity(value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                      intensity === value
                        ? "border-primary bg-primary text-white"
                        : "border-border/40 bg-secondary/10 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {value === "low" ? "Low" : value === "medium" ? "Med" : "High"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Script hint */}
        <div className="mt-6">
          <Label className="mb-2 block text-[10px] font-semibold text-muted-foreground">КОНТЕКСТ РЕЧИ / ХУК</Label>
          <Textarea
            value={scriptHint}
            onChange={(event) => setScriptHint(event.target.value)}
            placeholder="Опишите суть видео, ключевые тезисы или хук — AI точнее расставит акценты."
            className="min-h-[90px] rounded-lg resize-none"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className={cn(cfCard, "p-6")}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Предпросмотр и правка</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Расшифруй видео, поправь титры и положение эксперта — потом отправляй на монтаж
            </p>
          </div>
          {transcribeStatus !== "ready" && (
            <CfButtonMd
              onClick={() => prepareDraft()}
              disabled={transcribeStatus === "uploading" || transcribeStatus === "transcribing"}
              className="gap-2"
            >
              {transcribeStatus === "transcribing" || transcribeStatus === "uploading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Идёт транскрибация…</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Расшифровать</>
              )}
            </CfButtonMd>
          )}
        </div>

        {transcribeError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {transcribeError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* Left: live preview видео с CSS-рамкой crop'а */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground/80">Превью кадра</p>
            <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "9/16" }}>
              {videoPreview && (
                <video
                  src={videoPreview}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: `scale(${expertZoomPct / 100}) translateY(${-(expertCropYPct - 25) * 0.6}%)`,
                    transformOrigin: "center top",
                  }}
                  muted
                  playsInline
                />
              )}
              {/* верхняя половина: место для демо */}
              {(layoutTemplate === "split_demo_top" || layoutTemplate === "triple_demo_stack") && (
                <div className="absolute inset-x-0 top-0 h-1/2 border-b border-primary/40 bg-gradient-to-b from-primary/20 to-primary/5">
                  <div className="flex h-full items-center justify-center text-[10px] font-bold text-primary">ДЕМО</div>
                </div>
              )}
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Это приблизительное превью. Реальный crop сделает FFmpeg на сервере с теми же значениями.
            </p>
          </div>

          {/* Right: titres editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground/80">
                Титры {transcriptWords.length > 0 && `(${transcriptWords.length} слов)`}
              </p>
              {transcriptWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const text = transcriptWords.map((w) => w.w).join(" ");
                    const updated = prompt("Отредактируй текст (слова через пробел):", text);
                    if (updated && updated.trim()) {
                      const newWords = updated.trim().split(/\s+/);
                      const total = transcriptWords.length;
                      const lastT = transcriptWords[total - 1]?.t || 0;
                      const lastD = transcriptWords[total - 1]?.d || 0.3;
                      const span = lastT + lastD;
                      const slice = span / Math.max(1, newWords.length);
                      setTranscriptWords(newWords.map((w, i) => ({ t: +(slice * i).toFixed(3), d: +slice.toFixed(3), w })));
                    }
                  }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Редактировать целиком
                </button>
              )}
            </div>
            {transcribeStatus === "idle" && (
              <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                Нажми «Расшифровать» — Gemini проанализирует видео (1–2 мин)
              </div>
            )}
            {(transcribeStatus === "uploading" || transcribeStatus === "transcribing") && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center text-xs text-foreground">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
                {transcribeStatus === "uploading" ? "Загрузка видео…" : "Идёт транскрибация (Gemini 2.5)…"}
              </div>
            )}
            {transcribeStatus === "ready" && transcriptWords.length === 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-foreground">
                Не получилось распознать ни одного слова — проверь что в видео есть речь и нажми «Расшифровать» снова.
              </div>
            )}
            {transcribeStatus === "ready" && transcriptWords.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/40 bg-secondary/10 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {transcriptWords.map((word, idx) => (
                    <div key={idx} className="group flex items-center gap-1 rounded-md border border-border/40 bg-background px-2 py-1 text-xs">
                      <input
                        value={word.w}
                        onChange={(e) => {
                          const next = [...transcriptWords];
                          next[idx] = { ...next[idx], w: e.target.value };
                          setTranscriptWords(next);
                        }}
                        className="w-auto bg-transparent outline-none focus:text-primary"
                        size={Math.max(3, word.w.length)}
                      />
                      <button
                        type="button"
                        onClick={() => setTranscriptWords(transcriptWords.filter((_, i) => i !== idx))}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive/80"
                        aria-label="Удалить слово"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const canNext = () => {
    if (step === 0) return Boolean(videoFile);
    if (step === 1) return Boolean(layoutTemplate);
    if (step === 2) return true;
    if (step === 3) return transcribeStatus === "ready";
    return true;
  };

  const handleNextStep = () => {
    if (!canNext()) {
      toast({
        title: "Заполните все поля",
        description: "Пожалуйста, загрузите необходимые файлы, чтобы продолжить.",
        variant: "destructive",
      });
      return;
    }
    if (step === 2) {
      // Переход на предпросмотр — стартуем prepareDraft автоматически если ещё не запускали
      setStep(3);
      if (!draftProjectId && transcribeStatus === "idle") {
        prepareDraft();
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleFinalSubmit = () => {
    if (transcribeStatus !== "ready") {
      toast({ title: "Сначала расшифруйте видео", variant: "destructive" });
      return;
    }
    submitFinalRender();
  };

  const isCompleted = status?.status === "completed" && (status.renders?.length ?? 0) > 0;

  return (
    <>
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-foreground">Монтаж готов</p>
              <p className="text-[11px] text-muted-foreground">Видео отрендерено и доступно для скачивания.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={() => renderResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Смотреть результат
          </Button>
        </motion.div>
      )}
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="space-y-6">
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <CfStepIndicator steps={AI_EDIT_STEPS} current={step} />
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2 pb-4">
            <CfButtonMd
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Назад
            </CfButtonMd>

            {step < 3 ? (
              <CfButtonMd
                onClick={handleNextStep}
                className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-8"
              >
                {step === 2 ? "К предпросмотру" : "Далее"} <ArrowRight className="h-4 w-4" />
              </CfButtonMd>
            ) : (
              <CfButtonMd
                onClick={handleFinalSubmit}
                disabled={isSubmitting || transcribeStatus !== "ready"}
                className="gap-2.5 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 px-8"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Запустить ИИ монтаж
              </CfButtonMd>
            )}
          </div>
        </div>

        <aside className="xl:sticky xl:top-4 self-start space-y-4">
          {/* Before launch: Readiness checklist */}
          {!isSubmitting && !status && (
            <div className={cn(cfCard, "p-5")}>
              <h3 className="text-xs font-bold tracking-tight text-muted-foreground mb-4">ГОТОВНОСТЬ К ЗАПУСКУ</h3>
              <div className="space-y-2">
                {[
                  { label: "Исходное видео", done: Boolean(videoFile) },
                  { label: "Шаблон монтажа", done: Boolean(layoutTemplate) },
                  { label: "Верхний экран (демо)", done: Boolean(brollFile) },
                  ...(layoutTemplate === "triple_demo_stack" ? [{ label: "Нижний экран (демо)", done: Boolean(bottomDemoFile) }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-secondary/15 px-3 py-2.5">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      item.done ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground/50"
                    )}>
                      {item.done ? "Готово" : "Ожидает"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* During/after launch: Progress pipeline */}
          {(isSubmitting || status) && (
            <div className={cn(cfCard, "p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold tracking-tight text-muted-foreground">ПРОГРЕСС МОНТАЖА</h3>
                {projectId && <Badge variant="secondary" className="font-mono text-[10px]">{projectId.slice(-8)}</Badge>}
              </div>
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 mb-4">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-primary">
                  <span className="truncate pr-2">{status?.progressText ?? "Ожидание запуска"}</span>
                  <span>{status?.progress ?? 0}%</span>
                </div>
                <Progress value={status?.progress ?? 0} className="h-1.5" />
              </div>
              {status?.stage === "failed" && status.errorMessage && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-[10px] font-semibold text-destructive">Ошибка</p>
                  <p className="mt-1 text-xs leading-relaxed text-destructive/90">{status.errorMessage}</p>
                </div>
              )}
              <div className="space-y-1.5">
                {PIPELINE_STEPS.map((pStep, index) => {
                  const isDone = currentStepIndex > index && currentStepIndex !== -1;
                  const isActive = currentStepIndex === index;
                  return (
                    <div key={pStep.id} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors", isActive && "bg-primary/5", !isActive && !isDone && "opacity-50")}>
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", isDone ? "bg-primary text-white" : isActive ? "bg-primary/15 text-primary" : "bg-secondary/30 text-muted-foreground")}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="text-[9px] font-bold">{index + 1}</span>}
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
          )}

          {/* How it works guide */}
          <div className={cn(cfCard, "p-5")}>
            <p className="text-xs font-bold tracking-tight text-muted-foreground">КАК ЭТО РАБОТАЕТ</p>
            <div className="mt-3 space-y-2.5">
              {stageChecklist.map((item, index) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {status?.renders && status.renders.length > 0 && (
        <motion.div ref={renderResultsRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn(cfStyles.card, "p-6 mt-8 space-y-5")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Results</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Монтаж готов</h3>
            </div>
            <Button variant="outline" className="rounded-xl text-sm" onClick={resetTask}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Сбросить
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {status.renders.map((render) => (
              <div key={render.id} className="overflow-hidden rounded-lg border border-border/50 bg-secondary/10">
                <div className="flex min-h-[320px] items-center justify-center bg-black p-3">
                  <video src={render.output_url} controls className="max-h-[420px] w-full object-contain" />
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
      )}
    </>
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
    <Label className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
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
