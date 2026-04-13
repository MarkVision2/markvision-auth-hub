import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  SquareStack,
  Smartphone,
  CheckCircle2,
  Upload,
  Palette,
  Zap,
  Globe,
  Hash,
  RotateCcw,
  Send,
  X,
  Camera,
  Play,
  MonitorPlay,
  Megaphone,
  PanelTop,
  MousePointerClick,
  PenLine,
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
interface ContentType {
  value: string;
  label: string;
  desc: string;
  icon: typeof Layers;
}

type SourceMode = "link" | "photo" | "description";

interface WizardForm {
  content_type: string;
  source_mode: SourceMode | "";
  source_url: string;
  logo_file: File | null;
  photo_file: File | null;
  description_text: string;
  main_prompt: string;
  additional_instructions: string;
  aspect_ratio: string;
  cta: string[];
  language: string;
  slide_count: number;
  style: string;
  custom_style: string;
}

const INITIAL: WizardForm = {
  content_type: "",
  source_mode: "",
  source_url: "",
  logo_file: null,
  photo_file: null,
  description_text: "",
  main_prompt: "",
  additional_instructions: "",
  aspect_ratio: "1:1",
  cta: [],
  language: "RU",
  slide_count: 1,
  style: "",
  custom_style: "",
};

// ── Content Types ────────────────────────────────────
const CONTENT_TYPES: ContentType[] = [
  { value: "insta-carousel", label: "Insta Carousel", desc: "Образовательный контент", icon: SquareStack },
  { value: "facebook-ads", label: "Facebook Ads", desc: "Таргет реклама", icon: Megaphone },
  { value: "google-ads", label: "Google Ads", desc: "Баннеры (КМС)", icon: PanelTop },
  { value: "neural-photo", label: "Нейрофотосессия", desc: "AI-портреты", icon: Camera },
  { value: "reels-cover", label: "Reels Cover", desc: "Instagram, TikTok", icon: Play },
  { value: "stories", label: "Stories / Прогрев", desc: "Instagram", icon: Smartphone },
  { value: "youtube", label: "YouTube", desc: "Превью видео", icon: MonitorPlay },
  { value: "banner", label: "Баннер", desc: "Сайт, реклама", icon: ImageIcon },
];

const SOURCE_MODES: { value: SourceMode; label: string; desc: string; icon: typeof Link }[] = [
  { value: "link", label: "По ссылке", desc: "Вставьте ссылку на рилс, пост или страницу", icon: Link },
  { value: "photo", label: "По фото", desc: "Загрузите лого и/или своё фото", icon: ImageIcon },
  { value: "description", label: "По описанию", desc: "Опишите идею, нишу и продукт", icon: FileText },
];

const RATIOS = [
  { value: "1:1", label: "1:1", desc: "Квадрат" },
  { value: "4:5", label: "4:5", desc: "Portrait" },
  { value: "9:16", label: "9:16", desc: "Stories / Reels" },
  { value: "16:9", label: "16:9", desc: "YouTube" },
];

const CTA_OPTIONS = [
  { value: "follow", label: "Follow" },
  { value: "like", label: "Like" },
  { value: "comment", label: "Comment" },
  { value: "share", label: "Share" },
  { value: "save", label: "Save" },
  { value: "link_bio", label: "Link Bio" },
];

const LANGUAGES = [
  { value: "RU", label: "Русский", flag: "🇷🇺" },
  { value: "KZ", label: "Қазақша", flag: "🇰🇿" },
];

const SLIDE_COUNTS = [1, 3, 5, 7, 10];

const STYLES = [
  { value: "modern", label: "Современный", emoji: "🔥" },
  { value: "minimalism", label: "Минимализм", emoji: "◻️" },
];

const STEP_META = [
  { title: "Тип контента", desc: "Выберите формат рекламного креатива", icon: Layers },
  { title: "Источник и описание", desc: "Укажите исходные материалы и задайте промт", icon: FileText },
  { title: "Настройки формата", desc: "Формат, CTA, язык, количество и стиль", icon: Palette },
] as const;

const PIPELINE_STAGES = [
  { label: "Отправлено", icon: Send },
  { label: "Анализ", icon: Zap },
  { label: "Генерация", icon: Sparkles },
  { label: "Готово", icon: CheckCircle2 },
];

const anim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

// ── Component ──────────────────────────────────────────
export default function ClonyWizard() {
  const { active, isAgency } = useWorkspace();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({ ...INITIAL });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // File previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleCta = (val: string) => {
    setForm((prev) => ({
      ...prev,
      cta: prev.cta.includes(val) ? prev.cta.filter((c) => c !== val) : [...prev.cta, val],
    }));
  };

  // ── File helpers ───────────────────────────────────
  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    set("logo_file", file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    set("photo_file", file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearFile = (type: "logo" | "photo") => {
    if (type === "logo") {
      set("logo_file", null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    } else {
      set("photo_file", null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  // ── Upload helper ──────────────────────────────────
  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `clony/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("content_assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("content_assets").getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Validation ─────────────────────────────────────
  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return Boolean(form.content_type);
      case 1: {
        if (!form.source_mode) return false;
        if (form.source_mode === "link" && !form.source_url.trim()) return false;
        if (form.source_mode === "description" && !form.description_text.trim()) return false;
        if (form.source_mode === "photo" && !form.logo_file && !form.photo_file) return false;
        return Boolean(form.main_prompt.trim());
      }
      case 2:
        return Boolean(form.aspect_ratio && form.language);
      default:
        return false;
    }
  };

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      let photoUrl: string | undefined;

      if (form.logo_file) logoUrl = await uploadFile(form.logo_file);
      if (form.photo_file) photoUrl = await uploadFile(form.photo_file);

      const payload = {
        content_type: form.content_type,
        source_mode: form.source_mode,
        source_url: form.source_mode === "link" ? form.source_url : undefined,
        logo_url: logoUrl,
        photo_url: photoUrl,
        description: form.source_mode === "description" ? form.description_text : undefined,
        main_prompt: form.main_prompt,
        additional_instructions: form.additional_instructions || undefined,
        aspect_ratio: form.aspect_ratio,
        cta: form.cta.length > 0 ? form.cta : undefined,
        language: form.language,
        slide_count: form.slide_count,
        style: form.style || undefined,
        custom_style: form.custom_style || undefined,
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
      toast({ title: "Запуск выполнен", description: "Clony AI создаёт ваш контент. Результат придёт в Telegram." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast({ title: "Ошибка отправки", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setForm({ ...INITIAL });
    setSubmitted(false);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setLogoPreview(null);
    setPhotoPreview(null);
  };

  // ════════════════════════════════════════════════════
  // VIEWS
  // ════════════════════════════════════════════════════

  // ── Success ────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[55vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-[2.5rem] border border-border/40 bg-card p-10 sm:p-14 text-center space-y-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 via-primary to-green-400" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Запрос отправлен!</h2>
            <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
              Clony AI уже работает. Результат появится в Telegram.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-5 py-4">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="flex items-center gap-3 sm:gap-5">
                  {i > 0 && <div className={cn("h-px w-4 sm:w-8", i <= 0 ? "bg-green-400" : "bg-border/30")} />}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                        i === 0 ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-secondary/40 text-muted-foreground/30"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                    <span className={cn("text-[8px] font-black uppercase tracking-[0.15em]",
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

  // ── Step 0: Content Type ───────────────────────────
  const renderStep0 = () => (
    <motion.div key="s0" {...anim} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CONTENT_TYPES.map(({ value, label, desc, icon: Icon }) => (
          <button key={value} type="button" onClick={() => set("content_type", value)}
            className={cn(
              "group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-[1.5rem] border-2 transition-all duration-300",
              form.content_type === value
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-border/30 bg-card hover:border-primary/30 hover:shadow-md"
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              form.content_type === value
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-wider block leading-tight">{label}</span>
              <span className="text-[9px] text-muted-foreground/60 font-medium mt-1 block">{desc}</span>
            </div>
            {form.content_type === value && (
              <motion.div layoutId="typeCheck"
                className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );

  // ── Step 1: Source + Prompt ─────────────────────────
  const renderStep1 = () => (
    <motion.div key="s1" {...anim} className="space-y-6">
      {/* Source mode selector */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Link className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Источник контента</Label>
        </div>
        <p className="text-xs text-muted-foreground font-medium -mt-2">
          Выберите способ создания: по ссылке, по фото или по описанию
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SOURCE_MODES.map(({ value, label, desc, icon: Icon }) => (
            <button key={value} type="button" onClick={() => set("source_mode", value)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                form.source_mode === value
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/30 bg-background hover:border-primary/20"
              )}
            >
              <div className={cn(
                "h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors",
                form.source_mode === value ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider block">{label}</span>
                <span className="text-[9px] text-muted-foreground/60 font-medium block mt-0.5">{desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Conditional source inputs */}
        <AnimatePresence mode="wait">
          {form.source_mode === "link" && (
            <motion.div key="link-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
              <Label className={cn(cfStyles.label, "text-muted-foreground/50")}>Ссылка на контент (Reels, пост, страница)</Label>
              <Input
                value={form.source_url}
                onChange={(e) => set("source_url", e.target.value)}
                placeholder="https://instagram.com/reel/... или любая ссылка"
                className="h-13 rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 px-5"
              />
            </motion.div>
          )}

          {form.source_mode === "photo" && (
            <motion.div key="photo-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className={cn(cfStyles.label, "text-muted-foreground/50")}>Логотип</Label>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  {logoPreview ? (
                    <div className="relative h-28 rounded-2xl overflow-hidden border-2 border-primary/30 bg-primary/5 group">
                      <img src={logoPreview} alt="" className="h-full w-full object-contain p-2" />
                      <button type="button" onClick={() => clearFile("logo")}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoRef.current?.click()}
                      className="w-full h-28 rounded-2xl border-2 border-dashed border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border flex flex-col items-center justify-center gap-2 transition-all"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground/40" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Загрузить лого</span>
                    </button>
                  )}
                </div>

                {/* Photo upload */}
                <div className="space-y-2">
                  <Label className={cn(cfStyles.label, "text-muted-foreground/50")}>Ваше фото</Label>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  {photoPreview ? (
                    <div className="relative h-28 rounded-2xl overflow-hidden border-2 border-primary/30 bg-primary/5 group">
                      <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => clearFile("photo")}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => photoRef.current?.click()}
                      className="w-full h-28 rounded-2xl border-2 border-dashed border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border flex flex-col items-center justify-center gap-2 transition-all"
                    >
                      <Camera className="h-5 w-5 text-muted-foreground/40" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Загрузить фото</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {form.source_mode === "description" && (
            <motion.div key="desc-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
              <Label className={cn(cfStyles.label, "text-muted-foreground/50")}>Опишите продукт / нишу / идею</Label>
              <Textarea
                value={form.description_text}
                onChange={(e) => set("description_text", e.target.value)}
                placeholder="Например: Стоматологическая клиника в Алматы, премиум-сегмент, виниры и имплантация..."
                className="min-h-[100px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-5"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main prompt */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <PenLine className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Главное описание</Label>
        </div>
        <Textarea
          value={form.main_prompt}
          onChange={(e) => set("main_prompt", e.target.value)}
          placeholder="Что именно создать? Какой текст должен быть? Какой посыл? Опишите максимально подробно..."
          className="min-h-[120px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-5"
        />
      </div>

      {/* Additional instructions */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Mic className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>
            Дополнительные инструкции
            <span className="text-muted-foreground/40 normal-case font-medium ml-2">(необязательно)</span>
          </Label>
        </div>
        <Textarea
          value={form.additional_instructions}
          onChange={(e) => set("additional_instructions", e.target.value)}
          placeholder="Особые пожелания, тон, акценты, что точно НЕ должно быть..."
          className="min-h-[80px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-5"
        />
      </div>
    </motion.div>
  );

  // ── Step 2: Format Settings ────────────────────────
  const renderStep2 = () => (
    <motion.div key="s2" {...anim} className="space-y-6">
      {/* Aspect Ratio */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Hash className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Соотношение сторон</Label>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {RATIOS.map(({ value, label, desc }) => (
            <button key={value} type="button" onClick={() => set("aspect_ratio", value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-4 rounded-2xl transition-all duration-300",
                form.aspect_ratio === value
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <span className="text-sm font-black">{label}</span>
              <span className={cn("text-[8px] font-bold uppercase tracking-wider",
                form.aspect_ratio === value ? "text-white/70" : "text-muted-foreground/50"
              )}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <MousePointerClick className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Call to Action (CTA) <span className="text-muted-foreground/40 normal-case font-medium">— можно выбрать несколько</span></Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => toggleCta(value)}
              className={cn(
                "h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200",
                form.cta.includes(value)
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Globe className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Язык текста</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(({ value, label, flag }) => (
            <button key={value} type="button" onClick={() => set("language", value)}
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

      {/* Slide count */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <SquareStack className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Количество слайдов / вариантов</Label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {SLIDE_COUNTS.map((n) => (
            <button key={n} type="button" onClick={() => set("slide_count", n)}
              className={cn(
                "flex flex-col items-center gap-1 py-4 rounded-2xl transition-all duration-300",
                form.slide_count === n
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <span className="text-lg font-black">{n}</span>
              <span className={cn("text-[8px] font-bold",
                form.slide_count === n ? "text-white/70" : "text-muted-foreground/40"
              )}>
                {n === 1 ? "1 вариант" : `${n} вариантов`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="rounded-[2rem] bg-card border border-border/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Palette className="h-4 w-4 text-primary/60" />
          <Label className={cfStyles.label}>Стиль дизайна <span className="text-muted-foreground/40 normal-case font-medium">— если не выбрать, система подберёт сама</span></Label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STYLES.map(({ value, label, emoji }) => (
            <button key={value} type="button"
              onClick={() => set("style", form.style === value ? "" : value)}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                form.style === value
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/30 bg-background hover:border-primary/20"
              )}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
              {form.style === value && (
                <motion.div layoutId="styleCheck"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm"
                >
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </button>
          ))}
          {/* Custom style */}
          <button type="button"
            onClick={() => {
              set("style", "custom");
              if (form.style !== "custom") set("custom_style", "");
            }}
            className={cn(
              "relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
              form.style === "custom"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border/30 bg-background hover:border-primary/20"
            )}
          >
            <span className="text-xl">✏️</span>
            <span className="text-[11px] font-black uppercase tracking-wider">Свой стиль</span>
            {form.style === "custom" && (
              <motion.div layoutId="styleCheck"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm"
              >
                <CheckCircle2 className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </button>
        </div>

        {form.style === "custom" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <Textarea
              value={form.custom_style}
              onChange={(e) => set("custom_style", e.target.value)}
              placeholder="Опишите желаемый стиль: цвета, настроение, референсы..."
              className="min-h-[80px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-4 mt-3"
            />
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <Label className={cn(cfStyles.label, "text-primary")}>Сводка</Label>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
          {[
            ["Тип", CONTENT_TYPES.find((t) => t.value === form.content_type)?.label ?? form.content_type],
            ["Источник", SOURCE_MODES.find((s) => s.value === form.source_mode)?.label ?? form.source_mode],
            ["Формат", `${form.aspect_ratio} / ${LANGUAGES.find((l) => l.value === form.language)?.label ?? form.language}`],
            ...(form.cta.length > 0 ? [["CTA", form.cta.map((c) => CTA_OPTIONS.find((o) => o.value === c)?.label ?? c).join(", ")]] : []),
            ["Слайды", `${form.slide_count}`],
            ...(form.style ? [["Стиль", form.style === "custom" ? (form.custom_style || "Свой") : STYLES.find((s) => s.value === form.style)?.label ?? form.style]] : []),
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

  // ── Main Render ────────────────────────────────────
  const meta = STEP_META[step];
  const StepIcon = meta.icon;
  const isLastStep = step === STEP_META.length - 1;

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Step header */}
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
          <div className="flex gap-1.5">
            {STEP_META.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500",
                i <= step ? "bg-primary w-8" : "bg-border/30 w-4"
              )} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 pb-4">
          <CfButtonMd
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </CfButtonMd>

          {!isLastStep ? (
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
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Запустить генерацию
            </CfButtonMd>
          )}
        </div>
      </div>
    </div>
  );
}
