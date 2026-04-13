import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Link,
  FileText,
  ImageIcon,
  Mic,
  Layers,
  Megaphone,
  SquareStack,
  Smartphone,
  CheckCircle2,
  Upload,
  Minus,
  Plus,
  Palette,
  Zap,
  Globe,
  Ratio,
  Hash,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  cfStyles,
  CfH2,
  CfButtonMd,
} from "@/components/content/contentFactoryDesignSystem";

// ── Types ──────────────────────────────────────────────
type AdType = "carousel" | "story" | "post" | "reels";
type SourceType = "link" | "description" | "photo" | "audio";

interface ClonyFormData {
  ad_type: AdType | "";
  source_type: SourceType | "";
  product_url: string;
  description: string;
  photo_files: File[];
  audio_file: File | null;
  category: string;
  goal: string;
  additional_instructions: string;
  aspect_ratio: string;
  language: string;
  quantity: number;
  style: string;
  color: string;
}

const INITIAL_FORM: ClonyFormData = {
  ad_type: "",
  source_type: "",
  product_url: "",
  description: "",
  photo_files: [],
  audio_file: null,
  category: "",
  goal: "",
  additional_instructions: "",
  aspect_ratio: "1:1",
  language: "RU",
  quantity: 1,
  style: "",
  color: "",
};

const STEP_META = [
  { title: "Что создаём?", desc: "Выберите тип рекламного креатива и способ подачи материала", icon: Zap },
  { title: "Детали проекта", desc: "Укажите источник данных, категорию и цель рекламы", icon: FileText },
  { title: "Формат и язык", desc: "Настройте пропорции, язык и количество вариантов", icon: Globe },
  { title: "Визуальный стиль", desc: "Выберите стилистику и акцентный цвет для дизайна", icon: Palette },
] as const;

const AD_TYPES: { value: AdType; label: string; desc: string; icon: typeof Layers }[] = [
  { value: "carousel", label: "Карусель", desc: "Несколько слайдов", icon: SquareStack },
  { value: "story", label: "Сторис", desc: "Вертикальный формат", icon: Smartphone },
  { value: "post", label: "Пост", desc: "Классический пост", icon: ImageIcon },
  { value: "reels", label: "Reels", desc: "Короткое видео", icon: Megaphone },
];

const SOURCE_TYPES: { value: SourceType; label: string; desc: string; icon: typeof Link }[] = [
  { value: "link", label: "Ссылка", desc: "AI проанализирует страницу", icon: Link },
  { value: "description", label: "Описание", desc: "Опишите продукт текстом", icon: FileText },
  { value: "photo", label: "Фото", desc: "Загрузите изображения", icon: ImageIcon },
  { value: "audio", label: "Аудио", desc: "Загрузите голосовое", icon: Mic },
];

const CATEGORIES = [
  { value: "Стоматология", emoji: "🦷" },
  { value: "Маркетплейс", emoji: "🛒" },
  { value: "Бьюти", emoji: "💅" },
  { value: "Еда", emoji: "🍕" },
  { value: "Авто", emoji: "🚗" },
  { value: "Услуги", emoji: "🔧" },
  { value: "Другое", emoji: "📦" },
];

const GOALS = [
  { value: "Продажи", emoji: "💰" },
  { value: "Узнаваемость", emoji: "👁" },
  { value: "Лиды", emoji: "📋" },
  { value: "Вовлечённость", emoji: "❤️" },
];

const RATIOS = [
  { value: "1:1", label: "1:1", desc: "Квадрат" },
  { value: "4:5", label: "4:5", desc: "Instagram" },
  { value: "9:16", label: "9:16", desc: "Stories" },
  { value: "16:9", label: "16:9", desc: "YouTube" },
  { value: "3:2", label: "3:2", desc: "Фото" },
];

const LANGUAGES = [
  { value: "RU", label: "Русский", flag: "🇷🇺" },
  { value: "HE", label: "Иврит", flag: "🇮🇱" },
  { value: "ENG", label: "English", flag: "🇺🇸" },
];

const STYLES = [
  { value: "minimalism", label: "Минимализм", emoji: "◻️", color: "from-gray-100 to-gray-200" },
  { value: "gradient", label: "Градиент", emoji: "🌈", color: "from-purple-100 to-pink-100" },
  { value: "bright", label: "Яркий", emoji: "🎨", color: "from-yellow-100 to-orange-100" },
  { value: "photorealism", label: "Фото-реализм", emoji: "📸", color: "from-blue-50 to-cyan-50" },
  { value: "neon", label: "Неон", emoji: "💡", color: "from-violet-100 to-fuchsia-100" },
  { value: "corporate", label: "Корпоративный", emoji: "🏢", color: "from-slate-100 to-blue-100" },
];

const COLORS = [
  { hex: "#000000", name: "Чёрный" },
  { hex: "#FFFFFF", name: "Белый" },
  { hex: "#FF3B30", name: "Красный" },
  { hex: "#FF9500", name: "Оранжевый" },
  { hex: "#FFCC00", name: "Жёлтый" },
  { hex: "#34C759", name: "Зелёный" },
  { hex: "#007AFF", name: "Синий" },
  { hex: "#5856D6", name: "Фиолетовый" },
  { hex: "#AF52DE", name: "Пурпурный" },
  { hex: "#FF2D55", name: "Розовый" },
];

const PIPELINE_STAGES = [
  { label: "Отправлено", icon: Send },
  { label: "Анализ", icon: Zap },
  { label: "Генерация", icon: Sparkles },
  { label: "Готово", icon: CheckCircle2 },
];

const stepAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: "easeOut" },
};

// ── Component ──────────────────────────────────────────
export default function ClonyWizard() {
  const { active, isAgency } = useWorkspace();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ClonyFormData>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const update = useCallback(
    <K extends keyof ClonyFormData>(key: K, value: ClonyFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ── Validation ─────────────────────────────────────
  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return Boolean(form.ad_type && form.source_type);
      case 1: {
        if (form.source_type === "link" && !form.product_url.trim()) return false;
        if (form.source_type === "description" && !form.description.trim()) return false;
        if (form.source_type === "photo" && form.photo_files.length === 0) return false;
        if (form.source_type === "audio" && !form.audio_file) return false;
        return Boolean(form.category && form.goal);
      }
      case 2:
        return Boolean(form.aspect_ratio && form.language && form.quantity >= 1);
      case 3:
        return Boolean(form.style);
      default:
        return false;
    }
  };

  // ── File handling ──────────────────────────────────
  const handlePhotoFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 10 - form.photo_files.length);
    const updatedFiles = [...form.photo_files, ...newFiles];
    update("photo_files", updatedFiles);
    setPhotoPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePhoto = (idx: number) => {
    update("photo_files", form.photo_files.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let photoUrls: string[] = [];
      let audioUrl: string | undefined;

      if (form.source_type === "photo" && form.photo_files.length > 0) {
        for (const file of form.photo_files) {
          const ext = file.name.split(".").pop();
          const path = `clony/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("content_assets")
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (error) throw error;
          const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }

      if (form.source_type === "audio" && form.audio_file) {
        const ext = form.audio_file.name.split(".").pop();
        const path = `clony/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("content_assets")
          .upload(path, form.audio_file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
        audioUrl = data.publicUrl;
      }

      const payload = {
        ad_type: form.ad_type,
        source_type: form.source_type,
        product_url: form.source_type === "link" ? form.product_url : undefined,
        description: form.source_type === "description" ? form.description : undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        audio_url: audioUrl,
        category: form.category,
        goal: form.goal,
        additional_instructions: form.additional_instructions || undefined,
        aspect_ratio: form.aspect_ratio,
        language: form.language,
        quantity: form.quantity,
        style: form.style,
        color: form.color || undefined,
        project_id: isAgency ? undefined : active?.id,
        client_name: active?.name,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch("https://n8n.zapoinov.com/webhook/clony-yurii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Webhook error: ${res.status}`);

      setSubmitted(true);
      toast({ title: "Запуск выполнен", description: "Clony AI обрабатывает запрос. Результат придёт в Telegram." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast({ title: "Ошибка отправки", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setForm({ ...INITIAL_FORM });
    setSubmitted(false);
    photoPreviews.forEach(URL.revokeObjectURL);
    setPhotoPreviews([]);
  };

  // ── Success View ───────────────────────────────────
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-[2.5rem] border border-border/40 bg-card p-10 sm:p-14 text-center space-y-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 via-primary to-green-400" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Запрос отправлен!</h2>
            <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
              Clony AI уже работает над вашим креативом. Результат появится в Telegram-группе.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-5 py-4">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="flex items-center gap-3 sm:gap-5">
                  {i > 0 && <div className={cn("h-px w-4 sm:w-8", i <= 0 ? "bg-green-400" : "bg-border/30")} />}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center",
                        i === 0 ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-secondary/40 text-muted-foreground/30"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-[0.15em]",
                      i === 0 ? "text-green-600" : "text-muted-foreground/25"
                    )}>
                      {stage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <CfButtonMd onClick={handleReset} variant="outline" className="gap-2 border-border/50 shadow-sm">
            <RotateCcw className="h-4 w-4" /> Создать ещё
          </CfButtonMd>
        </motion.div>
      </div>
    );
  }

  // ── Step Header ────────────────────────────────────
  const meta = STEP_META[step];
  const StepIcon = meta.icon;

  // ── Steps ──────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div key="s0" {...stepAnim} className="space-y-10">
            {/* Ad type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 px-1">
                <Layers className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Тип рекламы</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AD_TYPES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("ad_type", value)}
                    className={cn(
                      "group relative flex flex-col items-center gap-3 p-6 rounded-[1.5rem] border-2 transition-all duration-300",
                      form.ad_type === value
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                        : "border-border/30 bg-card hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                      form.ad_type === value
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] font-black uppercase tracking-widest block">{label}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-medium mt-0.5 block">{desc}</span>
                    </div>
                    {form.ad_type === value && (
                      <motion.div
                        layoutId="adCheck"
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Source type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 px-1">
                <FileText className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Источник контента</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SOURCE_TYPES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("source_type", value)}
                    className={cn(
                      "group relative flex flex-col items-center gap-3 p-6 rounded-[1.5rem] border-2 transition-all duration-300",
                      form.source_type === value
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                        : "border-border/30 bg-card hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                      form.source_type === value
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] font-black uppercase tracking-widest block">{label}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-medium mt-0.5 block">{desc}</span>
                    </div>
                    {form.source_type === value && (
                      <motion.div
                        layoutId="srcCheck"
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div key="s1" {...stepAnim} className="space-y-6">
            {/* Source input */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                {form.source_type === "link" && <Link className="h-4 w-4 text-primary/60" />}
                {form.source_type === "description" && <FileText className="h-4 w-4 text-primary/60" />}
                {form.source_type === "photo" && <ImageIcon className="h-4 w-4 text-primary/60" />}
                {form.source_type === "audio" && <Mic className="h-4 w-4 text-primary/60" />}
                <Label className={cfStyles.label}>
                  {form.source_type === "link" ? "Ссылка на продукт или страницу" :
                   form.source_type === "description" ? "Описание продукта или услуги" :
                   form.source_type === "photo" ? "Загрузите фотографии (до 10 шт.)" :
                   "Загрузите аудио файл"}
                </Label>
              </div>

              {form.source_type === "link" && (
                <Input
                  value={form.product_url}
                  onChange={(e) => update("product_url", e.target.value)}
                  placeholder="https://example.com/product"
                  className="h-13 rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 px-5"
                />
              )}

              {form.source_type === "description" && (
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Опишите ваш продукт, услугу или бренд. AI создаст креатив на основе этого описания..."
                  className="min-h-[140px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-5"
                />
              )}

              {form.source_type === "photo" && (
                <div className="space-y-4">
                  <label className={cn(
                    "flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all gap-3 group",
                    form.photo_files.length > 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                  )}>
                    <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {form.photo_files.length > 0 ? `Загружено: ${form.photo_files.length} файл(ов)` : "Нажмите или перетащите файлы"}
                    </span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoFiles(e.target.files)} />
                  </label>
                  {photoPreviews.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {photoPreviews.map((url, i) => (
                        <div key={url} className="relative flex-shrink-0 h-20 w-20 rounded-2xl overflow-hidden border-2 border-border/40 group shadow-sm">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.source_type === "audio" && (
                <label className={cn(
                  "flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all gap-3 group",
                  form.audio_file
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                )}>
                  <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center px-4">
                    {form.audio_file ? form.audio_file.name : "Нажмите для выбора аудио"}
                  </span>
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => update("audio_file", e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            {/* Category & Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-[2rem] bg-card border border-border/40 p-6 space-y-4 shadow-sm">
                <Label className={cfStyles.label}>Категория бизнеса</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(({ value, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("category", value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all",
                        form.category === value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span>{emoji}</span> {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] bg-card border border-border/40 p-6 space-y-4 shadow-sm">
                <Label className={cfStyles.label}>Цель рекламы</Label>
                <div className="grid grid-cols-1 gap-2">
                  {GOALS.map(({ value, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("goal", value)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold transition-all",
                        form.goal === value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span className="text-base">{emoji}</span> {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional instructions */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 space-y-4 shadow-sm">
              <Label className={cfStyles.label}>Дополнительные указания <span className="text-muted-foreground/40 normal-case font-medium">(необязательно)</span></Label>
              <Textarea
                value={form.additional_instructions}
                onChange={(e) => update("additional_instructions", e.target.value)}
                placeholder="Особые пожелания: тон коммуникации, акценты, что важно подчеркнуть..."
                className="min-h-[80px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-4"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="s2" {...stepAnim} className="space-y-6">
            {/* Aspect ratio */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Ratio className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Пропорции изображения</Label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {RATIOS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("aspect_ratio", value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-4 rounded-2xl transition-all duration-300",
                      form.aspect_ratio === value
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-sm font-black">{label}</span>
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-wider",
                      form.aspect_ratio === value ? "text-white/70" : "text-muted-foreground/50"
                    )}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Язык контента</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("language", value)}
                    className={cn(
                      "flex items-center justify-center gap-3 h-14 rounded-2xl transition-all duration-300",
                      form.language === value
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-xl">{flag}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Hash className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Количество вариантов</Label>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => update("quantity", Math.max(1, form.quantity - 1))}
                  className="h-12 w-12 rounded-2xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-foreground tabular-nums">{form.quantity}</span>
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">вариантов</span>
                </div>
                <button
                  type="button"
                  onClick={() => update("quantity", Math.min(10, form.quantity + 1))}
                  className="h-12 w-12 rounded-2xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="s3" {...stepAnim} className="space-y-6">
            {/* Style */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Palette className="h-4 w-4 text-primary/60" />
                <Label className={cfStyles.label}>Визуальный стиль</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLES.map(({ value, label, emoji, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("style", value)}
                    className={cn(
                      "relative flex flex-col items-center gap-3 p-6 rounded-[1.5rem] border-2 transition-all duration-300 overflow-hidden",
                      form.style === value
                        ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                        : "border-border/30 hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", color)} />
                    <span className="text-2xl relative z-10">{emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{label}</span>
                    {form.style === value && (
                      <motion.div
                        layoutId="styleCheck"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md z-10"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4 text-primary/60" />
                  <Label className={cfStyles.label}>Акцентный цвет <span className="text-muted-foreground/40 normal-case font-medium">(необязательно)</span></Label>
                </div>
                {form.color && (
                  <button type="button" onClick={() => update("color", "")} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Сбросить
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(({ hex, name }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => update("color", form.color === hex ? "" : hex)}
                    title={name}
                    className={cn(
                      "h-10 w-10 rounded-2xl border-2 transition-all duration-200",
                      form.color === hex
                        ? "border-primary scale-125 shadow-lg ring-2 ring-primary/20"
                        : "border-border/30 hover:scale-110 hover:shadow-md"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <Label className={cn(cfStyles.label, "text-primary")}>Итого — ваш запрос</Label>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                {[
                  ["Тип", AD_TYPES.find((t) => t.value === form.ad_type)?.label ?? form.ad_type],
                  ["Источник", SOURCE_TYPES.find((s) => s.value === form.source_type)?.label ?? form.source_type],
                  ["Категория", form.category],
                  ["Цель", form.goal],
                  ["Формат", `${form.aspect_ratio} / ${LANGUAGES.find((l) => l.value === form.language)?.label ?? form.language}`],
                  ["Количество", `${form.quantity} вариант(ов)`],
                  ["Стиль", STYLES.find((s) => s.value === form.style)?.label ?? form.style],
                  ...(form.color ? [["Цвет", COLORS.find((c) => c.hex === form.color)?.name ?? form.color]] : []),
                ].map(([key, val]) => (
                  <div key={key as string} className="contents">
                    <span className="text-muted-foreground/60 font-medium">{key}</span>
                    <span className="font-bold text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ── Main Render ────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Step Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                <span className="text-primary mr-2">{step + 1}/{STEP_META.length}</span>
                {meta.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{meta.desc}</p>
            </div>
          </div>

          {/* Mini progress */}
          <div className="flex gap-1.5">
            {STEP_META.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i <= step ? "bg-primary w-8" : "bg-border/30 w-4"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 pb-4">
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
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-8"
            >
              Далее <ArrowRight className="h-4 w-4" />
            </CfButtonMd>
          ) : (
            <CfButtonMd
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="gap-2.5 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 px-8 h-13"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Запустить генерацию
            </CfButtonMd>
          )}
        </div>
      </div>
    </div>
  );
}
