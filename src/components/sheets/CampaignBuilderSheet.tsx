import { useState, useRef } from "react"; // v2
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload, Scissors, Rocket } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accounts = [
  { id: "1", name: "Клиника AIVA" },
  { id: "2", name: "Beauty Lab" },
  { id: "3", name: "NeoVision Eye" },
  { id: "4", name: "Дентал Тайм" },
];

type Objective = "whatsapp" | "website" | "leadform";

export default function CampaignBuilderSheet({ open, onOpenChange }: Props) {
  const [account, setAccount] = useState("");
  const [objective, setObjective] = useState<Objective>("whatsapp");
  const [utmTags, setUtmTags] = useState("?utm_source=meta&utm_medium=cpc&utm_campaign=");
  const [siteUrl, setSiteUrl] = useState("");
  const [pixel, setPixel] = useState("");
  const [pixelEvent, setPixelEvent] = useState("");
  const [leadForm, setLeadForm] = useState("");
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [launchTime, setLaunchTime] = useState<"now" | "midnight">("now");
  const [creativeTab, setCreativeTab] = useState<"feed" | "stories">("feed");

  const pixels = [
    { id: "px_1", name: "AIVA — Основной пиксель" },
    { id: "px_2", name: "NeoVision — Сайт" },
    { id: "px_3", name: "Дентал Тайм — Landing" },
  ];

  const pixelEvents = [
    { id: "Lead", name: "Lead" },
    { id: "Contact", name: "Contact" },
  ];

  const leadForms = [
    { id: "form_1", name: "Запись на консультацию" },
    { id: "form_2", name: "Обратный звонок" },
    { id: "form_3", name: "Получить прайс" },
  ];

  const whatsappByAccount: Record<string, string> = {
    "1": "+7 701 123-45-67",
    "2": "+7 702 987-65-43",
    "3": "+7 700 555-12-34",
    "4": "+7 700 333-22-11",
  };

  const objectiveOptions: { value: Objective; label: string }[] = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "website", label: "Лиды с сайта" },
    { value: "leadform", label: "Лид-форма Meta" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[620px] bg-card border-border overflow-y-auto p-0 flex flex-col">
        <div className="p-6 pb-4">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              Создать кампанию
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Настройте параметры и отправьте на запуск
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-28">
          {/* ── Block 1: Basic Setup ── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Основные настройки
            </h3>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/70">Рекламный кабинет</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                  <SelectValue placeholder="Выберите кабинет" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/70">Цель кампании</Label>
              <div className="grid grid-cols-3 gap-2">
                {objectiveOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setObjective(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                      objective === o.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/20 text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {objective === "website" && (
              <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Ссылка на сайт</Label>
                  <Input
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="bg-secondary/30 border-border text-xs h-9"
                    placeholder="https://example.com/landing"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Пиксель Meta</Label>
                  <Select value={pixel} onValueChange={setPixel}>
                    <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                      <SelectValue placeholder="Выберите пиксель" />
                    </SelectTrigger>
                    <SelectContent>
                      {pixels.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Событие оптимизации</Label>
                  <Select value={pixelEvent} onValueChange={setPixelEvent}>
                    <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                      <SelectValue placeholder="Выберите событие" />
                    </SelectTrigger>
                    <SelectContent>
                      {pixelEvents.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="text-xs">{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground/60">Список событий синхронизируется с Meta Pixel</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">UTM-метки</Label>
                  <Input
                    value={utmTags}
                    onChange={(e) => setUtmTags(e.target.value)}
                    className="bg-secondary/30 border-border text-xs h-9 font-mono"
                    placeholder="?utm_source=meta..."
                  />
                </div>
              </div>
            )}

            {objective === "leadform" && (
              <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Лид-форма Meta</Label>
                  <Select value={leadForm} onValueChange={setLeadForm}>
                    <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                      <SelectValue placeholder="Выберите форму" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadForms.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground/60">Формы синхронизируются из Meta Business Suite</p>
                </div>
              </div>
            )}

            {objective === "whatsapp" && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <Label className="text-xs text-foreground/70">Привязанный WhatsApp</Label>
                {account ? (
                  <div className="rounded-lg border border-border bg-secondary/20 p-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{accounts.find(a => a.id === account)?.name}</span>
                    <span className="text-xs font-mono text-primary">{whatsappByAccount[account] || "—"}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60 rounded-lg border border-dashed border-border p-3 text-center">
                    Сначала выберите кабинет
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator className="bg-border" />

          {/* ── Block 2: Budget & Schedule ── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Бюджет и расписание
            </h3>

            <Tabs value={budgetType} onValueChange={(v) => setBudgetType(v as "daily" | "lifetime")}>
              <TabsList className="bg-secondary/30 border border-border h-8">
                <TabsTrigger value="daily" className="text-[11px] h-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Дневной
                </TabsTrigger>
                <TabsTrigger value="lifetime" className="text-[11px] h-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  На всё время
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-3 space-y-2">
                <Label className="text-xs text-foreground/70">Дневной бюджет</Label>
                <div className="relative">
                  <Input
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8"
                    placeholder="5 000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₸</span>
                </div>
              </TabsContent>

              <TabsContent value="lifetime" className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Общий бюджет</Label>
                  <div className="relative">
                    <Input
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8"
                      placeholder="150 000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₸</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Начало</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs border-border bg-secondary/30", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-3 w-3 mr-1.5" />
                          {startDate ? format(startDate, "dd.MM.yyyy") : "Дата"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Конец</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs border-border bg-secondary/30", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-3 w-3 mr-1.5" />
                          {endDate ? format(endDate, "dd.MM.yyyy") : "Дата"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/70">Время запуска</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "now" as const, label: "Запустить сейчас" },
                  { value: "midnight" as const, label: "С 00:00 новых суток" },
                ] as const).map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setLaunchTime(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                      launchTime === o.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/20 text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* ── Block 3: Creative & Preview ── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Креатив и превью
            </h3>

            {/* Upload zone */}
            <div className="rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 transition-colors bg-secondary/10 p-6 text-center cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Перетащите фото или видео сюда</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">JPG, PNG, MP4 · до 30 МБ</p>
            </div>

            {/* Preview tabs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreativeTab("feed")}
                  className={cn(
                    "text-[11px] font-medium px-3 py-1 rounded-md transition-all",
                    creativeTab === "feed"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground/70"
                  )}
                >
                  Лента (1:1)
                </button>
                <button
                  onClick={() => setCreativeTab("stories")}
                  className={cn(
                    "text-[11px] font-medium px-3 py-1 rounded-md transition-all",
                    creativeTab === "stories"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground/70"
                  )}
                >
                  Stories/Reels (9:16)
                </button>
              </div>

              {/* Phone mockup */}
              <div className="flex justify-center">
                <div className={cn(
                  "rounded-2xl border border-border bg-secondary/20 overflow-hidden relative",
                  creativeTab === "feed" ? "w-48 h-48" : "w-32 h-56"
                )}>
                  {/* Crop guidelines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/15" style={{ left: `${(i + 1) * 25}%` }} />
                    ))}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/15" style={{ top: `${(i + 1) * 25}%` }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/40">Превью</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs border-border h-8">
                <Scissors className="h-3 w-3 mr-1.5" />
                Адаптировать размер
              </Button>
            </div>
          </section>
        </div>

        {/* ── Fixed footer ── */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4 space-y-2">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm font-semibold">
            <Rocket className="h-4 w-4 mr-2" />
            Отправить на запуск AI
          </Button>
          <p className="text-[10px] text-center text-muted-foreground/60">
            Данные будут отправлены в n8n webhook для автоматического запуска
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
