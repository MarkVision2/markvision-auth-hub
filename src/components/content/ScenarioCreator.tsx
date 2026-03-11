import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

// ─── Config ─────────────────────────────────────────────────────────────────
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || "";
const SPEECHMATICS_KEY = import.meta.env.VITE_SPEECHMATICS_KEY || ""; // Добавь ключ Speechmatics в .env
const AIRTABLE_BASE = "appspFv4OyALMTk8K";
const CONTENT_TABLE = "tblSppKHHKEDnyIoN";
const BOOST_WEBHOOK_CREATE = import.meta.env.VITE_BOOST_WEBHOOK_CREATE || "";

// ─── Options ─────────────────────────────────────────────────────────────────
const OPTIONS = {
    formats: ["Говорящая голова", "Демонстрация экрана", "Закадровый голос", "Карусель", "Подложка под музыку"],
    audiences: ["ВСЕ", "МАРКЕТОЛОГИ", "КОЛЛЕГИ AI", "ПРЕДПРИНИМАТЕЛИ", "Фрилансеры"],
    contentTypes: ["Информационный", "Репутационный", "Продающий", "Развлекательный", "Личный контент"],
    shootTypes: ["СЪЕМКА", "HEYGEN", "HYBRID - ME+AI"],
    funnels: ["Нет", "Да - ManyChat", "Да - WhatsApp", "Да - Telegram"],
};

interface ScenarioResult {
    "Только текст видео"?: string;
    "Текст Описание"?: string;
    "ТЕКСТ СЦЕНАРИИ"?: string;
    [key: string]: string | undefined;
}

// ─── Reusable native select ──────────────────────────────────────────────────
function NativeSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary/30 border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

// ─── Result block ────────────────────────────────────────────────────────────
function ResultBlock({ title, content }: { title: string; content?: string }) {
    if (!content) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{title}</span>
                <button
                    onClick={() => { navigator.clipboard.writeText(content); toast({ title: "📋 Скопировано" }); }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Copy className="h-3 w-3" /> Копировать
                </button>
            </div>
            <div className="p-4 bg-secondary/20 border border-border rounded-xl text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                {content}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ScenarioCreator() {
    // Form state
    const [topic, setTopic] = useState("");
    const [format, setFormat] = useState(OPTIONS.formats[0]);
    const [audience, setAudience] = useState(OPTIONS.audiences[0]);
    const [contentType, setContentType] = useState(OPTIONS.contentTypes[0]);
    const [shootType, setShootType] = useState(OPTIONS.shootTypes[0]);
    const [refs, setRefs] = useState("");
    const [funnel, setFunnel] = useState("Нет");
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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const handleGenerate = useCallback(async () => {
        if (!topic.trim() && !audioBlob) {
            toast({ title: "Введи тему или запиши голос!", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setResult(null);
        setLoaderProgress(10);
        setLoaderText("Обработка данных...");

        try {
            let finalTopic = topic;

            if (audioBlob) {
                setLoaderText("Распознаю голос через Speechmatics...");
                setLoaderProgress(25);
                const transcribed = await transcribeAudio(audioBlob);
                if (transcribed) finalTopic += finalTopic ? `\n\n[Голос]: ${transcribed}` : transcribed;
            }

            setLoaderText("Создаю запись в Airtable...");
            setLoaderProgress(40);

            const fields: Record<string, unknown> = {
                "Тема - О чем?": finalTopic,
                "Формат": [format],
                "АУДИТОРИЯ": [audience],
                "Тип контента": [contentType],
                "СЬЕМКА ИЛИ ИИ?": shootType,
                "Референсы": refs,
                "Есть воронка?": funnel,
                "СТАТУС СОЗДАНИЕ": "Идея ✨",
            };
            if (trigger.trim()) fields["ТРИГЕР СЛОВО"] = trigger;

            const airtableRes = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE}/${CONTENT_TABLE}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ records: [{ fields }], typecast: true }),
                }
            );

            if (!airtableRes.ok) {
                const err = await airtableRes.json();
                throw new Error(err?.error?.message || "Ошибка Airtable");
            }

            const { records } = await airtableRes.json();
            const recordId = records[0].id;

            setLoaderText("Запускаю Boost.space AI Pipeline...");
            setLoaderProgress(60);

            // Trigger Boost webhook
            try {
                await fetch(`${BOOST_WEBHOOK_CREATE}?recordID=${recordId}`, { method: "GET", mode: "no-cors" });
            } catch {
                // no-cors — expected
            }

            setLoaderText("AI пишет сценарий… (30–60 сек)");
            setLoaderProgress(75);

            // Polling for result
            let attempts = 0;
            pollingRef.current = setInterval(async () => {
                attempts++;
                setLoaderProgress(Math.min(75 + attempts * 2, 95));

                if (attempts > 36) { // 3 min
                    clearInterval(pollingRef.current!);
                    setIsGenerating(false);
                    toast({ title: "Timeout: AI не ответил", description: "Попробуй ещё раз", variant: "destructive" });
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
                        toast({ title: "✅ Сценарий готов!" });
                    }
                } catch {
                    // retry next tick
                }
            }, 5000);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Неизвестная ошибка";
            toast({ title: "Ошибка генерации", description: message, variant: "destructive" });
            setIsGenerating(false);
        }
    }, [topic, audioBlob, format, audience, contentType, shootType, refs, funnel, trigger]);

    const handleReset = () => {
        setTopic(""); setAudioBlob(null); setAudioUrl(null); setResult(null);
        setIsGenerating(false); setLoaderProgress(0);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 max-w-4xl w-full">
            {/* Boost info banner */}
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold">AI Сценарист (Boost.space)</span> — заполни форму, нажми «Создать сценарий».
                    AI напишет суфлёр, описание для Instagram и полный сценарий за 30–60 сек.
                </p>
            </div>

            {/* TOPIC + VOICE */}
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Тема / Идея (текст или голос)</Label>
                <div className="relative">
                    <Textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="О чём будет ролик? Опиши идею, тему, что хочешь показать..."
                        className="min-h-[120px] bg-secondary/30 border-border text-sm resize-none pr-14"
                    />
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`absolute bottom-3 right-3 h-10 w-10 rounded-full flex items-center justify-center transition-all ${isRecording
                            ? "bg-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.5)] animate-pulse"
                            : "bg-primary/10 border border-primary/30 hover:bg-primary/20"
                            }`}
                    >
                        {isRecording ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-primary" />}
                    </button>
                </div>

                {audioUrl && (
                    <div className="flex items-center gap-3 p-2 bg-secondary/20 border border-border rounded-lg">
                        <audio src={audioUrl} controls className="h-8 flex-1" />
                        <button onClick={clearAudio} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* FORM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NativeSelect label="Формат" value={format} onChange={setFormat} options={OPTIONS.formats} />
                <NativeSelect label="Аудитория" value={audience} onChange={setAudience} options={OPTIONS.audiences} />
                <NativeSelect label="Тип контента" value={contentType} onChange={setContentType} options={OPTIONS.contentTypes} />
                <NativeSelect label="Съёмка или ИИ?" value={shootType} onChange={setShootType} options={OPTIONS.shootTypes} />
            </div>

            {/* REFS + FUNNEL + TRIGGER */}
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Референсы / Ссылки</Label>
                <Textarea
                    value={refs}
                    onChange={(e) => setRefs(e.target.value)}
                    placeholder="Ссылки на примеры, референсы..."
                    className="min-h-[80px] bg-secondary/30 border-border text-sm resize-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NativeSelect label="Воронка ManyChat?" value={funnel} onChange={setFunnel} options={OPTIONS.funnels} />
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Триггер-слово (опционально)</Label>
                    <Input
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        placeholder="Например: ГАЙД"
                        className="h-10 bg-secondary/30 border-border text-sm"
                    />
                </div>
            </div>

            {/* CTA BUTTONS */}
            <div className="flex gap-3 pt-2">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm gap-2"
                >
                    {isGenerating
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Генерирую…</>
                        : <><Sparkles className="h-4 w-4" /> Создать сценарий</>
                    }
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                    className="h-12 px-6 border-border text-muted-foreground hover:text-foreground gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Сброс
                </Button>
            </div>

            {/* LOADER */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-border bg-card p-8 text-center space-y-5"
                    >
                        {/* Spinner */}
                        <div className="relative h-14 w-14 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-primary">{loaderText}</p>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                animate={{ width: `${loaderProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground/60">Не закрывай страницу — AI работает...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RESULT */}
            <AnimatePresence>
                {result && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-primary/30 bg-card overflow-hidden"
                    >
                        {/* Result header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-good))]" />
                                <span className="text-sm font-bold text-foreground">Сценарий готов!</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleReset}
                                variant="outline"
                                className="h-8 text-xs border-border gap-1.5"
                            >
                                <RotateCcw className="h-3 w-3" /> Новый
                            </Button>
                        </div>

                        {/* Result blocks */}
                        <div className="p-5 space-y-5">
                            <ResultBlock title="Текст для суфлёра" content={result["Только текст видео"]} />
                            <ResultBlock title="Описание для Instagram" content={result["Текст Описание"]} />
                            <ResultBlock title="Полный сценарий" content={result["ТЕКСТ СЦЕНАРИИ"]} />

                            {/* Copy all */}
                            <Button
                                onClick={() => {
                                    const all = [
                                        result["Только текст видео"] && `СУФЛЁР:\n${result["Только текст видео"]}`,
                                        result["Текст Описание"] && `ОПИСАНИЕ:\n${result["Текст Описание"]}`,
                                        result["ТЕКСТ СЦЕНАРИИ"] && `СЦЕНАРИЙ:\n${result["ТЕКСТ СЦЕНАРИИ"]}`,
                                    ].filter(Boolean).join("\n\n---\n\n");
                                    navigator.clipboard.writeText(all);
                                    toast({ title: "📋 Всё скопировано!" });
                                }}
                                variant="outline"
                                className="w-full h-10 border-border gap-2 text-sm"
                            >
                                <Copy className="h-3.5 w-3.5" /> Скопировать всё
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
