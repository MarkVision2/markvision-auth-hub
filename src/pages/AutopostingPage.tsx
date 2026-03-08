import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarIcon, Upload, Send, Target, Clock, Image as ImageIcon,
  Trash2, RefreshCw, Eye, MousePointerClick, Users, DollarSign,
  Sparkles, Loader2, ChevronDown, Play, GripVertical, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";

interface AutopostItem {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  channels: string[];
  scheduled_at: string | null;
  status: string;
  published_at: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
  created_at: string;
}

const SOCIAL_CHANNELS = [
  { id: "instagram", label: "Instagram", emoji: "📸", color: "from-pink-500 to-purple-500" },
  { id: "telegram", label: "Telegram", emoji: "✈️", color: "from-blue-400 to-blue-600" },
  { id: "tiktok", label: "TikTok", emoji: "🎵", color: "from-gray-800 to-gray-900" },
  { id: "youtube", label: "YouTube", emoji: "▶️", color: "from-red-500 to-red-700" },
  { id: "threads", label: "Threads", emoji: "🔗", color: "from-gray-700 to-black" },
  { id: "blog", label: "Блог / Сайт", emoji: "🌐", color: "from-emerald-500 to-teal-600" },
];

const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
const fmtMoney = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M ₸` : v >= 1000 ? `${(v / 1000).toFixed(0)}K ₸` : `${v} ₸`;

export default function AutopostingPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AutopostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Ad launcher
  const [adSheetOpen, setAdSheetOpen] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Expanded analytics
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel("autopost-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "autopost_items" }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchItems() {
    try {
      const { data, error } = await supabase
        .from("autopost_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data || []).map((d: any) => ({
        ...d,
        channels: Array.isArray(d.channels) ? d.channels : [],
      })));
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  function toggleChannel(id: string) {
    setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleAutoCaption() {
    setGeneratingCaption(true);
    await new Promise(r => setTimeout(r, 1500));
    setCaption("🔥 Готовы к переменам? Мы подготовили для вас нечто особенное!\n\nЭто не просто контент — это стратегия, которая работает на результат.\n\n💡 Сохраняйте, делитесь и применяйте!\n\n#маркетинг #реклама #бизнес");
    setGeneratingCaption(false);
    toast({ title: "✨ Описание сгенерировано" });
  }

  async function handleSubmit() {
    if (!mediaFile) {
      toast({ title: "Загрузите файл", variant: "destructive" });
      return;
    }
    if (selectedChannels.length === 0) {
      toast({ title: "Выберите хотя бы одну соцсеть", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = mediaFile.name.split(".").pop();
      const path = `autopost/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("content_assets").upload(path, mediaFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("content_assets").getPublicUrl(path);

      let scheduledAt: string | null = null;
      if (scheduleDate) {
        const [h, m] = scheduleTime.split(":").map(Number);
        const dt = new Date(scheduleDate);
        dt.setHours(h, m, 0, 0);
        scheduledAt = dt.toISOString();
      }

      const { error: insertErr } = await supabase.from("autopost_items").insert({
        media_url: urlData.publicUrl,
        media_type: mediaFile.type.startsWith("video") ? "video" : "image",
        caption: caption || null,
        channels: selectedChannels,
        scheduled_at: scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
      });
      if (insertErr) throw insertErr;

      toast({ title: "✅ Контент добавлен!" });
      setMediaFile(null);
      setMediaPreview(null);
      setCaption("");
      setSelectedChannels([]);
      setScheduleDate(undefined);
      setScheduleTime("12:00");
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("autopost_items").delete().eq("id", id);
    toast({ title: "Удалено" });
  }

  async function handlePublishNow(id: string) {
    await supabase.from("autopost_items").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Опубликовано!" });
  }

  const filtered = statusFilter === "all" ? items : items.filter(i => i.status === statusFilter);

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter(i => i.status === "published").length,
    scheduled: items.filter(i => i.status === "scheduled").length,
    impressions: items.reduce((s, i) => s + i.impressions, 0),
    clicks: items.reduce((s, i) => s + i.clicks, 0),
    leads: items.reduce((s, i) => s + i.leads, 0),
    revenue: items.reduce((s, i) => s + i.revenue, 0),
  }), [items]);

  const statusCounts = useMemo(() => ({
    all: items.length,
    draft: items.filter(i => i.status === "draft").length,
    scheduled: items.filter(i => i.status === "scheduled").length,
    published: items.filter(i => i.status === "published").length,
  }), [items]);

  return (
    <DashboardLayout breadcrumb="Автопостинг">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Автопостинг</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.published} опубликовано · {stats.scheduled} в очереди · {stats.total} всего
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems} className="gap-1.5 text-xs border-border rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" /> Обновить
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Охваты", value: fmt(stats.impressions), icon: Eye, sub: "Суммарно" },
            { label: "Клики", value: fmt(stats.clicks), icon: MousePointerClick, sub: "По постам" },
            { label: "Лиды", value: fmt(stats.leads), icon: Users, sub: "Из контента" },
            { label: "Выручка", value: fmtMoney(stats.revenue), icon: DollarSign, sub: "Атрибуция" },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <k.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</span>
              </div>
              <p className="text-xl font-mono font-bold text-foreground tabular-nums">{k.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Upload Form */}
        <div className="rounded-xl border border-primary/15 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-primary/[0.02] flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Новая публикация</span>
          </div>
          <div className="p-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Left: file + caption */}
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors relative group"
                  onClick={() => document.getElementById("autopost-file")?.click()}
                >
                  {mediaPreview ? (
                    <div className="relative">
                      {mediaFile?.type.startsWith("video") ? (
                        <video src={mediaPreview} className="max-h-48 mx-auto rounded-lg object-cover" />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <p className="text-xs font-medium text-foreground">Заменить файл</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Загрузите фото или видео</p>
                      <p className="text-[10px] text-muted-foreground/50">JPG, PNG, MP4 до 100MB</p>
                    </div>
                  )}
                  <input id="autopost-file" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Описание</span>
                    <Button
                      variant="ghost" size="sm"
                      onClick={handleAutoCaption}
                      disabled={generatingCaption}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1"
                    >
                      {generatingCaption ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI Caption
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Текст публикации, хэштеги, CTA..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={4}
                    className="bg-secondary/20 border-border resize-none text-sm"
                  />
                </div>
              </div>

              {/* Right: channels + schedule */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Каналы публикации</span>
                  <div className="grid grid-cols-2 gap-2">
                    {SOCIAL_CHANNELS.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all",
                          selectedChannels.includes(ch.id)
                            ? "bg-primary/10 border-primary/40 text-foreground shadow-sm"
                            : "bg-secondary/20 border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/40"
                        )}
                      >
                        <span className="text-base">{ch.emoji}</span>
                        <span>{ch.label}</span>
                        {selectedChannels.includes(ch.id) && (
                          <span className="ml-auto h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Дата и время</span>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("flex-1 justify-start text-left text-xs border-border rounded-lg h-10", !scheduleDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                          {scheduleDate ? format(scheduleDate, "dd MMM yyyy", { locale: ru }) : "Дата"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-24 bg-secondary/20 border-border text-xs rounded-lg"
                    />
                  </div>
                  {!scheduleDate && (
                    <p className="text-[10px] text-muted-foreground/50">Без даты → сохранится как черновик</p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={uploading || !mediaFile}
                  className="w-full h-11 gap-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Загрузка...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Добавить в автопостинг</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {(["all", "draft", "scheduled", "published"] as const).map(s => {
            const labels: Record<string, string> = { all: "Все", draft: "Черновики", scheduled: "В очереди", published: "Опубликовано" };
            const count = statusCounts[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                {labels[s]}
                {count > 0 && (
                  <span className={cn(
                    "text-[9px] tabular-nums px-1.5 py-0.5 rounded-full",
                    statusFilter === s ? "bg-primary-foreground/20" : "bg-secondary"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-2">Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <Send className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">Пока нет контента</p>
            <p className="text-xs text-muted-foreground mt-1">Загрузите файл выше, чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                const channelInfos = item.channels.map(ch => SOCIAL_CHANNELS.find(s => s.id === ch)).filter(Boolean);
                const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
                  draft: { bg: "bg-secondary", text: "text-muted-foreground", label: "Черновик" },
                  scheduled: { bg: "bg-primary/10", text: "text-primary", label: "В очереди" },
                  published: { bg: "bg-[hsl(var(--status-good)/0.1)]", text: "text-[hsl(var(--status-good))]", label: "Опубликовано" },
                };
                const st = statusStyles[item.status] || statusStyles.draft;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/15 transition-colors"
                  >
                    <div className="flex">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-secondary/30 relative overflow-hidden">
                        {item.media_type === "video" ? (
                          <>
                            <video src={item.media_url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                              <Play className="h-6 w-6 text-primary-foreground drop-shadow-lg" fill="currentColor" />
                            </div>
                          </>
                        ) : (
                          <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3 sm:p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                              {item.caption || <span className="text-muted-foreground italic">Без описания</span>}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {channelInfos.map(ch => ch && (
                                <span key={ch.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-[10px] font-medium text-muted-foreground">
                                  {ch.emoji} {ch.label}
                                </span>
                              ))}
                              {item.scheduled_at && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(item.scheduled_at), "dd MMM, HH:mm", { locale: ru })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn("px-2 py-1 rounded-md text-[10px] font-semibold", st.bg, st.text)}>
                              {st.label}
                            </span>
                          </div>
                        </div>

                        {/* Compact metrics */}
                        <div className="flex items-center gap-4 mt-3">
                          {[
                            { v: item.impressions, icon: Eye },
                            { v: item.clicks, icon: MousePointerClick },
                            { v: item.leads, icon: Users },
                            { v: item.revenue, icon: DollarSign, money: true },
                          ].map((m, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums font-mono">
                              <m.icon className="h-3 w-3" />
                              {m.money ? fmtMoney(m.v) : fmt(m.v)}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 mt-3">
                          {item.status !== "published" && (
                            <Button size="sm" className="h-7 text-[10px] gap-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handlePublishNow(item.id)}>
                              <Send className="h-3 w-3" /> Опубликовать
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-lg border-border" onClick={() => { setAdSheetOpen(true); }}>
                            <Target className="h-3 w-3" /> В рекламу
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CampaignBuilderSheet open={adSheetOpen} onOpenChange={setAdSheetOpen} />
    </DashboardLayout>
  );
}
