import { useState, useRef, useEffect } from "react";
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
import { CalendarIcon, Upload, Scissors, Rocket, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientConfig {
  id: string;
  client_name: string;
  whatsapp_number: string | null;
  fb_pixel_id: string | null;
  pixel_event: string | null;
  website_url: string | null;
  ad_account_id: string | null;
  page_id: string | null;
  page_name: string | null;
  fb_token: string | null;
}

type Objective = "whatsapp" | "website" | "leadform";

const N8N_WEBHOOK_URL = "https://n8n.zapoinov.com/webhook/ai-target-launch";

export default function CampaignBuilderSheet({ open, onOpenChange }: Props) {
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
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
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativePreview, setCreativePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [launching, setLaunching] = useState(false);
  const { toast } = useToast();
  const { pushNotification } = useNotifications();

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Load clients from Supabase
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    (supabase as any)
      .from("clients_config")
      .select("id, client_name, whatsapp_number, fb_pixel_id, pixel_event, website_url, ad_account_id, page_id, page_name, fb_token")
      .eq("is_active", true)
      .order("client_name")
      .then(({ data, error }: any) => {
        if (!error && data) setClients(data);
        setLoadingClients(false);
      });
  }, [open]);

  // Auto-fill pixel/site when client changes
  useEffect(() => {
    if (selectedClient) {
      if (selectedClient.fb_pixel_id) setPixel(selectedClient.fb_pixel_id);
      if (selectedClient.pixel_event) setPixelEvent(selectedClient.pixel_event);
      if (selectedClient.website_url) setSiteUrl(selectedClient.website_url);
    }
  }, [selectedClientId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreativeFile(file);
    setCreativePreview(URL.createObjectURL(file));
  };

  const handleLaunch = async () => {
    if (!creativeFile) {
      toast({ title: "Загрузите креатив", description: "Выберите фото или видео перед запуском", variant: "destructive" });
      return;
    }
    if (!selectedClient) {
      toast({ title: "Выберите клиента", variant: "destructive" });
      return;
    }
    setLaunching(true);
    try {
      // 1. Upload media to Supabase Storage
      const ext = creativeFile.name.split(".").pop();
      const filePath = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("content_assets").upload(filePath, creativeFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("content_assets").getPublicUrl(filePath);
      const mediaUrl = urlData?.publicUrl || "";

      // 2. Build payload matching n8n AI-targetolog workflow
      const isVideo = creativeFile.type.startsWith("video/");
      const payload = {
        // Client identification (used by Supabase lookup in n8n)
        client_name: selectedClient.client_name,
        client_id: selectedClient.id,
        ad_account_id: selectedClient.ad_account_id || "",
        page_id: selectedClient.page_id || "",
        fb_token: selectedClient.fb_token || "",

        // Media
        media_url: mediaUrl,
        media_type: isVideo ? "video" : "photo",
        format: creativeTab === "feed" ? "1:1" : "9:16",

        // Campaign config
        objective: objective === "whatsapp" ? "OUTCOME_ENGAGEMENT" : objective === "website" ? "OUTCOME_TRAFFIC" : "OUTCOME_LEADS",
        objective_label: objective === "whatsapp" ? "WhatsApp" : objective === "website" ? "Website" : "Lead Form",
        whatsapp_number: objective === "whatsapp" ? (selectedClient.whatsapp_number || "") : "",
        site_url: objective === "website" ? siteUrl : "",
        pixel_id: objective === "website" ? pixel : "",
        pixel_event: objective === "website" ? pixelEvent : "",
        utm_tags: objective === "website" ? utmTags : "",
        lead_form_id: objective === "leadform" ? leadForm : "",

        // Budget
        budget_type: budgetType === "daily" ? "DAILY" : "LIFETIME",
        budget_amount: Number(budgetAmount.replace(/\s/g, "")) || 0,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
        schedule_time: launchTime,

        // Source indicator (so n8n knows it's from webhook, not telegram)
        source: "webhook",
      };

      // 3. POST to n8n webhook
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Webhook error: ${res.status}`);

      toast({ title: "✅ Кампания отправлена в ИИ-Таргетолог!", description: `Клиент: ${selectedClient.client_name}` });
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      toast({ title: "❌ Ошибка отправки", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  const leadForms = [
    { id: "form_1", name: "Запись на консультацию" },
    { id: "form_2", name: "Обратный звонок" },
    { id: "form_3", name: "Получить прайс" },
  ];

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
              Настройте параметры и отправьте на запуск через Webhook
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
              <Label className="text-xs text-foreground/70">Клиент</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                  <SelectValue placeholder={loadingClients ? "Загрузка..." : "Выберите клиента"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient?.ad_account_id && (
                <p className="text-[10px] text-muted-foreground/60 font-mono">
                  Ad Account: {selectedClient.ad_account_id}
                </p>
              )}
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
                  <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="bg-secondary/30 border-border text-xs h-9" placeholder="https://example.com/landing" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Пиксель Meta</Label>
                  <Input value={pixel} onChange={(e) => setPixel(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono" placeholder="ID пикселя" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Событие оптимизации</Label>
                  <Select value={pixelEvent} onValueChange={setPixelEvent}>
                    <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                      <SelectValue placeholder="Выберите событие" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Lead", "Contact", "Purchase", "CompleteRegistration"].map((e) => (
                        <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">UTM-метки</Label>
                  <Input value={utmTags} onChange={(e) => setUtmTags(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono" placeholder="?utm_source=meta..." />
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
                </div>
              </div>
            )}

            {objective === "whatsapp" && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <Label className="text-xs text-foreground/70">Привязанный WhatsApp</Label>
                {selectedClient ? (
                  <div className="rounded-lg border border-border bg-secondary/20 p-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{selectedClient.client_name}</span>
                    <span className="text-xs font-mono text-primary">{selectedClient.whatsapp_number || "Не указан"}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60 rounded-lg border border-dashed border-border p-3 text-center">
                    Сначала выберите клиента
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
                <TabsTrigger value="daily" className="text-[11px] h-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Дневной</TabsTrigger>
                <TabsTrigger value="lifetime" className="text-[11px] h-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">На всё время</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-3 space-y-2">
                <Label className="text-xs text-foreground/70">Дневной бюджет</Label>
                <div className="relative">
                  <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8" placeholder="5 000" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₸</span>
                </div>
              </TabsContent>

              <TabsContent value="lifetime" className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Общий бюджет</Label>
                  <div className="relative">
                    <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8" placeholder="150 000" />
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

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" className="hidden" onChange={handleFileSelect} />
            <div onClick={() => fileInputRef.current?.click()} className="rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 transition-colors bg-secondary/10 p-6 text-center cursor-pointer">
              {creativePreview ? (
                <div className="space-y-2">
                  {creativeFile?.type.startsWith("video/") ? (
                    <video src={creativePreview} className="mx-auto max-h-32 rounded" muted autoPlay loop />
                  ) : (
                    <img src={creativePreview} alt="Превью" className="mx-auto max-h-32 rounded object-contain" />
                  )}
                  <p className="text-[10px] text-muted-foreground">{creativeFile?.name} · Нажмите чтобы заменить</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">Нажмите или перетащите фото/видео сюда</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">JPG, PNG, MP4 · до 30 МБ</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {(["feed", "stories"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCreativeTab(tab)}
                    className={cn(
                      "text-[11px] font-medium px-3 py-1 rounded-md transition-all",
                      creativeTab === tab ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/70"
                    )}
                  >
                    {tab === "feed" ? "Лента (1:1)" : "Stories/Reels (9:16)"}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <div className={cn(
                  "rounded-2xl border border-border bg-secondary/20 overflow-hidden relative",
                  creativeTab === "feed" ? "w-48 h-48" : "w-32 h-56"
                )}>
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/15" style={{ left: `${(i + 1) * 25}%` }} />
                    ))}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/15" style={{ top: `${(i + 1) * 25}%` }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {creativePreview ? (
                      creativeFile?.type.startsWith("video/") ? (
                        <video src={creativePreview} className="w-full h-full object-cover" muted autoPlay loop />
                      ) : (
                        <img src={creativePreview} alt="Превью" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">Превью</span>
                    )}
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
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm font-semibold"
            disabled={launching}
            onClick={handleLaunch}
          >
            {launching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            {launching ? "Отправка в Meta API..." : "🚀 Отправить на запуск AI"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground/60">
            Webhook → n8n AI-Targetolog · Media → Supabase Storage
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
