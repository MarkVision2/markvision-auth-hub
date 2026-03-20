import { useState, useRef, useCallback, useEffect } from "react";
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

const N8N_SCENARIO_WEBHOOK = "https://n8n.zapoinov.com/webhook/02671bf4-ab71-41b0-996a-c1667e0f389c";

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ScenarioCreator() {
    // Mode state
    const [creationMode, setCreationMode] = useState<"link" | "topic">("topic");
    const [linkUrl, setLinkUrl] = useState("");

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
    const handleGenerate = useCallback(async () => {
        if (creationMode === "link" && !linkUrl.trim()) {
            toast({ title: "Вставь ссылку на видео!", variant: "destructive" });
            return;
        }
        if (creationMode === "topic" && !topic.trim() && !audioBlob) {
            toast({ title: "Введи тему или запиши голос!", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setResult(null);
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

            setLoaderText("Отправка в n8n AI Pipeline...");
            setLoaderProgress(40);

            const payload = {
                mode: creationMode,
                source_url: creationMode === "link" ? linkUrl : null,
                topic: creationMode === "topic" ? finalTopic : null,
                format,
                audience,
                contentType,
                shootType,
                refs,
                funnel,
                trigger,
                timestamp: new Date().toISOString()
            };

            const n8nRes = await fetch(N8N_SCENARIO_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!n8nRes.ok) throw new Error("Ошибка связи с n8n");

            // Try to parse result immediately if n8n returns it
            const n8nData = await n8nRes.json().catch(() => null);
            
            if (n8nData && (n8nData["ТЕКСТ СЦЕНАРИИ"] || n8nData.scenario)) {
                setResult(n8nData as ScenarioResult);
                setLoaderProgress(100);
                setIsGenerating(false);
                toast({ title: "✅ Сценарий готов!" });
                return;
            }

            // Fallback to Airtable polling if recordId is provided or assumed
            const recordId = n8nData?.recordId || n8nData?.id;
            
            if (recordId) {
                setLoaderText("AI анализирует контент… (30–60 сек)");
                setLoaderProgress(60);

                let attempts = 0;
                pollingRef.current = setInterval(async () => {
                    attempts++;
                    setLoaderProgress(Math.min(60 + attempts * 2, 95));

                    if (attempts > 36) { 
                        clearInterval(pollingRef.current!);
                        setIsGenerating(false);
                        toast({ title: "Timeout: AI не ответил", variant: "destructive" });
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
                            toast({ title: "✅ Анализ завершен!" });
                        }
                    } catch { }
                }, 5000);
            } else {
                // If no immediate result and no recordId, we wait a bit and hope
                setLoaderText("Обработка в фоновом режиме...");
                await new Promise(r => setTimeout(r, 5000));
                setLoaderText("n8n запустил процесс. Проверь результат позже.");
                setIsGenerating(false);
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Ошибка";
            toast({ title: "Ошибка", description: message, variant: "destructive" });
            setIsGenerating(false);
        }
    }, [creationMode, linkUrl, topic, audioBlob, format, audience, contentType, shootType, refs, funnel, trigger]);

    const handleReset = () => {
        setTopic(""); setLinkUrl(""); setAudioBlob(null); setAudioUrl(null); setResult(null);
        setIsGenerating(false); setLoaderProgress(0);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-4xl w-full pb-10">
            {/* Mode Selection */}
            <div className="bg-secondary/20 p-1.5 rounded-2xl border border-border flex gap-2">
                <button
                    onClick={() => setCreationMode("link")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${creationMode === "link" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Send className="h-3.5 w-3.5" /> Анализ по ссылке
                </button>
                <button
                    onClick={() => setCreationMode("topic")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${creationMode === "topic" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Sparkles className="h-3.5 w-3.5" /> Творческая тема
                </button>
            </div>

            <div className="space-y-5">
                {creationMode === "link" ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ссылка на Reels / Shorts / TikTok</Label>
                        <Input
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Вставь ссылку для анализа..."
                            className="h-12 bg-secondary/30 border-border text-sm rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                         <p className="text-[10px] text-muted-foreground/60 italic px-1">Система проанализирует видео и подготовит сценарий на его основе</p>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Тема / Идея (текст или голос)</Label>
                        <div className="relative">
                            <Textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="О чём будет ролик? Опиши идею..."
                                className="min-h-[140px] bg-secondary/30 border-border text-sm resize-none pr-14 rounded-2xl focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`absolute bottom-4 right-4 h-12 w-12 rounded-full flex items-center justify-center transition-all ${isRecording
                                    ? "bg-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.6)] animate-pulse scale-110"
                                    : "bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary"
                                    }`}
                            >
                                {isRecording ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5" />}
                            </button>
                        </div>

                        {audioUrl && (
                            <div className="flex items-center gap-3 p-3 bg-secondary/10 border border-border rounded-xl">
                                <audio src={audioUrl} controls className="h-8 flex-1" />
                                <button onClick={clearAudio} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* FORM GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <NativeSelect label="Формат" value={format} onChange={setFormat} options={OPTIONS.formats} />
                    <NativeSelect label="Аудитория" value={audience} onChange={setAudience} options={OPTIONS.audiences} />
                </div>

                {/* ADVANCED SETTINGS COLLAPSIBLE (optional or just show) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <NativeSelect label="Тип контента" value={contentType} onChange={setContentType} options={OPTIONS.contentTypes} />
                    <NativeSelect label="Съёмка или ИИ?" value={shootType} onChange={setShootType} options={OPTIONS.shootTypes} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <NativeSelect label="Воронка ManyChat?" value={funnel} onChange={setFunnel} options={OPTIONS.funnels} />
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Триггер-слово</Label>
                        <Input
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                            placeholder="Например: ГАЙД"
                            className="h-10 bg-secondary/30 border-border text-sm rounded-lg"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Доп. пожелания / Референсы</Label>
                    <Textarea
                        value={refs}
                        onChange={(e) => setRefs(e.target.value)}
                        placeholder="Особые пожелания или ссылки на примеры..."
                        className="min-h-[80px] bg-secondary/30 border-border text-sm resize-none rounded-xl"
                    />
                </div>
            </div>

            {/* CTA BUTTONS */}
            <div className="flex gap-4 pt-4">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-base gap-3 rounded-2xl shadow-[0_8px_30px_rgb(var(--primary)/0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isGenerating
                        ? <><Loader2 className="h-5 w-5 animate-spin" /> Анализирую…</>
                        : <><Sparkles className="h-5 w-5" /> Создать сценарий</>
                    }
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                    className="h-14 px-8 border-border text-muted-foreground hover:text-foreground gap-2 rounded-2xl"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            {/* LOADER */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden"
                    >
                         <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary" 
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 10, ease: "linear" }}
                            />
                        </div>

                        <div className="relative h-20 w-20 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/5" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                            <div className="absolute inset-0 m-auto h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <p className="text-lg font-bold text-foreground">{loaderText}</p>
                             <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto">AI обрабатывает запрос. Обычно это занимает от 30 до 90 секунд.</p>
                        </div>
                        
                        <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden max-w-md mx-auto">
                            <motion.div
                                className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]"
                                animate={{ width: `${loaderProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RESULT */}
            <AnimatePresence>
                {result && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-primary/30 bg-card/60 backdrop-blur-md overflow-hidden shadow-2xl"
                    >
                        {/* Result header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-primary/5">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-[hsl(var(--status-good))]/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-good))]" />
                                </div>
                                <span className="text-base font-bold text-foreground">Сценарий готов!</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleReset}
                                variant="outline"
                                className="h-9 px-4 text-xs border-border/60 hover:bg-primary/5 rounded-xl gap-2 font-bold"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Новый
                            </Button>
                        </div>

                        {/* Result blocks */}
                        <div className="p-8 space-y-8">
                            <ResultBlock title="Текст для суфлёра" content={result["Только текст видео"] || result.teleprompter} />
                            <ResultBlock title="Описание для Instagram" content={result["Текст Описание"] || result.description} />
                            <ResultBlock title="Полный сценарий" content={result["ТЕКСТ СЦЕНАРИИ"] || result.scenario} />

                            {/* Copy all */}
                            <Button
                                onClick={() => {
                                    const all = [
                                        (result["Только текст видео"] || result.teleprompter) && `СУФЛЁР:\n${result["Только текст видео"] || result.teleprompter}`,
                                        (result["Текст Описание"] || result.description) && `ОПИСАНИЕ:\n${result["Текст Описание"] || result.description}`,
                                        (result["ТЕКСТ СЦЕНАРИИ"] || result.scenario) && `СЦЕНАРИЙ:\n${result["ТЕКСТ СЦЕНАРИИ"] || result.scenario}`,
                                    ].filter(Boolean).join("\n\n---\n\n");
                                    navigator.clipboard.writeText(all);
                                    toast({ title: "📋 Всё скопировано!" });
                                }}
                                variant="outline"
                                className="w-full h-14 border-primary/20 hover:bg-primary/5 bg-primary/5 text-primary rounded-2xl gap-3 text-sm font-bold shadow-sm"
                            >
                                <Copy className="h-4 w-4" /> Скопировать всё в буфер
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
