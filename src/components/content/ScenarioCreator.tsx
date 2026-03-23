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
import { CfButtonMd, CfH2, CfSection, cfStyles } from "@/components/content/contentFactoryDesignSystem";

// ─── Config ─────────────────────────────────────────────────────────────────
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || "";
const SPEECHMATICS_KEY = import.meta.env.VITE_SPEECHMATICS_KEY || ""; 
const AIRTABLE_BASE = "appspFv4OyALMTk8K";
const CONTENT_TABLE = "tblSppKHHKEDnyIoN";

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

// ─── Custom select ──────────────────────────────────────────────────────────
function ModernSelect({ label, value, onChange, options, icon: Icon }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: any;
}) {
    return (
        <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3 opacity-40" />}
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-12 bg-secondary border-border/40 rounded-2xl font-bold text-sm focus:ring-primary/20">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40">
                    {options.map((o) => <SelectItem key={o} value={o} className="rounded-xl font-medium">{o}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── Result block ────────────────────────────────────────────────────────────
function ResultBlock({ title, content, icon: Icon }: { title: string; content?: string; icon?: any }) {
    if (!content) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-primary" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">{title}</span>
                </div>
                <button
                    onClick={() => { navigator.clipboard.writeText(content); toast({ title: "📋 Скопировано" }); }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                    <Copy className="h-3 w-3" /> Копировать
                </button>
            </div>
            <div className="p-6 bg-secondary border border-border/40 rounded-[2rem] text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto custom-scrollbar font-medium">
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
            toast({ title: "Добавьте ссылку на видео", variant: "destructive" });
            return;
        }
        if (creationMode === "topic" && !topic.trim() && !audioBlob) {
            toast({ title: "Введите тему или запишите голос", variant: "destructive" });
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

            setLoaderText("Отправляем запрос...");
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
                await new Promise(r => setTimeout(r, 5000));
                setLoaderText("Процесс запущен. Результат появится в истории.");
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
        <div className={cn(cfStyles.grid, "max-w-4xl w-full pb-20")}>
            {/* Mode Selection */}
            <CfSection className="space-y-6">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block px-1">Выберите способ создания</Label>
                <div className="flex bg-secondary rounded-2xl p-1.5 border border-border/40 shadow-inner">
                    <button
                        onClick={() => setCreationMode("link")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                            creationMode === "link" ? "bg-card text-primary shadow-md ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Send className="h-4 w-4" /> Анализ по ссылке
                    </button>
                    <button
                        onClick={() => setCreationMode("topic")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                            creationMode === "topic" ? "bg-card text-primary shadow-md ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Sparkles className="h-4 w-4" /> Создать сценарий
                    </button>
                </div>
            </CfSection>

            <div className="space-y-8">
                <AnimatePresence mode="wait">
                    {creationMode === "link" ? (
                        <motion.div 
                            key="link-mode"
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }}
                            className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-6"
                        >
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block px-1">Ссылка на Reels / Shorts / TikTok</Label>
                            <div className="relative group">
                                <Input
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Вставьте ссылку для анализа..."
                                    className="h-14 bg-secondary border-border/40 text-sm font-bold rounded-2xl focus-visible:ring-primary/20"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-focus-within:scale-110 transition-transform">
                                    <Link className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground/40 italic px-2">AI разложит видео на сценарий, проанализирует структуру и предложит адаптацию под вашу нишу.</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="topic-mode"
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }}
                            className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40 space-y-6"
                        >
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block px-1">Тема / Идея (текст или голос)</Label>
                            <div className="relative">
                                <Textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="О чём будет ролик? Просто опишите идею своими словами..."
                                    className="min-h-[160px] bg-secondary border-border/40 text-sm font-bold rounded-[2rem] p-6 focus-visible:ring-primary/20 resize-none pr-20 shadow-inner"
                                />
                                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                            isRecording
                                                ? "bg-destructive text-white shadow-destructive/40 animate-pulse scale-110"
                                                : "bg-primary text-white shadow-primary/20 hover:scale-105 active:scale-95"
                                        )}
                                    >
                                        {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                    </button>
                                    {audioUrl && (
                                        <button 
                                            onClick={clearAudio}
                                            className="h-10 w-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {audioUrl && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-4 p-4 bg-secondary border border-border/40 rounded-2xl shadow-sm"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Play className="h-4 w-4 fill-primary" />
                                    </div>
                                    <audio src={audioUrl} controls className="h-8 flex-1 opacity-80" />
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Голос записан</span>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FORM GRID — only for "Создать сценарий" mode */}
                {creationMode === "topic" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[2.5rem] bg-secondary/20 border border-border/40">
                            <ModernSelect label="Формат" value={format} onChange={setFormat} options={OPTIONS.formats} icon={Video} />
                            <ModernSelect label="Аудитория" value={audience} onChange={setAudience} options={OPTIONS.audiences} icon={Users} />
                            <ModernSelect label="Тип контента" value={contentType} onChange={setContentType} options={OPTIONS.contentTypes} icon={Type} />
                            <ModernSelect label="Метод создания" value={shootType} onChange={setShootType} options={OPTIONS.shootTypes} icon={Zap} />
                            <ModernSelect label="Воронка ManyChat?" value={funnel} onChange={setFunnel} options={OPTIONS.funnels} icon={Target} />
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3 opacity-40" />
                                    Триггер-слово
                                </Label>
                                <Input
                                    value={trigger}
                                    onChange={(e) => setTrigger(e.target.value)}
                                    placeholder="Например: ГАЙД"
                                    className="h-12 bg-secondary border-border/40 rounded-2xl font-bold text-sm focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>

                        <CfSection className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block px-1">Доп. пожелания / Референсы</Label>
                            <Textarea
                                value={refs}
                                onChange={(e) => setRefs(e.target.value)}
                                placeholder="Особые пожелания по стилю, темпу, музыке или ссылки на примеры..."
                                className="min-h-[100px] bg-secondary border-border/40 text-sm font-bold rounded-2xl p-6 focus-visible:ring-primary/20 resize-none shadow-inner"
                            />
                        </CfSection>
                    </>
                )}
            </div>

            {/* CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <CfButtonMd
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 h-16 bg-primary hover:bg-primary/90 text-white text-sm gap-3 rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-[1.01] border-b-4 border-primary-foreground/20 active:border-b-0"
                >
                    {isGenerating
                        ? <><Loader2 className="h-6 w-6 animate-spin" /> Анализирую…</>
                        : <><Sparkles className="h-6 w-6" /> Создать сценарий</>
                    }
                </CfButtonMd>
                <CfButtonMd
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                    className="h-16 px-10 border-border/60 text-muted-foreground hover:text-foreground gap-2 rounded-[2rem] hover:bg-accent"
                >
                    <RotateCcw className="h-5 w-5" />
                </CfButtonMd>
            </div>

            {/* LOADER */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-[3rem] border border-border/40 bg-card backdrop-blur-2xl p-16 text-center space-y-10 shadow-2xl relative overflow-hidden"
                    >
                         <div className="absolute top-0 left-0 w-full h-2 bg-primary/10 overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                                initial={{ width: "0%" }}
                                animate={{ width: `${loaderProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <div className="relative h-24 w-24 mx-auto">
                            <div className="absolute inset-0 rounded-[2rem] border-4 border-primary/5" />
                            <div className="absolute inset-0 rounded-[2rem] border-4 border-t-primary animate-spin" />
                            <div className="absolute inset-0 m-auto h-12 w-12 flex items-center justify-center bg-primary/10 rounded-2xl">
                                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                             <CfH2 className="uppercase">{loaderText}</CfH2>
                             <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">Проверяем материал и готовим понятный сценарий.</p>
                        </div>
                        
                        <div className="space-y-4 max-w-md mx-auto">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">
                                <span>Прогресс</span>
                                <span>{loaderProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]"
                                    animate={{ width: `${loaderProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RESULT */}
            <AnimatePresence>
                {result && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[3rem] border border-primary/30 bg-card backdrop-blur-xl overflow-hidden shadow-2xl"
                    >
                        {/* Result header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-10 py-8 border-b border-border/40 bg-primary/5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                                </div>
                                <div>
                                    <CfH2 className="uppercase text-xl">Сценарий готов</CfH2>
                                    <p className={cfStyles.hint}>Скопируйте текст и используйте в съемке.</p>
                                </div>
                            </div>
                            <CfButtonMd
                                onClick={handleReset}
                                variant="outline"
                                className="h-11 px-6 text-xs border-border/60 hover:bg-accent rounded-xl gap-2"
                            >
                                <RotateCcw className="h-4 w-4" /> Новый
                            </CfButtonMd>
                        </div>

                        {/* Result blocks */}
                        <div className="p-10 space-y-10">
                            <ResultBlock title="Текст для суфлёра" content={result["Только текст видео"] || result.teleprompter} icon={MessageSquare} />
                            <ResultBlock title="Описание для Instagram" content={result["Текст Описание"] || result.description} icon={Type} />
                            <ResultBlock title="Полный сценарий" content={result["ТЕКСТ СЦЕНАРИИ"] || result.scenario} icon={Sparkles} />

                            {/* Copy all */}
                            <div className="pt-4">
                                <CfButtonMd
                                    onClick={() => {
                                        const all = [
                                            (result["Только текст видео"] || result.teleprompter) && `СУФЛЁР:\n${result["Только текст видео"] || result.teleprompter}`,
                                            (result["Текст Описание"] || result.description) && `ОПИСАНИЕ:\n${result["Текст Описание"] || result.description}`,
                                            (result["ТЕКСТ СЦЕНАРИИ"] || result.scenario) && `СЦЕНАРИЙ:\n${result["ТЕКСТ СЦЕНАРИИ"] || result.scenario}`,
                                        ].filter(Boolean).join("\n\n---\n\n");
                                        navigator.clipboard.writeText(all);
                                        toast({ title: "📋 Всё скопировано!" });
                                    }}
                                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] gap-3 text-xs shadow-xl shadow-primary/20 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1"
                                >
                                    <Copy className="h-5 w-5" /> Копировать всё в буфер
                                </CfButtonMd>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
