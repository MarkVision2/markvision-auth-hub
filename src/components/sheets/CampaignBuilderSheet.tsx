import { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload, Scissors, Rocket, Loader2, Check, X, RefreshCw } from "lucide-react";
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
  instagram_user_id: string | null;
  fb_token: string | null;
  city: string | null;
  region_key: string | null;
}

interface BusinessPage {
  id: string;
  page_name: string;
  page_id: string;
  instagram_user_id: string | null;
}

type Objective = "whatsapp" | "website" | "leadform";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_CAMPAIGN_LAUNCH_URL || "https://n8n.zapoinov.com/webhook/ai-target-launch";

export default function CampaignBuilderSheet({ open, onOpenChange }: Props) {
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  // Business pages for selected client
  const [businessPages, setBusinessPages] = useState<BusinessPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");

  const [objective, setObjective] = useState<Objective>("whatsapp");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
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
  
  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1); // 1 for feed, 9/16 for stories
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [launching, setLaunching] = useState(false);
  const [leadFormsData, setLeadFormsData] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const { toast } = useToast();
  const { pushNotification } = useNotifications();

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedPage = businessPages.find((p) => p.id === selectedPageId);

  // Active page_id and instagram to send: prefer selected business page, fallback to clients_config
  const activePage = selectedPage
    ? { page_id: selectedPage.page_id, page_name: selectedPage.page_name, instagram_user_id: selectedPage.instagram_user_id }
    : { page_id: selectedClient?.page_id ?? "", page_name: selectedClient?.page_name ?? "", instagram_user_id: selectedClient?.instagram_user_id ?? "" };

  // Load clients
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    (supabase as any)
      .from("clients_config")
      .select("id, client_name, whatsapp_number, fb_pixel_id, pixel_event, website_url, ad_account_id, page_id, page_name, instagram_user_id, fb_token, city, region_key")
      .eq("is_active", true)
      .order("client_name")
      .then(({ data, error }: any) => {
        if (!error && data) setClients(data);
        setLoadingClients(false);
      });
  }, [open]);

  // Load business pages when client changes
  useEffect(() => {
    setBusinessPages([]);
    setSelectedPageId("");
    setLeadFormsData([]);
    setLeadForm("");

    if (!selectedClientId) return;

    (supabase as any)
      .from("business_pages")
      .select("id, page_name, page_id, instagram_user_id")
      .eq("client_config_id", selectedClientId)
      .order("page_name")
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setBusinessPages(data);
          // Auto-select if only one page
          if (data.length === 1) setSelectedPageId(data[0].id);
        }
      });
  }, [selectedClientId]);

  // Auto-fill pixel/site when client changes
  useEffect(() => {
    if (selectedClient) {
      if (selectedClient.fb_pixel_id) setPixel(selectedClient.fb_pixel_id);
      if (selectedClient.pixel_event) setPixelEvent(selectedClient.pixel_event);
      if (selectedClient.website_url) setSiteUrl(selectedClient.website_url);
    }
  }, [selectedClientId]);

  // Load lead forms when objective=leadform, client and page selected
  useEffect(() => {
    if (objective !== "leadform") {
      setLeadFormsData([]);
      return;
    }
    
    // We strictly need page_id now
    const pageIdToUse = activePage.page_id;
    if (!pageIdToUse) {
      setLeadFormsData([]);
      return;
    }

    setLoadingForms(true);
    setLeadForm("");

    // Fetch lead forms by page_id as requested
    // ad_account_id is kept as extra context if needed by n8n
    const adAccountId = selectedClient?.ad_account_id || "";
    const url = `https://n8n.zapoinov.com/webhook/get-forms?page_id=${encodeURIComponent(pageIdToUse)}&ad_account_id=${encodeURIComponent(adAccountId)}`;
    
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          console.error(`[CampaignBuilder] Forms fetch failed: ${r.status} ${r.statusText}`, text);
          throw new Error(`Ошибка загрузки форм: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        const forms = data?.forms || [];
        setLeadFormsData(forms);
        if (forms.length === 1) setLeadForm(forms[0].id);
      })
      .catch((err) => {
        console.error("[CampaignBuilder] Forms fetch error:", err);
        setLeadFormsData([]);
      })
      .finally(() => setLoadingForms(false));
  }, [objective, selectedClientId, selectedPageId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreativeFile(file);
    setCreativePreview(URL.createObjectURL(file));
    setOriginalFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setCreativeFile(file);
    setCreativePreview(URL.createObjectURL(file));
  };

  // Sync aspect ratio when tab changes
  useEffect(() => {
    setAspect(creativeTab === "feed" ? 1 : 9/16);
  }, [creativeTab]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleApplyCrop = async () => {
    if (!originalPreview || !croppedAreaPixels || !originalFile) return;
    
    // For video, we don't actually crop in browser easily, so we just exit crop mode
    // but for images, we generate a new file
    if (originalFile.type.startsWith("image/")) {
      try {
        const croppedBlob = await getCroppedImg(originalPreview, croppedAreaPixels);
        if (croppedBlob) {
          const croppedFile = new File([croppedBlob], originalFile.name, { type: "image/jpeg" });
          setCreativeFile(croppedFile);
          setCreativePreview(URL.createObjectURL(croppedBlob));
        }
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    }
    setIsCropping(false);
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
    if (businessPages.length > 0 && !selectedPageId) {
      toast({ title: "Выберите страницу", description: "У этого клиента несколько страниц — выберите одну", variant: "destructive" });
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

      // 2. Build payload
      const isVideo = creativeFile.type.startsWith("video/");

      const payload = {
        clientConfig: {
          client_id: selectedClient.id,
          client_name: selectedClient.client_name,
          ad_account_id: selectedClient.ad_account_id || "",
          page_id: activePage.page_id,
          page_name: activePage.page_name,
          instagram_user_id: activePage.instagram_user_id || "",
          fb_token: selectedClient.fb_token || "",
          city: selectedClient.city || "",
          region_key: selectedClient.region_key || "",
          whatsapp_number: selectedClient.whatsapp_number || "",
          website_url: siteUrl || selectedClient.website_url || "",
          fb_pixel_id: pixel || selectedClient.fb_pixel_id || "",
          pixel_event: pixelEvent || selectedClient.pixel_event || "",
          daily_budget: Math.round((Number(budgetAmount.replace(/\s/g, "")) || 5) * 100),
        },
        plan: {
          goal: objective === "website" ? "WEBSITE" : objective === "leadform" ? "LEADS" : "WHATSAPP",
          mediaType: isVideo ? "VIDEO" : "PHOTO",
          mediaID: mediaUrl,
          websiteUrl: siteUrl,
          headline: headline || `Кампания: ${activePage.page_name || selectedClient.client_name}`,
          adText: bodyText || "Запущено автоматически через MarkVision Hub",
          targeting: { age_min: 25, age_max: 65 },
        },
        destination: objective,
        ...(objective === "leadform" && leadForm ? { leadFormId: leadForm } : {}),
        mediaType: isVideo ? "VIDEO" : "PHOTO",
        mediaID: mediaUrl,
        source: "markvision-webhook",
        sent_at: new Date().toISOString(),
      };

      console.log("[CampaignBuilder] Sending payload to n8n:", JSON.stringify(payload, null, 2));

      // 3. POST to n8n webhook
      const res = await fetch(`${N8N_WEBHOOK_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[CampaignBuilder] Launch failed with ${res.status}:`, errText);
        throw new Error(`Ошибка сервера автоматизации (${res.status}). Убедитесь, что сценарии n8n активны.`);
      }

      const pageName = activePage.page_name || selectedClient.client_name;
      toast({ title: "✅ Кампания отправлена в ИИ-Таргетолог!", description: `Страница: ${pageName}` });
      pushNotification("info", "Кампания отправлена на запуск", `Страница: ${pageName}, бюджет: ${budgetAmount}₽`, "Управление рекламой");

      // Reset
      setSelectedClientId("");
      setSelectedPageId("");
      setBusinessPages([]);
      setObjective("whatsapp");
      setBudgetAmount("");
      setStartDate(undefined);
      setEndDate(undefined);
      setCreativeFile(null);
      setCreativePreview(null);
      setSiteUrl("");
      setPixel("");
      setPixelEvent("");
      setLeadForm("");
      setHeadline("");
      setBodyText("");
      setUtmTags("?utm_source=meta&utm_medium=cpc&utm_campaign=");

      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      console.error("Campaign launch error:", e);
      toast({ title: "Ошибка связи с сервером автоматизации", description: msg, variant: "destructive" });
      pushNotification("error", "Ошибка запуска рекламы в n8n", msg, "Управление рекламой");
    } finally {
      setLaunching(false);
    }
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

            {/* Client selector */}
            <div className="space-y-2">
              <Label className="text-xs text-foreground/70">Клиент / Кабинет</Label>
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

            {/* Page selector — shown when client has business pages */}
            {businessPages.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Бизнес-страница Facebook
                  </Label>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {businessPages.length} {businessPages.length === 1 ? 'страница' : 'страницы'}
                  </span>
                </div>
                
                <div className="grid gap-2.5">
                  {businessPages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageId(p.id)}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-200",
                        selectedPageId === p.id
                          ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                          : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        selectedPageId === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border group-hover:border-border/80"
                      )}>
                        <div className="text-sm font-bold">{p.page_name.charAt(0)}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-bold truncate", selectedPageId === p.id ? "text-primary" : "text-foreground")}>
                            {p.page_name}
                          </p>
                          {p.instagram_user_id && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/10 text-[9px] text-pink-500 font-bold uppercase tracking-tighter">
                              IG
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 mt-1 truncate">
                          ID: {p.page_id}
                        </p>
                      </div>
                      
                      <div className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                        selectedPageId === p.id ? "bg-primary border-primary" : "border-border group-hover:border-border/80"
                      )}>
                        {selectedPageId === p.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Objective */}
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
                  <Label className="text-xs text-foreground/70">
                    Лид-форма Meta
                    {activePage.page_name && (
                      <span className="ml-1 text-muted-foreground/60 normal-case font-normal">
                        · {activePage.page_name}
                      </span>
                    )}
                  </Label>
                  {businessPages.length > 0 && !selectedPageId ? (
                    <p className="text-[11px] text-muted-foreground/60 rounded-lg border border-dashed border-border p-3 text-center">
                      Сначала выберите страницу выше
                    </p>
                  ) : (
                    <Select value={leadForm} onValueChange={setLeadForm}>
                      <SelectTrigger className="bg-secondary/30 border-border text-xs h-9">
                        <SelectValue placeholder="Выберите форму" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingForms ? (
                          <SelectItem value="__loading" disabled className="text-xs text-muted-foreground">Загрузка форм...</SelectItem>
                        ) : leadFormsData.length === 0 ? (
                          <SelectItem value="__empty" disabled className="text-xs text-muted-foreground">
                            {selectedClient ? "Формы не найдены" : "Сначала выберите клиента"}
                          </SelectItem>
                        ) : (
                          leadFormsData.map((f) => (
                            <SelectItem key={f.id} value={f.id} className="text-xs">
                              {f.name}
                              {f.status !== "ACTIVE" && <span className="ml-1 text-muted-foreground">({f.status})</span>}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
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
                  <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8" placeholder="50" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                </div>
              </TabsContent>

              <TabsContent value="lifetime" className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Общий бюджет</Label>
                  <div className="relative">
                    <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8" placeholder="1000" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
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
                    onClick={() => {
                      setCreativeTab(tab);
                      if (isCropping) setAspect(tab === "feed" ? 1 : 9/16);
                    }}
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
                  "rounded-2xl border border-border bg-secondary/20 overflow-hidden relative shadow-inner",
                  creativeTab === "feed" ? "w-48 h-48" : "w-32 h-56",
                  isCropping && "opacity-20 grayscale pointer-events-none"
                )}>
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/30" style={{ left: `${(i + 1) * 25}%` }} />
                    ))}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30" style={{ top: `${(i + 1) * 25}%` }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {creativePreview ? (
                      originalFile?.type.startsWith("video/") ? (
                        <video src={creativePreview} className="w-full h-full object-cover" muted autoPlay loop />
                      ) : (
                        <img src={creativePreview} alt="Превью" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40 font-medium">Превью</span>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "w-full text-xs border-border h-8 transition-all hover:bg-primary/5",
                  isCropping && "bg-primary/10 border-primary/30"
                )}
                onClick={() => setIsCropping(!isCropping)}
                disabled={!creativePreview}
              >
                <Scissors className="h-3 w-3 mr-1.5" />
                {isCropping ? "Закрыть редактор" : "Адаптировать размер"}
              </Button>
            </div>
            
            {/* Cropping Area - Overlay */}
            {isCropping && originalPreview && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="relative h-[400px] w-full bg-black rounded-xl overflow-hidden border border-border shadow-2xl">
                  <Cropper
                    image={originalFile?.type.startsWith("image/") ? originalPreview : undefined}
                    video={originalFile?.type.startsWith("video/") ? originalPreview : undefined}
                    crop={crop}
                    zoom={zoom}
                    aspect={creativeTab === "feed" ? 1 : 9/16}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    className="flex-1 bg-primary text-primary-foreground font-bold h-9 text-xs"
                    onClick={handleApplyCrop}
                  >
                    <Check className="h-3 w-3 mr-1.5" />
                    Применить
                  </Button>
                  <Button 
                    variant="ghost"
                    className="flex-1 text-muted-foreground font-bold h-9 text-xs border border-border"
                    onClick={() => setIsCropping(false)}
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    Отмена
                  </Button>
                </div>
                
                <p className="text-[10px] text-center text-muted-foreground/60 italic">
                  * Потяните за края или перетащите изображение внутри рамки
                </p>
              </div>
            )}
            {/* Ad Copy Section */}
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                  Текст объявления
                </Label>
              </div>
              
              <div className="space-y-3 rounded-xl border border-border/30 bg-secondary/10 p-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Заголовок</Label>
                  <Input 
                    placeholder="Например: Скидка 20% на первое посещение"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="h-10 border-border/20 bg-background/50 focus:border-primary/50 transition-all text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Основной текст</Label>
                  <Textarea 
                    placeholder="Опишите ваше предложение подробнее..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="min-h-[100px] border-border/20 bg-background/50 focus:border-primary/50 transition-all text-sm resize-none"
                  />
                </div>
              </div>
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
