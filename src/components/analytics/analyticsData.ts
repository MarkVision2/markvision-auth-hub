// Types and utility functions for analytics module
// Data is now fetched from Supabase tables: analytics_channels, analytics_campaigns, analytics_creatives, analytics_organic_posts

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
