import { useState, useCallback, useRef, useEffect } from "react";
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
  Plus,
  User,
  Star,
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

interface SavedCharacter {
  id: string;
  name: string;
  photo_urls: string[];
  created_at: string;
  project_id: string | null;
}

interface WizardForm {
  content_type: string;
  source_mode: SourceMode | "";
  source_url: string;
  logo_file: File | null;
  cover_photo_file: File | null;
  additional_photos: File[];
  character_photos: File[];
  character_name: string;
  saved_character_id: string | null;
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
  cover_photo_file: null,
  additional_photos: [],
  character_photos: [],
  character_name: "",
  saved_character_id: null,
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
  { value: "fb-target", label: "Facebook Ads", desc: "Таргет реклама", icon: Megaphone },
  { value: "google-ads", label: "Google Ads", desc: "Баннеры (КМС)", icon: PanelTop },
  { value: "neuro-photo", label: "Нейрофотосессия", desc: "AI-портреты", icon: Camera },
  { value: "reels-cover", label: "Reels Cover", desc: "Instagram, TikTok", icon: Play },
  { value: "instagram-stories", label: "Stories / Прогрев", desc: "Instagram", icon: Smartphone },
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

// ── Детальные инструкции по типу контента ────────
const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  "insta-carousel": `[ТИП: INSTAGRAM КАРУСЕЛЬ]
Формат: Серия связанных слайдов (количество указано в параметре slides).
Каждый слайд — самостоятельная визуальная единица, но вместе они формируют логичную историю.
Структура обязательна:
- Слайд 1: ХУК — цепляющий заголовок, интрига или провокационный вопрос. Человек должен остановить скролл.
- Слайды 2..N-1: ЦЕННОСТЬ — раскрытие темы, факты, советы, механизм, доказательства. Каждый слайд = 1 мысль.
- Последний слайд: CTA — призыв к действию (подписаться, сохранить, написать в директ).
Визуал: Единый стиль на всех слайдах. Крупный читаемый текст. Контрастные цвета. Логотип на каждом слайде внизу.
НЕ делать: слайды без текста, одинаковый текст на разных слайдах, мелкий шрифт.`,

  "fb-target": `[ТИП: РЕКЛАМНЫЙ БАННЕР ДЛЯ FACEBOOK/INSTAGRAM ADS]
Формат: ОДИН рекламный баннер (не карусель!). Это платная реклама — креатив для таргета.
Цель: Привлечь внимание → Донести оффер → Побудить кликнуть.
Обязательные элементы:
- Яркий, цепляющий заголовок (макс 5-7 слов, крупный шрифт)
- Чёткий оффер с конкретикой (скидка, бесплатно, результат за N дней)
- CTA-кнопка или текст действия: «Записаться», «Узнать подробнее», «Получить бесплатно», «Оставить заявку»
- Логотип бренда
- Контактная информация или призыв перейти по ссылке
Визуал: Яркий, контрастный. Лицо человека повышает CTR. Минимум текста (Facebook ограничивает). Читаемость на мобильном.
НЕ делать: много текста, мелкий шрифт, карусель из нескольких слайдов, абстрактные фото без людей.`,

  "google-ads": `[ТИП: БАННЕР ДЛЯ GOOGLE ADS (КМС)]
Формат: Статичный рекламный баннер для контекстно-медийной сети Google.
Размеры определяются aspect ratio. Основные: 1:1 (300x300), 16:9 (728x90, 1200x628), 4:5 (300x250).
Обязательные элементы:
- Заголовок: короткий, конкретный, с выгодой (макс 5 слов)
- Подзаголовок с деталями оффера
- CTA-кнопка: яркая, контрастная — «Узнать больше», «Получить скидку», «Заказать»
- Логотип бренда
Визуал: Чистый дизайн, минимум элементов, сильный контраст текста и фона. Баннер должен работать на маленьком размере.
НЕ делать: перегруженный дизайн, более 3 строк текста, плохо читаемые шрифты на малом размере.`,

  "neuro-photo": `[ТИП: НЕЙРОФОТОСЕССИЯ — AI ПОРТРЕТЫ]
Формат: Профессиональная фотосессия сгенерированная AI на основе загруженного фото человека.
КРИТИЧЕСКИ ВАЖНО: Если загружено фото человека — использовать ЕГО ЛИЦО. Генерировать портреты именно этого человека в разных образах, позах, локациях.
Что генерировать:
- Профессиональные портреты (бизнес, casual, lifestyle)
- Лицо должно быть узнаваемым и похожим на оригинал
- Разные ракурсы, освещение, фоны
- Студийное качество, профессиональная ретушь
Визуал: Фотореалистичный стиль. Качество как у профессионального фотографа. Естественное освещение или студийный свет.
НЕ делать: менять лицо, делать мультяшным, сильно искажать внешность, рисовать вместо фото.`,

  "reels-cover": `[ТИП: ОБЛОЖКА ДЛЯ REELS / TIKTOK]
Формат: Одна вертикальная обложка (9:16). Превью для видео в ленте.
Обязательные элементы:
- Крупный заголовок (2-4 слова) — суть видео, интрига
- Фото автора или ключевой кадр
- Яркий фон или градиент
- Эмодзи или иконки для привлечения внимания
Визуал: Максимально яркий и контрастный. Должна выделяться среди других обложек в сетке профиля. Текст крупный, читаемый на маленьком превью.
НЕ делать: мелкий текст, тёмные фото, перегруженный дизайн, много элементов.`,

  "instagram-stories": `[ТИП: INSTAGRAM STORIES / ПРОГРЕВ]
Формат: Серия сторис для прогрева аудитории. Каждая сторис — вертикальная (9:16).
Структура прогрева:
- Сторис 1: Привлечение внимания — вопрос, интрига, боль аудитории
- Сторис 2-3: Раскрытие темы, история, закулисье, процесс
- Сторис 4: Социальное доказательство — отзывы, результаты, до/после
- Последняя сторис: CTA — «Напишите в директ», «Переходите по ссылке», опрос/голосование
Визуал: Живой, неформальный стиль. Крупный текст. Стикеры, опросы, вопросы. Фото или видео автора.
НЕ делать: слишком официальный стиль, мелкий текст, отсутствие CTA.`,

  "youtube": `[ТИП: ПРЕВЬЮ ДЛЯ YOUTUBE ВИДЕО (THUMBNAIL)]
Формат: Горизонтальное превью (16:9, 1280x720). Задача — максимальный CTR в ленте YouTube.
Обязательные элементы:
- Лицо с яркой эмоцией (удивление, восторг, шок) — повышает CTR на 30%
- Крупный текст (3-5 слов) — должен читаться на мобильном
- Контрастные цвета (жёлтый/красный текст на тёмном фоне)
- Стрелки, круги, выделения для акцента
Визуал: Максимальная яркость и контраст. Стиль MrBeast/топ-блогеров. Чёткая композиция: лицо слева, текст справа.
НЕ делать: мелкий текст, тёмное фото, отсутствие лица, более 5 слов.`,

  "banner": `[ТИП: УНИВЕРСАЛЬНЫЙ БАННЕР]
Формат: Статичный баннер для сайта, рекламы, соцсетей. Размер определяется aspect ratio.
Обязательные элементы:
- Заголовок с главным оффером
- Подзаголовок с деталями (необязательно)
- CTA-элемент (кнопка или текст действия)
- Логотип бренда
- Визуальный акцент (фото продукта, иллюстрация, паттерн)
Визуал: Чистый профессиональный дизайн. Читаемая типографика. Баланс текста и визуала.
НЕ делать: перегруженный макет, мелкий нечитаемый текст, отсутствие CTA.`,
};

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
  const [enhancing, setEnhancing] = useState(false);

  // File previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [characterPreviews, setCharacterPreviews] = useState<string[]>([]);

  // Character management
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [savingCharacter, setSavingCharacter] = useState(false);

  // File input refs
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const additionalRef = useRef<HTMLInputElement>(null);
  const characterRef = useRef<HTMLInputElement>(null);

  // Load saved characters when neuro-photo is selected
  useEffect(() => {
    if (form.content_type === "neuro-photo") {
      loadSavedCharacters();
    }
  }, [form.content_type]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedCharacters = async () => {
    setLoadingCharacters(true);
    try {
      const { data } = await (supabase as any)
        .from("neuro_characters")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setSavedCharacters(data);
    } catch {
      // table may not exist yet
    } finally {
      setLoadingCharacters(false);
    }
  };

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

  const handleCoverPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    set("cover_photo_file", file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
    e.target.value = "";
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setForm((prev) => {
      const canAdd = Math.min(files.length, 9 - prev.additional_photos.length);
      if (canAdd <= 0) {
        toast({ title: "Максимум 9 дополнительных фото", variant: "destructive" });
        return prev;
      }
      const newFiles = files.slice(0, canAdd);
      setAdditionalPreviews((p) => [...p, ...newFiles.map((f) => URL.createObjectURL(f))]);
      return { ...prev, additional_photos: [...prev.additional_photos, ...newFiles] };
    });
    e.target.value = "";
  };

  const handleRemoveAdditionalPhoto = (idx: number) => {
    setAdditionalPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setForm((prev) => ({
      ...prev,
      additional_photos: prev.additional_photos.filter((_, i) => i !== idx),
    }));
  };

  const handleAddCharacterPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setForm((prev) => {
      const canAdd = Math.min(files.length, 10 - prev.character_photos.length);
      if (canAdd <= 0) {
        toast({ title: "Максимум 10 фото персонажа", variant: "destructive" });
        return prev;
      }
      const newFiles = files.slice(0, canAdd);
      setCharacterPreviews((p) => [...p, ...newFiles.map((f) => URL.createObjectURL(f))]);
      return { ...prev, character_photos: [...prev.character_photos, ...newFiles] };
    });
    e.target.value = "";
  };

  const handleRemoveCharacterPhoto = (idx: number) => {
    setCharacterPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setForm((prev) => ({
      ...prev,
      character_photos: prev.character_photos.filter((_, i) => i !== idx),
    }));
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

  const uploadFiles = async (files: File[]): Promise<string[]> =>
    Promise.all(files.map((f) => uploadFile(f)));

  // ── Save character ─────────────────────────────────
  const handleSaveCharacter = async () => {
    if (!form.character_name.trim()) {
      toast({ title: "Введите имя персонажа", variant: "destructive" });
      return;
    }
    if (form.character_photos.length === 0) {
      toast({ title: "Загрузите хотя бы одно фото", variant: "destructive" });
      return;
    }
    setSavingCharacter(true);
    try {
      const photoUrls = await uploadFiles(form.character_photos);
      const { data, error } = await (supabase as any)
        .from("neuro_characters")
        .insert({
          name: form.character_name,
          photo_urls: photoUrls,
          project_id: isAgency ? null : active?.id,
        })
        .select()
        .single();
      if (error) throw error;
      setSavedCharacters((prev) => [data, ...prev]);
      set("saved_character_id", data.id);
      toast({ title: "✅ Персонаж сохранён!", description: `«${form.character_name}» доступен для будущих сессий` });
    } catch {
      toast({ title: "Ошибка сохранения персонажа", variant: "destructive" });
    } finally {
      setSavingCharacter(false);
    }
  };

  // ── Magic enhance prompt ───────────────────────────
  const handleEnhancePrompt = async () => {
    const raw = form.main_prompt.trim();
    if (!raw) {
      toast({ title: "Напишите промпт", description: "Сначала опишите идею — AI сделает из неё чёткое ТЗ", variant: "destructive" });
      return;
    }
    setEnhancing(true);
    try {
      const typeCtx = CONTENT_TYPE_INSTRUCTIONS[form.content_type] || "";
      const res = await fetch("https://n8n.zapoinov.com/webhook/clony-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: raw,
          content_type: form.content_type,
          content_type_instructions: typeCtx,
          source_mode: form.source_mode,
          language: form.language,
          slide_count: form.slide_count,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const enhanced = typeof data === "string" ? data : data.enhanced || data.result || data.output || raw;
      set("main_prompt", enhanced);
      toast({ title: "✨ Промпт улучшен", description: "AI переформулировал описание для лучшего результата" });
    } catch {
      toast({ title: "Ошибка AI", description: "Не удалось улучшить промпт. Попробуйте позже.", variant: "destructive" });
    } finally {
      setEnhancing(false);
    }
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
        if (form.source_mode === "photo") {
          if (form.content_type === "neuro-photo") {
            if (!form.saved_character_id && form.character_photos.length === 0) return false;
          } else {
            if (!form.logo_file && !form.cover_photo_file) return false;
          }
        }
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
      let coverPhotoUrl: string | undefined;
      let additionalPhotoUrls: string[] = [];
      let characterPhotoUrls: string[] = [];

      if (form.logo_file) logoUrl = await uploadFile(form.logo_file);
      if (form.cover_photo_file) coverPhotoUrl = await uploadFile(form.cover_photo_file);
      if (form.additional_photos.length > 0) additionalPhotoUrls = await uploadFiles(form.additional_photos);

      if (form.content_type === "neuro-photo") {
        if (form.saved_character_id) {
          const char = savedCharacters.find((c) => c.id === form.saved_character_id);
          if (char) characterPhotoUrls = char.photo_urls;
        } else if (form.character_photos.length > 0) {
          characterPhotoUrls = await uploadFiles(form.character_photos);
        }
      }

      const imageUrls: string[] = [
        ...(logoUrl ? [logoUrl] : []),
        ...(coverPhotoUrl ? [coverPhotoUrl] : []),
        ...additionalPhotoUrls,
        ...characterPhotoUrls,
      ];

      const typeInstructions = CONTENT_TYPE_INSTRUCTIONS[form.content_type] || "";
      let sourceContext = "";
      if (form.source_mode === "photo") {
        if (form.content_type === "neuro-photo") {
          sourceContext = `\n[НЕЙРОФОТОСЕССИЯ: Загружено ${characterPhotoUrls.length} референсных фото персонажа. КРИТИЧЕСКИ ВАЖНО — использовать СТРОГО лицо этого человека. Не менять внешность, создавать профессиональные портреты именно его.]`;
        } else {
          sourceContext = [
            "\n[ИСТОЧНИК — загружены изображения:",
            logoUrl ? "• Логотип загружен — использовать его цвета, шрифты и стиль во всём дизайне, логотип размещать где уместно." : "",
            coverPhotoUrl ? "• Обложка (главное фото) — использовать строго это фото как основу ПЕРВОГО слайда/баннера, нанести на него текст заголовка." : "",
            additionalPhotoUrls.length > 0 ? `• Дополнительные фото (${additionalPhotoUrls.length} шт.) — использовать эти фото для остальных слайдов, нанести на каждое соответствующий текст.` : "",
            "]",
          ].filter(Boolean).join(" ");
        }
      } else if (form.source_mode === "link") {
        sourceContext = "\n[ИСТОЧНИК: Ссылка на продукт/страницу — проанализировать контент и использовать информацию оттуда.]";
      }

      const formatContext = `\n[ФОРМАТ: Размер ${form.aspect_ratio}, слайдов: ${form.slide_count}, язык: ${form.language === "KZ" ? "Казахский" : "Русский"}]`;
      const fullPrompt = [
        typeInstructions,
        sourceContext,
        formatContext,
        `\nОПИСАНИЕ ЗАДАЧИ:\n${form.main_prompt}`,
        form.additional_instructions?.trim() ? `\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${form.additional_instructions}` : "",
      ].filter(Boolean).join("\n");

      const { data: dbTask, error: dbError } = await (supabase as any)
        .from("content_tasks")
        .insert({
          content_type: form.content_type,
          status: "pending",
          progress_text: "Запрос отправлен в Clony AI...",
          project_id: isAgency ? null : active?.id,
          main_text: form.main_prompt,
        })
        .select()
        .single();

      if (dbError) console.error("Supabase insert error:", dbError);

      const payload = {
        task_id: dbTask?.id,
        content_type: form.content_type,
        input_mode: form.source_mode,
        link: form.source_mode === "link" ? form.source_url : undefined,
        logo_url: logoUrl,
        cover_photo_url: coverPhotoUrl,
        additional_photo_urls: additionalPhotoUrls.length > 0 ? additionalPhotoUrls : undefined,
        character_photo_urls: characterPhotoUrls.length > 0 ? characterPhotoUrls : undefined,
        character_name: form.character_name || undefined,
        saved_character_id: form.saved_character_id || undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        description: form.source_mode === "description" ? form.description_text : undefined,
        prompt: fullPrompt,
        aspect: form.aspect_ratio,
        ctas: form.cta.length > 0 ? form.cta : undefined,
        languege: form.language,
        slides: form.slide_count,
        style: form.style === "custom" ? form.custom_style : form.style || undefined,
        name: active?.name,
        project_id: isAgency ? undefined : active?.id,
        session_id: crypto.randomUUID(),
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
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    additionalPreviews.forEach((p) => URL.revokeObjectURL(p));
    characterPreviews.forEach((p) => URL.revokeObjectURL(p));
    setLogoPreview(null);
    setCoverPreview(null);
    setAdditionalPreviews([]);
    setCharacterPreviews([]);
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
            <motion.div key="photo-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">

              {/* ── НЕЙРОФОТОСЕССИЯ: Character Management ── */}
              {form.content_type === "neuro-photo" ? (
                <div className="space-y-5 pt-2">
                  {/* Saved characters */}
                  {loadingCharacters ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/50 py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Загрузка персонажей...
                    </div>
                  ) : savedCharacters.length > 0 && (
                    <div className="space-y-3">
                      <Label className={cn(cfStyles.label, "text-muted-foreground/70")}>Сохранённые персонажи</Label>
                      <div className="flex flex-wrap gap-2">
                        {savedCharacters.map((char) => (
                          <button key={char.id} type="button"
                            onClick={() => set("saved_character_id", char.id === form.saved_character_id ? null : char.id)}
                            className={cn(
                              "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 text-sm",
                              form.saved_character_id === char.id
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border/30 bg-background hover:border-primary/30 text-foreground"
                            )}
                          >
                            <div className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black",
                              form.saved_character_id === char.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                            )}>
                              {char.photo_urls?.[0] ? (
                                <img src={char.photo_urls[0]} alt="" className="h-full w-full object-cover rounded-full" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <span className="font-bold text-[12px]">{char.name}</span>
                            {form.saved_character_id === char.id && (
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                      {form.saved_character_id && (
                        <p className="text-[10px] text-primary/70 font-medium">
                          ✓ Персонаж выбран — его лицо будет использовано строго
                        </p>
                      )}
                    </div>
                  )}

                  {/* Create new character */}
                  {!form.saved_character_id && (
                    <div className="rounded-2xl bg-secondary/20 border border-border/40 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-primary/60" />
                        <Label className={cn(cfStyles.label, "text-muted-foreground/70")}>
                          {savedCharacters.length > 0 ? "Или создайте нового персонажа" : "Создать персонажа для фотосессии"}
                        </Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 font-medium -mt-2">
                        Загрузите 3–10 фото лица (разные ракурсы, хорошее освещение). Система сохранит лицо и будет использовать его строго.
                      </p>

                      <Input
                        value={form.character_name}
                        onChange={(e) => set("character_name", e.target.value)}
                        placeholder="Имя персонажа (например: Юрий)"
                        className="h-11 rounded-xl border-border/40 bg-card text-sm font-semibold focus-visible:ring-primary/30"
                      />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Фото для обучения</Label>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            form.character_photos.length >= 3 ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground/50"
                          )}>
                            {form.character_photos.length}/10
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {characterPreviews.map((preview, idx) => (
                            <div key={idx} className="relative h-[72px] w-[72px] rounded-xl overflow-hidden border-2 border-primary/20 group shadow-sm">
                              <img src={preview} alt="" className="h-full w-full object-cover" />
                              <button type="button" onClick={() => handleRemoveCharacterPhoto(idx)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          ))}
                          {form.character_photos.length < 10 && (
                            <button type="button" onClick={() => characterRef.current?.click()}
                              className="h-[72px] w-[72px] rounded-xl border-2 border-dashed border-border/40 bg-card hover:bg-secondary/20 hover:border-primary/30 flex flex-col items-center justify-center gap-1 transition-all"
                            >
                              <Plus className="h-4 w-4 text-muted-foreground/40" />
                              <span className="text-[8px] font-bold text-muted-foreground/40">Фото</span>
                            </button>
                          )}
                        </div>
                        <input ref={characterRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddCharacterPhotos} />
                      </div>

                      {form.character_photos.length >= 1 && form.character_name.trim() && (
                        <CfButtonMd
                          onClick={handleSaveCharacter}
                          disabled={savingCharacter}
                          className="gap-2 bg-card border border-border/60 hover:bg-secondary/50 text-foreground shadow-sm"
                        >
                          {savingCharacter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 text-amber-500" />}
                          {savingCharacter ? "Сохраняю..." : "Сохранить персонажа"}
                        </CfButtonMd>
                      )}
                    </div>
                  )}

                  {form.saved_character_id && (
                    <button type="button"
                      onClick={() => set("saved_character_id", null)}
                      className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1.5 underline underline-offset-2"
                    >
                      <X className="h-3 w-3" /> Создать нового персонажа
                    </button>
                  )}
                </div>

              ) : (
                /* ── ОБЫЧНЫЙ КОНТЕНТ: Logo + Cover + Additional ── */
                <div className="space-y-5 pt-2">
                  {/* Logo + Cover row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Logo */}
                    <div className="space-y-2">
                      <div>
                        <Label className={cn(cfStyles.label, "text-muted-foreground/70")}>
                          Логотип
                          <span className="ml-2 text-[9px] font-medium text-muted-foreground/40 normal-case">(необязательно)</span>
                        </Label>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 font-medium">
                          Цвета и стиль лого будут применены во всём дизайне
                        </p>
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                      {logoPreview ? (
                        <div className="relative h-28 rounded-2xl overflow-hidden border-2 border-primary/30 bg-primary/5 group shadow-sm">
                          <img src={logoPreview} alt="" className="h-full w-full object-contain p-3" />
                          <button type="button" onClick={() => { set("logo_file", null); if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoPreview(null); }}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => logoRef.current?.click()}
                          className="w-full h-28 rounded-2xl border-2 border-dashed border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-primary/30 flex flex-col items-center justify-center gap-2 transition-all"
                        >
                          <Upload className="h-5 w-5 text-muted-foreground/40" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Загрузить лого</span>
                        </button>
                      )}
                    </div>

                    {/* Cover photo */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Label className={cn(cfStyles.label, "text-muted-foreground/70")}>Обложка</Label>
                          <span className="text-[8px] font-bold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Главное фото
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 font-medium">
                          Это фото — основа первого слайда / главного баннера
                        </p>
                      </div>
                      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPhoto} />
                      {coverPreview ? (
                        <div className="relative h-28 rounded-2xl overflow-hidden border-2 border-primary/40 bg-primary/5 group shadow-sm">
                          <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => { set("cover_photo_file", null); if (coverPreview) URL.revokeObjectURL(coverPreview); setCoverPreview(null); }}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => coverRef.current?.click()}
                          className="w-full h-28 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-all"
                        >
                          <Camera className="h-5 w-5 text-primary/40" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-primary/50">Загрузить обложку</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional photos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className={cn(cfStyles.label, "text-muted-foreground/70")}>Дополнительные фото</Label>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 font-medium">
                          До 9 фото — система нанесёт текст на каждое
                        </p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors",
                        form.additional_photos.length > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground/40"
                      )}>
                        {form.additional_photos.length}/9
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {additionalPreviews.map((preview, idx) => (
                        <div key={idx} className="relative h-[72px] w-[72px] rounded-xl overflow-hidden border-2 border-border/40 group shadow-sm">
                          <img src={preview} alt="" className="h-full w-full object-cover" />
                          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-black/60 flex items-center justify-center">
                            <span className="text-[8px] font-black text-white">{idx + 1}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveAdditionalPhoto(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                      {form.additional_photos.length < 9 && (
                        <button type="button" onClick={() => additionalRef.current?.click()}
                          className="h-[72px] w-[72px] rounded-xl border-2 border-dashed border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-primary/30 flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <Plus className="h-4 w-4 text-muted-foreground/40" />
                          <span className="text-[8px] font-bold text-muted-foreground/40">Добавить</span>
                        </button>
                      )}
                    </div>
                    <input ref={additionalRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                  </div>
                </div>
              )}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PenLine className="h-4 w-4 text-primary/60" />
            <Label className={cfStyles.label}>Главное описание</Label>
          </div>
          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={enhancing || !form.main_prompt.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              enhancing
                ? "bg-primary/10 text-primary/60 cursor-wait"
                : form.main_prompt.trim()
                  ? "bg-primary/10 text-primary hover:bg-primary/20 active:scale-95"
                  : "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            {enhancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {enhancing ? "Улучшаю..." : "AI Магия"}
          </button>
        </div>
        <Textarea
          value={form.main_prompt}
          onChange={(e) => set("main_prompt", e.target.value)}
          placeholder="Что именно создать? Какой текст должен быть? Какой посыл? Опишите максимально подробно..."
          className="min-h-[120px] rounded-2xl border-border/40 bg-secondary/20 text-sm font-semibold focus-visible:ring-primary/30 resize-none p-5"
        />
        <p className="text-[10px] font-medium text-muted-foreground/40 italic px-1">
          Напишите идею кратко — кнопка «AI Магия» превратит её в чёткое ТЗ для генерации
        </p>
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
            ...(form.source_mode === "photo" && form.content_type !== "neuro-photo" ? [
              ...(form.logo_file ? [["Лого", "✓ Загружен"]] : []),
              ...(form.cover_photo_file ? [["Обложка", "✓ Загружена"]] : []),
              ...(form.additional_photos.length > 0 ? [["Доп. фото", `${form.additional_photos.length} шт.`]] : []),
            ] : []),
            ...(form.content_type === "neuro-photo" ? [
              form.saved_character_id
                ? [["Персонаж", savedCharacters.find((c) => c.id === form.saved_character_id)?.name ?? "Выбран"]]
                : (form.character_photos.length > 0 ? [["Фото лица", `${form.character_photos.length} шт.`]] : []),
            ].flat() : []),
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
