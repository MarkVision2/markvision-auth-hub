// Mock data for Сквозная аналитика

export interface Creative {
  id: string;
  name: string;
  format: "Video" | "Photo" | "Carousel" | "Reel";
  thumbnail?: string;
  landing: string;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

export interface Campaign {
  id: string;
  name: string;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
  creatives: Creative[];
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  color: string;
  spend: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
  campaigns: Campaign[];
}

export interface OrganicPost {
  id: string;
  thumbnail: string;
  caption: string;
  triggerWord: string;
  dms: number;
  leads: number;
  sales: number;
  revenue: number;
  ltv: number;
}

export const channels: Channel[] = [
  {
    id: "meta",
    name: "Meta Ads",
    icon: "🔷",
    color: "hsl(250, 80%, 60%)",
    spend: 2_450_000,
    clicks: 34_200,
    leads: 1_890,
    visits: 1_420,
    sales: 312,
    revenue: 7_840_000,
    campaigns: [
      {
        id: "meta-1",
        name: "Брекеты_Март_2026",
        spend: 1_200_000,
        clicks: 18_400,
        leads: 980,
        visits: 740,
        sales: 168,
        revenue: 4_200_000,
        creatives: [
          { id: "c1", name: "Video_Sora_v2", format: "Video", landing: "clinic.kz/braces", spend: 480_000, clicks: 8_200, leads: 460, visits: 350, sales: 82, revenue: 1_950_000 },
          { id: "c2", name: "Reel_Transformation", format: "Reel", landing: "clinic.kz/braces", spend: 360_000, clicks: 5_800, leads: 310, visits: 230, sales: 52, revenue: 1_300_000 },
          { id: "c3", name: "Static_Banner_1", format: "Photo", landing: "clinic.kz/braces", spend: 360_000, clicks: 4_400, leads: 210, visits: 160, sales: 34, revenue: 950_000 },
        ],
      },
      {
        id: "meta-2",
        name: "Виниры_Весна",
        spend: 850_000,
        clicks: 11_200,
        leads: 620,
        visits: 480,
        sales: 98,
        revenue: 2_450_000,
        creatives: [
          { id: "c4", name: "Carousel_BeforeAfter", format: "Carousel", landing: "clinic.kz/veneers", spend: 510_000, clicks: 7_100, leads: 410, visits: 320, sales: 65, revenue: 1_625_000 },
          { id: "c5", name: "Video_DoctorReview", format: "Video", landing: "clinic.kz/veneers", spend: 340_000, clicks: 4_100, leads: 210, visits: 160, sales: 33, revenue: 825_000 },
        ],
      },
      {
        id: "meta-3",
        name: "Ретаргетинг_Клиника",
        spend: 400_000,
        clicks: 4_600,
        leads: 290,
        visits: 200,
        sales: 46,
        revenue: 1_190_000,
        creatives: [
          { id: "c6", name: "DPA_Услуги", format: "Photo", landing: "clinic.kz", spend: 400_000, clicks: 4_600, leads: 290, visits: 200, sales: 46, revenue: 1_190_000 },
        ],
      },
    ],
  },
  {
    id: "google",
    name: "Google Ads",
    icon: "🟥",
    color: "hsl(4, 80%, 55%)",
    spend: 1_800_000,
    clicks: 22_100,
    leads: 1_240,
    visits: 960,
    sales: 204,
    revenue: 5_100_000,
    campaigns: [
      {
        id: "g1",
        name: "Search_Брекеты_Алматы",
        spend: 980_000,
        clicks: 12_800,
        leads: 720,
        visits: 560,
        sales: 118,
        revenue: 2_950_000,
        creatives: [
          { id: "g1c1", name: "RSA_Брекеты_Цена", format: "Photo", landing: "clinic.kz/braces", spend: 580_000, clicks: 7_800, leads: 440, visits: 340, sales: 72, revenue: 1_800_000 },
          { id: "g1c2", name: "RSA_Установка_Брекеты", format: "Photo", landing: "clinic.kz/braces-install", spend: 400_000, clicks: 5_000, leads: 280, visits: 220, sales: 46, revenue: 1_150_000 },
        ],
      },
      {
        id: "g2",
        name: "PMax_Стоматология",
        spend: 820_000,
        clicks: 9_300,
        leads: 520,
        visits: 400,
        sales: 86,
        revenue: 2_150_000,
        creatives: [
          { id: "g2c1", name: "PMax_Auto_Asset_1", format: "Photo", landing: "clinic.kz", spend: 820_000, clicks: 9_300, leads: 520, visits: 400, sales: 86, revenue: 2_150_000 },
        ],
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    icon: "🎵",
    color: "hsl(180, 80%, 55%)",
    spend: 680_000,
    clicks: 41_200,
    leads: 520,
    visits: 340,
    sales: 62,
    revenue: 1_550_000,
    campaigns: [
      {
        id: "t1",
        name: "Spark_Ads_Март",
        spend: 680_000,
        clicks: 41_200,
        leads: 520,
        visits: 340,
        sales: 62,
        revenue: 1_550_000,
        creatives: [
          { id: "t1c1", name: "SparkAd_DoctorTrend", format: "Video", landing: "clinic.kz/tiktok", spend: 410_000, clicks: 26_000, leads: 340, visits: 220, sales: 42, revenue: 1_050_000 },
          { id: "t1c2", name: "SparkAd_PatientStory", format: "Video", landing: "clinic.kz/tiktok", spend: 270_000, clicks: 15_200, leads: 180, visits: 120, sales: 20, revenue: 500_000 },
        ],
      },
    ],
  },
  {
    id: "organic",
    name: "Органика (Контент-Завод)",
    icon: "🟢",
    color: "hsl(160, 84%, 36%)",
    spend: 0,
    clicks: 18_900,
    leads: 890,
    visits: 620,
    sales: 148,
    revenue: 3_700_000,
    campaigns: [
      {
        id: "o1",
        name: 'Кодовое слово: УЛЫБКА',
        spend: 0,
        clicks: 8_400,
        leads: 420,
        visits: 310,
        sales: 74,
        revenue: 1_850_000,
        creatives: [
          { id: "o1c1", name: "Reel_Трансформация_Улыбки", format: "Reel", landing: "DM → CRM", spend: 0, clicks: 5_200, leads: 280, visits: 210, sales: 50, revenue: 1_250_000 },
          { id: "o1c2", name: "Reel_До_После_Виниры", format: "Reel", landing: "DM → CRM", spend: 0, clicks: 3_200, leads: 140, visits: 100, sales: 24, revenue: 600_000 },
        ],
      },
      {
        id: "o2",
        name: 'Кодовое слово: СКИДКА',
        spend: 0,
        clicks: 6_100,
        leads: 290,
        visits: 190,
        sales: 46,
        revenue: 1_150_000,
        creatives: [
          { id: "o2c1", name: "Stories_Акция_Март", format: "Photo", landing: "DM → CRM", spend: 0, clicks: 6_100, leads: 290, visits: 190, sales: 46, revenue: 1_150_000 },
        ],
      },
      {
        id: "o3",
        name: "Прямой трафик (Instagram Bio)",
        spend: 0,
        clicks: 4_400,
        leads: 180,
        visits: 120,
        sales: 28,
        revenue: 700_000,
        creatives: [
          { id: "o3c1", name: "Bio_Link_Clinic", format: "Photo", landing: "clinic.kz", spend: 0, clicks: 4_400, leads: 180, visits: 120, sales: 28, revenue: 700_000 },
        ],
      },
    ],
  },
];

export const organicPosts: OrganicPost[] = [
  { id: "op1", thumbnail: "🎬", caption: "Трансформация улыбки за 2 часа — реальный кейс", triggerWord: "УЛЫБКА", dms: 342, leads: 280, sales: 50, revenue: 1_250_000, ltv: 25_000 },
  { id: "op2", thumbnail: "🎬", caption: "До и после: виниры E-max на 10 зубов", triggerWord: "УЛЫБКА", dms: 198, leads: 140, sales: 24, revenue: 600_000, ltv: 25_000 },
  { id: "op3", thumbnail: "📸", caption: "Акция марта: -30% на профгигиену", triggerWord: "СКИДКА", dms: 410, leads: 290, sales: 46, revenue: 1_150_000, ltv: 25_000 },
  { id: "op4", thumbnail: "🎬", caption: "Врач отвечает: боятся ли брекеты?", triggerWord: "БРЕКЕТЫ", dms: 156, leads: 98, sales: 18, revenue: 450_000, ltv: 25_000 },
  { id: "op5", thumbnail: "🎬", caption: "Отбеливание зубов ZOOM — процесс и результат", triggerWord: "ZOOM", dms: 89, leads: 62, sales: 10, revenue: 200_000, ltv: 20_000 },
];

export const funnelData = [
  { stage: "Показы", value: 2_840_000, label: "2.84M" },
  { stage: "Клики", value: 116_400, label: "116.4K" },
  { stage: "Лиды", value: 4_540, label: "4,540" },
  { stage: "Визиты", value: 3_340, label: "3,340" },
  { stage: "Продажи", value: 726, label: "726" },
];

export const channelChartData = [
  { name: "Meta Ads", spend: 2_450_000, revenue: 7_840_000, color: "hsl(250, 80%, 60%)" },
  { name: "Google Ads", spend: 1_800_000, revenue: 5_100_000, color: "hsl(4, 80%, 55%)" },
  { name: "TikTok Ads", spend: 680_000, revenue: 1_550_000, color: "hsl(180, 80%, 55%)" },
  { name: "Органика", spend: 0, revenue: 3_700_000, color: "hsl(160, 84%, 36%)" },
];

export function formatMoney(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ₸`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K ₸`;
  return `${val} ₸`;
}

export function formatNum(val: number): string {
  return val.toLocaleString("ru-RU");
}

export function calcRomi(revenue: number, spend: number): string {
  if (spend === 0) return "∞";
  return `${Math.round(((revenue - spend) / spend) * 100)}%`;
}
