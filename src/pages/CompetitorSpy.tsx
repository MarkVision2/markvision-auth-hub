import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Radio, Loader2 } from "lucide-react";
import { CompetitorAdCard } from "@/components/spy/CompetitorAdCard";
import { AiRebuildSheet } from "@/components/spy/AiRebuildSheet";
import { startCompetitorScrape, rebuildAdText, type RebuildResult } from "@/lib/api/ad-library-api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompetitorAd {
  id: string;
  advertiser_name: string;
  advertiser_avatar: string | null;
  ad_copy: string | null;
  platform: string | null;
  media_type: string | null;
  is_active: boolean | null;
  active_since: string | null;
  is_monitored: boolean | null;
  source_url: string | null;
}

// Keep mock data as fallback for demo
const MOCK_ADS: CompetitorAd[] = [
  {
    id: "mock-1",
    advertiser_name: "AIVA Clinic",
    advertiser_avatar: "AC",
    ad_copy: "Ставим брекеты недорого! Звоните по телефону и запишитесь на бесплатную консультацию. Наши специалисты помогут вам выбрать идеальный вариант лечения для вашей улыбки.",
    platform: "Instagram",
    media_type: "4:5",
    is_active: true,
    active_since: "2026-03-12T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
  {
    id: "mock-2",
    advertiser_name: "BeautyLab Moscow",
    advertiser_avatar: "BL",
    ad_copy: "Лазерная эпиляция от 990 рублей. Акция до конца месяца! Приходите к нам в салон, адрес: ул. Тверская, 15. Работаем без выходных.",
    platform: "Instagram",
    media_type: "9:16",
    is_active: true,
    active_since: "2026-03-05T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
  {
    id: "mock-3",
    advertiser_name: "FitPro Academy",
    advertiser_avatar: "FP",
    ad_copy: "Фитнес тренировки онлайн. Программы для похудения и набора массы. Опытные тренеры. Первая тренировка бесплатно.",
    platform: "Facebook",
    media_type: "4:5",
    is_active: true,
    active_since: "2026-03-01T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
  {
    id: "mock-4",
    advertiser_name: "Digital School Pro",
    advertiser_avatar: "DS",
    ad_copy: "Курсы по маркетингу. Научим настраивать рекламу в Instagram и Facebook. Диплом по окончании. Записывайтесь!",
    platform: "Instagram",
    media_type: "9:16",
    is_active: true,
    active_since: "2026-02-28T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
  {
    id: "mock-5",
    advertiser_name: "AutoDetailing VIP",
    advertiser_avatar: "AD",
    ad_copy: "Детейлинг автомобилей. Полировка, керамика, химчистка салона. Качественно и быстро. Звоните!",
    platform: "Instagram",
    media_type: "4:5",
    is_active: true,
    active_since: "2026-03-10T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
  {
    id: "mock-6",
    advertiser_name: "SmartHome Solutions",
    advertiser_avatar: "SH",
    ad_copy: "Умный дом под ключ. Установка систем автоматизации. Работаем по всей Москве.",
    platform: "Facebook",
    media_type: "9:16",
    is_active: true,
    active_since: "2026-03-07T00:00:00Z",
    is_monitored: false,
    source_url: null,
  },
];

export default function CompetitorSpy() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "monitoring">("results");
  const [ads, setAds] = useState<CompetitorAd[]>(MOCK_ADS);
  const [scraping, setScraping] = useState(false);
  const [selectedAd, setSelectedAd] = useState<CompetitorAd | null>(null);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<RebuildResult | null>(null);

  // Load saved ads from Supabase
  useEffect(() => {
    const loadAds = async () => {
      const { data } = await supabase
        .from("competitor_ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setAds([...data.map((d: any) => ({
          id: d.id,
          advertiser_name: d.advertiser_name,
          advertiser_avatar: d.advertiser_avatar,
          ad_copy: d.ad_copy,
          platform: d.platform,
          media_type: d.media_type,
          is_active: d.is_active,
          active_since: d.active_since,
          is_monitored: d.is_monitored,
          source_url: d.source_url,
        })), ...MOCK_ADS]);
      }
    };
    loadAds();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("competitor_ads_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competitor_ads" }, (payload) => {
        const d = payload.new as any;
        setAds((prev) => [{
          id: d.id,
          advertiser_name: d.advertiser_name,
          advertiser_avatar: d.advertiser_avatar,
          ad_copy: d.ad_copy,
          platform: d.platform,
          media_type: d.media_type,
          is_active: d.is_active,
          active_since: d.active_since,
          is_monitored: d.is_monitored,
          source_url: d.source_url,
        }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setScraping(true);
    try {
      const result = await startCompetitorScrape(search.trim());
      toast({
        title: "Парсинг завершён",
        description: `Найдено ${result.count} объявлений`,
      });
    } catch (e: any) {
      toast({
        title: "Ошибка парсинга",
        description: e.message || "Не удалось получить данные",
        variant: "destructive",
      });
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
      setRebuildResult(result.data);
    } catch (e: any) {
      toast({
        title: "Ошибка AI",
        description: e.message || "Не удалось проанализировать объявление",
        variant: "destructive",
      });
    } finally {
      setRebuildLoading(false);
    }
  };

  const toggleMonitoring = async (ad: CompetitorAd) => {
    // For DB ads, update is_monitored
    if (!ad.id.startsWith("mock-")) {
      await supabase
        .from("competitor_ads")
        .update({ is_monitored: !ad.is_monitored })
        .eq("id", ad.id);
    }
    setAds((prev) =>
      prev.map((a) => a.id === ad.id ? { ...a, is_monitored: !a.is_monitored } : a)
    );
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
            <p className="text-xs text-muted-foreground">Анализ рекламы · Разбор офферов · AI-реконструкция</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Введите Instagram ник, ссылку на Ad Library или название страницы..."
                className="pl-11 h-12 bg-card/50 border-border/50 text-sm rounded-xl backdrop-blur-sm focus-visible:ring-primary/30"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={scraping}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {scraping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {scraping ? "Сканирую..." : "Найти"}
            </Button>
          </div>
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
            Результаты поиска
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

        {/* Ad Grid */}
        {displayAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Eye className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{activeTab === "monitoring" ? "Нет объявлений в мониторинге" : "Введите запрос для поиска рекламы конкурентов"}</p>
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
                  // These are no longer needed on the card — AI generates them live
                  weaknesses: [],
                  improved: "",
                  suggestedFormat: "",
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
          weaknesses: rebuildResult?.weaknesses || [],
          improved: rebuildResult?.new_script || "",
          suggestedFormat: rebuildResult?.suggested_format || "",
        } : null}
        loading={rebuildLoading}
        onClose={() => { setSelectedAd(null); setRebuildResult(null); }}
      />
    </DashboardLayout>
  );
}
