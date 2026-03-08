import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Upload, Send, BarChart3, Target, Clock, Image, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, formatNum } from "@/components/analytics/analyticsData";
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
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "telegram", label: "Telegram", emoji: "✈️" },
  { id: "facebook", label: "Facebook", emoji: "📘" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
];

export default function AutopostingPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AutopostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");

  // Ad launcher
  const [adSheetOpen, setAdSheetOpen] = useState(false);
  const [selectedAdImage, setSelectedAdImage] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel("autopost-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "autopost_items" }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("autopost_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setItems((data || []).map((d: any) => ({
        ...d,
        channels: Array.isArray(d.channels) ? d.channels : [],
      })));
    }
    setLoading(false);
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
      const mediaUrl = urlData.publicUrl;

      let scheduledAt: string | null = null;
      if (scheduleDate) {
        const [h, m] = scheduleTime.split(":").map(Number);
        const dt = new Date(scheduleDate);
        dt.setHours(h, m, 0, 0);
        scheduledAt = dt.toISOString();
      }

      const { error: insertErr } = await supabase.from("autopost_items").insert({
        media_url: mediaUrl,
        media_type: mediaFile.type.startsWith("video") ? "video" : "image",
        caption: caption || null,
        channels: selectedChannels,
        scheduled_at: scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
      });
      if (insertErr) throw insertErr;

      toast({ title: "✅ Контент добавлен в автопостинг!" });
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

  function openAdLauncher(mediaUrl: string) {
    setSelectedAdImage(mediaUrl);
    setAdSheetOpen(true);
  }

  const filtered = statusFilter === "all" ? items : items.filter(i => i.status === statusFilter);

  const totalImpressions = items.reduce((s, i) => s + i.impressions, 0);
  const totalClicks = items.reduce((s, i) => s + i.clicks, 0);
  const totalLeads = items.reduce((s, i) => s + i.leads, 0);
  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📅 Автопостинг</h1>
            <p className="text-sm text-muted-foreground mt-1">Загружайте контент, выбирайте соцсети и планируйте публикации</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw size={14} className="mr-1" /> Обновить
          </Button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Охваты", value: formatNum(totalImpressions), icon: "👁" },
            { label: "Клики", value: formatNum(totalClicks), icon: "👆" },
            { label: "Лиды", value: formatNum(totalLeads), icon: "🎯" },
            { label: "Выручка", value: formatMoney(totalRevenue), icon: "💰" },
          ].map(k => (
            <Card key={k.label} className="bg-card border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{k.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-lg font-bold text-foreground">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Form */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload size={18} /> Добавить контент
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: file + preview */}
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                  onClick={() => document.getElementById("autopost-file")?.click()}
                >
                  {mediaPreview ? (
                    <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                  ) : (
                    <div className="space-y-2">
                      <Image size={32} className="mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Нажмите для загрузки изображения или видео</p>
                    </div>
                  )}
                  <input id="autopost-file" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </div>
                <Textarea
                  placeholder="Текст публикации / caption..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  className="bg-background"
                />
              </div>

              {/* Right: channels + schedule */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Соцсети для публикации</p>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_CHANNELS.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                          selectedChannels.includes(ch.id)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <span>{ch.emoji}</span> {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Запланировать публикацию</p>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("flex-1 justify-start text-left", !scheduleDate && "text-muted-foreground")}>
                          <CalendarIcon size={14} className="mr-2" />
                          {scheduleDate ? format(scheduleDate, "dd MMM yyyy", { locale: ru }) : "Выберите дату"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-28 bg-background"
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} disabled={uploading} className="w-full mt-2">
                  {uploading ? "Загрузка..." : "📤 Добавить в автопостинг"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Фильтр:</p>
          {["all", "draft", "scheduled", "published"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {{ all: "Все", draft: "Черновик", scheduled: "Запланировано", published: "Опубликовано" }[s]}
            </Button>
          ))}
        </div>

        {/* Content List with Analytics */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Пока нет контента в автопостинге</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <Card key={item.id} className="bg-card border-border/50 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Preview */}
                  <div className="w-full md:w-40 h-40 md:h-auto shrink-0 bg-muted">
                    {item.media_type === "video" ? (
                      <video src={item.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info + Analytics */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">{item.caption || "Без подписи"}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.channels.map(ch => {
                            const info = SOCIAL_CHANNELS.find(s => s.id === ch);
                            return (
                              <Badge key={ch} variant="secondary" className="text-[11px]">
                                {info?.emoji} {info?.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={item.status === "published" ? "default" : item.status === "scheduled" ? "secondary" : "outline"}>
                          {{ draft: "Черновик", scheduled: "📅 Запланировано", published: "✅ Опубликовано" }[item.status] || item.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Schedule info */}
                    {item.scheduled_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(item.scheduled_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    )}

                    {/* Analytics Row */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-muted/50 rounded-lg p-3">
                      {[
                        { label: "Охваты", value: item.impressions },
                        { label: "Клики", value: item.clicks },
                        { label: "Лиды", value: item.leads },
                        { label: "Визиты", value: item.visits },
                        { label: "Продажи", value: item.sales },
                        { label: "Выручка", value: item.revenue, money: true },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                          <p className="text-sm font-bold text-foreground">
                            {m.money ? formatMoney(m.value) : formatNum(m.value)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status !== "published" && (
                        <Button size="sm" onClick={() => handlePublishNow(item.id)}>
                          <Send size={14} className="mr-1" /> Опубликовать сейчас
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openAdLauncher(item.media_url)}>
                        <Target size={14} className="mr-1" /> В рекламу
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} className="mr-1" /> Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CampaignBuilderSheet open={adSheetOpen} onOpenChange={setAdSheetOpen} />
    </DashboardLayout>
  );
}
