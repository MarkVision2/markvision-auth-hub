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
import { motion, AnimatePresence } from "framer-motion";

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

  // Media state
  const [feedMedia, setFeedMedia] = useState<{
    file: File | null;
    preview: string | null;
    originalFile: File | null;
    originalPreview: string | null;
  }>({ file: null, preview: null, originalFile: null, originalPreview: null });

  const [storiesMedia, setStoriesMedia] = useState<{
    file: File | null;
    preview: string | null;
    originalFile: File | null;
    originalPreview: string | null;
  }>({ file: null, preview: null, originalFile: null, originalPreview: null });
  
  // Cropping state
  const [activeCropType, setActiveCropType] = useState<"feed" | "stories" | null>(null);
  const isCropping = activeCropType !== null;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storiesInputRef = useRef<HTMLInputElement>(null);
  const [launching, setLaunching] = useState(false);
  const [leadFormsData, setLeadFormsData] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const { toast } = useToast();
  const { pushNotification } = useNotifications();

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedPage = businessPages.find((p) => p.id === selectedPageId);

  // Active page_id and instagram to send
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

  // Load lead forms
  useEffect(() => {
    if (objective !== "leadform") {
      setLeadFormsData([]);
      return;
    }
    
    const pageIdToUse = activePage.page_id;
    if (!pageIdToUse) {
      setLeadFormsData([]);
      return;
    }

    setLoadingForms(true);
    setLeadForm("");

    const adAccountId = selectedClient?.ad_account_id || "";
    const url = `https://n8n.zapoinov.com/webhook/get-forms?page_id=${encodeURIComponent(pageIdToUse)}&ad_account_id=${encodeURIComponent(adAccountId)}`;
    
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Ошибка загрузки форм: ${r.status}`);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "feed" | "stories") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const data = { file, preview, originalFile: file, originalPreview: preview };
    
    if (type === "feed") setFeedMedia(data);
    else setStoriesMedia(data);
  };

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
    if (!activeCropType) return;
    const media = activeCropType === "feed" ? feedMedia : storiesMedia;
    if (!media.originalPreview || !croppedAreaPixels || !media.originalFile) return;
    
    if (media.originalFile.type.startsWith("image/")) {
      try {
        const croppedBlob = await getCroppedImg(media.originalPreview, croppedAreaPixels);
        if (croppedBlob) {
          const croppedFile = new File([croppedBlob], media.originalFile.name, { type: "image/jpeg" });
          const updated = { ...media, file: croppedFile, preview: URL.createObjectURL(croppedBlob) };
          if (activeCropType === "feed") setFeedMedia(updated);
          else setStoriesMedia(updated);
        }
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    }
    setActiveCropType(null);
  };

  const handleLaunch = async () => {
    if (!feedMedia.file && !storiesMedia.file) {
      toast({ title: "Загрузите креатив", description: "Выберите хотя бы один файл (4:5 или 9:16)", variant: "destructive" });
      return;
    }
    if (!selectedClient) {
      toast({ title: "Выберите клиента", variant: "destructive" });
      return;
    }
    
    setLaunching(true);
    try {
      // 1. Upload media files
      let feedUrl = "";
      let storiesUrl = "";

      if (feedMedia.file) {
        const ext = feedMedia.file.name.split(".").pop();
        const path = `uploads/${Date.now()}_feed_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("content_assets").upload(path, feedMedia.file);
        if (error) throw error;
        feedUrl = supabase.storage.from("content_assets").getPublicUrl(path).data.publicUrl;
      }

      if (storiesMedia.file) {
        const ext = storiesMedia.file.name.split(".").pop();
        const path = `uploads/${Date.now()}_stories_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("content_assets").upload(path, storiesMedia.file);
        if (error) throw error;
        storiesUrl = supabase.storage.from("content_assets").getPublicUrl(path).data.publicUrl;
      }

      // 2. Build payload
      const primaryMedia = storiesMedia.file || feedMedia.file;
      const isVideo = primaryMedia?.type.startsWith("video/");

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
          mediaID: feedUrl || storiesUrl, // Legacy support
          feedMediaUrl: feedUrl,
          storiesMediaUrl: storiesUrl,
          websiteUrl: siteUrl,
          headline: headline || `Кампания: ${activePage.page_name || selectedClient.client_name}`,
          adText: bodyText || "Запущено автоматически через MarkVision Hub",
          targeting: { age_min: 25, age_max: 65 },
        },
        destination: objective,
        ...(objective === "leadform" && leadForm ? { leadFormId: leadForm } : {}),
        mediaType: isVideo ? "VIDEO" : "PHOTO",
        mediaID: feedUrl || storiesUrl,
        feedMediaUrl: feedUrl,
        storiesMediaUrl: storiesUrl,
        source: "markvision-webhook",
        sent_at: new Date().toISOString(),
      };

      const res = await fetch(`${N8N_WEBHOOK_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Ошибка сервера автоматизации (${res.status})`);

      toast({ title: "✅ Кампания отправлена в ИИ-Таргетолог!" });
      onOpenChange(false);
      
      // Reset
      setFeedMedia({ file: null, preview: null, originalFile: null, originalPreview: null });
      setStoriesMedia({ file: null, preview: null, originalFile: null, originalPreview: null });
    } catch (e: any) {
      toast({ title: "Ошибка запуска", description: e.message, variant: "destructive" });
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
          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Основные настройки</h3>
            
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
            </div>

            {businessPages.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">Бизнес-страница Facebook</p>
                <div className="grid gap-2">
                  {businessPages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageId(p.id)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-3 text-left transition-all",
                        selectedPageId === p.id ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-secondary/20 hover:bg-secondary/40"
                      )}
                    >
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", selectedPageId === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                        <div className="text-sm font-bold">{p.page_name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate", selectedPageId === p.id ? "text-primary" : "text-foreground")}>{p.page_name}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono">ID: {p.page_id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-foreground/70">Цель кампании</Label>
              <div className="grid grid-cols-3 gap-2">
                {objectiveOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setObjective(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                      objective === o.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {objective === "website" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">Ссылка на сайт</Label>
                  <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="bg-secondary/30 border-border text-xs h-9" placeholder="https://example.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/70">UTM-метки</Label>
                  <Input value={utmTags} onChange={(e) => setUtmTags(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono" />
                </div>
              </div>
            )}
          </section>

          <Separator className="bg-border" />

          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Бюджет</h3>
            <div className="relative">
              <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="bg-secondary/30 border-border text-xs h-9 font-mono pr-8" placeholder="50" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
            </div>
          </section>

          <Separator className="bg-border" />

          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Креативы</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Feed Slot */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Лента (4:5)</span>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileSelect(e, "feed")} />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "aspect-[4/5] rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                    feedMedia.preview ? "border-primary/20 bg-primary/5" : "hover:border-primary/30 hover:bg-secondary/20"
                  )}
                >
                  {feedMedia.preview ? (
                    <img src={feedMedia.preview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground">Загрузить 4:5</span>
                    </div>
                  )}
                </div>
                {feedMedia.preview && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold" onClick={() => setActiveCropType("feed")}>
                    <Scissors className="h-3 w-3 mr-1.5" /> Адаптировать
                  </Button>
                )}
              </div>

              {/* Stories Slot */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Stories (9:16)</span>
                <input ref={storiesInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileSelect(e, "stories")} />
                <div 
                  onClick={() => storiesInputRef.current?.click()}
                  className={cn(
                    "aspect-[9/16] rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                    storiesMedia.preview ? "border-primary/20 bg-primary/5" : "hover:border-primary/30 hover:bg-secondary/20"
                  )}
                >
                  {storiesMedia.preview ? (
                    <img src={storiesMedia.preview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground">Загрузить 9:16</span>
                    </div>
                  )}
                </div>
                {storiesMedia.preview && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold" onClick={() => setActiveCropType("stories")}>
                    <Scissors className="h-3 w-3 mr-1.5" /> Адаптировать
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">Текст объявления</Label>
              <Input placeholder="Заголовок" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-10 text-sm" />
              <Textarea placeholder="Основной текст" value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <Button className="w-full bg-primary text-primary-foreground h-10 font-bold" disabled={launching} onClick={handleLaunch}>
            {launching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            {launching ? "Запуск..." : "🚀 Отправить на запуск AI"}
          </Button>
        </div>

        {/* Cropper Modal */}
        <AnimatePresence>
          {isCropping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-4 md:p-10 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-lg font-bold">Адаптация креатива</h3>
                <Button variant="ghost" className="text-white" onClick={() => setActiveCropType(null)}><X className="h-6 w-6" /></Button>
              </div>
              <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10">
                <Cropper
                  image={activeCropType === "feed" ? feedMedia.originalPreview! : storiesMedia.originalPreview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={activeCropType === "feed" ? 4/5 : 9/16}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="mt-8 flex items-center justify-center gap-4">
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-48 accent-primary" />
                <Button className="bg-primary px-8 h-12 rounded-2xl font-bold" onClick={handleApplyCrop}>Сохранить</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
