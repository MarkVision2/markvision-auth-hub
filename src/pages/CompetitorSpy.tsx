import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Radio, Loader2, RefreshCw, RotateCw, Globe, ExternalLink, Satellite } from "lucide-react";
import { CompetitorAdCard } from "@/components/spy/CompetitorAdCard";
import { AiRebuildSheet } from "@/components/spy/AiRebuildSheet";
import { triggerCompetitorScrape, searchLocalAds, rebuildAdText, type RebuildResult } from "@/lib/api/ad-library-api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";

export interface CompetitorAd {
  id: string;
  advertiser_name: string;
  advertiser_avatar: string | null;
  ad_copy: string | null;
  platform: string | null;
  media_type: string | null;
  media_url: string | null;
  is_active: boolean | null;
  active_since: string | null;
  is_monitored: boolean | null;
  source_url: string | null;
}

function mapDbRow(d: any): CompetitorAd {
  return {
    id: d.id,
    advertiser_name: d.advertiser_name || d.page_name || "—",
    advertiser_avatar: d.advertiser_avatar || (d.page_name || d.advertiser_name || "??").slice(0, 2).toUpperCase(),
    ad_copy: d.ad_copy || d.ad_text || null,
    platform: d.platform || "Instagram",
    media_type: d.media_type || "4:5",
    media_url: d.media_url ?? null,
    is_active: d.is_active ?? (d.ad_status === "ACTIVE"),
    active_since: d.active_since || d.start_date || null,
    is_monitored: d.is_monitored ?? false,
    source_url: d.source_url,
  };
}

export default function CompetitorSpy() {
  const { toast } = useToast();
  const { pushNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "monitoring">("results");
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [selectedAd, setSelectedAd] = useState<CompetitorAd | null>(null);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<RebuildResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load saved ads from Supabase
  useEffect(() => {
    const loadAds = async () => {
      try {
        const { data, error } = await supabase
          .from("competitor_ads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setAds(data.map(mapDbRow));
        }
      } catch (e: any) {
        console.error("Failed to load ads:", e);
      } finally {
        setLoading(false);
      }
    };
    loadAds();

    // Realtime — new ads appear instantly
    const channel = supabase
      .channel("competitor_ads_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competitor_ads" }, (payload) => {
        const newAd = mapDbRow(payload.new);
        setAds((prev) => {
          // Deduplicate
          if (prev.some(a => a.id === newAd.id)) return prev;

          const isMonitoredAdvertiser = prev.some(
            (a) => a.is_monitored && a.advertiser_name === newAd.advertiser_name
          );
          if (isMonitoredAdvertiser) {
            toast({
              title: "🔔 Новое объявление конкурента",
              description: `${newAd.advertiser_name} запустил новую рекламу`,
            });
          }
          return [newAd, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setScraping(true);
    try {
      // Step 1: Check local DB first
      const localResults = await searchLocalAds(search.trim());
      if (localResults.length > 0) {
        setAds(localResults.map(mapDbRow));
        toast({ title: "Найдено в базе", description: `${localResults.length} объявлений` });
      }

      // Step 2: Trigger n8n → Apify scrape (async, data arrives via Realtime)
      await triggerCompetitorScrape(search.trim());
      toast({
        title: "⏳ Парсинг запущен",
        description: "Алгоритм ищет креативы конкурента. Данные появятся автоматически через ~60 сек.",
      });
      pushNotification("info", "Парсинг конкурента запущен", `Ищем рекламу: ${search.trim()}`, "Радар конкурентов");
      setSearch("");
    } catch (e: any) {
      // If n8n failed but we have local results, don't show error
      if (ads.length === 0) {
        toast({
          title: "Ошибка сканирования",
          description: e.message || "Не удалось запустить парсинг",
          variant: "destructive",
        });
      } else {
        toast({
          title: "⚠️ Парсинг недоступен",
          description: "Показаны результаты из базы. Фоновый скан временно не работает.",
        });
      }
      pushNotification("error", "Ошибка сканирования конкурентов", e.message, "Радар конкурентов");
    } finally {
      setScraping(false);
    }
  };

  const handleRebuild = async (ad: CompetitorAd) => {
    setSelectedAd(ad);
    setRebuildResult(null);
    setRebuildLoading(true);
    try {
      const result = await rebuildAdText(ad.ad_copy || "");
      setRebuildResult(result);
    } catch (e: any) {
      toast({
        title: "Ошибка AI",
        description: e.message || "Не удалось проанализировать объявление",
        variant: "destructive",
      });
      pushNotification("error", "Ошибка AI-реконструкции", e.message, "Радар конкурентов");
    } finally {
      setRebuildLoading(false);
    }
  };

  const toggleMonitoring = async (ad: CompetitorAd) => {
    await supabase
      .from("competitor_ads")
      .update({ is_monitored: !ad.is_monitored })
      .eq("id", ad.id);
    setAds((prev) =>
      prev.map((a) => a.id === ad.id ? { ...a, is_monitored: !a.is_monitored } : a)
    );
  };

  const syncMonitored = async () => {
    const monitored = ads.filter(a => a.is_monitored);
    if (monitored.length === 0) {
      toast({ title: "Нет отслеживаемых", description: "Добавьте конкурентов в мониторинг" });
      return;
    }
    setSyncing(true);
    const uniqueNames = [...new Set(monitored.map(a => a.advertiser_name))];
    let ok = 0;

    for (const name of uniqueNames) {
      try {
        await triggerCompetitorScrape(name);
        ok++;
      } catch { /* skip */ }
    }

    toast({
      title: "🔄 Синхронизация запущена",
      description: `${ok} из ${uniqueNames.length} конкурентов отправлены на обновление. Данные появятся через ~90 сек.`,
    });
    setSyncing(false);
  };

  const monitoredCount = ads.filter((a) => a.is_monitored).length;
  const displayAds = activeTab === "monitoring"
    ? ads.filter((a) => a.is_monitored)
    : ads;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    } catch { return "—"; }
  };

  return (
    <DashboardLayout breadcrumb="Радар конкурентов">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Радар конкурентов</h1>
            <p className="text-xs text-muted-foreground">Парсинг рекламы из Meta Ad Library · AI-реконструкция · Мониторинг</p>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Введите <strong>@username</strong> конкурента из Instagram, название страницы или ссылку из{" "}
            <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
              Meta Ad Library <ExternalLink className="h-3 w-3" />
            </a>
            . Данные появятся автоматически через Realtime.
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="@aivaclinic  или  Клиника AIVA  или  https://facebook.com/ads/library/..."
              className="pl-11 h-12 bg-card/50 border-border/50 text-sm rounded-xl backdrop-blur-sm focus-visible:ring-primary/30"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={scraping}
            className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {scraping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {scraping ? "Ищу..." : "Искать"}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setAds([]); setSearch(""); }}
            className="h-12 px-4 rounded-xl border-border/50 text-muted-foreground hover:text-foreground"
            title="Сбросить результаты"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card/30 border border-border/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === "results"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Результаты ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === "monitoring"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Мой мониторинг ({monitoredCount})
          </button>
        </div>

        {activeTab === "monitoring" && monitoredCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={syncMonitored}
            disabled={syncing}
            className="gap-2 text-xs border-border/50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Обновляю..." : "Обновить все отслеживаемые"}
          </Button>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : displayAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            {scraping ? (
              <>
                <Satellite className="h-10 w-10 mb-3 animate-pulse text-primary/50" />
                <p className="text-sm font-medium">Парсинг запущен...</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Креативы появятся автоматически через Realtime</p>
              </>
            ) : (
              <>
                <Eye className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">{activeTab === "monitoring" ? "Нет объявлений в мониторинге" : "Введите @username или название конкурента"}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayAds.map((ad) => (
              <CompetitorAdCard
                key={ad.id}
                ad={{
                  id: ad.id,
                  advertiser: ad.advertiser_name,
                  avatar: ad.advertiser_avatar || ad.advertiser_name.slice(0, 2).toUpperCase(),
                  activeSince: formatDate(ad.active_since),
                  media: (ad.media_type as "4:5" | "9:16") || "4:5",
                  copy: ad.ad_copy || "",
                  platform: ad.platform || "Instagram",
                  weaknesses: [],
                  improved: "",
                  suggestedFormat: "",
                  media_url: ad.media_url,
                }}
                isMonitored={!!ad.is_monitored}
                onToggleMonitor={() => toggleMonitoring(ad)}
                onRebuild={() => handleRebuild(ad)}
              />
            ))}
          </div>
        )}
      </div>

      <AiRebuildSheet
        ad={selectedAd ? {
          id: selectedAd.id,
          advertiser: selectedAd.advertiser_name,
          avatar: selectedAd.advertiser_avatar || selectedAd.advertiser_name.slice(0, 2).toUpperCase(),
          activeSince: formatDate(selectedAd.active_since),
          media: (selectedAd.media_type as "4:5" | "9:16") || "4:5",
          copy: selectedAd.ad_copy || "",
          platform: selectedAd.platform || "Instagram",
          weaknesses: rebuildResult?.weaknesses ? [rebuildResult.weaknesses] : [],
          improved: rebuildResult?.new_script || "",
          suggestedFormat: rebuildResult?.format_tip || "",
          improved_headline: rebuildResult?.improved_headline || "",
          cta: rebuildResult?.cta || "",
        } : null}
        loading={rebuildLoading}
        onClose={() => { setSelectedAd(null); setRebuildResult(null); }}
      />
    </DashboardLayout>
  );
}
