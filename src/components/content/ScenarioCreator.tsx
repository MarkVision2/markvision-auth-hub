import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Trash2,
    Sparkles,
    Loader2,
    CheckCircle2,
    Copy,
    RotateCcw,
    Send,
    Video,
    Users,
    Type,
    Zap,
    MessageSquare,
    Target,
    Play,
    Link
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { CfButtonMd, CfH2, CfSection, cfStyles } from "@/components/content/contentFactoryDesignSystem";

// ─── Config ─────────────────────────────────────────────────────────────────
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || "";
const SPEECHMATICS_KEY = import.meta.env.VITE_SPEECHMATICS_KEY || ""; 
const AIRTABLE_BASE = "appspFv4OyALMTk8K";
const CONTENT_TABLE = "tblSppKHHKEDnyIoN";

// ─── Options ─────────────────────────────────────────────────────────────────
const OPTIONS = {
    formats: ["Говорящая голова", "Демонстрация экрана", "Закадровый голос", "Карусель", "Подложка под музыку"],
    contentTypes: ["Информационный", "Репутационный", "Продающий", "Развлекательный", "Личный контент"],
};

interface ScenarioResult {
    "Только текст видео"?: string;
    "Текст Описание"?: string;
    "ТЕКСТ СЦЕНАРИИ"?: string;
    [key: string]: string | undefined;
}

// ─── Custom select ──────────────────────────────────────────────────────────
function ModernSelect({ label, value, onChange, options, icon: Icon }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: any;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background text-sm focus:ring-primary/30">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                    {options.map((o) => <SelectItem key={o} value={o} className="rounded-lg text-sm">{o}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── Result block ────────────────────────────────────────────────────────────
function ResultBlock({ title, content, icon: Icon }: { title: string; content?: string; icon?: any }) {
    if (!content) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-primary" />}
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                <button
                    onClick={() => { navigator.clipboard.writeText(content); toast({ title: "Скопировано" }); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    <Copy className="h-3.5 w-3.5" /> Копировать
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90">
                {content}
            </div>
        </div>
    );
}

const N8N_SCENARIO_WEBHOOK = "https://n8n.zapoinov.com/webhook/02671bf4-ab71-41b0-996a-c1667e0f389c";

const SCENARIO_PRESETS = [
    {
        title: "Экспертный Reels",
        description: "Для врача, эксперта или основателя. Объяснить сложную тему простым языком.",
        topic: "Снимите экспертный Reels на тему: почему клиент долго откладывает решение, и как показать ему понятный следующий шаг без давления.",
        format: "Говорящая голова",
        contentType: "Информационный",
    },
    {
        title: "Продающий ролик",
        description: "Короткий оффер с сильным хуком, болью и ясным CTA.",
        topic: "Нужен продающий ролик с цепляющим первым кадром, конкретным оффером и призывом написать кодовое слово в директ.",
        format: "Говорящая голова",
        contentType: "Продающий",
    },
    {
        title: "Личный контент",
        description: "Прогрев через историю, путь и личную позицию бренда.",
        topic: "Подготовьте личный сценарий о том, почему я перестал работать по-старому, что понял на практике и как это влияет на результат клиента.",
        format: "Говорящая голова",
        contentType: "Личный контент",
    },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ScenarioCreator() {
    const { active, isAgency } = useWorkspace();
    // Mode state
    const [creationMode, setCreationMode] = useState<"link" | "topic">("topic");
    const [linkUrl, setLinkUrl] = useState("");

    // Form state
    const [topic, setTopic] = useState("");
    const [format, setFormat] = useState(OPTIONS.formats[0]);
    const [contentType, setContentType] = useState(OPTIONS.contentTypes[0]);
    const [refs, setRefs] = useState("");
    const [trigger, setTrigger] = useState("");

    // Recording
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [loaderText, setLoaderText] = useState("");
    const [loaderProgress, setLoaderProgress] = useState(0);
    const [result, setResult] = useState<ScenarioResult | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Scroll to top when submitted
    useEffect(() => {
        if (isGenerating || isSubmitted) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [isGenerating, isSubmitted]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // ── Voice recording ──────────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((t) => t.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch {
            toast({ title: "Нет доступа к микрофону", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state !== "inactive") {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    };

    const clearAudio = () => { setAudioBlob(null); setAudioUrl(null); };

    // ── Transcription via Speechmatics ───────────────────────────────────────
    const transcribeAudio = async (blob: Blob): Promise<string> => {
        if (!SPEECHMATICS_KEY) {
            toast({ title: "⚠️ Ключ Speechmatics не настроен", description: "Голосовой ввод пропущен" });
            return "";
        }
        const formData = new FormData();
        formData.append("data_file", blob, "audio.webm");
        formData.append("config", JSON.stringify({
            type: "transcription",
            transcription_config: { language: "ru", operating_point: "enhanced" },
        }));

        const res = await fetch("https://asr.api.speechmatics.com/v2/jobs", {
            method: "POST",
            headers: { Authorization: `Bearer ${SPEECHMATICS_KEY}` },
            body: formData,
        });
        const { id: jobId } = await res.json();

        for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const statusRes = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${SPEECHMATICS_KEY}` },
            });
            const { job } = await statusRes.json();
            if (job.status === "completed") break;
            if (job.status === "rejected") throw new Error("Ошибка Speechmatics");
        }

        const textRes = await fetch(
            `https://asr.api.speechmatics.com/v2/jobs/${jobId}/transcript?format=txt`,
            { headers: { Authorization: `Bearer ${SPEECHMATICS_KEY}` } }
        );
        return (await textRes.text()).trim();
    };

    // ── Main generate ────────────────────────────────────────────────────────
    const handleGenerateClick = () => {
        if (creationMode === "link" && !linkUrl.trim()) {
            toast({ title: "Добавьте ссылку на видео", description: "Нужна ссылка для анализа сценария", variant: "destructive" });
            return;
        }
        if (creationMode === "topic" && !topic.trim() && !audioBlob) {
            toast({ title: "Введите тему или запишите голос", description: "AI нужно описание, чтобы составить сценарий", variant: "destructive" });
            return;
        }
        handleGenerate();
    };

    const handleGenerate = useCallback(async () => {

        setIsGenerating(true);
        setResult(null);
        setIsSubmitted(false);
        setLoaderProgress(10);
        setLoaderText("Инициализация...");

        try {
            let finalTopic = topic;

            if (creationMode === "topic" && audioBlob) {
                setLoaderText("Распознаю голос...");
                setLoaderProgress(25);
                const transcribed = await transcribeAudio(audioBlob);
                if (transcribed) finalTopic += finalTopic ? `\n\n[Голос]: ${transcribed}` : transcribed;
            }

            setLoaderText("Отправляем запрос...");
            setLoaderProgress(40);

            // Create record in Supabase first
            const { data: dbRecord, error: dbError } = await (supabase as any)
                .from("content_tasks")
                .insert({
                    content_type: "scenario",
                    status: "pending",
                    progress_text: "Генерация сценария...",
                    project_id: active?.id,
                    main_text: creationMode === "topic" ? topic : linkUrl,
                })
                .select()
                .single();

            if (dbError) console.error("Supabase error:", dbError);

            const payload = {
                task_id: dbRecord?.id,
                mode: creationMode,
                source_url: creationMode === "link" ? linkUrl : null,
                topic: creationMode === "topic" ? finalTopic : null,
                main_topic: topic,
                format,
                contentType,
                refs,
                trigger,
                project_id: active?.id,
                client_name: active?.name,
                timestamp: new Date().toISOString()
            };

            const n8nRes = await fetch(N8N_SCENARIO_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!n8nRes.ok) throw new Error("Ошибка связи с сервером");

            // Try to parse result immediately if n8n returns it
            const n8nData = await n8nRes.json().catch(() => null);
            
            if (n8nData && (n8nData["ТЕКСТ СЦЕНАРИИ"] || n8nData.scenario)) {
                setResult(n8nData as ScenarioResult);
                setLoaderProgress(100);
                setIsGenerating(false);
                toast({ title: "Сценарий готов" });
                return;
            }

            // Fallback to Airtable polling if recordId is provided or assumed
            const recordId = n8nData?.recordId || n8nData?.id;
            
            if (recordId) {
                setLoaderText("Анализируем материал...");
                setLoaderProgress(60);

                let attempts = 0;
                pollingRef.current = setInterval(async () => {
                    attempts++;
                    setLoaderProgress(Math.min(60 + attempts * 2, 95));

                    if (attempts > 36) { 
                        clearInterval(pollingRef.current!);
                        setIsGenerating(false);
                        toast({ title: "Превышено время ожидания", variant: "destructive" });
                        return;
                    }

                    try {
                        const pollRes = await fetch(
                            `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CONTENT_TABLE}/${recordId}`,
                            { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
                        );
                        const data = await pollRes.json();

                        if (data.fields?.["ТЕКСТ СЦЕНАРИИ"]) {
                            clearInterval(pollingRef.current!);
                            setResult(data.fields as ScenarioResult);
                            setLoaderProgress(100);
                            setIsGenerating(false);
                            toast({ title: "Готово" });
                        }
                    } catch { }
                }, 5000);
            } else {
                // If no immediate result and no recordId, we wait a bit and hope
                setLoaderText("Обрабатываем запрос...");
                await new Promise(r => setTimeout(r, 2000));
                setLoaderProgress(100);
                setIsGenerating(false);
                setIsSubmitted(true);
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Ошибка";
            toast({ title: "Ошибка", description: message, variant: "destructive" });
            setIsGenerating(false);
        }
    }, [creationMode, linkUrl, topic, audioBlob, format, contentType, refs, trigger]);

    const handleReset = () => {
        setTopic(""); setLinkUrl(""); setAudioBlob(null); setAudioUrl(null); setResult(null);
        setIsGenerating(false); setLoaderProgress(0); setIsSubmitted(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const applyPreset = (preset: typeof SCENARIO_PRESETS[number]) => {
        setCreationMode("topic");
        setTopic(preset.topic);
        setFormat(preset.format);
        setContentType(preset.contentType);
        toast({ title: `Шаблон «${preset.title}» применён` });
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-4xl space-y-6 pb-16">
            {/* Mode toggle */}
            <div className={cn(cfStyles.card, "p-4")}>
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">Способ создания</Label>
                <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1">
                    <button
                        onClick={() => setCreationMode("topic")}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                            creationMode === "topic" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Sparkles className="h-4 w-4" /> Создать сценарий
                    </button>
                    <button
                        onClick={() => setCreationMode("link")}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                            creationMode === "link" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Send className="h-4 w-4" /> Анализ по ссылке
                    </button>
                </div>
            </div>

            {/* Presets */}
            <div className={cn(cfStyles.card, "p-5")}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">Быстрый старт</h3>
                    <p className="hidden text-xs text-muted-foreground sm:block">Нажмите, чтобы заполнить заготовку</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    {SCENARIO_PRESETS.map((preset) => (
                        <button
                            key={preset.title}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className="group rounded-xl border border-border/60 bg-background p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{preset.title}</p>
                                <Zap className="h-4 w-4 text-primary/70 transition-transform group-hover:scale-110" />
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{preset.description}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {preset.format}
                                </span>
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {preset.contentType}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main input */}
            <AnimatePresence mode="wait">
                {creationMode === "link" ? (
                    <motion.div
                        key="link-mode"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(cfStyles.card, "p-5")}
                    >
                        <Label className="mb-2 block text-xs font-medium text-muted-foreground">Ссылка на Reels / Shorts / TikTok</Label>
                        <div className="relative">
                            <Input
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="Вставьте ссылку для анализа..."
                                className="h-11 rounded-xl border-border/60 bg-background pr-10 text-sm"
                            />
                            <Link className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            AI разложит видео на сценарий, проанализирует структуру и предложит адаптацию под вашу нишу.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="topic-mode"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(cfStyles.card, "p-5 space-y-3")}
                    >
                        <Label className="block text-xs font-medium text-muted-foreground">Тема / Идея (текст или голос)</Label>
                        <div className="relative">
                            <Textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="О чём будет ролик? Опишите идею своими словами..."
                                className="min-h-[140px] resize-none rounded-xl border-border/60 bg-background pr-14 text-sm"
                            />
                            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                                        isRecording
                                            ? "animate-pulse bg-destructive text-white"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </button>
                                {audioUrl && (
                                    <button
                                        onClick={clearAudio}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {audioUrl && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3"
                            >
                                <Play className="h-4 w-4 fill-primary text-primary" />
                                <audio src={audioUrl} controls className="h-8 flex-1" />
                                <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-medium text-emerald-600">Записано</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form grid — only for "topic" mode */}
            {creationMode === "topic" && (
                <div className={cn(cfStyles.card, "p-5 space-y-5")}>
                    <h3 className="text-base font-semibold text-foreground">Параметры сценария</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ModernSelect label="Формат" value={format} onChange={setFormat} options={OPTIONS.formats} icon={Video} />
                        <ModernSelect label="Тип контента" value={contentType} onChange={setContentType} options={OPTIONS.contentTypes} icon={Type} />
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Триггер-слово
                            </Label>
                            <Input
                                value={trigger}
                                onChange={(e) => setTrigger(e.target.value)}
                                placeholder="Например: ГАЙД"
                                className="h-10 rounded-xl border-border/60 bg-background text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="block text-xs font-medium text-muted-foreground">Доп. пожелания / Референсы</Label>
                        <Textarea
                            value={refs}
                            onChange={(e) => setRefs(e.target.value)}
                            placeholder="Особые пожелания по стилю, темпу, музыке или ссылки на примеры..."
                            className="min-h-[90px] resize-none rounded-xl border-border/60 bg-background text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
                <CfButtonMd
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                    className="h-12 flex-1 gap-2 rounded-xl bg-primary text-sm text-primary-foreground hover:bg-primary/90"
                >
                    {isGenerating
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Анализирую…</>
                        : <><Sparkles className="h-4 w-4" /> Создать сценарий</>
                    }
                </CfButtonMd>
                <CfButtonMd
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                    className="h-12 gap-2 rounded-xl border-border/60 px-6 text-sm"
                >
                    <RotateCcw className="h-4 w-4" /> Сбросить
                </CfButtonMd>
            </div>

            {/* Loader */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(cfStyles.card, "overflow-hidden")}
                    >
                        <div className="h-1 bg-muted">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${loaderProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="flex items-center gap-4 p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{loaderText}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Готовим сценарий — обычно это занимает 1-3 минуты</p>
                            </div>
                            <span className="text-sm font-semibold text-primary">{loaderProgress}%</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
                {result && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(cfStyles.card, "overflow-hidden")}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-emerald-500/5 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Сценарий готов</p>
                                    <p className="text-xs text-muted-foreground">Скопируйте текст и используйте в съемке</p>
                                </div>
                            </div>
                            <CfButtonMd
                                onClick={handleReset}
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-border/60 px-3 text-xs"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Новый
                            </CfButtonMd>
                        </div>

                        <div className="space-y-5 p-5">
                            <ResultBlock title="Текст для суфлёра" content={result["Только текст видео"] || result.teleprompter} icon={MessageSquare} />
                            <ResultBlock title="Описание для Instagram" content={result["Текст Описание"] || result.description} icon={Type} />
                            <ResultBlock title="Полный сценарий" content={result["ТЕКСТ СЦЕНАРИИ"] || result.scenario} icon={Sparkles} />

                            <CfButtonMd
                                onClick={() => {
                                    const all = [
                                        (result["Только текст видео"] || result.teleprompter) && `СУФЛЁР:\n${result["Только текст видео"] || result.teleprompter}`,
                                        (result["Текст Описание"] || result.description) && `ОПИСАНИЕ:\n${result["Текст Описание"] || result.description}`,
                                        (result["ТЕКСТ СЦЕНАРИИ"] || result.scenario) && `СЦЕНАРИЙ:\n${result["ТЕКСТ СЦЕНАРИИ"] || result.scenario}`,
                                    ].filter(Boolean).join("\n\n---\n\n");
                                    navigator.clipboard.writeText(all);
                                    toast({ title: "Всё скопировано" });
                                }}
                                className="h-11 w-full gap-2 rounded-xl bg-primary text-sm text-primary-foreground hover:bg-primary/90"
                            >
                                <Copy className="h-4 w-4" /> Копировать всё в буфер
                            </CfButtonMd>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task queued state */}
            <AnimatePresence>
                {isSubmitted && !result && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5 text-center p-8 sm:p-12 shadow-sm"
                    >
                        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-5 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-md rounded-2xl animate-pulse" />
                            <CheckCircle2 className="h-8 w-8 text-primary relative" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Задача поставлена!</h3>
                        <p className="mt-2 text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                            Контент создается, ожидайте... Система анализирует исходники и генерирует сценарий. Обычно это занимает пару минут, результат появится в <strong>Истории</strong>.
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <CfButtonMd onClick={handleReset} variant="outline" className="gap-2 border-primary/20 bg-background text-sm">
                                <RotateCcw className="h-4 w-4" /> Создать новый
                            </CfButtonMd>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
