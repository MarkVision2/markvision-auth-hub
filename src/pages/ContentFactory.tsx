import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Image, Link, FileText, Upload } from "lucide-react";

const GENERATION_STEPS = [
  { label: "Отправка в n8n...", progress: 15 },
  { label: "Анализ сценария...", progress: 35 },
  { label: "Генерация контента...", progress: 55 },
  { label: "Рендер AI...", progress: 78 },
  { label: "Финальная обработка...", progress: 92 },
  { label: "✅ Готово!", progress: 100 },
];

export default function ContentFactory() {
  const [mainType, setMainType] = useState<"video" | "photo">("video");
  const [videoMode, setVideoMode] = useState<"link" | "description">("link");
  const [photoMode, setPhotoMode] = useState<"link" | "description">("link");
  const [photoFormat, setPhotoFormat] = useState("banner");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [designTab, setDesignTab] = useState<"ready" | "my">("ready");

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;
    if (genStep >= GENERATION_STEPS.length - 1) return;
    const timer = setTimeout(() => setGenStep((s) => s + 1), 1800);
    return () => clearTimeout(timer);
  }, [isGenerating, genStep]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenStep(0);
  };

  const handleReset = () => {
    setIsGenerating(false);
    setGenStep(0);
  };

  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-3xl py-4">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Контент-Завод
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Генерация видео и фото контента с помощью AI
        </p>

        {/* Main container */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-8">
          {/* Step 1: Main type toggle */}
          <Tabs
            value={mainType}
            onValueChange={(v) => {
              setMainType(v as "video" | "photo");
              handleReset();
            }}
          >
            <TabsList className="w-full grid grid-cols-2 h-12 bg-secondary/60">
              <TabsTrigger
                value="video"
                className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Video className="mr-2 h-4 w-4" />
                Видео (Sora 2)
              </TabsTrigger>
              <TabsTrigger
                value="photo"
                className="h-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Image className="mr-2 h-4 w-4" />
                Фото / Карусель
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Video mode */}
          {mainType === "video" && (
            <div className="space-y-6">
              <Tabs
                value={videoMode}
                onValueChange={(v) => setVideoMode(v as "link" | "description")}
              >
                <TabsList className="h-9 bg-secondary/40">
                  <TabsTrigger
                    value="link"
                    className="text-xs data-[state=active]:bg-background"
                  >
                    <Link className="mr-1.5 h-3.5 w-3.5" />
                    По ссылке
                  </TabsTrigger>
                  <TabsTrigger
                    value="description"
                    className="text-xs data-[state=active]:bg-background"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    По описанию
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {videoMode === "link" ? (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Ссылка на видео
                  </Label>
                  <Input
                    type="url"
                    placeholder="Вставьте ссылку на YouTube, TikTok или Reels"
                    className="h-11 bg-secondary/30 border-border"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    AI проанализирует видео и создаст уникальный аналог.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Визуальный стиль и детали
                    </Label>
                    <Textarea
                      placeholder="Что должно происходить на экране — стиль, сцена, движение камеры…"
                      className="min-h-[100px] bg-secondary/30 border-border resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Текст для AI-Спикера
                    </Label>
                    <Textarea
                      placeholder="Точный текст, который будет озвучен (слово в слово)"
                      className="min-h-[100px] bg-secondary/30 border-border resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo mode */}
          {mainType === "photo" && (
            <div className="space-y-8">
              {/* Source: link or description */}
              <Tabs
                value={photoMode}
                onValueChange={(v) => setPhotoMode(v as "link" | "description")}
              >
                <TabsList className="h-9 bg-secondary/40">
                  <TabsTrigger
                    value="link"
                    className="text-xs data-[state=active]:bg-background"
                  >
                    <Link className="mr-1.5 h-3.5 w-3.5" />
                    По ссылке
                  </TabsTrigger>
                  <TabsTrigger
                    value="description"
                    className="text-xs data-[state=active]:bg-background"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    По описанию
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {photoMode === "link" ? (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Ссылка на референс
                  </Label>
                  <Input
                    type="url"
                    placeholder="Вставьте ссылку на пример дизайна, пост или рекламу"
                    className="h-11 bg-secondary/30 border-border"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    AI проанализирует пример и создаст уникальный аналог в выбранном формате.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Описание визуала
                  </Label>
                  <Textarea
                    placeholder="Опишите стиль, цвета, композицию и что должно быть изображено…"
                    className="min-h-[100px] bg-secondary/30 border-border resize-none"
                  />
                </div>
              )}

              {/* Format */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Формат
                </Label>
                <RadioGroup
                  value={photoFormat}
                  onValueChange={setPhotoFormat}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: "banner", label: "ADS Баннер", sub: "1 картинка" },
                    { value: "carousel7", label: "Карусель", sub: "7 слайдов" },
                    { value: "carousel10", label: "Карусель", sub: "10 слайдов" },
                  ].map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={opt.value}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-4 cursor-pointer transition-colors ${
                        photoFormat === opt.value
                          ? "border-primary/60 bg-primary/[0.06]"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={opt.value}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opt.sub}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Aspect ratio */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Соотношение сторон
                </Label>
                <Tabs
                  value={aspectRatio}
                  onValueChange={setAspectRatio}
                >
                  <TabsList className="h-9 bg-secondary/40">
                    <TabsTrigger
                      value="1:1"
                      className="text-xs data-[state=active]:bg-background"
                    >
                      1:1 Квадрат
                    </TabsTrigger>
                    <TabsTrigger
                      value="4:5"
                      className="text-xs data-[state=active]:bg-background"
                    >
                      4:5 Лента
                    </TabsTrigger>
                    <TabsTrigger
                      value="9:16"
                      className="text-xs data-[state=active]:bg-background"
                    >
                      9:16 Stories
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Text content */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Текст для слайдов
                </Label>
                <Textarea
                  placeholder="Каждая новая строка — новый слайд. Для баннера — одна строка."
                  className="min-h-[120px] bg-secondary/30 border-border resize-none"
                />
              </div>

              {/* Design & style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Дизайн и стиль
                </Label>
                <Tabs
                  value={designTab}
                  onValueChange={(v) => setDesignTab(v as "ready" | "my")}
                >
                  <TabsList className="h-9 bg-secondary/40 mb-3">
                    <TabsTrigger
                      value="ready"
                      className="text-xs data-[state=active]:bg-background"
                    >
                      Готовые стили
                    </TabsTrigger>
                    <TabsTrigger
                      value="my"
                      className="text-xs data-[state=active]:bg-background"
                    >
                      Мои шаблоны
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {designTab === "ready" ? (
                  <Select defaultValue="modern">
                    <SelectTrigger className="h-11 bg-secondary/30 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Современный</SelectItem>
                      <SelectItem value="tech">Технологичный</SelectItem>
                      <SelectItem value="stylish">Стильный</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3">
                    <Select defaultValue="tmpl1">
                      <SelectTrigger className="h-11 bg-secondary/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tmpl1">Шаблон «Минимализм»</SelectItem>
                        <SelectItem value="tmpl2">Шаблон «Премиум»</SelectItem>
                        <SelectItem value="tmpl3">Шаблон «Яркий»</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Загрузить Логотип / Шрифт
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom action */}
          <div className="pt-2">
            {!isGenerating ? (
              <Button
                onClick={handleGenerate}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                🚀 Запустить генерацию
              </Button>
            ) : (
              <div className="space-y-3">
                <Progress
                  value={GENERATION_STEPS[genStep].progress}
                  className="h-2 bg-secondary/40 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-700"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {GENERATION_STEPS[genStep].label}
                  </p>
                  <p className="text-xs text-muted-foreground/60 tabular-nums">
                    {GENERATION_STEPS[genStep].progress}%
                  </p>
                </div>
                {genStep >= GENERATION_STEPS.length - 1 && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full mt-2 border-border"
                  >
                    Создать ещё
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
